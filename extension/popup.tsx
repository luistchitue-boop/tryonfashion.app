import { ClerkProvider, SignedIn, SignedOut, SignOutButton, useAuth, useUser } from "@clerk/chrome-extension";
import { useEffect, useState } from "react";
import "./style.css";

type ProductDetails = {
  productName: string;
  brand: string;
  productUrl: string;
  imageUrl: string;
  price: string;
  currency: string;
  source: string;
};

const API_URL = process.env.PLASMO_PUBLIC_API_URL || "https://www.tryonfashion.app";
const CLERK_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CLERK_SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST;
const EXTENSION_URL = typeof chrome !== "undefined" ? chrome.runtime.getURL(".") : "";

function extractFromActiveTab(): Promise<ProductDetails | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url?.startsWith("http")) return resolve(null);

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            type JsonObject = Record<string, unknown>;
            const asObject = (value: unknown): JsonObject | null =>
              value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
            const textValue = (value: unknown): string => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
            const firstText = (...values: unknown[]): string => values.map(textValue).find(Boolean) || "";
            const meta = (selectors: string[]): string => {
              for (const selector of selectors) {
                const element = document.querySelector<HTMLElement>(selector);
                const value = (element?.getAttribute("content") || element?.getAttribute("href") || "").trim();
                if (value) return value;
              }
              return "";
            };
            const absoluteHttpUrl = (value: unknown): string => {
              const candidate = textValue(value);
              if (!candidate) return "";
              try {
                const url = new URL(candidate, document.baseURI);
                return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
              } catch {
                return "";
              }
            };
            const imageUrls = (value: unknown): string[] => {
              const entries = Array.isArray(value) ? value : [value];
              return entries.map((entry) => {
                const object = asObject(entry);
                return absoluteHttpUrl(object ? object.contentUrl || object.url || object.thumbnailUrl : entry);
              }).filter(Boolean);
            };
            const parsePrice = (value: unknown): string => {
              const raw = textValue(value);
              if (!raw || raw.length > 50) return "";
              let number = raw.replace(/[\u00a0\u202f\s]/g, "").replace(/[^\d.,+\-]/g, "");
              if (!/\d/.test(number)) return "";
              const negative = number.startsWith("-");
              number = number.replace(/[+-]/g, "");
              const lastDot = number.lastIndexOf(".");
              const lastComma = number.lastIndexOf(",");
              const decimalSeparator = lastDot > lastComma ? "." : lastComma > lastDot ? "," : "";
              if (decimalSeparator) {
                const decimalDigits = number.length - number.lastIndexOf(decimalSeparator) - 1;
                const otherSeparator = decimalSeparator === "." ? "," : ".";
                const hasBoth = number.includes(otherSeparator);
                const isThousandsOnly = !hasBoth && (number.match(/[.,]/g) || []).length === 1 && decimalDigits === 3;
                if (isThousandsOnly) number = number.replace(/[.,]/g, "");
                else {
                  number = number.split(otherSeparator).join("");
                  const splitAt = number.lastIndexOf(decimalSeparator);
                  number = `${number.slice(0, splitAt).replace(/[.,]/g, "")}.${number.slice(splitAt + 1).replace(/[.,]/g, "")}`;
                }
              }
              const parsed = Number(`${negative ? "-" : ""}${number}`);
              return Number.isFinite(parsed) ? String(parsed) : "";
            };
            const walk = (value: unknown, visit: (object: JsonObject) => void, seen = new Set<object>()) => {
              if (Array.isArray(value)) {
                value.forEach((entry) => walk(entry, visit, seen));
                return;
              }
              const object = asObject(value);
              if (!object || seen.has(object)) return;
              seen.add(object);
              visit(object);
              Object.values(object).forEach((entry) => walk(entry, visit, seen));
            };
            const productCandidates: JsonObject[] = [];
            for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
              try {
                walk(JSON.parse(script.textContent || ""), (object) => {
                  const types = Array.isArray(object["@type"]) ? object["@type"] : [object["@type"]];
                  if (types.some((type) => typeof type === "string" && type.toLowerCase() === "product")) productCandidates.push(object);
                });
              } catch {
                // Ignore malformed structured data and continue with other sources.
              }
            }
            const product = productCandidates.sort((a, b) => {
              const score = (item: JsonObject) => Number(Boolean(item.name)) + Number(Boolean(item.image)) + Number(Boolean(item.offers)) + Number(Boolean(item.brand));
              return score(b) - score(a);
            })[0];

            const offersValue = product?.offers;
            const offerEntries = Array.isArray(offersValue) ? offersValue : offersValue ? [offersValue] : [];
            let structuredPrice = "";
            let structuredCurrency = "";
            for (const entry of offerEntries) {
              const offer = asObject(entry);
              if (!offer) continue;
              const specs = Array.isArray(offer.priceSpecification) ? offer.priceSpecification : [offer.priceSpecification];
              const spec = specs.map(asObject).find(Boolean);
              structuredPrice = parsePrice(offer.price ?? offer.lowPrice ?? spec?.price ?? spec?.minPrice);
              structuredCurrency = firstText(offer.priceCurrency, spec?.priceCurrency, spec?.currency);
              if (structuredPrice) break;
            }

            const microdataPrice = document.querySelector<HTMLElement>('[itemprop="price"]');
            const itemPrice = microdataPrice?.getAttribute("content") || microdataPrice?.getAttribute("value") || microdataPrice?.textContent;
            const metaPrice = meta([
              'meta[property="product:price:amount"]', 'meta[property="og:price:amount"]',
              'meta[property="product:sale_price:amount"]', 'meta[itemprop="price"]',
            ]);
            const priceElements = Array.from(document.querySelectorAll<HTMLElement>(
              '[itemprop="price"], [data-testid*="price" i], [class*="price" i], [id*="price" i]',
            )).map((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              const hint = `${element.getAttribute("class") || ""} ${element.id} ${element.getAttribute("data-testid") || ""}`.toLowerCase();
              return { element, hint, visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && style.textDecorationLine !== "line-through" };
            }).filter(({ element, hint, visible }) => visible && !/(old|was|compare|original|strike|list-price)/i.test(hint) && (element.textContent || "").trim().length <= 50);
            priceElements.sort((a, b) => Number(b.element.hasAttribute("itemprop")) - Number(a.element.hasAttribute("itemprop")));
            const visiblePrice = priceElements.map(({ element }) => parsePrice(element.getAttribute("content") || element.getAttribute("value") || element.textContent)).find(Boolean) || "";

            const currencyFromText = (value: string): string => {
              const upper = value.toUpperCase();
              if (/\b(USD|CAD|AUD|EUR|GBP|JPY|CNY|INR|CHF)\b/.test(upper)) return upper.match(/\b(USD|CAD|AUD|EUR|GBP|JPY|CNY|INR|CHF)\b/)?.[1] || "";
              if (value.includes("€")) return "EUR";
              if (value.includes("£")) return "GBP";
              if (value.includes("¥")) return "JPY";
              if (value.includes("$")) return "USD";
              return "";
            };
            const priceSource = firstText(itemPrice, metaPrice, priceElements[0]?.element.textContent);
            const currency = firstText(structuredCurrency, meta([
              'meta[property="product:price:currency"]', 'meta[property="og:price:currency"]', 'meta[itemprop="priceCurrency"]',
            ]), document.querySelector<HTMLElement>('[itemprop="priceCurrency"]')?.getAttribute("content"), currencyFromText(priceSource));

            const productBrand = asObject(product?.brand);
            const microdataBrand = document.querySelector<HTMLElement>('[itemprop="brand"]');
            const brand = firstText(typeof product?.brand === "string" ? product.brand : productBrand?.name, microdataBrand?.getAttribute("content"), microdataBrand?.textContent);
            const productName = firstText(product?.name, document.querySelector<HTMLElement>('[itemprop="name"]')?.getAttribute("content"), document.querySelector<HTMLElement>("h1")?.textContent, meta(['meta[property="og:title"]', 'meta[name="twitter:title"]']), document.title);

            const imageCandidates = [
              ...imageUrls(product?.image),
              meta(['meta[property="og:image"]', 'meta[property="og:image:url"]', 'meta[property="og:image:secure_url"]', 'meta[name="twitter:image"]', 'meta[name="twitter:image:src"]', 'link[rel="image_src"]']),
            ].map(absoluteHttpUrl).filter(Boolean);
            const imageNodes = Array.from(document.querySelectorAll<HTMLImageElement>("main img, [role=main] img, article img, img"));
            const renderedImages = imageNodes.map((img) => {
              const rect = img.getBoundingClientRect();
              const hint = `${img.alt} ${img.className} ${img.id} ${img.currentSrc} ${img.src}`.toLowerCase();
              const srcset = img.getAttribute("srcset")?.split(",").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean).pop();
              const lazy = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src") || img.getAttribute("data-zoom-image");
              const url = absoluteHttpUrl(img.currentSrc || lazy || srcset || img.src);
              const visible = rect.width >= 120 && rect.height >= 120 && getComputedStyle(img).visibility !== "hidden";
              const unsuitable = /(logo|icon|avatar|sprite|placeholder|payment|flag|pixel|tracking)/i.test(hint) || /\.svg(?:$|[?#])/i.test(url);
              const mainImage = Boolean(img.closest("main, [role=main], article"));
              return { url, visible, unsuitable, score: (mainImage ? 4 : 0) + (img.naturalWidth >= 300 ? 2 : 0) + (img.alt ? 1 : 0) };
            }).filter((image) => image.url && image.visible && !image.unsuitable).sort((a, b) => b.score - a.score);
            const imageUrl = [...imageCandidates, ...renderedImages.map((image) => image.url)].find(Boolean) || "";

            return {
              productName,
              brand,
              productUrl: location.href,
              imageUrl,
              price: structuredPrice || parsePrice(itemPrice) || parsePrice(metaPrice) || visiblePrice,
              currency,
              source: location.hostname.replace(/^www\./, ""),
            };
          },
        },
        (results) => {
          if (chrome.runtime.lastError || !results?.[0]?.result) return resolve(null);
          resolve(results[0].result as ProductDetails);
        },
      );
    });
  });
}

function PopupContent() {
  const { isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void extractFromActiveTab().then((details) => {
      setProduct(details);
      setIsLoading(false);
    });
  }, []);

  const update = (field: keyof ProductDetails, value: string) => {
    setProduct((current) => current ? { ...current, [field]: value } : current);
  };

  const saveToCloset = async () => {
    if (!product) return;
    setMessage("");
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Sign in again to continue.");
      const response = await fetch(`${API_URL}/api/extension/closet`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(product),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this item.");
      setMessage("Saved to your closet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this item.");
    } finally {
      setIsSaving(false);
    }
  };

  const openCloset = () => void chrome.tabs.create({ url: `${API_URL}/closet` });
  const signInOnWeb = () => void chrome.tabs.create({ url: `${API_URL}/sign-in?callbackUrl=%2Fcloset` });

  if (!CLERK_KEY) return <main className="state"><strong>Extension setup needed</strong><p>Add the Clerk publishable key to the extension environment.</p></main>;
  if (!isLoaded) return <main className="state"><span className="spinner" />Getting your closet ready…</main>;

  return (
    <main className="popup">
      <header className="topbar">
        <div className="brand-mark">TF</div>
        <div className="brand-copy"><strong>TRYONFASHION</strong><span>Save pieces you love</span></div>
        <SignedIn><SignOutButton><button className="quiet-button">Sign out</button></SignOutButton></SignedIn>
      </header>

      <SignedOut>
        <section className="welcome">
          <div className="eyebrow">YOUR PERSONAL CLOSET</div>
          <h1>Find something<br />you love?</h1>
          <p>Sign in securely on TryOnFashion, then reopen this extension to save the item.</p>
          <button className="primary-button full" onClick={signInOnWeb}>Sign in on TryOnFashion</button>
        </section>
      </SignedOut>

      <SignedIn>
        <section className="content">
          <div className="user-line">{user?.firstName ? `Hi, ${user.firstName}` : "Ready to save?"}</div>
          <h1>Add to your closet</h1>
          {isLoading ? (
            <div className="state inline"><span className="spinner" />Reading this page…</div>
          ) : !product ? (
            <div className="empty"><span className="empty-icon">↗</span><strong>Open a product page</strong><p>Visit a clothing item page, then open this extension to collect its details.</p></div>
          ) : (
            <>
              <div className="preview-card">
                {product.imageUrl ? <img src={product.imageUrl} alt="Product preview" className="product-image" /> : <div className="image-placeholder">No image found</div>}
                <div className="form-fields">
                  <label>Product name<input value={product.productName} onChange={(event) => update("productName", event.target.value)} /></label>
                  <div className="two-fields">
                    <label>Brand<input value={product.brand} onChange={(event) => update("brand", event.target.value)} placeholder="Optional" /></label>
                    <label>Price<input value={product.price} onChange={(event) => update("price", event.target.value)} placeholder="Optional" /></label>
                  </div>
                  <label>Product link<input value={product.productUrl} onChange={(event) => update("productUrl", event.target.value)} /></label>
                </div>
              </div>
              <div className="detail-row"><span>{product.source}</span><span>{product.currency}</span></div>
              <button className="primary-button full" disabled={isSaving || !product.productName.trim()} onClick={() => void saveToCloset()}>{isSaving ? "Saving…" : "Save to My Closet"}</button>
              {message && <p className={message.startsWith("Saved") ? "feedback success" : "feedback"} role="status">{message}</p>}
            </>
          )}
          <button className="link-button" onClick={openCloset}>Open my closet <span>↗</span></button>
        </section>
      </SignedIn>
      <footer>Products are reviewed before saving. Your closet stays yours.</footer>
    </main>
  );
}

export default function IndexPopup() {
  if (!CLERK_KEY) {
    return <main className="state"><strong>Missing Clerk publishable key</strong><p>Set PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY in extension/.env.development.</p></main>;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      syncHost={CLERK_SYNC_HOST}
      afterSignOutUrl={`${EXTENSION_URL}/popup.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
    >
      <PopupContent />
    </ClerkProvider>
  );
}

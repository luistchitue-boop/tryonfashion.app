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
            type JsonLdProduct = {
              "@type"?: string | string[];
              name?: string;
              brand?: string | { name?: string };
              image?: string | string[] | { url?: string }[];
              offers?: { price?: string | number; priceCurrency?: string } | { price?: string | number; priceCurrency?: string }[];
            };
            const metas = (selectors: string[]) => {
              for (const selector of selectors) {
                const value = document.querySelector<HTMLMetaElement>(selector)?.content?.trim();
                if (value) return value;
              }
              return "";
            };
            const findProduct = (value: unknown): JsonLdProduct | null => {
              if (Array.isArray(value)) {
                for (const item of value) {
                  const found = findProduct(item);
                  if (found) return found;
                }
              } else if (value && typeof value === "object") {
                const object = value as JsonLdProduct & { "@graph"?: unknown };
                const types = Array.isArray(object["@type"]) ? object["@type"] : [object["@type"]];
                if (types.some((type) => type?.toLowerCase() === "product")) return object;
                return object["@graph"] ? findProduct(object["@graph"]) : null;
              }
              return null;
            };

            let product: JsonLdProduct | null = null;
            for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
              try {
                product = findProduct(JSON.parse(script.textContent || ""));
                if (product) break;
              } catch {
                // Ignore malformed or unrelated structured data and try the next block.
              }
            }

            const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
            const productImage = Array.isArray(product?.image) ? product?.image[0] : product?.image;
            const image = typeof productImage === "string" ? productImage : productImage?.url;
            const brand = typeof product?.brand === "string" ? product.brand : product?.brand?.name || "";
            const metaImage = metas(['meta[property="og:image"]', 'meta[name="twitter:image"]']);
            const metaPrice = metas(['meta[property="product:price:amount"]', 'meta[property="og:price:amount"]']);
            const metaCurrency = metas(['meta[property="product:price:currency"]', 'meta[property="og:price:currency"]']);

            return {
              productName: product?.name || metas(['meta[property="og:title"]', 'meta[name="twitter:title"]']) || document.title,
              brand,
              productUrl: location.href,
              imageUrl: image || metaImage,
              price: String(offers?.price ?? metaPrice),
              currency: offers?.priceCurrency || metaCurrency,
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

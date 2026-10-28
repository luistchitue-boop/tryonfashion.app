import { load } from "cheerio";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 900;

const MAX_PAGE_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCTS = 30;

type StoreCatalog = {
  name: string;
  pages: Record<"women" | "men", string>;
  allowedHosts: string[];
  imageHosts: string[];
};

type Product = {
  id: string;
  name: string;
  imageUrl: string;
  productUrl: string;
  price: string | null;
  currency: string | null;
};

const catalogs: Record<string, StoreCatalog> = {
  saks: {
    name: "Saks Fifth Avenue",
    pages: { women: "https://www.saksfifthavenue.com/c/women/clothing", men: "https://www.saksfifthavenue.com/c/men/clothing" },
    allowedHosts: ["www.saksfifthavenue.com", "saksfifthavenue.com"],
    imageHosts: ["www.saksfifthavenue.com", "saksfifthavenue.com", "images.saksfifthavenue.com"],
  },
  zara: {
    name: "Zara",
    pages: { women: "https://www.zara.com/us/en/woman-l1180.html", men: "https://www.zara.com/us/en/man-l711.html" },
    allowedHosts: ["www.zara.com", "zara.com"],
    imageHosts: ["www.zara.com", "zara.com", "static.zara.net"],
  },
  "louis-vuitton": {
    name: "Louis Vuitton",
    pages: { women: "https://us.louisvuitton.com/eng-us/women/ready-to-wear", men: "https://us.louisvuitton.com/eng-us/men/ready-to-wear" },
    allowedHosts: ["us.louisvuitton.com", "www.louisvuitton.com", "louisvuitton.com"],
    imageHosts: ["us.louisvuitton.com", "www.louisvuitton.com", "louisvuitton.com", "images.louisvuitton.com"],
  },
  nordstrom: {
    name: "Nordstrom",
    pages: { women: "https://www.nordstrom.com/browse/women/clothing", men: "https://www.nordstrom.com/browse/men/clothing" },
    allowedHosts: ["www.nordstrom.com", "nordstrom.com"],
    imageHosts: ["www.nordstrom.com", "nordstrom.com", "n.nordstrommedia.com", "nordstrom.scene7.com"],
  },
  hm: {
    name: "H&M",
    pages: { women: "https://www2.hm.com/en_us/women/new-arrivals/view-all.html", men: "https://www2.hm.com/en_us/men/new-arrivals/view-all.html" },
    allowedHosts: ["www2.hm.com", "www.hm.com"],
    imageHosts: ["www2.hm.com", "www.hm.com", "image.hm.com", "lp2.hm.com"],
  },
  asos: {
    name: "ASOS",
    pages: { women: "https://www.asos.com/women/new-in/cat/?cid=27108", men: "https://www.asos.com/men/new-in/cat/?cid=27110" },
    allowedHosts: ["www.asos.com", "asos.com"],
    imageHosts: ["www.asos.com", "asos.com", "images.asos-media.com"],
  },
};

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}

function toAllowedUrl(value: unknown, baseUrl: string, allowedHosts: string[]): string {
  const candidate = text(value);
  if (!candidate) return "";
  try {
    const url = new URL(candidate, baseUrl);
    if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname.toLowerCase())) return "";
    return url.href;
  } catch {
    return "";
  }
}

function flattenJsonLd(value: unknown, products: Record<string, unknown>[], seen = new Set<object>()) {
  if (Array.isArray(value)) {
    for (const entry of value) flattenJsonLd(entry, products, seen);
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  const object = value as Record<string, unknown>;
  const types = Array.isArray(object["@type"]) ? object["@type"] : [object["@type"]];
  if (types.some((type) => typeof type === "string" && type.toLowerCase() === "product")) products.push(object);
  for (const child of Object.values(object)) flattenJsonLd(child, products, seen);
}

function productsFromHtml(html: string, pageUrl: string, catalog: StoreCatalog): Product[] {
  const $ = load(html);
  const found: Product[] = [];
  const seen = new Set<string>();
  const addProduct = (product: Product) => {
    if (!product.name || !product.imageUrl || !product.productUrl || seen.has(product.productUrl)) return;
    seen.add(product.productUrl);
    found.push(product);
  };

  $("script[type='application/ld+json']").each((_, script) => {
    const contents = $(script).contents().text();
    try {
      const nodes: Record<string, unknown>[] = [];
      flattenJsonLd(JSON.parse(contents), nodes);
      for (const node of nodes) {
        const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        const offer = offers && typeof offers === "object" ? offers as Record<string, unknown> : {};
        const images = Array.isArray(node.image) ? node.image : [node.image];
        const imageObject = images[0] && typeof images[0] === "object" ? images[0] as Record<string, unknown> : null;
        addProduct({
          id: text(node.sku || node.productID || node.name) || `product-${found.length}`,
          name: text(node.name),
          imageUrl: toAllowedUrl(imageObject?.url || imageObject?.contentUrl || images[0], pageUrl, catalog.imageHosts),
          productUrl: toAllowedUrl(node.url, pageUrl, catalog.allowedHosts),
          price: text(offer.price || offer.lowPrice) || null,
          currency: text(offer.priceCurrency) || null,
        });
      }
    } catch {
      // Some retail pages contain malformed JSON-LD; continue with page markup.
    }
  });

  const productLinkPattern = /(?:productpage\.|\/prd\/|\/product\/|\/products\/|\/p\/)/i;
  $("a[href]").each((index, element) => {
    if (found.length >= MAX_PRODUCTS) return false;
    const anchor = $(element);
    const productUrl = toAllowedUrl(anchor.attr("href"), pageUrl, catalog.allowedHosts);
    if (!productUrl || !productLinkPattern.test(new URL(productUrl).pathname)) return;

    const image = anchor.find("img").first();
    const card = anchor.closest("article, li, [data-product], [class*='product-card'], [class*='productCard'], [class*='product-item']");
    const scope = card.length ? card : anchor;
    const name = text(
      image.attr("alt") || anchor.attr("aria-label") || scope.find("[data-testid*='name'], [class*='product-name'], [class*='productName'], h2, h3").first().text() || anchor.text(),
    );
    const imageUrl = toAllowedUrl(image.attr("data-src") || image.attr("data-original") || image.attr("src") || image.attr("srcset")?.split(",")[0]?.trim().split(/\s+/)[0], pageUrl, catalog.imageHosts);
    const priceElement = scope.find("[itemprop='price'], [data-price], [class*='price'], [data-testid*='price']").first();
    const rawPrice = text(priceElement.attr("content") || priceElement.attr("data-price") || priceElement.text()).replace(/\s+/g, " ");
    const priceMatch = rawPrice.match(/(?:[$€£]\s?\d[\d,.]*|\d[\d,.]*\s?(?:USD|EUR|GBP|CAD|AUD))/i);
    const currency = priceMatch?.[0].includes("$") ? "USD" : priceMatch?.[0].includes("€") ? "EUR" : priceMatch?.[0].includes("£") ? "GBP" : priceMatch?.[0].match(/USD|EUR|GBP|CAD|AUD/i)?.[0]?.toUpperCase() ?? null;
    const price = priceMatch?.[0].replace(/[^\d,.]/g, "").replace(/,/g, "") || null;

    addProduct({ id: `page-${index}-${productUrl}`, name, imageUrl, productUrl, price, currency });
  });

  return found.slice(0, MAX_PRODUCTS);
}

async function getCatalogHtml(url: string, catalog: StoreCatalog) {
  let current = new URL(url);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (current.protocol !== "https:" || !catalog.allowedHosts.includes(current.hostname.toLowerCase())) {
      throw new Error("Retailer redirected outside its approved domain.");
    }
    const response = await fetch(current, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "TryOnFashion/1.0 (+https://www.tryonfashion.app; product catalog preview)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 900 },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Retailer redirected without a destination.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`Retailer returned HTTP ${response.status}.`);
    if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
      throw new Error("Retailer did not return a product page.");
    }
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_PAGE_BYTES) throw new Error("Retailer page is too large to process.");
    const html = await response.text();
    if (Buffer.byteLength(html) > MAX_PAGE_BYTES) throw new Error("Retailer page is too large to process.");
    return { html, finalUrl: current.href };
  }
  throw new Error("Retailer redirected too many times.");
}

export async function GET(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const catalog = catalogs[storeId];
  if (!catalog) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  const department = new URL(request.url).searchParams.get("department");
  if (department !== "women" && department !== "men") {
    return NextResponse.json({ error: "Choose women's or men's clothing." }, { status: 400 });
  }

  try {
    const { html, finalUrl } = await getCatalogHtml(catalog.pages[department], catalog);
    const products = productsFromHtml(html, finalUrl, catalog);
    if (!products.length) {
      return NextResponse.json({
        products: [],
        store: catalog.name,
        department,
        message: "This retailer's catalog did not expose product details on its public page. Try again later or visit its collection in a new tab.",
      }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
    }
    return NextResponse.json({ products, store: catalog.name, department }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.warn("Store catalog fetch failed", { storeId, message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({
      error: "We couldn't load this store's catalog right now. The retailer may block automated requests or be temporarily unavailable.",
    }, { status: 502 });
  }
}

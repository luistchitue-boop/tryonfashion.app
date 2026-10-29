import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CATALOG_TTL_SECONDS = 900;
const PAGE_SIZE = 30;

type CjProduct = {
  id?: string | number;
  title?: string;
  brand?: string;
  imageLink?: string;
  link?: string;
  price?: { amount?: string | number; currency?: string };
  salePrice?: { amount?: string | number; currency?: string };
  availability?: string;
  advertiserName?: string;
  gender?: string;
  linkCode?: { clickUrl?: string; imageUrl?: string };
};

type ShopProduct = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  productUrl: string;
  price: string | null;
  currency: string | null;
  availability: string | null;
  gender: string | null;
};

type CatalogResult = { products: ShopProduct[]; totalCount: number; nextOffset: number };

function secureImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

function secureProductUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

function mapProduct(product: CjProduct): ShopProduct | null {
  const name = product.title?.trim();
  const imageUrl = secureImageUrl(product.imageLink || product.linkCode?.imageUrl);
  const productUrl = secureProductUrl(product.linkCode?.clickUrl || product.link);
  if (!name || !imageUrl || !productUrl) return null;

  const price = product.salePrice?.amount ?? product.price?.amount;
  return {
    id: String(product.id ?? productUrl),
    name,
    brand: product.brand?.trim() || product.advertiserName?.trim() || "Fashion",
    imageUrl,
    productUrl,
    price: price === undefined || price === null ? null : String(price),
    currency: product.salePrice?.currency || product.price?.currency || null,
    availability: product.availability || null,
    gender: product.gender || null,
  };
}

async function searchCjProducts(department: "women" | "men", search: string, offset: number, country: string): Promise<CatalogResult> {
  const token = process.env.CJ_API_TOKEN;
  const companyId = process.env.CJ_COMPANY_ID;
  const publisherId = process.env.CJ_PUBLISHER_ID;
  if (!token || !companyId || !publisherId) throw new Error("CJ_NOT_CONFIGURED");

  const keywords = [search ? `${department} ${search}` : `${department} clothing`];
  const query = `query SearchShoppingProducts($companyId: ID!, $keywords: [String!], $country: String!, $limit: Int!, $offset: Int!, $publisherId: String!) {
    shoppingProducts(
      companyId: $companyId
      partnerStatus: JOINED
      keywords: $keywords
      advertiserCountries: [$country]
      limit: $limit
      offset: $offset
    ) {
      totalCount
      resultList {
        id
        title
        brand
        imageLink
        link
        price { amount currency }
        salePrice { amount currency }
        availability
        gender
        advertiserName
        linkCode(pid: $publisherId) { clickUrl imageUrl }
      }
    }
  }`;

  const response = await fetch("https://ads.api.cj.com/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        companyId,
        keywords,
        country,
        limit: PAGE_SIZE,
        offset,
        publisherId,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const responseBody = (await response.text()).slice(0, 1_500).replaceAll(token, "[redacted]").replace(/[\u0000-\u001f]/g, " ");
    console.error("CJ product feed HTTP error", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      body: responseBody,
    });
    if (response.status === 401 || response.status === 403) throw new Error("CJ_AUTH_FAILED");
    if (response.status === 429) throw new Error("CJ_RATE_LIMITED");
    if (response.status === 400) throw new Error("CJ_QUERY_REJECTED");
    throw new Error(`CJ_UPSTREAM_${response.status}`);
  }

  let payload: {
    data?: { shoppingProducts?: { totalCount?: number; resultList?: CjProduct[] } };
    errors?: Array<{ message?: string }>;
  };
  try {
    payload = await response.json();
  } catch {
    console.error("CJ product feed returned a non-JSON success response", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    throw new Error("CJ_INVALID_RESPONSE");
  }
  if (payload.errors?.length) {
    console.error("CJ product feed query error", { errors: payload.errors.map((error) => error.message).filter(Boolean) });
    throw new Error("CJ_QUERY_FAILED");
  }

  const listing = payload.data?.shoppingProducts;
  const products = (listing?.resultList ?? []).map(mapProduct).filter((product): product is ShopProduct => Boolean(product));
  return {
    products,
    totalCount: Number(listing?.totalCount ?? products.length),
    nextOffset: offset + (listing?.resultList?.length ?? 0),
  };
}

const getCachedCjProducts = unstable_cache(
  async (department: "women" | "men", search: string, offset: number, country: string) => searchCjProducts(department, search, offset, country),
  ["cj-shop-products-v1"],
  { revalidate: CATALOG_TTL_SECONDS, tags: ["cj-product-catalog"] },
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department");
  if (department !== "women" && department !== "men") {
    return NextResponse.json({ error: "Choose women's or men's clothing.", code: "INVALID_DEPARTMENT" }, { status: 400 });
  }

  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const parsedOffset = Number(url.searchParams.get("offset") ?? 0);
  if (!Number.isInteger(parsedOffset) || parsedOffset < 0 || parsedOffset > 100_000) {
    return NextResponse.json({ error: "Invalid catalog page.", code: "INVALID_OFFSET" }, { status: 400 });
  }

  try {
    const country = (process.env.CJ_ADVERTISER_COUNTRY || "US").trim().toUpperCase().slice(0, 2);
    const result = await getCachedCjProducts(department, search, parsedOffset, country);
    return NextResponse.json(result, {
      headers: { "Cache-Control": `public, s-maxage=${CATALOG_TTL_SECONDS}, stale-while-revalidate=3600` },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CJ_REQUEST_FAILED";
    console.warn("CJ catalog request failed", { code });
    const message = code === "CJ_NOT_CONFIGURED"
      ? "CJ integration is not configured. Add the CJ publisher API settings to the server environment."
      : code === "CJ_AUTH_FAILED"
        ? "CJ rejected the API credentials. Verify the publisher token and company ID in server settings."
        : code === "CJ_RATE_LIMITED"
          ? "CJ is temporarily rate-limiting catalog requests. Please retry shortly."
          : code === "CJ_QUERY_REJECTED"
            ? "CJ rejected the catalog query. Verify the company ID, publisher ID, and access to joined product feeds; see the Vercel function logs for CJ's response details."
          : code === "CJ_QUERY_FAILED"
            ? "CJ couldn't complete this product search. Check that your publisher account can access joined shopping feeds."
            : code === "CJ_INVALID_RESPONSE"
              ? "CJ returned an unexpected response. Check the Vercel function logs and retry."
              : code.startsWith("CJ_UPSTREAM_")
                ? `CJ's catalog service returned an error (${code.replace("CJ_UPSTREAM_", "HTTP ")}). Check the Vercel function logs and retry.`
                : "CJ's product catalog is temporarily unavailable. Please try again later.";
    return NextResponse.json({ error: message, code }, {
      status: code === "CJ_NOT_CONFIGURED" ? 503 : 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

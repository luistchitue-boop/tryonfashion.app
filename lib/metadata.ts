import { z } from "zod";

const urlSchema = z.string().url();

function normalizeHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return "unknown";
  }
}

function getMetaContent(doc: Document, property: string) {
  const elements = Array.from(doc.querySelectorAll(`meta[property="${property}"]`));
  const itemProp = Array.from(doc.querySelectorAll(`meta[itemprop="${property}"]`));
  const fromName = Array.from(doc.querySelectorAll(`meta[name="${property}"]`));
  const candidate = [...elements, ...itemProp, ...fromName].find((element) => element.getAttribute("content"));
  return candidate?.getAttribute("content") ?? null;
}

export async function extractProductMetadata(rawUrl: string) {
  const parsed = urlSchema.safeParse(rawUrl);
  if (!parsed.success) {
    return null;
  }

  const url = new URL(parsed.data);
  if (!/^(https?:)$/.test(url.protocol)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 TryOnFashion/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return null;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const productName =
      getMetaContent(doc, "og:title") ??
      doc.querySelector("title")?.textContent?.trim() ??
      doc.querySelector("h1")?.textContent?.trim() ??
      null;

    const imageUrl =
      getMetaContent(doc, "og:image") ??
      doc.querySelector("meta[property='og:image:url']")?.getAttribute("content") ??
      null;

    const priceText =
      getMetaContent(doc, "product:price:amount") ??
      doc.querySelector('[itemprop="price"]')?.getAttribute("content") ??
      doc.querySelector('[data-price]')?.getAttribute("data-price") ??
      null;

    return {
      productName: productName?.trim() ?? null,
      imageUrl: imageUrl?.trim() ?? null,
      price: priceText?.trim() ?? null,
      source: normalizeHostname(url.toString()),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

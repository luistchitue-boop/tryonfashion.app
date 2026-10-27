import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { generateText } from "ai";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { galleryPhotos, savedItems } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function isPublicIpv4(address: string) {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split(".").map(Number);
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

async function fetchProductImage(imageUrl: string) {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error("This closet piece has an invalid product image URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("For safety, product images must use a public HTTPS address.");
  }

  const addresses = isIP(url.hostname) === 4
    ? [{ address: url.hostname, family: 4 }]
    : isIP(url.hostname)
      ? []
      : await lookup(url.hostname, { all: true, verbatim: true, family: 4 });
  const publicAddresses = addresses.filter((entry) => entry.family === 4 && isPublicIpv4(entry.address));
  if (!publicAddresses.length || publicAddresses.length !== addresses.length) {
    throw new Error("The product image host is not publicly reachable.");
  }
  const pinnedAddress = publicAddresses[0].address;

  return new Promise<{ data: Uint8Array; mediaType: string }>((resolve, reject) => {
    const request = httpsRequest({
      hostname: url.hostname,
      servername: url.hostname,
      port: 443,
      path: `${url.pathname}${url.search}`,
      method: "GET",
      agent: false,
      headers: { Accept: "image/jpeg,image/png,image/webp,image/avif" },
      lookup: (_hostname, options, callback) => {
        // Node may request all DNS records when opening a TLS socket. Honor
        // that overload; returning a scalar in all mode produces an undefined
        // address in Node's family-selection path.
        if (typeof options === "object" && options.all) {
          callback(null, [{ address: pinnedAddress, family: 4 }]);
        } else {
          callback(null, pinnedAddress, 4);
        }
      },
    }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error("The product image could not be retrieved. Try another closet item."));
        return;
      }
      const mediaType = (response.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      if (!supportedImageTypes.has(mediaType)) {
        response.resume();
        reject(new Error("The product image must be JPEG, PNG, WebP, or AVIF."));
        return;
      }
      const contentLength = Number(response.headers["content-length"] || 0);
      if (contentLength > MAX_PRODUCT_IMAGE_BYTES) {
        response.resume();
        reject(new Error("The product image is too large to use for a try-on."));
        return;
      }

      const chunks: Buffer[] = [];
      let total = 0;
      response.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > MAX_PRODUCT_IMAGE_BYTES) {
          request.destroy(new Error("The product image is too large to use for a try-on."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ data: new Uint8Array(Buffer.concat(chunks)), mediaType }));
      response.on("error", reject);
    });
    request.setTimeout(12_000, () => request.destroy(new Error("The product image request timed out.")));
    request.on("error", reject);
    request.end();
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to create a try-on." }, { status: 401 });
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json({ error: "AI image generation is not configured for this deployment." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("itemId" in body) || !("photoId" in body) || typeof body.itemId !== "string" || typeof body.photoId !== "string") {
    return NextResponse.json({ error: "Choose a closet piece and a gallery photo." }, { status: 400 });
  }

  const db = getDb();
  const [[item], [photo]] = await Promise.all([
    db.select({ imageUrl: savedItems.imageUrl, productName: savedItems.productName, userId: savedItems.userId })
      .from(savedItems).where(eq(savedItems.id, body.itemId)).limit(1),
    db.select({ pathname: galleryPhotos.pathname, contentType: galleryPhotos.contentType, userId: galleryPhotos.userId })
      .from(galleryPhotos).where(eq(galleryPhotos.id, body.photoId)).limit(1),
  ]);
  if (!item || item.userId !== user.id || !photo || photo.userId !== user.id) {
    return NextResponse.json({ error: "That closet piece or gallery photo is unavailable." }, { status: 404 });
  }
  if (!item.imageUrl) return NextResponse.json({ error: "This closet piece does not have a product image." }, { status: 400 });
  if (!supportedImageTypes.has(photo.contentType)) {
    return NextResponse.json({ error: "This gallery photo format is not supported for try-on yet." }, { status: 400 });
  }

  try {
    const [blob, productImage] = await Promise.all([
      get(photo.pathname, { access: "private" }),
      fetchProductImage(item.imageUrl),
    ]);
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return NextResponse.json({ error: "Could not load your selected gallery photo." }, { status: 404 });
    }
    const photoBytes = new Uint8Array(await new Response(blob.stream).arrayBuffer());

    const result = await generateText({
      model: "google/gemini-3-pro-image",
      abortSignal: AbortSignal.timeout(105_000),
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Create a photorealistic virtual try-on using the two reference images. The first image is the user's personal photo; preserve their identity, face, body shape, pose, skin tone, hair, background, and camera framing. The second image shows the clothing item: faithfully reproduce its garment, color, pattern, material, cut, and details, and naturally dress the person in it. Do not add text, accessories, or unrelated clothing. The item is: ${item.productName}. Return one finished image.`,
          },
          { type: "file", mediaType: photo.contentType, data: photoBytes },
          { type: "file", mediaType: productImage.mediaType, data: productImage.data },
        ],
      }],
    });

    const generatedImage = result.files.find((file) => file.mediaType.startsWith("image/"));
    if (!generatedImage) return NextResponse.json({ error: "The AI model did not return an image. Please try again." }, { status: 502 });

    return new NextResponse(Buffer.from(generatedImage.uint8Array), {
      headers: {
        "Content-Type": generatedImage.mediaType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Virtual try-on generation failed", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof Error && /public HTTPS|publicly reachable|too large|JPEG, PNG|invalid product image|timed out|could not be retrieved/i.test(error.message)
      ? error.message
      : "Try-on generation failed. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

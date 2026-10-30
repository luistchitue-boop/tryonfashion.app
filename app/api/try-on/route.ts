import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { generateImage } from "ai";
import sharp from "sharp";
import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { creditCostFor, debitCredits, refundCredits } from "@/lib/credits";
import { savedItems } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PERSON_IMAGE_BYTES = 4 * 1024 * 1024;
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function toModelJpeg(image: Uint8Array) {
  return new Uint8Array(await sharp(image, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1536, height: 2048, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer());
}

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload a photo and select up to four closet pieces." }, { status: 400 });
  }
  const uploadedPhoto = formData.get("photo");
  const rawItemIds = formData.get("itemIds");
  if (!(uploadedPhoto instanceof File) || typeof rawItemIds !== "string") {
    return NextResponse.json({ error: "Upload a photo and select up to four closet pieces." }, { status: 400 });
  }
  let itemIds: unknown;
  try {
    itemIds = JSON.parse(rawItemIds);
  } catch {
    return NextResponse.json({ error: "Choose between one and four closet pieces." }, { status: 400 });
  }
  if (!Array.isArray(itemIds) || itemIds.length < 1 || itemIds.length > 4 || itemIds.some((id) => typeof id !== "string") || new Set(itemIds).size !== itemIds.length) {
    return NextResponse.json({ error: "Choose between one and four different closet pieces." }, { status: 400 });
  }
  if (!supportedImageTypes.has(uploadedPhoto.type)) {
    return NextResponse.json({ error: "Upload a JPEG, PNG, WebP, or AVIF photo." }, { status: 400 });
  }
  if (uploadedPhoto.size === 0 || uploadedPhoto.size > MAX_PERSON_IMAGE_BYTES) {
    return NextResponse.json({ error: "Your photo must be smaller than 4 MB." }, { status: 400 });
  }

  const db = getDb();
  const items = await db.select({ id: savedItems.id, imageUrl: savedItems.imageUrl, productName: savedItems.productName, userId: savedItems.userId })
    .from(savedItems).where(inArray(savedItems.id, itemIds as string[]));
  if (items.length !== itemIds.length || items.some((item) => item.userId !== user.id)) {
    return NextResponse.json({ error: "One or more selected closet pieces are unavailable." }, { status: 404 });
  }
  const selectedItems = itemIds.map((id) => items.find((item) => item.id === id)!);
  if (selectedItems.some((item) => !item.imageUrl)) {
    return NextResponse.json({ error: "Each selected closet piece needs a product image." }, { status: 400 });
  }

  const creditReference = `image-generation:${crypto.randomUUID()}`;
  const imageCreditCost = creditCostFor("image_generation");
  const hasCredits = await debitCredits(user.id, "image_generation", creditReference);
  if (!hasCredits) {
    return NextResponse.json({ error: `You need ${imageCreditCost} credit${imageCreditCost === 1 ? "" : "s"} to create a try-on. Add credits to continue.`, code: "INSUFFICIENT_CREDITS" }, { status: 402 });
  }

  try {
    const photoBytes = new Uint8Array(await uploadedPhoto.arrayBuffer());
    const [modelPhoto, ...modelProducts] = await Promise.all([
      toModelJpeg(photoBytes),
      ...selectedItems.map(async (item) => toModelJpeg((await fetchProductImage(item.imageUrl!)).data)),
    ]);
    const clothingDescription = selectedItems.map((item, index) => `${index + 1}. ${item.productName}`).join("; ");

    const result = await generateImage({
      model: "microsoft/mai-image-2.6-flash",
      abortSignal: AbortSignal.timeout(105_000),
      prompt: {
        text: `Create one photorealistic virtual try-on using the reference images. The first image is the user's personal photo; preserve their identity, face, body shape, pose, skin tone, hair, background, and camera framing. The remaining images show the clothing pieces in the listed order: ${clothingDescription}. Faithfully reproduce each garment's color, pattern, material, cut, and details, and style the person wearing all selected pieces together naturally. Do not add text, accessories, or unrelated clothing. Return one finished image.`,
        images: [modelPhoto, ...modelProducts],
      },
    });

    return new NextResponse(Buffer.from(result.image.uint8Array), {
      headers: {
        "Content-Type": result.image.mediaType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    await refundCredits(user.id, "image_generation", creditReference).catch((refundError) => {
      console.error("Could not refund failed try-on credits", refundError instanceof Error ? refundError.message : "Unknown error");
    });
    console.error("Virtual try-on generation failed", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof Error && /public HTTPS|publicly reachable|too large|JPEG, PNG|invalid product image|timed out|could not be retrieved/i.test(error.message)
      ? error.message
      : "Try-on generation failed. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

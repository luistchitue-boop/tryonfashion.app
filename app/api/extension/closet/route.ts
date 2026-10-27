import { verifyToken } from "@clerk/backend";
import { NextResponse } from "next/server";
import { syncClerkUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";
import { savedItemSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowedOrigins() {
  return (process.env.CHROME_EXTENSION_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null) {
  const allowed = allowedOrigins();
  const permittedOrigin = origin && allowed.includes(origin) ? origin : "";
  return {
    ...(permittedOrigin ? { "Access-Control-Allow-Origin": permittedOrigin, Vary: "Origin" } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  if (!origin || !allowedOrigins().includes(origin)) {
    return NextResponse.json({ error: "Extension origin is not allowed." }, { status: 403 });
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Sign in to save this item." }, { status: 401, headers });

  let claims: Awaited<ReturnType<typeof verifyToken>>;
  try {
    claims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  } catch (error) {
    // Keep the bearer token out of logs; the verification reason is needed to
    // distinguish an expired token from a key or authorized-party mismatch.
    console.error("Extension Clerk token verification failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Non-Error thrown",
    });
    return NextResponse.json({ error: "Your sign-in expired. Sign in again and retry." }, { status: 401, headers });
  }

  if (typeof claims.sub !== "string" || !claims.sub.startsWith("user_")) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers });
  }

  const parsed = savedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid item data." }, { status: 400, headers });
  }

  const { sub, email, name, image_url: imageUrl } = claims;
  const user = await syncClerkUser({
    clerkId: sub,
    email: typeof email === "string" ? email : null,
    name: typeof name === "string" ? name : null,
    image: typeof imageUrl === "string" ? imageUrl : null,
  });
  const data = parsed.data;
  const [item] = await getDb()
    .insert(savedItems)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      productName: data.productName,
      brand: data.brand?.trim() || null,
      productUrl: data.productUrl,
      imageUrl: data.imageUrl?.trim() || null,
      price: data.price ? Number(data.price) : null,
      currency: data.currency?.trim().toUpperCase() || null,
      source: data.source,
    })
    .returning();

  return NextResponse.json({ item }, { status: 201, headers });
}

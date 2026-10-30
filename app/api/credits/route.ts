import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCreditPackage } from "@/lib/credit-plans";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_NOT_CONFIGURED");
  return new Stripe(secretKey);
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your credits." }, { status: 401 });

  const [account] = await getDb()
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return NextResponse.json({ balance: account?.creditBalance ?? 0 });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to purchase credits." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose a credit package." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("packageId" in body) || typeof body.packageId !== "string") {
    return NextResponse.json({ error: "Choose a credit package." }, { status: 400 });
  }

  const creditPackage = getCreditPackage(body.packageId);
  if (!creditPackage) return NextResponse.json({ error: "That credit package is unavailable." }, { status: 400 });

  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) return NextResponse.json({ error: "Payments are not configured for this deployment." }, { status: 503 });
  try {
    const stripe = stripeClient();
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      allowed_payment_method_types: ["card"],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: creditPackage.priceCents,
          product_data: {
            name: `${creditPackage.credits} TryOnFashion credits`,
            description: `${creditPackage.name} package: ${creditPackage.description}.`,
          },
        },
      }],
      metadata: { userId: user.id, packageId: creditPackage.id },
      success_url: `${appUrl}/credits?checkout=success`,
      cancel_url: `${appUrl}/credits?checkout=cancelled`,
    });
    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}

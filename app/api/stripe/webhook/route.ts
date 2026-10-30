import Stripe from "stripe";
import { NextResponse } from "next/server";
import { addCredits } from "@/lib/credits";
import { getCreditPackage } from "@/lib/credit-plans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secretKey || !webhookSecret || !signature) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.warn("Stripe webhook signature verification failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }
  const userId = session.metadata?.userId;
  const packageId = session.metadata?.packageId;
  const creditPackage = packageId ? getCreditPackage(packageId) : undefined;
  if (!userId || session.client_reference_id !== userId || !creditPackage ||
      session.amount_total !== creditPackage.priceCents || session.currency !== "usd") {
    console.error("Paid Stripe session failed credit verification", { sessionId: session.id });
    return NextResponse.json({ error: "Checkout session does not match a credit package." }, { status: 400 });
  }

  try {
    await addCredits(userId, creditPackage.credits, "purchase", `stripe-session:${session.id}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Could not apply Stripe credit purchase", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not apply credit purchase." }, { status: 500 });
  }
}

import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { creditTransactions } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to view billing history." }, { status: 401 });

  const purchases = await getDb()
    .select({
      id: creditTransactions.id,
      credits: creditTransactions.amount,
      paymentAmountCents: creditTransactions.paymentAmountCents,
      currency: creditTransactions.currency,
      packageId: creditTransactions.packageId,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(and(eq(creditTransactions.userId, user.id), eq(creditTransactions.type, "purchase")))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(100);

  return NextResponse.json({ purchases }, { headers: { "Cache-Control": "private, no-store" } });
}

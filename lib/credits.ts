import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { CREDIT_COSTS } from "@/lib/credit-plans";

export type CreditUsage = "image_generation";

const usageCosts: Record<CreditUsage, number> = {
  image_generation: CREDIT_COSTS.imageGeneration,
};

export function creditCostFor(usage: CreditUsage) {
  return usageCosts[usage];
}

export async function debitCredits(userId: string, usage: CreditUsage, reference: string) {
  const amount = creditCostFor(usage);
  const result = await getDb().execute(sql`
    WITH deducted AS (
      UPDATE "User"
      SET "creditBalance" = "creditBalance" - ${amount}, "updatedAt" = now()
      WHERE "id" = ${userId} AND "creditBalance" >= ${amount}
      RETURNING "id"
    ), recorded AS (
      INSERT INTO "CreditTransaction" ("id", "userId", "amount", "type", "reference")
      SELECT ${crypto.randomUUID()}, deducted."id", ${-amount}, ${usage}, ${reference}
      FROM deducted
      RETURNING "id"
    )
    SELECT "id" FROM recorded
  `);
  return result.rows.length > 0;
}

export async function addCredits(userId: string, amount: number, type: string, reference: string) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Invalid credit amount.");
  const result = await getDb().execute(sql`
    WITH recorded AS (
      INSERT INTO "CreditTransaction" ("id", "userId", "amount", "type", "reference")
      VALUES (${crypto.randomUUID()}, ${userId}, ${amount}, ${type}, ${reference})
      ON CONFLICT ("reference") DO NOTHING
      RETURNING "userId", "amount"
    ), credited AS (
      UPDATE "User" AS account
      SET "creditBalance" = account."creditBalance" + recorded."amount", "updatedAt" = now()
      FROM recorded
      WHERE account."id" = recorded."userId"
      RETURNING account."id"
    )
    SELECT "id" FROM credited
  `);
  return result.rows.length > 0;
}

export async function refundCredits(userId: string, usage: CreditUsage, reference: string) {
  return addCredits(userId, creditCostFor(usage), "refund", `${reference}:refund`);
}

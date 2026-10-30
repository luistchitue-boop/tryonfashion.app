import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { CreditsClient } from "@/components/credits-client";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

type CreditsPageProps = {
  searchParams: Promise<{ checkout?: string | string[] }>;
};

export default async function CreditsPage({ searchParams }: CreditsPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in?callbackUrl=/credits");

  const [{ creditBalance }, params] = await Promise.all([
    getDb().select({ creditBalance: users.creditBalance }).from(users).where(eq(users.id, user.id)).limit(1).then((rows) => rows[0] ?? { creditBalance: 0 }),
    searchParams,
  ]);
  const checkoutParam = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;
  const checkoutStatus = checkoutParam === "success" || checkoutParam === "cancelled" ? checkoutParam : undefined;

  return <CreditsClient initialBalance={creditBalance} checkoutStatus={checkoutStatus} />;
}

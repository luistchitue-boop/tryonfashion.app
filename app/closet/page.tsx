import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { ClosetClient } from "@/components/closet-client";
import { getDb } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";

export default async function ClosetPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in?callbackUrl=/closet");
  }

  const items = await getDb()
    .select()
    .from(savedItems)
    .where(eq(savedItems.userId, user.id))
    .orderBy(desc(savedItems.createdAt));

  return (
    <ClosetClient
      initialItems={items.map((item) => ({
        id: item.id,
        productName: item.productName,
        brand: item.brand,
        productUrl: item.productUrl,
        imageUrl: item.imageUrl,
        price: item.price,
        currency: item.currency,
        source: item.source,
        createdAt: item.createdAt.toISOString(),
      }))}
      userName={user.name ?? "Fashion lover"}
      userImage={user.image ?? null}
    />
  );
}

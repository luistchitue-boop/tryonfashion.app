import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TryOnClient } from "@/components/try-on-client";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";

export default async function TryOnPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in?callbackUrl=/closet/try-on");

  const items = await getDb().select({
      id: savedItems.id,
      productName: savedItems.productName,
      brand: savedItems.brand,
      imageUrl: savedItems.imageUrl,
      source: savedItems.source,
    }).from(savedItems).where(eq(savedItems.userId, user.id)).orderBy(desc(savedItems.createdAt));

  return <TryOnClient initialItems={items} />;
}

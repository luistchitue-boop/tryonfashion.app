"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";
import { savedItemSchema } from "@/lib/validations";

const createSavedItemSchema = savedItemSchema;

export async function createSavedItem(input: z.infer<typeof createSavedItemSchema>) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("You must be signed in to save a piece.");
  }

  const parsed = createSavedItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid item data.");
  }

  const data = parsed.data;
  const productUrl = new URL(data.productUrl).toString();
  const normalizedImageUrl = data.imageUrl ? new URL(data.imageUrl).toString() : null;
  const priceValue = data.price && data.price !== "" ? Number(data.price) : null;

  const [item] = await getDb().insert(savedItems).values({
      id: crypto.randomUUID(),
      userId: user.id,
      productName: data.productName,
      brand: data.brand && data.brand.trim() ? data.brand.trim() : null,
      productUrl: productUrl,
      imageUrl: normalizedImageUrl,
      price: priceValue !== null ? priceValue : null,
      currency: data.currency && data.currency.trim() ? data.currency.trim().toUpperCase() : null,
      source: data.source,
    }).returning();

  revalidatePath("/closet");
  redirect("/closet");

  return item;
}

export async function deleteSavedItem(id: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("You must be signed in to remove a piece.");
  }

  const [item] = await getDb()
    .select({ userId: savedItems.userId })
    .from(savedItems)
    .where(eq(savedItems.id, id))
    .limit(1);

  if (!item || item.userId !== user.id) {
    throw new Error("You are not allowed to remove this item.");
  }

  await getDb().delete(savedItems).where(and(eq(savedItems.id, id), eq(savedItems.userId, user.id)));
  revalidatePath("/closet");
}

export async function getClosetItems() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return [];
  }

  return getDb().select().from(savedItems).where(eq(savedItems.userId, user.id)).orderBy(desc(savedItems.createdAt));
}

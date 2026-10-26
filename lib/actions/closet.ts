"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { savedItemSchema } from "@/lib/validations";

const createSavedItemSchema = savedItemSchema;

export async function createSavedItem(input: z.infer<typeof createSavedItemSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
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

  const item = await prisma.savedItem.create({
    data: {
      userId: session.user.id,
      productName: data.productName,
      brand: data.brand && data.brand.trim() ? data.brand.trim() : null,
      productUrl: productUrl,
      imageUrl: normalizedImageUrl,
      price: priceValue !== null ? priceValue : null,
      currency: data.currency && data.currency.trim() ? data.currency.trim().toUpperCase() : null,
      source: data.source,
    },
  });

  revalidatePath("/closet");
  redirect("/closet");

  return item;
}

export async function deleteSavedItem(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to remove a piece.");
  }

  const item = await prisma.savedItem.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!item || item.userId !== session.user.id) {
    throw new Error("You are not allowed to remove this item.");
  }

  await prisma.savedItem.delete({ where: { id } });
  revalidatePath("/closet");
}

export async function getClosetItems() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.savedItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

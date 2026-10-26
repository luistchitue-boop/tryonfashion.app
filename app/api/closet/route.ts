import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";
import { savedItemSchema } from "@/lib/validations";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getDb()
    .select()
    .from(savedItems)
    .where(eq(savedItems.userId, user.id))
    .orderBy(desc(savedItems.createdAt));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = savedItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid item data." }, { status: 400 });
  }

  const data = parsed.data;
  const [item] = await getDb()
    .insert(savedItems)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      productName: data.productName,
      brand: data.brand && data.brand.trim() ? data.brand.trim() : null,
      productUrl: data.productUrl,
      imageUrl: data.imageUrl && data.imageUrl.trim() ? data.imageUrl.trim() : null,
      price: data.price && data.price !== "" ? Number(data.price) : null,
      currency: data.currency && data.currency.trim() ? data.currency.trim().toUpperCase() : null,
      source: data.source,
    })
    .returning();

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing item id." }, { status: 400 });
  }

  const [item] = await getDb()
    .select({ userId: savedItems.userId })
    .from(savedItems)
    .where(eq(savedItems.id, id))
    .limit(1);

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await getDb().delete(savedItems).where(and(eq(savedItems.id, id), eq(savedItems.userId, user.id)));
  return NextResponse.json({ success: true });
}

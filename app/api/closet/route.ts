import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savedItemSchema } from "@/lib/validations";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.savedItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

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
  const item = await prisma.savedItem.create({
    data: {
      userId: user.id,
      productName: data.productName,
      brand: data.brand && data.brand.trim() ? data.brand.trim() : null,
      productUrl: data.productUrl,
      imageUrl: data.imageUrl && data.imageUrl.trim() ? data.imageUrl.trim() : null,
      price: data.price && data.price !== "" ? Number(data.price) : null,
      currency: data.currency && data.currency.trim() ? data.currency.trim().toUpperCase() : null,
      source: data.source,
    },
  });

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

  const item = await prisma.savedItem.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.savedItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

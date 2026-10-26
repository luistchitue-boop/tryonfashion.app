import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const [photo] = await getDb()
    .select({ userId: galleryPhotos.userId, pathname: galleryPhotos.pathname, contentType: galleryPhotos.contentType })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.id, id))
    .limit(1);

  if (!photo) return new NextResponse("Not found", { status: 404 });
  if (photo.userId !== user.id) return new NextResponse("Forbidden", { status: 403 });

  const blob = await get(photo.pathname, { access: "private" });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

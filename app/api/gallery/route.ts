import { del, put } from "@vercel/blob";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/db/schema";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photos = await getDb()
    .select({ id: galleryPhotos.id, filename: galleryPhotos.filename, createdAt: galleryPhotos.createdAt })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.userId, user.id))
    .orderBy(desc(galleryPhotos.createdAt));

  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN && !(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)) {
    return NextResponse.json({ error: "Vercel Blob is not configured for this deployment." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPEG, PNG, WebP, or AVIF photo." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Each photo must be smaller than 4 MB." }, { status: 400 });
  }

  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  const id = crypto.randomUUID();
  const pathname = `gallery/${user.id}/${id}.${extensionByType[file.type]}`;
  const originalName = file.name.replace(/[\\/\0-\x1f]/g, "_").slice(0, 160) || `photo.${extensionByType[file.type]}`;

  const blob = await put(pathname, file, {
    access: "private",
    contentType: file.type,
    addRandomSuffix: true,
  });

  try {
    const [photo] = await getDb()
      .insert(galleryPhotos)
      .values({ id, userId: user.id, pathname: blob.pathname, filename: originalName, contentType: file.type })
      .returning({ id: galleryPhotos.id, filename: galleryPhotos.filename, createdAt: galleryPhotos.createdAt });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    await del(blob.pathname).catch(() => undefined);
    throw error;
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing photo id." }, { status: 400 });

  const [photo] = await getDb()
    .select({ id: galleryPhotos.id, userId: galleryPhotos.userId, pathname: galleryPhotos.pathname })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.id, id))
    .limit(1);

  if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

  if (photo.userId !== user.id) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  await del(photo.pathname);
  await getDb().delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  return NextResponse.json({ success: true });
}
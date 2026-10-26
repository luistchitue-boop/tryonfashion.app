import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { GalleryClient } from "@/components/gallery-client";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/db/schema";

export default async function GalleryPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in?callbackUrl=/closet/gallery");

  const photos = await getDb()
    .select({ id: galleryPhotos.id, filename: galleryPhotos.filename, createdAt: galleryPhotos.createdAt })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.userId, user.id))
    .orderBy(desc(galleryPhotos.createdAt));

  return (
    <GalleryClient
      initialPhotos={photos.map((photo) => ({ ...photo, createdAt: photo.createdAt.toISOString() }))}
      userName={user.name ?? "Fashion lover"}
      userImage={user.image ?? null}
    />
  );
}
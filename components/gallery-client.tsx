"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { ArrowUpRight, Images, LoaderCircle, Plus, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type GalleryPhoto = {
  id: string;
  filename: string;
  createdAt: string;
};

type GalleryClientProps = {
  initialPhotos: GalleryPhoto[];
  userName: string;
  userImage: string | null;
};

const acceptedImageTypes = "image/jpeg,image/png,image/webp,image/avif";

export function GalleryClient({ initialPhotos, userName, userImage }: GalleryClientProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setIsUploading(true);
    const selectedFiles = Array.from(files);

    try {
      for (const [index, file] of selectedFiles.entries()) {
        setUploadProgress(`Uploading ${index + 1} of ${selectedFiles.length}`);
        const formData = new FormData();
        formData.set("file", file);
        const response = await fetch("/api/gallery", { method: "POST", body: formData });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Could not upload ${file.name}.`);
        setPhotos((current) => [payload.photo, ...current]);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Photo upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    setDeletingId(photo.id);
    setError(null);
    try {
      const response = await fetch(`/api/gallery?id=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not delete this photo.");
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not delete this photo.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-stone-200 bg-white p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-stone-50">TF</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">TryOnFashion</p>
              <p className="text-base font-medium">My Closet</p>
            </div>
          </div>
          <nav className="space-y-2">
            <Link href="/closet" className="block rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">My Closet</Link>
            <Link href="/closet/gallery" aria-current="page" className="block rounded-xl bg-stone-900 px-3 py-2.5 text-sm font-medium text-white">Gallery</Link>
            <Link href="/" className="block rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">Discover</Link>
          </nav>
          <div className="mt-10 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center gap-3">
              {userImage ? (
                <Image src={userImage} alt={userName} width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-sm font-medium text-stone-700">{userName.slice(0, 2).toUpperCase()}</div>
              )}
              <div><p className="text-sm font-medium text-stone-800">{userName}</p><p className="text-xs text-stone-500">Curator</p></div>
            </div>
            <SignOutButton redirectUrl="/">
              <Button type="button" variant="secondary" className="mt-4 w-full justify-center">Sign out</Button>
            </SignOutButton>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Your private photo library</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Gallery</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Add clear photos of yourself to keep ready for future virtual try-ons. Your photos are private and only visible to you.</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isUploading ? uploadProgress : "Upload photos"}
                </Button>
                <SignOutButton redirectUrl="/">
                  <Button type="button" variant="secondary" className="lg:hidden">Sign out</Button>
                </SignOutButton>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={acceptedImageTypes}
                multiple
                className="sr-only"
                onChange={(event) => void uploadPhotos(event.target.files)}
                aria-label="Choose photos to upload"
              />
            </div>
            <nav aria-label="Closet navigation" className="mt-6 flex gap-2 border-t border-stone-200 pt-4 lg:hidden">
              <Link href="/closet" className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700">My Closet</Link>
              <Link href="/closet/gallery" aria-current="page" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white">Gallery</Link>
              <Link href="/" className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700">Discover</Link>
            </nav>
          </header>

          {error && <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          {photos.length ? (
            <section aria-label="Your uploaded photos" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo) => (
                <article key={photo.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <button type="button" onClick={() => setSelectedPhoto(photo)} className="relative block aspect-[4/5] w-full overflow-hidden bg-stone-100 text-left" aria-label={`Preview ${photo.filename}`}>
                    <Image src={`/api/gallery/${photo.id}/image`} alt={photo.filename} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.02]" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 opacity-0 shadow-sm transition group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
                  </button>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{photo.filename}</p><p className="mt-0.5 text-xs text-stone-500">{new Date(photo.createdAt).toLocaleDateString()}</p></div>
                    <button type="button" onClick={() => void deletePhoto(photo)} disabled={deletingId === photo.id} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50" aria-label={`Delete ${photo.filename}`}>
                      {deletingId === photo.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="flex min-h-72 w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center transition hover:border-stone-500 hover:bg-stone-50 disabled:opacity-60">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-700"><Images className="h-7 w-7" /></span>
              <span className="mt-5 text-xl font-semibold">Your gallery starts here</span>
              <span className="mt-2 max-w-md text-sm leading-6 text-stone-600">Upload a few clear, well-lit photos. JPEG, PNG, WebP, or AVIF; up to 4 MB each.</span>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"><Upload className="h-4 w-4" />Choose photos</span>
            </button>
          )}
        </main>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${selectedPhoto.filename}`} onClick={() => setSelectedPhoto(null)}>
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedPhoto(null)} className="absolute -right-2 -top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900" aria-label="Close photo preview"><X className="h-5 w-5" /></button>
            <div className="relative h-[75vh] w-full overflow-hidden rounded-2xl bg-black">
              <Image src={`/api/gallery/${selectedPhoto.id}/image`} alt={selectedPhoto.filename} fill unoptimized className="object-contain" sizes="90vw" />
            </div>
            <p className="mt-3 max-w-full truncate text-sm text-white">{selectedPhoto.filename}</p>
          </div>
        </div>
      )}
    </div>
  );
}
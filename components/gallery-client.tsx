"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { ArrowUpRight, Images, LoaderCircle, Plus, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ITEMS_PER_PAGE, PaginationControls } from "@/components/pagination-controls";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pageCount = Math.max(1, Math.ceil(photos.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, pageCount);
  const visiblePhotos = photos.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

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
        setCurrentPage(1);
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
      <div className="mx-auto flex max-w-7xl gap-4 px-3 py-5 sm:gap-8 sm:px-6 sm:py-6 lg:px-8">
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
            <Link href="/closet/try-on" className="block rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">Try On</Link>
            <Link href="/shop" className="block rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">Shop</Link>
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
          <header className="mb-6 min-w-0 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Your private photo library</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Gallery</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Add clear photos of yourself to keep ready for future virtual try-ons. Your photos are private and only visible to you.</p>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
                <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="min-w-0 flex-1 sm:flex-none">
                  {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isUploading ? uploadProgress : "Upload photos"}
                </Button>
                <SignOutButton redirectUrl="/">
                  <Button type="button" variant="secondary" className="flex-1 sm:flex-none lg:hidden">Sign out</Button>
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
            <nav aria-label="Closet navigation" className="mt-5 flex flex-wrap gap-2 border-t border-stone-200 pt-4 lg:hidden">
              <Link href="/closet" className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700 sm:px-4">My Closet</Link>
              <Link href="/closet/gallery" aria-current="page" className="rounded-full bg-stone-900 px-3 py-2 text-sm text-white sm:px-4">Gallery</Link>
              <Link href="/" className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700 sm:px-4">Discover</Link>
              <Link href="/closet/try-on" className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700 sm:px-4">Try On</Link>
              <Link href="/shop" className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700 sm:px-4">Shop</Link>
            </nav>
          </header>

          {error && <p role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          {photos.length ? (
            <>
            <section aria-label="Your uploaded photos" className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {visiblePhotos.map((photo) => (
                <article key={photo.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <button type="button" onClick={() => setSelectedPhoto(photo)} className="relative block aspect-[4/5] w-full overflow-hidden bg-stone-100 text-left" aria-label={`Preview ${photo.filename}`}>
                    <Image src={`/api/gallery/${photo.id}/image`} alt={photo.filename} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.02]" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-700 opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
                  </button>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{photo.filename}</p><p className="mt-0.5 text-xs text-stone-500">{new Date(photo.createdAt).toLocaleDateString()}</p></div>
                    <button type="button" onClick={() => void deletePhoto(photo)} disabled={deletingId === photo.id} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50" aria-label={`Delete ${photo.filename}`}>
                      {deletingId === photo.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </article>
              ))}
            </section>
            <PaginationControls itemCount={photos.length} page={activePage} onPageChange={setCurrentPage} label="Gallery photos" />
            </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-3 backdrop-blur-sm sm:p-6" role="presentation" onClick={() => setSelectedPhoto(null)}>
          <section className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={`Preview ${selectedPhoto.filename}`} onClick={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 sm:px-5">
              <p className="min-w-0 truncate text-sm font-medium text-stone-800">{selectedPhoto.filename}</p>
              <button type="button" onClick={() => setSelectedPhoto(null)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-900 transition hover:bg-stone-100" aria-label="Close photo preview"><X className="h-5 w-5" /></button>
            </header>
            <div className="relative min-h-0 flex-1 bg-stone-950">
              <Image src={`/api/gallery/${selectedPhoto.id}/image`} alt={selectedPhoto.filename} fill unoptimized className="object-contain" sizes="90vw" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
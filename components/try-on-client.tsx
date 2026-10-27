"use client";

/* eslint-disable @next/next/no-img-element -- Product images come from arbitrary store hosts and results use blob: URLs, so Next's optimizer allowlist is not applicable. */

import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, Check, LoaderCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

type ClosetChoice = { id: string; productName: string; brand: string | null; imageUrl: string | null; source: string };
type GalleryChoice = { id: string; filename: string; contentType: string };

type TryOnClientProps = { initialItems: ClosetChoice[]; initialPhotos: GalleryChoice[] };

export function TryOnClient({ initialItems, initialPhotos }: TryOnClientProps) {
  const [selectedItem, setSelectedItem] = useState(initialItems.find((item) => item.imageUrl)?.id ?? "");
  const [selectedPhoto, setSelectedPhoto] = useState(initialPhotos[0]?.id ?? "");
  const [resultUrl, setResultUrl] = useState("");
  const [resultFormat, setResultFormat] = useState("png");
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const item = initialItems.find((entry) => entry.id === selectedItem);
  const photo = initialPhotos.find((entry) => entry.id === selectedPhoto);

  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  useEffect(() => {
    if (!showPreview) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPreview(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPreview]);

  const generate = async () => {
    if (!selectedItem || !selectedPhoto) return;
    setError("");
    setShowPreview(false);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItem, photoId: selectedPhoto }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Could not create your try-on. Please try again.");
      }
      const resultBlob = await response.blob();
      const nextUrl = URL.createObjectURL(resultBlob);
      setResultFormat(resultBlob.type === "image/jpeg" ? "jpg" : resultBlob.type === "image/webp" ? "webp" : "png");
      setResultUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return nextUrl;
      });
      setShowPreview(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create your try-on. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectClass = (active: boolean) => `group w-full overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 ${active ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-400"}`;
  const imageSrc = (url: string) => url.startsWith("/") ? url : url;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/closet" className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950">← Back to My Closet</Link>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">Style preview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Virtual Try-On</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Pair a photo from your gallery with a piece from your closet to preview the look.</p>
          </div>
        </header>
        <nav aria-label="Closet navigation" className="mt-5 flex flex-wrap gap-2 border-b border-stone-200 pb-4 text-sm">
          <Link href="/closet" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 transition hover:bg-stone-100">My Closet</Link>
          <Link href="/closet/gallery" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 transition hover:bg-stone-100">Gallery</Link>
          <Link href="/" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 transition hover:bg-stone-100">Discover</Link>
          <Link href="/closet/try-on" aria-current="page" className="rounded-full bg-stone-900 px-4 py-2 font-medium text-white">Try On</Link>
        </nav>

        {initialItems.filter((entry) => entry.imageUrl).length && initialPhotos.length ? (
          <div className="mx-auto mt-8 max-w-5xl">
            <section className="space-y-5">
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Step 1</p><h2 className="mt-1 text-lg font-semibold">Choose a closet piece</h2></div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">{initialItems.filter((entry) => entry.imageUrl).length} available</span>
                </div>
                <div className="relative">
                <div className="grid max-h-[28rem] grid-cols-2 gap-3 overflow-y-auto overscroll-contain pr-2 scroll-smooth sm:grid-cols-3 [scrollbar-color:#a8a29e_transparent] [scrollbar-width:thin]">
                  {initialItems.filter((entry) => entry.imageUrl).map((entry) => (
                    <button key={entry.id} type="button" onClick={() => setSelectedItem(entry.id)} disabled={isGenerating} className={`${selectClass(selectedItem === entry.id)} disabled:cursor-not-allowed disabled:opacity-70`} aria-pressed={selectedItem === entry.id}>
                      <div className="relative aspect-[4/5] bg-stone-100">{/* External product image URLs vary by store, so keep these unoptimized rather than requiring a remote-host allowlist. */}<img src={imageSrc(entry.imageUrl!)} alt="" className="h-full w-full object-cover" loading="lazy" />{selectedItem === entry.id && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white"><Check className="h-4 w-4" /></span>}</div>
                      <span className="block truncate px-3 pb-3 pt-2 text-sm font-medium">{entry.productName}</span>
                    </button>
                  ))}
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-b-xl bg-gradient-to-t from-white/90 to-transparent" />
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Step 2</p><h2 className="mt-1 text-lg font-semibold">Choose your photo</h2></div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">{initialPhotos.length} available</span>
                </div>
                <div className="relative">
                <div className="grid max-h-[28rem] grid-cols-3 gap-3 overflow-y-auto overscroll-contain pr-2 scroll-smooth sm:grid-cols-4 [scrollbar-color:#a8a29e_transparent] [scrollbar-width:thin]">
                  {initialPhotos.map((entry) => (
                    <button key={entry.id} type="button" onClick={() => setSelectedPhoto(entry.id)} disabled={isGenerating} className={`${selectClass(selectedPhoto === entry.id)} disabled:cursor-not-allowed disabled:opacity-70`} aria-pressed={selectedPhoto === entry.id}>
                      <div className="relative aspect-[4/5] bg-stone-100"><Image src={`/api/gallery/${entry.id}/image`} alt="" fill unoptimized className="object-cover" sizes="(max-width: 640px) 33vw, 25vw" />{selectedPhoto === entry.id && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white"><Check className="h-4 w-4" /></span>}</div>
                      <span className="block truncate px-2 pb-2 pt-1.5 text-xs font-medium">{entry.filename}</span>
                    </button>
                  ))}
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-b-xl bg-gradient-to-t from-white/90 to-transparent" />
                </div>
              </div>
              <button type="button" onClick={() => void generate()} disabled={!item || !photo || isGenerating} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-55">
                {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Creating your look…" : resultUrl ? "Generate another preview" : "Create my try-on"}
              </button>
              <p className="text-center text-xs leading-5 text-stone-500">Your selected photo and product image are sent to the AI provider to create this preview. Generated results are not saved.</p>
              {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              {isGenerating && (
                <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" role="status" aria-live="polite">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white"><Sparkles className="h-5 w-5 animate-pulse" /></span>
                    <div><p className="font-medium text-stone-900">Creating your look</p><p className="mt-0.5 text-sm text-stone-500">Blending your photo with the selected piece…</p></div>
                    <LoaderCircle className="ml-auto h-5 w-5 shrink-0 animate-spin text-stone-500" />
                  </div>
                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100"><Image src={`/api/gallery/${photo!.id}/image`} alt="" fill unoptimized className="object-cover opacity-70" sizes="40vw" /><div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/45 to-transparent" /></div>
                    <ArrowLeftRight className="h-4 w-4 animate-pulse text-stone-400" />
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100"><img src={imageSrc(item!.imageUrl!)} alt="" className="h-full w-full object-cover opacity-70" loading="lazy" /><div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/45 to-transparent" /></div>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full w-1/3 animate-[tryon-progress_1.6s_ease-in-out_infinite] rounded-full bg-stone-800" /></div>
                  <p className="mt-3 text-center text-xs text-stone-500">This can take a little while. Keep this page open.</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <section className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100"><Sparkles className="h-6 w-6 text-stone-700" /></div>
            <h2 className="mt-5 text-xl font-semibold">Get your pieces ready</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">Virtual Try-On needs a gallery photo and at least one closet item with a product image.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/closet" className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">Add a closet piece</Link><Link href="/closet/gallery" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700">Add a gallery photo</Link></div>
          </section>
        )}
      </main>
      {showPreview && resultUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-3 backdrop-blur-sm sm:p-6" role="presentation" onClick={() => setShowPreview(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="tryon-preview-title" className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6">
              <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Your look is ready</p><h2 id="tryon-preview-title" className="mt-1 truncate text-lg font-semibold">Virtual Try-On Preview</h2></div>
              <button type="button" onClick={() => setShowPreview(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:bg-stone-100" aria-label="Close preview"><X className="h-5 w-5" /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-auto bg-stone-100 p-3 sm:p-5">
              <img src={resultUrl} alt="AI-generated virtual try-on preview" className="mx-auto max-h-[68vh] w-full rounded-2xl object-contain" />
              <p className="mt-3 text-center text-sm text-stone-600">{item ? `${item.brand ? `${item.brand} · ` : ""}${item.productName}` : "Your generated look"}</p>
            </div>
            <footer className="flex flex-wrap justify-end gap-3 border-t border-stone-100 p-4 sm:px-6">
              <button type="button" onClick={() => setShowPreview(false)} className="min-h-11 rounded-full border border-stone-200 px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-50">Close</button>
              <a href={resultUrl} download={`tryonfashion-preview.${resultFormat}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700"><ArrowDownToLine className="h-4 w-4" />Download preview</a>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

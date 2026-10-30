"use client";

/* eslint-disable @next/next/no-img-element -- Product images and temporary upload/result previews use arbitrary or blob URLs. */

import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, Check, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ClosetChoice = { id: string; productName: string; brand: string | null; imageUrl: string | null; source: string };
type TryOnClientProps = { initialItems: ClosetChoice[] };

const acceptedImageTypes = "image/jpeg,image/png,image/webp,image/avif";
const maxSelection = 4;

export function TryOnClient({ initialItems }: TryOnClientProps) {
  const availableItems = useMemo(() => initialItems.filter((item) => item.imageUrl), [initialItems]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultFormat, setResultFormat] = useState("png");
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const selectedProducts = selectedItems.map((id) => availableItems.find((item) => item.id === id)).filter((item): item is ClosetChoice => Boolean(item));

  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

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

  const toggleItem = (itemId: string) => {
    setError("");
    setSelectedItems((current) => current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : current.length < maxSelection ? [...current, itemId] : current);
  };

  const generate = async () => {
    if (!photo || selectedItems.length === 0) return;
    setError("");
    setShowPreview(false);
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.set("photo", photo);
      formData.set("itemIds", JSON.stringify(selectedItems));
      const response = await fetch("/api/try-on", { method: "POST", body: formData });
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
  const imageSrc = (url: string) => url;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/closet" className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950">← Back to My Closet</Link>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">Style preview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Virtual Try-On</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Select up to four pieces and upload a photo when you are ready. Your photo is used for this generation only.</p>
          </div>
        </header>
        <nav aria-label="Closet navigation" className="mt-5 flex flex-wrap gap-2 border-b border-stone-200 pb-4 text-sm">
          <Link href="/closet" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 transition hover:bg-stone-100">My Closet</Link>
          <Link href="/closet/try-on" aria-current="page" className="rounded-full bg-stone-900 px-4 py-2 font-medium text-white">Try On</Link>
          <Link href="/shop" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 transition hover:bg-stone-100">Shop</Link>
          <Link href="/credits" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 transition hover:bg-stone-100">Credits</Link>
        </nav>

        {availableItems.length ? (
          <div className="mx-auto mt-8 max-w-5xl space-y-5">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Step 1</p><h2 className="mt-1 text-lg font-semibold">Choose clothing pieces</h2></div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">{selectedItems.length} of {maxSelection} selected</span>
              </div>
              <p className="mb-4 text-sm text-stone-600">Choose between one and four items to style together.</p>
              <div className="grid max-h-[34rem] grid-cols-2 gap-3 overflow-y-auto overscroll-contain pr-2 sm:grid-cols-3 lg:grid-cols-4">
                {availableItems.map((entry) => {
                  const selected = selectedItems.includes(entry.id);
                  const selectionLimitReached = selectedItems.length >= maxSelection && !selected;
                  return (
                    <button key={entry.id} type="button" onClick={() => toggleItem(entry.id)} disabled={isGenerating || selectionLimitReached} className={`${selectClass(selected)} disabled:cursor-not-allowed disabled:opacity-55`} aria-pressed={selected}>
                      <div className="relative aspect-[4/5] bg-stone-100"><img src={imageSrc(entry.imageUrl!)} alt="" className="h-full w-full object-cover" loading="lazy" />{selected && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white"><Check className="h-4 w-4" /></span>}</div>
                      <span className="block truncate px-3 pb-3 pt-2 text-sm font-medium">{entry.productName}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Step 2</p><h2 className="mt-1 text-lg font-semibold">Upload your photo</h2></div>
              <p className="mt-2 text-sm leading-6 text-stone-600">Choose a clear, well-lit photo of yourself. JPEG, PNG, WebP, or AVIF; up to 4 MB. It is processed for this request only.</p>
              <input ref={photoInputRef} type="file" accept={acceptedImageTypes} className="sr-only" onChange={(event) => { const selectedPhoto = event.target.files?.[0] ?? null; setPhoto(selectedPhoto); setPhotoPreview(selectedPhoto ? URL.createObjectURL(selectedPhoto) : ""); setError(""); }} aria-label="Upload a photo for virtual try-on" />
              {photo && photoPreview ? (
                <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-stone-200"><Image src={photoPreview} alt="Preview of your uploaded photo" fill unoptimized className="object-cover" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{photo.name}</p><p className="mt-1 text-xs text-stone-500">Used for this try-on only</p></div>
                  <button type="button" onClick={() => { setPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ""; }} disabled={isGenerating} className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-50" aria-label="Remove uploaded photo"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isGenerating} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-60"><Upload className="h-4 w-4" />Upload a photo</button>
              )}
            </section>

            <button type="button" onClick={() => void generate()} disabled={!photo || selectedItems.length === 0 || isGenerating} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-55">
              {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "Creating your look…" : resultUrl ? "Generate another preview" : "Create my try-on"}
            </button>
            <p className="text-center text-xs leading-5 text-stone-500">This generation costs 1 credit. Your uploaded photo and clothing images are sent to the AI provider; the uploaded photo is not stored by the app.</p>
            {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><p>{error}</p>{error.toLowerCase().includes("credit") && <Link href="/credits" className="mt-2 inline-flex font-semibold underline">Get credits</Link>}</div>}
            {isGenerating && (
              <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" role="status" aria-live="polite">
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white"><Sparkles className="h-5 w-5 animate-pulse" /></span><div><p className="font-medium text-stone-900">Creating your look</p><p className="mt-0.5 text-sm text-stone-500">Styling your selected pieces together…</p></div><LoaderCircle className="ml-auto h-5 w-5 shrink-0 animate-spin text-stone-500" /></div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100">{photoPreview && <Image src={photoPreview} alt="" fill unoptimized className="object-cover opacity-70" />}</div><span className="text-xs text-stone-500">with</span><div className="grid aspect-[4/3] grid-cols-2 gap-1 overflow-hidden rounded-xl bg-stone-100">{selectedProducts.map((item) => <img key={item.id} src={imageSrc(item.imageUrl!)} alt="" className="h-full w-full object-cover opacity-70" />)}</div></div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full w-1/3 animate-[tryon-progress_1.6s_ease-in-out_infinite] rounded-full bg-stone-800" /></div>
                <p className="mt-3 text-center text-xs text-stone-500">This can take a little while. Keep this page open.</p>
              </div>
            )}
          </div>
        ) : (
          <section className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100"><Sparkles className="h-6 w-6 text-stone-700" /></div>
            <h2 className="mt-5 text-xl font-semibold">Add pieces to your closet first</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">Virtual Try-On needs at least one saved clothing item with a product image.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/closet" className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white">Open My Closet</Link><Link href="/shop" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700">Browse clothes</Link></div>
          </section>
        )}
      </main>
      {showPreview && resultUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-3 backdrop-blur-sm sm:p-6" role="presentation" onClick={() => setShowPreview(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="tryon-preview-title" className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Your look is ready</p><h2 id="tryon-preview-title" className="mt-1 truncate text-lg font-semibold">Virtual Try-On Preview</h2></div><button type="button" onClick={() => setShowPreview(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:bg-stone-100" aria-label="Close preview"><X className="h-5 w-5" /></button></header>
            <div className="min-h-0 flex-1 overflow-auto bg-stone-100 p-3 sm:p-5"><img src={resultUrl} alt="AI-generated virtual try-on preview" className="mx-auto max-h-[68vh] w-full rounded-2xl object-contain" /><p className="mt-3 text-center text-sm text-stone-600">{selectedProducts.map((item) => item.productName).join(" · ")}</p></div>
            <footer className="flex flex-wrap justify-end gap-3 border-t border-stone-100 p-4 sm:px-6"><button type="button" onClick={() => setShowPreview(false)} className="min-h-11 rounded-full border border-stone-200 px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-50">Close</button><a href={resultUrl} download={`tryonfashion-preview.${resultFormat}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700"><ArrowDownToLine className="h-4 w-4" />Download preview</a></footer>
          </section>
        </div>
      )}
    </div>
  );
}

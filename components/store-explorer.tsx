"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Bookmark, Check, Shirt, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

export type FeaturedStore = {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  imageAlt: string;
  initials: string;
  featured?: boolean;
};

type Department = "women" | "men";
type Product = { id: string; name: string; imageUrl: string; productUrl: string; price: string | null; currency: string | null };

type StoreExplorerProps = { stores: FeaturedStore[] };

export function StoreExplorer({ stores }: StoreExplorerProps) {
  const [selectedStore, setSelectedStore] = useState<FeaturedStore | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogCode, setCatalogCode] = useState("");
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const openStore = (store: FeaturedStore) => {
    setSelectedStore(store);
    setDepartment(null);
    setProducts([]);
    setCatalogError("");
    setCatalogCode("");
  };

  const closeStore = (open: boolean) => {
    if (!open) {
      setSelectedStore(null);
      setDepartment(null);
      setProducts([]);
      setCatalogError("");
      setCatalogCode("");
    }
  };

  const chooseDepartment = async (choice: Department) => {
    if (!selectedStore) return;
    setDepartment(choice);
    setIsLoading(true);
    setCatalogError("");
    setCatalogCode("");
    setProducts([]);
    try {
      const response = await fetch(`/api/stores/${encodeURIComponent(selectedStore.id)}/products?department=${choice}`);
      const payload = await response.json() as { products?: Product[]; error?: string; message?: string; code?: string };
      if (!response.ok) {
        setCatalogCode(payload.code ?? "CATALOG_FETCH_FAILED");
        throw new Error(payload.error || "The store catalog is temporarily unavailable.");
      }
      setProducts(payload.products ?? []);
      setCatalogCode(payload.code ?? "");
      setCatalogError(payload.message ?? "");
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "The store catalog is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProduct = async (product: Product) => {
    if (!selectedStore) return;
    setSavingProductId(product.id);
    setCatalogError("");
    try {
      const response = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          brand: selectedStore.name,
          productUrl: product.productUrl,
          imageUrl: product.imageUrl,
          price: product.price ?? "",
          currency: product.currency ?? "",
          source: selectedStore.name,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Couldn't save this item.");
      setSavedProductIds((current) => [...current, product.id]);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Couldn't save this item.");
    } finally {
      setSavingProductId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {stores.map((store) => (
          <article key={store.name} className={`group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${store.featured ? "sm:col-span-2 xl:col-span-2" : ""}`}>
            <div className={`grid h-full ${store.featured ? "sm:grid-cols-[1.1fr_0.9fr]" : ""}`}>
              <div className={`relative overflow-hidden bg-stone-100 ${store.featured ? "aspect-[5/3] sm:aspect-auto sm:min-h-72" : "aspect-[4/3]"}`}>
                <Image src={store.image} alt={store.imageAlt} fill className="object-cover transition duration-700 group-hover:scale-[1.03]" sizes={store.featured ? "(max-width: 640px) 100vw, (max-width: 1280px) 66vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"} />
                <span className="absolute left-4 top-4 flex h-11 min-w-11 items-center justify-center rounded-full border border-white/60 bg-white/90 px-2 text-sm font-semibold tracking-wide text-stone-900 shadow-sm backdrop-blur">{store.initials}</span>
                {store.featured && <span className="absolute bottom-4 left-4 rounded-full bg-stone-900/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur">Editor&apos;s pick</span>}
              </div>
              <div className="flex min-w-0 flex-col justify-between gap-5 p-5 sm:p-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">{store.category}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{store.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{store.description}</p>
                </div>
                <button type="button" onClick={() => openStore(store)} className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-full border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-900 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 sm:w-fit sm:justify-center sm:px-5">
                  Explore collection <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={Boolean(selectedStore)} onOpenChange={closeStore}>
        <DialogContent className="max-h-[min(90dvh,48rem)] max-w-xl overflow-y-auto rounded-3xl border-stone-200 bg-stone-50 p-5 sm:p-7">
          {selectedStore && (
            <>
              {!department ? (
                <>
                  <DialogHeader>
                    <span className="mb-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white"><Bookmark className="h-5 w-5" /></span>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Explore {selectedStore.name}</p>
                    <h2 className="pr-8 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">What are you shopping for?</h2>
                    <p className="mt-1 text-sm leading-6 text-stone-600">Choose a department to personalize your store collection.</p>
                  </DialogHeader>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {(["women", "men"] as const).map((choice) => (
                      <button key={choice} type="button" onClick={() => void chooseDepartment(choice)} className="group flex min-h-28 items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900">
                        <span><span className="block text-lg font-semibold capitalize text-stone-900">{choice === "women" ? "Women's clothing" : "Men's clothing"}</span><span className="mt-1 block text-sm text-stone-500">Show me the {choice} collection</span></span>
                        <span className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700 transition group-hover:bg-stone-900 group-hover:text-white"><Shirt className="h-5 w-5" /></span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-stone-500">You can change this selection any time. It only filters the collection shown here.</p>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <span className="mb-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white"><Sparkles className="h-5 w-5" /></span>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">{selectedStore.name} · {department === "women" ? "Women's" : "Men's"}</p>
                    <h2 className="pr-8 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{isLoading ? "Loading the collection…" : `${department === "women" ? "Women's" : "Men's"} collection`}</h2>
                    <p className="mt-1 text-sm leading-6 text-stone-600">We refresh {selectedStore.name}&apos;s public category page every 15 minutes. Some retailers limit automated access.</p>
                  </DialogHeader>
                  {catalogError && (
                    <div role="status" className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                      <p>{catalogError}</p>
                      {catalogCode && catalogCode !== "RETAILER_BLOCKED" && catalogCode !== "RETAILER_RATE_LIMITED" && (
                        <button type="button" onClick={() => void chooseDepartment(department)} className="mt-3 min-h-10 rounded-full border border-amber-300 bg-white px-4 text-sm font-medium text-amber-950 transition hover:bg-amber-100">Retry catalog fetch</button>
                      )}
                    </div>
                  )}
                  {isLoading ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Loading products" aria-busy="true">
                      {Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className="aspect-[4/5] bg-stone-200" /><div className="space-y-2 p-3"><div className="h-3 rounded bg-stone-200" /><div className="h-3 w-1/2 rounded bg-stone-100" /></div></div>)}
                    </div>
                  ) : products.length > 0 ? (
                    <div className="mt-3 grid max-h-[50dvh] grid-cols-2 gap-3 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-3">
                      {products.map((product) => (
                        <article key={product.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                          <div className="relative aspect-[4/5] bg-stone-100"><Image src={product.imageUrl} alt={product.name} fill unoptimized className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" /></div>
                          <div className="space-y-2 p-3">
                            <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-stone-900">{product.name}</h3>
                            <p className="text-sm text-stone-600">{product.price ? `${product.currency ?? ""} ${product.price}`.trim() : "Price unavailable"}</p>
                            <button type="button" onClick={() => void saveProduct(product)} disabled={savingProductId === product.id || savedProductIds.includes(product.id)} className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-stone-900 px-3 text-xs font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
                              {savedProductIds.includes(product.id) ? <><Check className="h-3.5 w-3.5" />Saved</> : savingProductId === product.id ? "Saving…" : <><Bookmark className="h-3.5 w-3.5" />Save to closet</>}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : !catalogError ? (
                    <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-600">No product listings were found on this store page.</div>
                  ) : null}
                  <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => { setDepartment(null); setProducts([]); setCatalogError(""); setCatalogCode(""); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"><ArrowRight className="h-4 w-4 rotate-180" />Change department</button>
                    <button type="button" onClick={() => closeStore(false)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700">Done</button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

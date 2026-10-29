"use client";

import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { Bookmark, Check, Search, Shirt, Sparkles } from "lucide-react";

type Department = "women" | "men";
type Product = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  productUrl: string;
  price: string | null;
  currency: string | null;
  availability: string | null;
  gender: string | null;
};

export function ShopClient() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadCatalog = useCallback(async (selectedDepartment: Department, query: string, offset: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else {
      setIsLoading(true);
      setProducts([]);
      setTotalCount(0);
      setNextOffset(0);
      setError("");
    }

    try {
      const params = new URLSearchParams({ department: selectedDepartment, offset: String(offset) });
      if (query) params.set("q", query);
      const response = await fetch(`/api/shop/products?${params.toString()}`);
      const payload = await response.json() as { products?: Product[]; totalCount?: number; nextOffset?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "The CJ catalog is temporarily unavailable.");
      const nextProducts = payload.products ?? [];
      setProducts((current) => append ? [...current, ...nextProducts] : nextProducts);
      setTotalCount(payload.totalCount ?? (append ? products.length : 0) + nextProducts.length);
      setNextOffset(payload.nextOffset ?? offset + nextProducts.length);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The CJ catalog is temporarily unavailable.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [products.length]);

  const chooseDepartment = (choice: Department) => {
    setDepartment(choice);
    setActiveSearch("");
    setSearchInput("");
    void loadCatalog(choice, "", 0, false);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!department) return;
    const query = searchInput.trim().slice(0, 100);
    setActiveSearch(query);
    void loadCatalog(department, query, 0, false);
  };

  const loadMore = () => {
    if (department && nextOffset < totalCount && !isLoadingMore) {
      void loadCatalog(department, activeSearch, nextOffset, true);
    }
  };

  const saveProduct = async (product: Product) => {
    setSavingId(product.id);
    setError("");
    try {
      const response = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          brand: product.brand,
          productUrl: product.productUrl,
          imageUrl: product.imageUrl,
          price: product.price ?? "",
          currency: product.currency ?? "",
          source: product.brand,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Couldn't save this item.");
      setSavedIds((current) => [...current, product.id]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn't save this item.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      {!department ? (
        <section aria-labelledby="department-title" className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white"><Shirt className="h-5 w-5" /></span>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Personalize your catalog</p>
          <h2 id="department-title" className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">What are you shopping for?</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Choose a department to explore products from fashion partners in the CJ catalog.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(["women", "men"] as const).map((choice) => (
              <button key={choice} type="button" onClick={() => chooseDepartment(choice)} className="group flex min-h-24 items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-5 text-left transition hover:border-stone-400 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900">
                <span><span className="block text-lg font-semibold capitalize text-stone-900">{choice === "women" ? "Women's fashion" : "Men's fashion"}</span><span className="mt-1 block text-sm text-stone-500">Browse live partner catalogs</span></span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 transition group-hover:bg-stone-900 group-hover:text-white"><Sparkles className="h-4 w-4" /></span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-stone-500">CJ search uses product keywords; gender information is shown when a merchant provides it.</p>
        </section>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Browsing</p>
              <h2 className="mt-1 text-xl font-semibold capitalize tracking-tight text-stone-900">{department}&apos;s fashion</h2>
            </div>
            <form onSubmit={submitSearch} className="flex w-full gap-2 sm:max-w-xl">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search the CJ product catalog</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search fashion, shoes, bags…" className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 pl-11 pr-4 text-sm outline-none transition focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200" />
              </label>
              <button type="submit" disabled={isLoading} className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60">Search</button>
            </form>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">{isLoading ? "Refreshing catalog…" : `${products.length.toLocaleString()} shown · ${totalCount.toLocaleString()} catalog results`}{activeSearch ? ` for “${activeSearch}”` : ""}</p>
            <button type="button" onClick={() => setDepartment(null)} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100">Change department</button>
          </div>

          {error && <div role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</div>}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading catalog" aria-busy="true">
              {Array.from({ length: 10 }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className="aspect-[4/5] bg-stone-200" /><div className="space-y-2 p-3"><div className="h-3 rounded bg-stone-200" /><div className="h-3 w-1/2 rounded bg-stone-100" /></div></div>)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product, index) => (
                <article key={`${product.id}-${index}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <a href={product.productUrl} target="_blank" rel="noreferrer sponsored" aria-label={`View ${product.name} from ${product.brand}`}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-100"><Image src={product.imageUrl} alt={product.name} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" /></div>
                  </a>
                  <div className="space-y-2 p-3 sm:p-4">
                    <p className="truncate text-[10px] font-medium uppercase tracking-[0.15em] text-stone-500">{product.brand}</p>
                    <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-stone-900">{product.name}</h3>
                    <p className="text-sm text-stone-700">{product.price ? `${product.currency ?? ""} ${product.price}`.trim() : "Price unavailable"}</p>
                    <button type="button" onClick={() => void saveProduct(product)} disabled={savingId === product.id || savedIds.includes(product.id)} className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-stone-900 px-3 text-xs font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
                      {savedIds.includes(product.id) ? <><Check className="h-3.5 w-3.5" />Saved to closet</> : savingId === product.id ? "Saving…" : <><Bookmark className="h-3.5 w-3.5" />Save to closet</>}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : !error ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
              <Search className="mx-auto h-7 w-7 text-stone-400" />
              <h3 className="mt-4 text-lg font-semibold text-stone-900">No products found</h3>
              <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-stone-600">
                {totalCount > 0
                  ? "CJ returned catalog items, but none had both a usable product image and link. Check the advertiser feed data and your publisher link setup."
                  : "CJ returned no matching products. Join fashion advertiser programs in CJ, wait for approval, and confirm their shopping product feeds are available to publishers. You can also try a more specific search."}
              </p>
            </div>
          ) : null}

          {nextOffset < totalCount && (
            <button type="button" onClick={loadMore} disabled={isLoadingMore} className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-60">
              {isLoadingMore ? "Loading more…" : `Load more (${products.length} of ${totalCount})`}
            </button>
          )}
          <p className="mt-8 text-center text-xs leading-5 text-stone-500">Products, prices, and availability come from CJ advertiser feeds. Some links are affiliate links and may earn TryOnFashion a commission.</p>
        </>
      )}
    </>
  );
}

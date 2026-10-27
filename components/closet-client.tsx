"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { ArrowUpRight, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ITEMS_PER_PAGE, PaginationControls } from "@/components/pagination-controls";

export type ClosetItem = {
  id: string;
  productName: string;
  brand: string | null;
  productUrl: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  source: string;
  createdAt: string;
};

type ClosetClientProps = {
  initialItems: ClosetItem[];
  userName: string;
  userImage: string | null;
};

export function ClosetClient({ initialItems, userName, userImage }: ClosetClientProps) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    productUrl: "",
    productName: "",
    brand: "",
    imageUrl: "",
    price: "",
    currency: "",
    source: "",
  });

  const sources = useMemo(
    () => Array.from(new Set(items.map((item) => item.source))).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        const matchesQuery =
          !normalizedQuery ||
          item.productName.toLowerCase().includes(normalizedQuery) ||
          (item.brand ?? "").toLowerCase().includes(normalizedQuery);
        const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
        return matchesQuery && matchesSource;
      })
      .sort((a, b) => {
        if (sortBy === "alphabetical") {
          return a.productName.localeCompare(b.productName);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, query, sortBy, sourceFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, pageCount);
  const visibleItems = filteredItems.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  const handleAddPiece = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          productUrl: form.productUrl.trim(),
          productName: form.productName.trim(),
          brand: form.brand.trim(),
          imageUrl: form.imageUrl.trim(),
          price: form.price.trim(),
          currency: form.currency.trim(),
          source: form.source.trim() || "unknown",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save this item.");
      }

      setItems((prev) => [payload.item, ...prev]);
      setCurrentPage(1);
      setDialogOpen(false);
      setForm({
        productUrl: "",
        productName: "",
        brand: "",
        imageUrl: "",
        price: "",
        currency: "",
        source: "",
      });
      setSuccessMessage("Piece added to your closet.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    const previousItems = items;
    setItems((current) => current.filter((item) => item.id !== id));

    try {
      const response = await fetch(`/api/closet?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setItems(previousItems);
        throw new Error("Unable to remove this piece.");
      }
      setSuccessMessage("Piece removed from your closet.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to remove this piece.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-stone-200 bg-white p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-stone-50">
              TF
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">TryOnFashion</p>
              <p className="text-base font-medium">My Closet</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/closet" className="block rounded-xl bg-stone-900 px-3 py-2.5 text-sm font-medium text-white">
              My Closet
            </Link>
            <Link href="/closet/gallery" className="block rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">
              Gallery
            </Link>
            <Link href="/" className="block rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">
              Discover
            </Link>
          </nav>

          <div className="mt-10 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center gap-3">
              {userImage ? (
                <Image src={userImage} alt={userName} width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-sm font-medium text-stone-700">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-stone-800">{userName}</p>
                <p className="text-xs text-stone-500">Curator</p>
              </div>
            </div>
            <SignOutButton redirectUrl="/">
              <Button type="button" variant="secondary" className="w-full justify-center">
                Sign out
              </Button>
            </SignOutButton>
          </div>
        </aside>

        <main className="flex-1">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Closet</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">My Closet</h1>
                <p className="mt-2 max-w-xl text-sm text-stone-600">Everything you&apos;ve discovered, saved, and want to try.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setDialogOpen(true)} className="w-fit">
                  Add a piece
                </Button>
                <SignOutButton redirectUrl="/">
                  <Button type="button" variant="secondary" className="w-fit lg:hidden">
                    Sign out
                  </Button>
                </SignOutButton>
              </div>
            </div>

            <nav aria-label="Closet navigation" className="flex gap-2 border-t border-stone-200 pt-4 lg:hidden">
              <Link href="/closet" aria-current="page" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white">My Closet</Link>
              <Link href="/closet/gallery" className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700">Gallery</Link>
              <Link href="/" className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700">Discover</Link>
            </nav>

            <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <span className="rounded-full bg-stone-100 px-3 py-1.5 font-medium text-stone-800">{items.length} saved</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    aria-label="Search saved items"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by name or brand"
                    className="pl-9"
                  />
                </div>
                <div className="relative">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <select
                    value={sourceFilter}
                    onChange={(event) => {
                      setSourceFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-11 rounded-xl border border-stone-300 bg-white pl-9 pr-3 text-sm text-stone-700 outline-none focus:border-stone-800"
                    aria-label="Filter by source website"
                  >
                    <option value="all">All sources</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-800"
                  aria-label="Sort saved items"
                >
                  <option value="recent">Recently added</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {filteredItems.length ? (
            <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <article key={item.id} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-stone-200 text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
                        Style pick
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-700 backdrop-blur-sm transition hover:bg-stone-100"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-stone-500">{item.brand || item.source}</p>
                        <h2 className="mt-1 text-lg font-medium text-stone-900">{item.productName}</h2>
                      </div>
                      <Link href={item.productUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:bg-stone-100">
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="flex items-center justify-between text-sm text-stone-600">
                      <span>{item.currency ?? "USD"} {item.price ? Number(item.price).toFixed(2) : "—"}</span>
                      <span>{item.source}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <PaginationControls itemCount={filteredItems.length} page={activePage} onPageChange={setCurrentPage} label="Closet items" />
            </>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                <Search className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold text-stone-900">Your personal collection starts here.</h2>
              <p className="mx-auto mt-3 max-w-md text-stone-600">
                Find something you love on a fashion website and add it to your closet.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="mt-6">
                Add your first piece
              </Button>
            </div>
          )}
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">New piece</p>
              <h2 className="mt-1 text-2xl font-semibold text-stone-900">Add an item to your closet</h2>
            </div>
          </DialogHeader>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Product URL</label>
              <Input value={form.productUrl} onChange={(event) => setForm({ ...form, productUrl: event.target.value })} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Product name</label>
              <Input value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} placeholder="Silk wrap dress" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Brand</label>
              <Input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Brand name" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Source</label>
              <Input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Selfridges" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Image URL</label>
              <Input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Price</label>
              <Input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="199" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Currency</label>
              <Input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} placeholder="USD" />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddPiece} disabled={isSubmitting || !form.productUrl || !form.productName}>
              {isSubmitting ? "Saving..." : "Save piece"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

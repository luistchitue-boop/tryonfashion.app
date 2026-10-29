import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Shirt, Sparkles } from "lucide-react";
import { HomeAuthAction } from "@/components/home-auth-action";
import { ShopClient } from "@/components/shop-client";

export const metadata: Metadata = {
  title: "Shop the Catalog | TryOnFashion",
  description: "Discover live fashion products from CJ affiliate partner catalogs and save pieces to your TryOnFashion closet.",
};

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold tracking-[0.16em] text-stone-900 sm:text-lg sm:tracking-[0.2em]">TRYONFASHION</Link>
        <HomeAuthAction />
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pb-12 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-stone-600 sm:tracking-[0.22em]">
            <Sparkles className="h-3.5 w-3.5" /> Live partner catalog
          </span>
          <h1 className="mt-5 text-4xl leading-[0.98] tracking-[-0.05em] text-stone-900 sm:mt-6 sm:text-6xl">A better way to find your next look.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
            Browse products from fashion advertisers in your joined CJ feeds, explore tracked product links, and save pieces that belong in your closet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/closet" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"><Bookmark className="h-4 w-4" />Open My Closet</Link>
            <Link href="/closet/try-on" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100"><Shirt className="h-4 w-4" />Try On</Link>
          </div>
        </div>
      </section>

      <section aria-label="CJ fashion product catalog" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <ShopClient />
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link href="/" className="text-base font-semibold tracking-[0.16em] text-stone-900">TRYONFASHION</Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/closet">My Closet</Link>
            <Link href="/closet/gallery">Gallery</Link>
            <Link href="/closet/try-on">Try On</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

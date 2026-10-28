import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Sparkles } from "lucide-react";
import { HomeAuthAction } from "@/components/home-auth-action";
import { StoreExplorer, type FeaturedStore } from "@/components/store-explorer";

export const metadata: Metadata = {
  title: "Featured Stores | TryOnFashion",
  description: "Explore a curated collection of fashion stores and discover pieces for your TryOnFashion closet.",
};

const stores: FeaturedStore[] = [
  {
    id: "saks",
    name: "Saks Fifth Avenue",
    category: "Designer · Contemporary",
    description: "Discover standout designers, occasionwear, and modern wardrobe staples.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Fashion-forward outfits on a clothing rack",
    initials: "S5",
    featured: true,
  },
  {
    id: "zara",
    name: "Zara",
    category: "Contemporary · Everyday",
    description: "Explore current collections, new arrivals, and easy-to-style essentials.",
    image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Modern neutral fashion pieces",
    initials: "Z",
  },
  {
    id: "louis-vuitton",
    name: "Louis Vuitton",
    category: "Luxury · Designer",
    description: "Browse ready-to-wear collections and iconic luxury fashion.",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Luxury fashion editorial look",
    initials: "LV",
  },
  {
    id: "nordstrom",
    name: "Nordstrom",
    category: "Designer · Contemporary",
    description: "Shop a wide mix of labels, from daily favorites to special pieces.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Carefully curated wardrobe essentials",
    initials: "N",
  },
  {
    id: "hm",
    name: "H&M",
    category: "Everyday · Contemporary",
    description: "Find wearable essentials and trend-led pieces for every day.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Neutral seasonal clothing collection",
    initials: "H&M",
  },
  {
    id: "asos",
    name: "ASOS",
    category: "Contemporary · Streetwear",
    description: "Explore a broad mix of contemporary fashion and emerging labels.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Street-style fashion portrait",
    initials: "AS",
  },
];

export default function StoresPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold tracking-[0.16em] text-stone-900 sm:text-lg sm:tracking-[0.2em]">
          TRYONFASHION
        </Link>
        <HomeAuthAction />
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-stone-600 sm:tracking-[0.22em]">
            <Sparkles className="h-3.5 w-3.5" /> Curated fashion discovery
          </span>
          <h1 className="mt-5 text-4xl leading-[0.98] tracking-[-0.05em] text-stone-900 sm:mt-6 sm:text-6xl">
            Find your next favorite store.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
            Explore a handpicked mix of fashion destinations. When something catches your eye, save it to your closet and build a look that feels like you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/closet" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700">
              <Bookmark className="h-4 w-4" /> Open My Closet
            </Link>
            <Link href="/closet/try-on" className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100">
              Try On
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Featured fashion stores" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">The directory</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Featured stores</h2>
          </div>
          <span className="hidden rounded-full bg-white px-3 py-1.5 text-xs text-stone-500 sm:inline-flex">{stores.length} destinations</span>
        </div>

        <StoreExplorer stores={stores} />

        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 text-xs leading-5 text-stone-500 sm:text-sm">
          Store names and trademarks belong to their respective owners. TryOnFashion is not affiliated with or endorsed by the stores listed. Product availability and prices are set by each retailer.
        </p>
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

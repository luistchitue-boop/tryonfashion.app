import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-signin-button";

const steps = [
  {
    title: "Discover",
    description: "Browse fashion websites and find pieces that match your style.",
  },
  {
    title: "Save",
    description: "Add interesting garments to your personal digital closet.",
  },
  {
    title: "Try on",
    description: "Explore the vision of seeing those pieces on yourself virtually.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-[0.2em] text-stone-900">
          TRYONFASHION
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
          <Link href="#how-it-works">How it works</Link>
          <Link href="#about">About</Link>
          <Link href="/sign-in" className="transition hover:text-stone-900">
            Sign in
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden text-sm font-medium text-stone-700 md:inline-flex">
            Sign in
          </Link>
          <Link
            href="/api/auth/signin/google?callbackUrl=/closet"
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:pt-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-stone-600">
            <Sparkles className="h-3.5 w-3.5" />
            Curated fashion discovery
          </span>
          <h1 className="mt-6 max-w-xl text-5xl leading-[0.95] tracking-[-0.06em] text-stone-900 sm:text-6xl">
            Your next favorite outfit, before you buy it.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
            Discover clothing from the websites you love, curate your personal closet, and explore a new way to decide what to wear.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <GoogleSignInButton label="Start your closet" />
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
            >
              Discover how it works
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-3 shadow-[0_20px_60px_rgba(24,24,27,0.08)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
            <Image
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80"
              alt="Editorial fashion portrait"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">How it works</p>
          <h2 className="mt-3 text-4xl tracking-tight text-stone-900">From inspiration to personal wardrobe.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-stone-50">
                0{index + 1}
              </div>
              <h3 className="text-2xl font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-stone-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-[#f2eee9] py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Why TryOnFashion</p>
            <h2 className="text-4xl tracking-tight text-stone-900">Stay organized in a changing wardrobe.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              "Keep interesting finds organized in one place.",
              "Build a personal collection from multiple fashion websites.",
              "Make more informed clothing decisions.",
              "Prepare for a future AI-powered virtual try-on experience.",
            ].map((value) => (
              <div key={value} className="rounded-[1.75rem] border border-stone-200 bg-white p-5 text-base leading-7 text-stone-700 shadow-sm">
                {value}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-stone-200 bg-stone-900 px-8 py-10 text-stone-50 shadow-sm sm:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-300">Start now</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">Build your ideal closet.</h2>
            </div>
            <GoogleSignInButton label="Create your account" />
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-stone-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-[0.2em] text-stone-900">TRYONFASHION</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="#how-it-works">How it works</Link>
            <Link href="#about">About</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

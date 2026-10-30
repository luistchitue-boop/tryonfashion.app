"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CREDIT_COSTS, CREDIT_PACKAGES } from "@/lib/credit-plans";

type CreditsClientProps = { initialBalance: number; checkoutStatus?: string };

export function CreditsClient({ initialBalance, checkoutStatus }: CreditsClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [pendingPackage, setPendingPackage] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (checkoutStatus !== "success") return;
    let attempts = 0;
    const refresh = async () => {
      try {
        const response = await fetch("/api/credits", { cache: "no-store" });
        const payload = await response.json() as { balance?: number };
        if (response.ok && typeof payload.balance === "number") setBalance(payload.balance);
      } catch {
        // The page still gives a clear pending message if the balance cannot refresh.
      }
      attempts += 1;
      if (attempts < 10) window.setTimeout(() => void refresh(), 2500);
    };
    void refresh();
  }, [checkoutStatus]);

  const buyCredits = async (packageId: string) => {
    setPendingPackage(packageId);
    setError("");
    try {
      const response = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || "Could not open secure checkout.");
      window.location.assign(payload.checkoutUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not open secure checkout.");
      setPendingPackage(null);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
      <Link href="/closet" className="text-sm text-stone-600 transition hover:text-stone-950">← Back to My Closet</Link>
      <header className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Your creative balance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Credits</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">Use credits for AI try-ons and video generation when it becomes available.</p>
        <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="text-4xl font-semibold tabular-nums">{balance.toLocaleString()}</span>
          <span className="pb-1 text-sm text-stone-500">credits available</span>
        </div>
        {checkoutStatus === "success" && <p role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Checkout completed. Your credits are added after Stripe confirms the payment; this balance refreshes automatically.</p>}
        {checkoutStatus === "cancelled" && <p role="status" className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">Checkout was cancelled. No payment was made.</p>}
        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      </header>

      <section className="mt-8">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">One-time purchase</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose a credit pack</h2>
          <p className="mt-2 text-sm text-stone-600">Secure checkout powered by Stripe. Credits are added only after payment confirmation.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {CREDIT_PACKAGES.map((creditPackage) => (
            <article key={creditPackage.id} className={`relative rounded-3xl border bg-white p-6 shadow-sm ${"popular" in creditPackage && creditPackage.popular ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200"}`}>
              {"popular" in creditPackage && creditPackage.popular && <span className="absolute right-5 top-5 rounded-full bg-stone-900 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white">Popular</span>}
              <h3 className="text-lg font-semibold">{creditPackage.name}</h3>
              <p className="mt-1 text-sm text-stone-500">{creditPackage.description}</p>
              <p className="mt-6 text-3xl font-semibold">${(creditPackage.priceCents / 100).toFixed(2)}</p>
              <p className="mt-1 text-sm text-stone-600">{creditPackage.credits.toLocaleString()} credits</p>
              <button type="button" onClick={() => void buyCredits(creditPackage.id)} disabled={pendingPackage !== null} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
                {pendingPackage === creditPackage.id ? "Opening secure checkout…" : "Buy credits"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Credit use</h2>
        <ul className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-3">
          <li className="rounded-2xl bg-stone-50 p-4"><span className="font-semibold text-stone-900">{CREDIT_COSTS.imageGeneration} credit</span> per virtual try-on image</li>
          <li className="rounded-2xl bg-stone-50 p-4"><span className="font-semibold text-stone-900">{CREDIT_COSTS.videoGeneration} credits</span> per video generation (feature not yet available)</li>
          <li className="rounded-2xl bg-stone-50 p-4"><span className="font-semibold text-stone-900">Free starter balance</span> 2 credits for new accounts</li>
        </ul>
        <p className="mt-4 text-xs leading-5 text-stone-500">Pack pricing and usage rates are initial defaults and should be reviewed before launch. Uploaded try-on photos are used for that request only and are not saved to the app.</p>
      </section>
    </main>
  );
}

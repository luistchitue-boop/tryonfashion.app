"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard, LoaderCircle, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountSettingsClientProps = { initialName: string; email: string };
type BillingPurchase = {
  id: string;
  credits: number;
  paymentAmountCents: number | null;
  currency: string | null;
  packageId: string | null;
  createdAt: string;
};

export function AccountSettingsClient({ initialName, email }: AccountSettingsClientProps) {
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [confirmation, setConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "billing">("profile");
  const [purchases, setPurchases] = useState<BillingPurchase[]>([]);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [billingError, setBillingError] = useState("");

  const openBilling = async () => {
    setActiveTab("billing");
    if (billingLoaded || isLoadingBilling) return;
    setIsLoadingBilling(true);
    setBillingError("");
    try {
      const response = await fetch("/api/account/billing", { cache: "no-store" });
      const payload = await response.json() as { purchases?: BillingPurchase[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not load billing history.");
      setPurchases(payload.purchases ?? []);
      setBillingLoaded(true);
    } catch (caughtError) {
      setBillingError(caughtError instanceof Error ? caughtError.message : "Could not load billing history.");
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const formatPayment = (purchase: BillingPurchase) => {
    if (purchase.paymentAmountCents === null || !purchase.currency) return "Payment details unavailable";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: purchase.currency.toUpperCase(),
    }).format(purchase.paymentAmountCents / 100);
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json() as { name?: string; error?: string };
      if (!response.ok || !payload.name) throw new Error(payload.error || "Could not save your profile.");
      setName(payload.name);
      setSavedName(payload.name);
      setMessage("Your profile has been updated.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmation !== "DELETE") return;
    setError("");
    setIsDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete your account.");
      window.location.replace("/");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not delete your account.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Account settings sections" className="mb-6 flex gap-2 border-b border-stone-200">
        <button type="button" role="tab" id="settings-profile-tab" aria-selected={activeTab === "profile"} aria-controls="settings-profile-panel" onClick={() => setActiveTab("profile")} className={`min-h-11 border-b-2 px-4 text-sm font-medium transition ${activeTab === "profile" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}>Profile</button>
        <button type="button" role="tab" id="settings-billing-tab" aria-selected={activeTab === "billing"} aria-controls="settings-billing-panel" onClick={() => void openBilling()} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${activeTab === "billing" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}><CreditCard className="h-4 w-4" />Billing</button>
      </div>

      {activeTab === "profile" ? <div id="settings-profile-panel" role="tabpanel" aria-labelledby="settings-profile-tab" className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Profile</p>
        <h2 className="mt-2 text-xl font-semibold">Your details</h2>
        <form onSubmit={saveProfile} className="mt-6 space-y-5">
          <div>
            <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium text-stone-700">Display name</label>
            <Input id="account-name" autoComplete="name" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} />
            <p className="mt-1.5 text-xs text-stone-500">This name is stored in your Clerk profile.</p>
          </div>
          <div>
            <label htmlFor="account-email" className="mb-1.5 block text-sm font-medium text-stone-700">Email address</label>
            <Input id="account-email" type="email" value={email} readOnly aria-describedby="email-help" className="bg-stone-50 text-stone-500" />
            <p id="email-help" className="mt-1.5 text-xs text-stone-500">Email changes require verification and aren’t available here yet.</p>
          </div>
          {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={isSaving || name.trim() === savedName}>
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-700">Danger zone</p>
        <h2 className="mt-2 text-xl font-semibold">Delete account</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">This permanently deletes your Clerk sign-in and your TryOnFashion profile, closet items, and credit history. This cannot be undone. Stripe may retain payment records as required for its legal and financial obligations.</p>
        <div className="mt-5 max-w-sm">
          <label htmlFor="delete-confirmation" className="mb-1.5 block text-sm font-medium text-stone-700">Type DELETE to confirm</label>
          <Input id="delete-confirmation" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </div>
        <Button type="button" variant="default" onClick={() => void deleteAccount()} disabled={confirmation !== "DELETE" || isDeleting} className="mt-5 bg-red-700 hover:bg-red-800">
          {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {isDeleting ? "Deleting account…" : "Permanently delete account"}
        </Button>
      </section>
      <p className="text-xs leading-5 text-stone-500">Need help? Contact support before deleting your account.</p>
      </div> : <section id="settings-billing-panel" role="tabpanel" aria-labelledby="settings-billing-tab" className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Payments</p><h2 className="mt-2 text-xl font-semibold">Credit purchase history</h2><p className="mt-2 text-sm text-stone-600">Your completed credit pack purchases.</p></div>
          <Link href="/credits" className="inline-flex min-h-10 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-700">Buy credits</Link>
        </div>
        {isLoadingBilling ? <div role="status" className="mt-8 flex items-center justify-center gap-2 py-8 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading billing history…</div>
          : billingError ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p role="alert">{billingError}</p><button type="button" onClick={() => { setBillingLoaded(false); void openBilling(); }} className="mt-2 font-semibold underline">Try again</button></div>
            : purchases.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center"><p className="font-medium text-stone-800">No credit purchases yet</p><p className="mt-1 text-sm text-stone-600">Completed purchases will appear here.</p></div>
              : <ul className="mt-6 divide-y divide-stone-100" aria-label="Credit purchase history">{purchases.map((purchase) => <li key={purchase.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-1"><div><p className="font-medium text-stone-900">{purchase.credits.toLocaleString()} credits</p><p className="mt-1 text-sm text-stone-500">{purchase.packageId ? `${purchase.packageId[0]?.toUpperCase()}${purchase.packageId.slice(1)} package · ` : ""}{new Date(purchase.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p></div><div className="text-right"><p className="font-semibold text-stone-900">{formatPayment(purchase)}</p><p className="mt-1 text-xs text-stone-500">Paid</p></div></li>)}</ul>}
        <p className="mt-5 text-xs leading-5 text-stone-500">Only purchases completed after billing history became available include their payment amount. Stripe remains the source of truth for receipts and formal invoices.</p>
      </section>}
      <Link href="/closet" className="inline-flex text-sm font-medium text-stone-700 underline">Return to My Closet</Link>
    </div>
  );
}

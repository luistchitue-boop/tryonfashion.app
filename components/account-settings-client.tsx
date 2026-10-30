"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountSettingsClientProps = { initialName: string; email: string };

export function AccountSettingsClient({ initialName, email }: AccountSettingsClientProps) {
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [confirmation, setConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    <div className="mt-8 space-y-6">
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
      <Link href="/closet" className="inline-flex text-sm font-medium text-stone-700 underline">Return to My Closet</Link>
    </div>
  );
}

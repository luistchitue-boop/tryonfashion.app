import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { AccountSettingsClient } from "@/components/account-settings-client";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in?callbackUrl=/settings");

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
      <Link href="/closet" className="text-sm text-stone-600 transition hover:text-stone-950">← Back to My Closet</Link>
      <header className="mt-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">Manage your profile and account data.</p>
      </header>
      <AccountSettingsClient initialName={user.name ?? ""} email={user.email ?? "No email on file"} />
    </main>
  );
}

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-stone-800">
      <Link href="/" className="text-sm uppercase tracking-[0.2em] text-stone-500">
        TryOnFashion
      </Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-stone-700">
        <p>
          TryOnFashion stores the information needed to support your personal closet and account, including your Google profile name and email when you sign in.
        </p>
        <p>
          We use this data only to provide the application experience, allow access to your saved items, and maintain the integrity of your account.
        </p>
        <p>
          We do not sell personal data and will not share your information beyond the services required to operate the product.
        </p>
      </div>
    </main>
  );
}

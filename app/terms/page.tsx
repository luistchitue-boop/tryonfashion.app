import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-stone-800">
      <Link href="/" className="text-sm uppercase tracking-[0.2em] text-stone-500">
        TryOnFashion
      </Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-stone-700">
        <p>
          TryOnFashion provides a personal closet and discovery experience for fashion inspiration. We do not guarantee availability of future virtual try-on features.
        </p>
        <p>
          Users remain responsible for the accuracy and legality of any content or product URLs they submit. We reserve the right to remove items that violate platform integrity.
        </p>
        <p>
          Continued use of the app indicates acceptance of these basic terms as the product evolves.
        </p>
      </div>
    </main>
  );
}

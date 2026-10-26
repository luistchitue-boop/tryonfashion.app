import Link from "next/link";
import { Globe } from "lucide-react";

export function GoogleSignInButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <Link
      href="/api/auth/signin/google?callbackUrl=/closet"
      className="inline-flex items-center justify-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100">
        <Globe className="h-3.5 w-3.5" />
      </span>
      {label}
    </Link>
  );
}

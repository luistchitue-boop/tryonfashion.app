import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SignIn, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">TryOnFashion</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Sign in to access your personal closet and save the looks you&apos;re drawn to.
        </p>

        <div className="mt-8 flex justify-center">
          <SignIn routing="hash" forceRedirectUrl="/closet" />
        </div>

        <div className="mt-4 flex justify-center">
          <SignOutButton redirectUrl="/">
            <Button type="button" variant="ghost" size="sm">
              Sign out
            </Button>
          </SignOutButton>
        </div>

        <div className="mt-6 border-t border-stone-200 pt-5 text-sm text-stone-600">
          <p>New to TryOnFashion?</p>
          <Link href="/" className="mt-2 inline-flex items-center gap-2 font-medium text-stone-900">
            Explore the brand <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

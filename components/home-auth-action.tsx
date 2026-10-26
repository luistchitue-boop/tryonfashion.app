"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

const actionClassName = "inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700";

export function HomeAuthAction() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isLoaded) {
    return <span className="h-10 w-28 animate-pulse rounded-full bg-stone-200" aria-hidden="true" />;
  }

  if (!isSignedIn) {
    return (
      <Link href="/sign-in" className={actionClassName}>
        Get started
      </Link>
    );
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <button type="button" onClick={handleSignOut} disabled={isSigningOut} className={actionClassName}>
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}

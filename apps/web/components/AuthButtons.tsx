"use client";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

/** Auth controls for the nav. Only rendered when Clerk is configured, so the
 *  `useAuth` hook always runs inside a mounted ClerkProvider. */
export function AuthButtons() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <Link href="/sign-in" className="btn-nav" data-ev="nav_sign_in">
        Sign in
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    );
  }
  return (
    <>
      <Link href="/account" style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: 13.5 }}>
        Account
      </Link>
      <UserButton />
    </>
  );
}

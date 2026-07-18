"use client";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Header actions for the landing page, styled with the new design system
 * (btn-ghost / btn-dark). Preserves the previous auth-aware behavior: when a
 * user is signed in we show Account + the Clerk user menu instead of Sign Up.
 *
 * Clerk hooks (useAuth) only run inside <ClerkAuthActions>, which is rendered
 * exclusively when Clerk is configured — so the hook always executes inside a
 * mounted ClerkProvider (mirrors components/AuthButtons.tsx).
 */
export function LandingAuthActions() {
  return clerkEnabled ? <ClerkAuthActions /> : <GuestActions />;
}

function GuestActions() {
  return (
    <>
      <Link href="/sign-in" className="btn btn-ghost" data-ev="nav_sign_in">Sign In</Link>
      <Link href="/sign-up" className="btn btn-dark" data-ev="nav_sign_up">Sign Up</Link>
    </>
  );
}

function ClerkAuthActions() {
  const { isLoaded, isSignedIn } = useAuth();
  // Before Clerk resolves, render the guest actions so the header never flickers empty.
  if (!isLoaded) return <GuestActions />;

  if (isSignedIn) {
    return (
      <>
        <Link href="/account" className="btn btn-ghost" data-ev="nav_account">Account</Link>
        <UserButton />
      </>
    );
  }
  return <GuestActions />;
}

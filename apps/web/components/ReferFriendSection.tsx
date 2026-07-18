"use client";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ReferFriend } from "./ReferFriend";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * "Refer a friend" promo — reused just above the closing Pay Decoder CTA on
 * every marketing page, and above the decoder on the dashboard. Signed-in
 * users get the real share flow ({@link ReferFriend}); signed-out visitors get
 * a sign-up nudge instead, since /api/referral requires an account.
 */
export function ReferFriendSection() {
  return (
    <section className="refer-promo">
      <span className="refer-promo-eyebrow">Refer a friend</span>
      <h3 className="refer-promo-h">Know someone job hunting or checking a new offer?</h3>
      <p className="refer-promo-sub">
        Share Onward with a friend — refer a friend and get 1 credit once they join.
      </p>
      {clerkEnabled && <ReferCta />}
    </section>
  );
}

function ReferCta() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <ReferFriend />;
  return (
    <Link href="/sign-up" className="refer-promo-cta" data-ev="refer_promo_signup">
      Sign up to get your referral link
    </Link>
  );
}

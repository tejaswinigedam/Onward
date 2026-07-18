import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReferFriend } from "@/components/ReferFriend";
import { ReferralClaimer } from "@/components/ReferralClaimer";
import { LearningTeaser } from "@/components/LearningTeaser";
import { getServiceClient } from "@/lib/supabase";
import { getBalance } from "@/lib/credits";
import { PaymentHistory } from "./PaymentHistory";
import { SavedAnalyses } from "./SavedAnalyses";

export const dynamic = "force-dynamic";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" />
  </svg>
);

const ExploreDecoder = () => (
  <Link href="/offer" className="btn btn-accent btn-lg" data-ev="account_decoder">
    Explore Decoder <ArrowRight />
  </Link>
);

const BuyCredits = () => (
  <div className="acct-buy">
    <p className="acct-buy-txt">Ready to unlock the full analysis? Credits start at ₹149.</p>
    <Link href="/pricing" className="btn btn-accent" data-ev="account_buy">Buy credits <ArrowRight /></Link>
  </div>
);

export default async function AccountPage() {
  if (!clerkEnabled) {
    return (
      <div className="onward-landing">
        <SiteHeader />
        <main className="wrap acct-wrap"><h1 className="acct-hi">Accounts aren&apos;t configured yet</h1>
          <p className="acct-lead">Add your Clerk keys to <code>.env.local</code> to enable sign-in.</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  const name = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "there";

  const supabase = getServiceClient();
  let balance = 0;
  let savedCount = 0;
  let paymentsCount = 0;
  if (supabase) {
    balance = await getBalance(supabase, userId);
    const [{ count: sc }, { count: pc }] = await Promise.all([
      supabase.from("analysis_results").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("saved", true),
      supabase.from("payment_requests").select("*", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    savedCount = sc ?? 0;
    paymentsCount = pc ?? 0;
  }

  const hasCredits = balance > 0;
  const hasPayments = paymentsCount > 0;
  const hasSaved = savedCount > 0;

  return (
    <div className="onward-landing">
      <SiteHeader />
      <ReferralClaimer />
      <main className="wrap acct-wrap">
        <div className="acct-top">
          <div>
            <h1 className="acct-hi">Hi, {name}</h1>
            {hasCredits && <p className="acct-credits">{balance} credit{balance === 1 ? "" : "s"} left</p>}
          </div>
          <ReferFriend />
        </div>

        {hasCredits ? (
          <>
            {hasSaved && (
              <section className="acct-sec">
                <h2 className="acct-h2">Your saved analyses</h2>
                <SavedAnalyses />
              </section>
            )}
            <section className="acct-sec acct-cta-sec">
              <h2 className="acct-h2">Decode another document</h2>
              <ExploreDecoder />
            </section>
            <section className="acct-sec"><LearningTeaser /></section>
            <BuyCredits />
          </>
        ) : hasPayments ? (
          <>
            <section className="acct-sec">
              <h2 className="acct-h2">Your payments</h2>
              <PaymentHistory />
            </section>
            <section className="acct-sec"><LearningTeaser /></section>
            <BuyCredits />
          </>
        ) : (
          <>
            <section className="acct-sec acct-start">
              <h2 className="acct-h2">Start your analysis</h2>
              <p className="acct-lead">Upload your offer letter or payslip and get your full salary breakdown — free.</p>
              <ExploreDecoder />
            </section>
            <section className="acct-sec"><LearningTeaser /></section>
            <BuyCredits />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

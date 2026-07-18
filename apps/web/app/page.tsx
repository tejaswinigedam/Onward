import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { LandingHero } from "@/components/LandingHero";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReferralClaimer } from "@/components/ReferralClaimer";
import { UserDashboard } from "@/components/UserDashboard";
import { getServiceClient } from "@/lib/supabase";
import { getBalance } from "@/lib/credits";
import "./landing.css";

export const metadata: Metadata = {
  title: "Onward — Understand your pay. Own your money.",
  description:
    "Whether you're opening your first offer letter or checking your latest payslip, Onward helps you understand what it means, spot what matters, and make smarter money decisions.",
};

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Signed-out visitors get the marketing landing; signed-in users get their
 * dashboard right here, so their credits and next steps are the first thing
 * they see.
 */
export default async function LandingPage() {
  let userId: string | null = null;
  if (clerkEnabled) {
    try {
      ({ userId } = await auth());
    } catch {
      userId = null;
    }
  }

  if (!userId) return <LandingHero />;

  const user = await currentUser();
  const name = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "there";

  const supabase = getServiceClient();
  let balance = 0;
  let savedCount = 0;
  if (supabase) {
    balance = await getBalance(supabase, userId);
    const { count } = await supabase
      .from("analysis_results")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("saved", true);
    savedCount = count ?? 0;
  }

  return (
    <div className="onward-landing">
      <SiteHeader />
      <ReferralClaimer />
      <main className="wrap acct-wrap">
        <UserDashboard name={name} balance={balance} hasSaved={savedCount > 0} />
      </main>
      <SiteFooter />
    </div>
  );
}

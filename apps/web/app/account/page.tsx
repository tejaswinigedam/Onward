import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReferralClaimer } from "@/components/ReferralClaimer";
import { UserDashboard } from "@/components/UserDashboard";
import { getServiceClient } from "@/lib/supabase";
import { getBalance } from "@/lib/credits";

export const dynamic = "force-dynamic";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default async function AccountPage() {
  if (!clerkEnabled) {
    return (
      <div className="onward-landing">
        <SiteHeader />
        <main className="wrap acct-wrap">
          <h1 className="acct-hi">Accounts aren&apos;t configured yet</h1>
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

  return (
    <div className="onward-landing">
      <SiteHeader />
      <ReferralClaimer />
      <main className="wrap acct-wrap">
        <UserDashboard name={name} balance={balance} hasSaved={savedCount > 0} />

        {/* Payment history moved to its own page — linked as an option, not shown inline. */}
        {paymentsCount > 0 && (
          <p className="acct-more-link">
            <Link href="/account/payments">View your payment history →</Link>
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

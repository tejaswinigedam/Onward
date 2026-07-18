import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaymentHistory } from "../PaymentHistory";

export const dynamic = "force-dynamic";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Payment history, split out of the main dashboard into its own account option. */
export default async function AccountPaymentsPage() {
  if (!clerkEnabled) redirect("/account");

  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Faccount%2Fpayments");

  return (
    <div className="onward-landing">
      <SiteHeader />
      <main className="wrap acct-wrap">
        <Link href="/account" className="decoder-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="20" y1="12" x2="4" y2="12" />
            <polyline points="11 19 4 12 11 5" />
          </svg>
          Back to account
        </Link>
        <h1 className="acct-hi" style={{ marginTop: 18 }}>Your payments</h1>
        <section className="acct-sec">
          <PaymentHistory />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

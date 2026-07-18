import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/credits";

export const runtime = "nodejs";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Admin overview counters: total users (from Clerk — we don't mirror a users
 * table), total referral sign-ups, total payment requests, and how many of
 * those payments came from a referred user.
 */
export async function GET() {
  if (!clerkEnabled) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isAdmin(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let users = 0;
  try {
    const client = await clerkClient();
    const res = await client.users.getCount();
    // The Backend SDK has returned either a bare number or a { totalCount }
    // shape across versions — handle both defensively.
    users = typeof res === "number" ? res : (res as { totalCount?: number })?.totalCount ?? 0;
  } catch (err) {
    console.warn("[admin/stats] Clerk user count failed:", err);
  }

  const [{ count: referrals }, { count: payments }, { data: referredRows }] = await Promise.all([
    supabase.from("referral_signups").select("*", { count: "exact", head: true }),
    supabase.from("payment_requests").select("*", { count: "exact", head: true }),
    supabase.from("referral_signups").select("referred_id"),
  ]);

  const referredIds = [...new Set((referredRows ?? []).map((r) => r.referred_id))];
  let referralPayments = 0;
  if (referredIds.length > 0) {
    const { count } = await supabase
      .from("payment_requests")
      .select("*", { count: "exact", head: true })
      .in("user_id", referredIds);
    referralPayments = count ?? 0;
  }

  return NextResponse.json({
    users,
    referrals: referrals ?? 0,
    payments: payments ?? 0,
    referralPayments,
  });
}

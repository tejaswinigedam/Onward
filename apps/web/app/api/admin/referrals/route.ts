import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/credits";

export const runtime = "nodejs";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Admin: referral tracking. Lists each referred sign-up with its referrer and
 * whether it converted to a payment, plus a per-referrer rollup.
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

  const { data: signups, error } = await supabase
    .from("referral_signups")
    .select("referred_id, referrer_id, code, signed_up_at, converted_at")
    .order("signed_up_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = signups ?? [];
  // Per-referrer rollup.
  const byReferrer = new Map<string, { referrer_id: string; signups: number; converted: number }>();
  for (const r of rows) {
    const agg = byReferrer.get(r.referrer_id) ?? { referrer_id: r.referrer_id, signups: 0, converted: 0 };
    agg.signups += 1;
    if (r.converted_at) agg.converted += 1;
    byReferrer.set(r.referrer_id, agg);
  }

  return NextResponse.json({
    items: rows,
    rollup: [...byReferrer.values()].sort((a, b) => b.signups - a.signups),
    totals: { signups: rows.length, converted: rows.filter((r) => r.converted_at).length },
  });
}

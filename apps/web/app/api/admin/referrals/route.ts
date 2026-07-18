import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/credits";
import { lookupPeople, type Person } from "@/lib/people";

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

  // Resolve ids → email/name for both sides of each referral.
  const people = await lookupPeople(rows.flatMap((r) => [r.referrer_id, r.referred_id]));
  const person = (id: string): Person => people[id] ?? { email: "", name: "" };

  // Per-referrer rollup.
  const byReferrer = new Map<string, { referrer_id: string; email: string; name: string; signups: number; converted: number }>();
  for (const r of rows) {
    const p = person(r.referrer_id);
    const agg = byReferrer.get(r.referrer_id) ?? {
      referrer_id: r.referrer_id, email: p.email, name: p.name, signups: 0, converted: 0,
    };
    agg.signups += 1;
    if (r.converted_at) agg.converted += 1;
    byReferrer.set(r.referrer_id, agg);
  }

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      referrer_email: person(r.referrer_id).email,
      referrer_name: person(r.referrer_id).name,
      referred_email: person(r.referred_id).email,
      referred_name: person(r.referred_id).name,
    })),
    rollup: [...byReferrer.values()].sort((a, b) => b.signups - a.signups),
    totals: { signups: rows.length, converted: rows.filter((r) => r.converted_at).length },
  });
}

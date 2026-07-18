import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/credits";
import { lookupPeople } from "@/lib/people";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Admin: list payment requests, optionally filtered by status and search. */
export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // may be a comma list
  const q = url.searchParams.get("q")?.trim();

  let query = supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.in("status", status.split(",").map((s) => s.trim()).filter(Boolean));
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data ?? [];

  // Revenue: always the full verified total, independent of the current filter.
  const { data: verified } = await supabase
    .from("payment_requests")
    .select("amount, credits_requested")
    .eq("status", "VERIFIED");
  const revenue = {
    total: (verified ?? []).reduce((sum, v) => sum + (v.amount ?? 0), 0),
    payments: verified?.length ?? 0,
    credits: (verified ?? []).reduce((sum, v) => sum + (v.credits_requested ?? 0), 0),
  };

  // Was this payer referred, and by whom?
  const payerIds = rows.map((r) => r.user_id);
  const { data: refs } = payerIds.length
    ? await supabase
        .from("referral_signups")
        .select("referred_id, referrer_id")
        .in("referred_id", payerIds)
    : { data: [] as { referred_id: string; referrer_id: string }[] };

  const referrerOf = new Map((refs ?? []).map((r) => [r.referred_id, r.referrer_id]));
  const people = await lookupPeople([...referrerOf.values()]);

  const items = rows.map((r) => {
    const referrerId = referrerOf.get(r.user_id);
    const p = referrerId ? people[referrerId] : undefined;
    return {
      ...r,
      referred: Boolean(referrerId),
      referred_by_email: p?.email ?? "",
      referred_by_name: p?.name ?? "",
      referred_by_id: referrerId ?? "",
    };
  });

  return NextResponse.json({ items, revenue });
}

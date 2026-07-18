import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/credits";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const bodySchema = z.object({
  action: z.enum(["mark_received", "verify", "reject", "edit_notes", "reopen", "mark_test", "unmark_test"]),
  notes: z.string().max(2000).optional(),
});

/**
 * Admin row actions on a payment request. All status transitions are manual
 * (the system has no visibility into WhatsApp). Verify grants credits via the
 * grant_credits RPC (atomic balance update + ledger entry).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { data: pr, error: getErr } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (getErr || !pr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, notes } = parsed.data;

  if (action === "edit_notes") {
    const { error } = await supabase.from("payment_requests").update({ notes: notes ?? "" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Flag a payment as a test account: it keeps its credits, but its amount is
  // left out of reported revenue. Allowed in any status, including VERIFIED.
  if (action === "mark_test" || action === "unmark_test") {
    const { error } = await supabase
      .from("payment_requests")
      .update({ is_test: action === "mark_test" })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_received") {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: "SCREENSHOT_RECEIVED", ...(notes !== undefined ? { notes } : {}) })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Undo an accidental Verify/Reject: put the row back in the actionable queue.
  // Coming back from VERIFIED we must take the granted credits back, or a second
  // verify would grant them twice.
  if (action === "reopen") {
    if (pr.status === "PENDING_SCREENSHOT" || pr.status === "SCREENSHOT_RECEIVED") {
      return NextResponse.json({ error: "Already actionable" }, { status: 409 });
    }

    let revokedTo: number | null = null;
    if (pr.status === "VERIFIED") {
      const { data: balance, error: revErr } = await supabase.rpc("revoke_credits", {
        p_user_id: pr.user_id,
        p_amount: pr.credits_requested,
        p_reason: "reversal",
        p_payment_request_id: id,
      });
      if (revErr) return NextResponse.json({ error: revErr.message }, { status: 500 });
      revokedTo = balance ?? null;

      // If this was their only verified payment, the referral is no longer converted.
      const { count } = await supabase
        .from("payment_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", pr.user_id)
        .eq("status", "VERIFIED")
        .neq("id", id);
      if ((count ?? 0) === 0) {
        await supabase
          .from("referral_signups")
          .update({ converted_at: null })
          .eq("referred_id", pr.user_id);
      }
    }

    const { error } = await supabase
      .from("payment_requests")
      .update({
        status: "PENDING_SCREENSHOT",
        verified_at: null,
        verified_by: null,
        ...(notes !== undefined ? { notes } : {}),
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, balance: revokedTo });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: "REJECTED", verified_at: new Date().toISOString(), verified_by: userId, ...(notes !== undefined ? { notes } : {}) })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // action === "verify" → grant credits (idempotent guard: only if not already VERIFIED).
  if (pr.status === "VERIFIED") {
    return NextResponse.json({ error: "Already verified" }, { status: 409 });
  }

  const { data: balance, error: grantErr } = await supabase.rpc("grant_credits", {
    p_user_id: pr.user_id,
    p_delta: pr.credits_requested,
    p_reason: "purchase",
    p_payment_request_id: id,
  });
  if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 });

  const { error: updErr } = await supabase
    .from("payment_requests")
    .update({ status: "VERIFIED", verified_at: new Date().toISOString(), verified_by: userId, ...(notes !== undefined ? { notes } : {}) })
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // If this payer was referred, mark that referral as converted (tracking only).
  await supabase
    .from("referral_signups")
    .update({ converted_at: new Date().toISOString() })
    .eq("referred_id", pr.user_id)
    .is("converted_at", null);

  return NextResponse.json({ ok: true, balance });
}

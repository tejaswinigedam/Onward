import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
// Accept a single id (single-doc unlock) or several (compare mode) — either way
// it costs exactly ONE credit.
const bodySchema = z.union([
  z.object({ analysisId: z.string().uuid() }),
  z.object({ analysisIds: z.array(z.string().uuid()).min(1).max(4) }),
]);

/**
 * Spend 1 credit to unlock the analysis half of one or more stored results.
 * Requires sign in. Idempotent: if every requested result is already unlocked by
 * this user, the full analyses are returned without charging again. A single
 * `analysisId` returns `{ analysis }`; `analysisIds` returns `{ analyses: [...] }`.
 */
export async function POST(req: Request) {
  if (!clerkEnabled) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Sign in to unlock" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "Sign in to unlock" }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

  const ids = "analysisId" in parsed.data ? [parsed.data.analysisId] : parsed.data.analysisIds;
  const single = "analysisId" in parsed.data;

  const { data: rows, error: getErr } = await supabase
    .from("analysis_results")
    .select("id, user_id, analysis, unlocked")
    .in("id", ids);
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 });
  if (!rows || rows.length !== ids.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership: results uploaded by another signed-in user can't be unlocked here.
  // Anonymous uploads (user_id null) are claimed by whoever unlocks them.
  if (rows.some((r) => r.user_id && r.user_id !== userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reply = () =>
    single
      ? { ok: true, analysis: rows[0].analysis }
      : { ok: true, analyses: rows.map((r) => ({ id: r.id, analysis: r.analysis })) };

  // Already paid for (all requested results) → return without charging again.
  if (rows.every((r) => r.unlocked && r.user_id === userId)) {
    return NextResponse.json(reply());
  }

  const { data: newBalance, error: spendErr } = await supabase.rpc("spend_credit", {
    p_user_id: userId,
    p_reason: "analysis",
  });
  if (spendErr) return NextResponse.json({ error: spendErr.message }, { status: 500 });
  if (newBalance === null) {
    return NextResponse.json(
      { error: "You're out of credits — buy more to unlock the full analysis.", code: "NO_CREDITS" },
      { status: 402 },
    );
  }

  const { error: updErr } = await supabase
    .from("analysis_results")
    .update({ unlocked: true, user_id: userId })
    .in("id", ids);
  if (updErr) {
    // Refund if we charged but couldn't mark them unlocked.
    await supabase.rpc("grant_credits", {
      p_user_id: userId,
      p_delta: 1,
      p_reason: "refund",
      p_payment_request_id: null,
    });
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ...reply(), balance: newBalance });
}

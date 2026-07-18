import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const bodySchema = z.object({ code: z.string().min(4).max(16) });

/**
 * Record that the signed-in user signed up via a referral code. Called once,
 * right after a referred friend first authenticates (the code was captured from
 * `/sign-up?ref=` and stored client-side). No-ops safely if already recorded,
 * self-referral, or an unknown code.
 */
export async function POST(req: Request) {
  if (!clerkEnabled) return NextResponse.json({ ok: false });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ ok: false });
  }
  if (!userId) return NextResponse.json({ ok: false });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ ok: false });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false });

  // Look up who owns the code.
  const { data: owner } = await supabase
    .from("referral_codes")
    .select("user_id")
    .eq("code", parsed.data.code)
    .maybeSingle();
  if (!owner || owner.user_id === userId) return NextResponse.json({ ok: false });

  // Already attributed to someone? Insert only if this user has no referral yet.
  const { data: existing } = await supabase
    .from("referral_signups")
    .select("referred_id")
    .eq("referred_id", userId)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, already: true });

  await supabase.from("referral_signups").insert({
    referred_id: userId,
    referrer_id: owner.user_id,
    code: parsed.data.code,
  });
  return NextResponse.json({ ok: true });
}

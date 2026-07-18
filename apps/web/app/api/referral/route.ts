import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { getOrCreateReferralCode, referralLink, shareTargets } from "@/lib/referral";

export const runtime = "nodejs";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** The signed-in user's referral link + share targets + tracking stats. */
export async function GET() {
  if (!clerkEnabled) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Sign in" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const code = await getOrCreateReferralCode(supabase, userId);
  const link = referralLink(code);

  const { data: signups } = await supabase
    .from("referral_signups")
    .select("converted_at")
    .eq("referrer_id", userId);
  const total = signups?.length ?? 0;
  const converted = signups?.filter((s) => s.converted_at).length ?? 0;

  return NextResponse.json({
    code,
    link,
    share: shareTargets(link),
    stats: { signups: total, converted },
  });
}

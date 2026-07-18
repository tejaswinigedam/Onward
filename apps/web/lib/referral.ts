import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

/** Short, URL-safe, human-shareable referral code. */
function genCode(): string {
  return randomBytes(6)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
}

/** The signup link a referrer shares. */
export function referralLink(code: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "";
  return `${base}/sign-up?ref=${encodeURIComponent(code)}`;
}

/** Fetch the user's referral code, creating one on first use. */
export async function getOrCreateReferralCode(
  sb: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await sb
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.code) return data.code;

  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { error } = await sb.from("referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
    // Race or collision — re-read our own row before retrying with a new code.
    const { data: again } = await sb
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle();
    if (again?.code) return again.code;
  }
  throw new Error("could not create referral code");
}

/** WhatsApp / email share targets for a referral link. */
export function shareTargets(link: string) {
  const msg = `I've been using Onward to decode salary offers & payslips — it breaks down your real take-home in plain English. Sign up here: ${link}`;
  return {
    message: msg,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
    email: `mailto:?subject=${encodeURIComponent("Try Onward — decode your salary")}&body=${encodeURIComponent(msg)}`,
  };
}

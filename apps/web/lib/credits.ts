import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Clerk user ids allowed into the admin portal. Env-overridable; defaults to
 * the two founding admins so the portal works out of the box.
 */
const DEFAULT_ADMINS = [
  "user_3GULIgGMKYRnOsMvQaWkIsjcPRM",
  "user_3GUmEgy5EghMphtWK7QlWZCpS2u",
];

export function adminUserIds(): string[] {
  const fromEnv = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ADMINS;
}

export function isAdmin(userId: string | null | undefined): boolean {
  return Boolean(userId && adminUserIds().includes(userId));
}

/** Current spendable balance for a user (0 when no row / not configured). */
export async function getBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.balance ?? 0;
}

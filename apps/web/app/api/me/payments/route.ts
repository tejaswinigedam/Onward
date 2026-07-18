import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** The signed-in user's own payment requests (their payment history). */
export async function GET() {
  if (!clerkEnabled) return NextResponse.json({ items: [] });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Sign in" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from("payment_requests")
    .select("id, plan, amount, credits_requested, status, created_at, verified_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

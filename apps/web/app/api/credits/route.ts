import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { getBalance } from "@/lib/credits";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Current user's credit balance. Anonymous / unconfigured → 0. */
export async function GET() {
  if (!clerkEnabled) return NextResponse.json({ balance: 0, signedIn: false });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ balance: 0, signedIn: false });
  }
  if (!userId) return NextResponse.json({ balance: 0, signedIn: false });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ balance: 0, signedIn: true });

  return NextResponse.json({ balance: await getBalance(supabase, userId), signedIn: true });
}

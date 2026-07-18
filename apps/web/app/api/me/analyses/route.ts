import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** The signed-in user's saved analyses (the ones they chose to keep). */
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
    .from("analysis_results")
    .select("id, analysis, unlocked, title, created_at")
    .eq("user_id", userId)
    .eq("saved", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

const saveSchema = z.object({ analysisId: z.string().uuid(), title: z.string().max(80).optional() });

/** "Save analysis for future" — flags a stored analysis so it shows on /account. */
export async function POST(req: Request) {
  if (!clerkEnabled) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Sign in to save" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

  // Claim the row to the user if anonymous, and mark it saved — only if it isn't
  // owned by someone else.
  const { data: row } = await supabase
    .from("analysis_results")
    .select("id, user_id")
    .eq("id", parsed.data.analysisId)
    .maybeSingle();
  if (!row || (row.user_id && row.user_id !== userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("analysis_results")
    .update({ saved: true, user_id: userId, ...(parsed.data.title ? { title: parsed.data.title } : {}) })
    .eq("id", parsed.data.analysisId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

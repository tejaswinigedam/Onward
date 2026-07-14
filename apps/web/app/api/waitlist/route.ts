import { NextResponse } from "next/server";
import { waitlistSchema } from "@/lib/schemas";
import { getServiceClient } from "@/lib/supabase";

/**
 * Waitlist signup. Replaces the legacy Google Apps Script webhook. Persists to
 * Supabase when configured; degrades to a no-op (still 200) in local dev so the
 * form flow is testable before the DB exists.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }
  const { email, source } = parsed.data;

  const supabase = getServiceClient();
  if (!supabase) {
    console.info(`[waitlist] (no DB configured) would store: ${email} from ${source}`);
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabase
    .from("waitlist")
    .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("[waitlist] insert failed", error);
    return NextResponse.json({ error: "Could not join waitlist" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { salaryInputSchema, offersSchema } from "@/lib/schemas";

const saveSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("salary"), inputs: salaryInputSchema, results: z.unknown() }),
  z.object({ kind: z.literal("offer"), inputs: offersSchema, results: z.unknown() }),
]);

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** List the signed-in user's saved computations (scoped by Clerk user id). */
export async function GET() {
  if (!clerkEnabled) return NextResponse.json({ items: [] });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from("computations")
    .select("id, kind, inputs, results, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

/** Save a computation for the signed-in user. */
export async function POST(req: Request) {
  if (!clerkEnabled) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { error, data } = await supabase
    .from("computations")
    .insert({ user_id: userId, kind: parsed.data.kind, inputs: parsed.data.inputs, results: parsed.data.results })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

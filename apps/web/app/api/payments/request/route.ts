import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServiceClient } from "@/lib/supabase";
import { getPlan, whatsappMessage, WHATSAPP_NUMBER } from "@/lib/credits-config";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const bodySchema = z.object({
  plan: z.enum(["STARTER_149", "POPULAR_299", "PRO_499"]),
});

/**
 * "Payment Done" → log a PaymentRequest (PENDING_SCREENSHOT) snapshotting the
 * user's name + email, and return the pre-filled WhatsApp handoff. Requires
 * login so we have an identity to attach (PRD §4).
 */
export async function POST(req: Request) {
  if (!clerkEnabled) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 422 });
  const plan = getPlan(parsed.data.plan)!;

  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Onward user";
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      user_id: userId,
      name,
      email,
      plan: plan.id,
      credits_requested: plan.credits,
      amount: plan.amount,
      status: "PENDING_SCREENSHOT",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const text = whatsappMessage(name, email);
  return NextResponse.json({
    ok: true,
    id: data.id,
    whatsapp: {
      number: WHATSAPP_NUMBER,
      text,
      // Mobile deep link; desktop opens web.whatsapp.com (client decides).
      waMeUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      webUrl: `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`,
    },
  });
}

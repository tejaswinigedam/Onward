import { NextResponse } from "next/server";
import { compareOffers } from "@onward/engine";
import { offersSchema } from "@/lib/schemas";

/** Authoritative offer comparison (guaranteed take-home). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = offersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const result = compareOffers(parsed.data.offers);
  return NextResponse.json({ result });
}

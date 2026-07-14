import { NextResponse } from "next/server";
import { computeSalary } from "@onward/engine";
import { salaryInputSchema } from "@/lib/schemas";

/** Authoritative salary + tax + opportunity computation. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = salaryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const result = computeSalary(parsed.data);
  return NextResponse.json({ result });
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractText, getDocumentProxy } from "unpdf";
import { analyseOfferFromText, analyseOfferFromPdf, geminiConfigured } from "@/lib/gemini";
import { analysisFromGemini, analysisFromText } from "@/lib/offer-analysis";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Uploads an offer PDF; extracts CTC / variable / notice period. The file is
 * processed in memory and never stored.
 *
 * Access is credit-gated (PRD §4): each analysis costs 1 credit. We spend the
 * credit atomically up-front (so concurrent uploads can't overspend a balance
 * of 1) and refund it if the analysis ultimately fails to produce a result.
 */
export async function POST(req: Request) {
  // `spendUserId` is set once a credit has been debited, so error paths refund.
  let spendUserId: string | null = null;

  if (clerkEnabled) {
    let userId: string | null = null;
    try {
      ({ userId } = await auth());
    } catch {
      return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });
    }
    if (!userId) return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });

    const supabase = getServiceClient();
    if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

    const { data: newBalance, error } = await supabase.rpc("spend_credit", {
      p_user_id: userId,
      p_reason: "analysis",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (newBalance === null) {
      return NextResponse.json(
        { error: "Available credits: 0 — make a payment to analyze.", code: "NO_CREDITS" },
        { status: 402 },
      );
    }
    spendUserId = userId;
  } else if (process.env.NODE_ENV === "production") {
    // No auth configured: fine for local dev, but never serve this unauthenticated
    // in production.
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  // else: local dev without Clerk keys — skip auth/credits and decode anyway.

  // Refund the debited credit whenever we bail without a successful analysis.
  const refund = async () => {
    if (!spendUserId) return;
    const supabase = getServiceClient();
    await supabase?.rpc("grant_credits", {
      p_user_id: spendUserId,
      p_delta: 1,
      p_reason: "refund",
      p_payment_request_id: null,
    });
  };

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    await refund();
    return NextResponse.json({ error: "Expected a file upload" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    await refund();
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    await refund();
    return NextResponse.json(
      { error: "Please upload a PDF. Scanned images aren't supported yet." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    await refund();
    return NextResponse.json({ error: "File too large (max 8 MB)." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Extract the text first — fast, and a small payload keeps the Gemini call
  // well under the serverless time limit.
  let text = "";
  try {
    const pdf = await getDocumentProxy(bytes);
    const result = await extractText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n") : result.text ?? "";
  } catch {
    /* fall through — may still be readable as a scanned PDF by Gemini */
  }

  const hasText = text.trim().length >= 20;

  // Text PDF: Gemini-on-text (rich analysis, low latency) → heuristic fallback.
  if (hasText) {
    if (geminiConfigured()) {
      try {
        return NextResponse.json({ analysis: analysisFromGemini(await analyseOfferFromText(text)), via: "gemini-text" });
      } catch (err) {
        console.warn("[offer/extract] Gemini(text) failed, using heuristic:", err);
      }
    }
    return NextResponse.json({ analysis: analysisFromText(text), via: "heuristic" });
  }

  // No selectable text (scanned/image): only Gemini vision can read it.
  if (geminiConfigured()) {
    try {
      const base64 = Buffer.from(bytes).toString("base64");
      return NextResponse.json({ analysis: analysisFromGemini(await analyseOfferFromPdf(base64, file.type)), via: "gemini-pdf" });
    } catch (err) {
      console.warn("[offer/extract] Gemini(pdf) failed:", err);
    }
  }
  await refund();
  return NextResponse.json(
    { error: "This looks like a scanned/image PDF. Add a Gemini key to read scanned offers, or enter the numbers manually." },
    { status: 422 },
  );
}

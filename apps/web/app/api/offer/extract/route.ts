import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractText, getDocumentProxy } from "unpdf";
import { analyseOfferFromText, analyseOfferFromPdf, geminiConfigured } from "@/lib/gemini";
import { analysisFromGemini, analysisFromText, freeAnalysis, type OfferAnalysis } from "@/lib/offer-analysis";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Uploads a PDF and returns the salary/component breakdown — FREE and open to
 * everyone (anonymous included). The analysis half (tax regime, opportunities,
 * clauses, actions, assumptions) is withheld: the full result is stored server
 * side and only the free subset is returned, alongside an `analysisId` the
 * client uses to unlock the rest for 1 credit via /api/offer/unlock.
 *
 * The uploaded file itself is processed in memory and never stored.
 */
export async function POST(req: Request) {
  // Identify the uploader when signed in (so the stored analysis is theirs), but
  // never block the upload — the breakdown is free.
  let userId: string | null = null;
  if (clerkEnabled) {
    try {
      ({ userId } = await auth());
    } catch {
      userId = null;
    }
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Please upload a PDF. Scanned images aren't supported yet." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
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

  let analysis: OfferAnalysis | null = null;
  let via = "heuristic";

  if (hasText) {
    if (geminiConfigured()) {
      try {
        analysis = analysisFromGemini(await analyseOfferFromText(text));
        via = "gemini-text";
      } catch (err) {
        console.warn("[offer/extract] Gemini(text) failed, using heuristic:", err);
      }
    }
    if (!analysis) {
      analysis = analysisFromText(text);
      via = "heuristic";
    }
  } else if (geminiConfigured()) {
    // No selectable text (scanned/image): only Gemini vision can read it.
    try {
      const base64 = Buffer.from(bytes).toString("base64");
      analysis = analysisFromGemini(await analyseOfferFromPdf(base64, file.type));
      via = "gemini-pdf";
    } catch (err) {
      console.warn("[offer/extract] Gemini(pdf) failed:", err);
    }
  }

  if (!analysis) {
    return NextResponse.json(
      { error: "This looks like a scanned/image PDF. Add a Gemini key to read scanned offers, or enter the numbers manually." },
      { status: 422 },
    );
  }

  // Store the full analysis so the locked half can be released on unlock. If
  // storage isn't configured (local dev without Supabase), return the full
  // analysis unlocked so the tool still works end to end.
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ analysis, via, locked: false });
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .insert({ user_id: userId, analysis })
    .select("id")
    .single();
  if (error) {
    // Storage failed — fall back to serving the full result rather than erroring.
    console.warn("[offer/extract] analysis store failed:", error.message);
    return NextResponse.json({ analysis, via, locked: false });
  }

  return NextResponse.json({
    analysis: freeAnalysis(analysis),
    analysisId: data.id,
    locked: true,
    via,
  });
}

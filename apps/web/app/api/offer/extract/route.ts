import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractText, getDocumentProxy } from "unpdf";
import { extractOffer } from "@onward/engine";
import { extractOfferViaGemini, geminiConfigured } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Signed-in users upload an offer PDF; we extract its text and heuristically
 * pull out CTC / variable / notice period. The file is processed in memory and
 * never stored. No external AI is called.
 */
export async function POST(req: Request) {
  if (!clerkEnabled) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    // Clerk couldn't verify (e.g. misconfigured server key) — treat as signed out
    // rather than crashing with a 500.
    return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });

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

  // Primary: Gemini reads the raw PDF, so it handles any layout (and scanned
  // files). Falls back to the heuristic text parser if the key is unset or the
  // call fails.
  if (geminiConfigured()) {
    try {
      const base64 = Buffer.from(bytes).toString("base64");
      const extracted = await extractOfferViaGemini(base64, file.type);
      return NextResponse.json({ extracted, via: "gemini" });
    } catch (err) {
      console.warn("[offer/extract] Gemini failed, falling back to heuristic:", err);
    }
  }

  // Fallback: extract text and run the heuristic parser.
  let text: string;
  try {
    const pdf = await getDocumentProxy(bytes);
    const result = await extractText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n") : result.text ?? "";
  } catch {
    return NextResponse.json({ error: "Couldn't read that PDF." }, { status: 422 });
  }

  if (text.trim().length < 20) {
    return NextResponse.json(
      { error: "This looks like a scanned/image PDF with no selectable text. Add a Gemini key to read scanned offers, or enter the numbers manually." },
      { status: 422 },
    );
  }

  const extracted = extractOffer(text);
  return NextResponse.json({ extracted, via: "heuristic" });
}

import type { ExtractedOffer } from "@onward/engine";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const PROMPT = `You are extracting compensation details from an Indian job offer letter (any layout: prose, salary tables with monthly/annual columns, annexures, etc).

Return ONLY the requested fields:
- annualCTC: the TOTAL annual cost-to-company in rupees as a plain number (e.g. 1200000). If the document shows both monthly and annual, use the ANNUAL figure. No currency symbols or commas.
- variableSharePct: variable / performance / at-risk pay as a percentage of CTC (e.g. 7.5). Use 0 if there is none.
- noticePeriodDays: notice period in days as an integer, or 0 if not stated (convert months to days).
- warnings: short notes about anything ambiguous or missing (empty array if all clear).

Be accurate. If a value is genuinely absent, use 0 and add a warning.`;

interface GeminiFields {
  annualCTC: number;
  variableSharePct: number;
  noticePeriodDays: number;
  warnings: string[];
}

/**
 * Extract offer details from a PDF using Google Gemini (free tier). Sends the
 * raw PDF so it works on any layout, including scanned/image PDFs. Throws on any
 * failure so the caller can fall back to the heuristic parser.
 */
export async function extractOfferViaGemini(
  pdfBase64: string,
  mimeType = "application/pdf",
): Promise<ExtractedOffer> {
  const key = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: pdfBase64 } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            annualCTC: { type: "number" },
            variableSharePct: { type: "number" },
            noticePeriodDays: { type: "number" },
            warnings: { type: "array", items: { type: "string" } },
          },
          required: ["annualCTC", "variableSharePct", "noticePeriodDays", "warnings"],
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: empty response");

  const f = JSON.parse(text) as GeminiFields;
  return {
    annualCTC: f.annualCTC > 0 ? Math.round(f.annualCTC) : undefined,
    variableShare: f.variableSharePct > 0 ? Math.min(1, f.variableSharePct / 100) : undefined,
    noticePeriodDays: f.noticePeriodDays > 0 ? Math.round(f.noticePeriodDays) : undefined,
    warnings: Array.isArray(f.warnings) ? f.warnings : [],
  };
}

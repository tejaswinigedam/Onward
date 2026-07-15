const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** Raw structured output from Gemini for a single offer letter. */
export interface GeminiAnalysis {
  annualCTC: number;
  monthlyGross: number; // monthly in-hand gross (earnings before deductions)
  variableSharePct: number;
  noticePeriodDays: number;
  /** Earning lines that make up monthly gross (Basic, HRA, allowances) — NOT
   *  employer contributions like employer PF or gratuity. */
  components: { name: string; monthly: number }[];
  clauses: { title: string; explanation: string; flag: "standard" | "watch" | "negotiate"; action: string }[];
  actions: string[]; // what to do after reading the offer
  warnings: string[];
}

const PROMPT = `You are a compensation expert decoding an Indian job offer letter for the employee who received it. Read the whole document (prose + any CTC/salary annexure tables) and produce a structured analysis.

Rules:
- annualCTC: TOTAL annual cost-to-company in rupees (plain number). If monthly & annual columns exist, use ANNUAL.
- monthlyGross: the monthly GROSS salary (sum of the employee's earning components — Basic, HRA, allowances — i.e. the "Gross Earning" line), NOT the CTC and NOT including employer PF/gratuity/insurance.
- components: the earning lines that sum to monthlyGross, each { name, monthly }. Exclude employer contributions and deductions.
- variableSharePct: variable/performance/at-risk pay as % of CTC (0 if none).
- noticePeriodDays: notice period in days (convert months; 0 if absent).
- clauses: every noteworthy term (notice period, probation, bonus clawback/joining-bonus recovery, non-compete, variable-pay conditions, transfer/bond, gratuity vesting, etc). For each: title, a plain-English explanation for the employee, a flag ("standard" = normal, "watch" = be careful, "negotiate" = worth pushing back), and a concrete action.
- actions: a checklist of what the employee should DO after reading this offer — including what to reconcile against their first payslip, tax-declaration steps, and anything to clarify/negotiate before signing.
- warnings: anything ambiguous or that you couldn't determine.

Be specific to THIS offer's numbers and clauses. Use rupees, no symbols/commas in numeric fields.`;

const schema = {
  type: "object",
  properties: {
    annualCTC: { type: "number" },
    monthlyGross: { type: "number" },
    variableSharePct: { type: "number" },
    noticePeriodDays: { type: "number" },
    components: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, monthly: { type: "number" } }, required: ["name", "monthly"] },
    },
    clauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          flag: { type: "string", enum: ["standard", "watch", "negotiate"] },
          action: { type: "string" },
        },
        required: ["title", "explanation", "flag", "action"],
      },
    },
    actions: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: ["annualCTC", "monthlyGross", "variableSharePct", "noticePeriodDays", "components", "clauses", "actions", "warnings"],
};

async function callGemini(parts: unknown[]): Promise<GeminiAnalysis> {
  const key = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: schema },
    }),
    signal: AbortSignal.timeout(50_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: empty response");
  return JSON.parse(text) as GeminiAnalysis;
}

/** Fast path: analyse already-parsed PDF text (small payload → low latency). */
export function analyseOfferFromText(text: string): Promise<GeminiAnalysis> {
  return callGemini([{ text: `${PROMPT}\n\nOFFER LETTER TEXT:\n${text.slice(0, 30000)}` }]);
}

/** Scanned/image PDFs: send the raw PDF for Gemini to read visually. */
export function analyseOfferFromPdf(pdfBase64: string, mimeType = "application/pdf"): Promise<GeminiAnalysis> {
  return callGemini([{ inline_data: { mime_type: mimeType, data: pdfBase64 } }, { text: PROMPT }]);
}

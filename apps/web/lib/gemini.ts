const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** Raw structured output from Gemini for a single offer letter. All money
 *  fields are ANNUAL rupees (compute-from-annual model). */
export interface GeminiAnalysis {
  annualCTC: number;
  /** Did the letter actually state a component split (annexure/table)? If
   *  false, `components` must be empty — never fabricate a split. */
  breakupFound: boolean;
  /** Annual earning lines that are paid as cash (Basic, HRA, allowances) — NOT
   *  employer contributions (employer PF/gratuity) and NOT deductions. */
  components: { name: string; annual: number }[];
  /** Stated employer PF (annual, 0 if not stated). */
  employerPF: number;
  /** Stated gratuity (annual, 0 if not stated). */
  gratuity: number;
  /** Stated employee PF deduction (annual, 0 if not stated). */
  employeePF: number;
  /** Cash variable/performance pay (annual, 0 if none). */
  cashVariableAnnual: number;
  variableSharePct: number;
  /** ESOP/RSU equity grant value in rupees (0 if none). */
  esopValue: number;
  /** Is the ESOP counted inside the headline CTC? Usually false (on top). */
  esopInCTC: boolean;
  esopDiscretionary: boolean;
  esopVesting: string; // e.g. "10:20:30:40" ("" if none)
  /** State or city of posting, for professional tax ("" if unknown). */
  stateOrCity: string;
  noticePeriodDays: number;
  clauses: { title: string; explanation: string; flag: "standard" | "watch" | "negotiate"; action: string }[];
  actions: string[]; // what to do after reading the offer
  warnings: string[];
}

const PROMPT = `You are a compensation expert decoding an Indian job offer letter for the employee who received it. Read the ENTIRE document end to end — every page, including annexures, appendices and any page containing a CTC/salary table (the salary breakup is often on a later "Annexure A" page). Produce a structured analysis.

Rules:
- annualCTC: TOTAL annual cost-to-company in rupees (plain number). If monthly & annual columns exist, use ANNUAL.
- breakupFound: true ONLY if the letter actually states a component-wise salary split (a table/annexure listing Basic, HRA, etc.). If you cannot find a real split anywhere in the document, set false and return components as an EMPTY array. Never invent or assume a "standard" 50/25/25 split.
- components: when breakupFound is true, the ANNUAL earning lines that are paid as cash to the employee (Basic, HRA, Special Allowance, LTA, and other allowances), each { name, annual }. EXCLUDE employer PF, gratuity, employer insurance (those are employer contributions, not cash) and exclude any deductions. Use the letter's stated numbers verbatim.
- employerPF / gratuity: the STATED annual employer PF and gratuity amounts from the CTC table (0 if not stated). These are part of CTC but not paid in cash.
- employeePF: the STATED annual employee PF deduction if the letter gives one (0 otherwise).
- cashVariableAnnual: stated annual cash variable/performance bonus/incentive in rupees (0 if none).
- variableSharePct: variable/performance/at-risk CASH pay as % of CTC (0 if none). Do NOT count ESOP here.
- esopValue: stated ESOP/RSU/stock grant value in rupees (0 if none). esopInCTC: true only if the letter counts it inside the CTC (usually false — it's "on top"). esopDiscretionary: true if described as discretionary/at the company's discretion/performance-linked. esopVesting: the vesting schedule as stated (e.g. "10:20:30:40"), else "".
- stateOrCity: the work location's state or city (for professional tax), else "".
- noticePeriodDays: notice period in days (convert months; 0 if absent).
- clauses: every noteworthy term (notice period, probation, bonus clawback/joining-bonus recovery, non-compete, ESOP vesting/forfeiture, variable-pay conditions, transfer/bond, gratuity vesting, etc). For each: title, a plain-English explanation for the employee, a flag ("standard" = normal, "watch" = be careful, "negotiate" = worth pushing back), and a concrete action.
- actions: a checklist of what the employee should DO after reading this offer — including what to reconcile against their first payslip, tax-declaration steps, and anything to clarify/negotiate before signing.
- warnings: anything ambiguous or that you couldn't determine (including "component split not found" if breakupFound is false).

Be specific to THIS offer's numbers and clauses. Use rupees, no symbols/commas in numeric fields.`;

const schema = {
  type: "object",
  properties: {
    annualCTC: { type: "number" },
    breakupFound: { type: "boolean" },
    components: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, annual: { type: "number" } }, required: ["name", "annual"] },
    },
    employerPF: { type: "number" },
    gratuity: { type: "number" },
    employeePF: { type: "number" },
    cashVariableAnnual: { type: "number" },
    variableSharePct: { type: "number" },
    esopValue: { type: "number" },
    esopInCTC: { type: "boolean" },
    esopDiscretionary: { type: "boolean" },
    esopVesting: { type: "string" },
    stateOrCity: { type: "string" },
    noticePeriodDays: { type: "number" },
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
  required: [
    "annualCTC", "breakupFound", "components", "employerPF", "gratuity", "employeePF",
    "cashVariableAnnual", "variableSharePct", "esopValue", "esopInCTC", "esopDiscretionary",
    "esopVesting", "stateOrCity", "noticePeriodDays", "clauses", "actions", "warnings",
  ],
};

async function callGemini(parts: unknown[]): Promise<GeminiAnalysis> {
  const key = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: schema,
        // Flash models "think" by default which is slow for structured output;
        // disable it so the call returns in a few seconds.
        thinkingConfig: { thinkingBudget: 0 },
      },
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
  // Cap generously: the salary annexure is frequently on a LATER page, so an
  // aggressive slice would drop the very table we need (the Case B failure).
  return callGemini([{ text: `${PROMPT}\n\nOFFER LETTER TEXT:\n${text.slice(0, 120000)}` }]);
}

/** Scanned/image PDFs: send the raw PDF for Gemini to read visually. */
export function analyseOfferFromPdf(pdfBase64: string, mimeType = "application/pdf"): Promise<GeminiAnalysis> {
  return callGemini([{ inline_data: { mime_type: mimeType, data: pdfBase64 } }, { text: PROMPT }]);
}

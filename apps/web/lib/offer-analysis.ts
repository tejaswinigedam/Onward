import {
  computeSalary,
  earningsFromCTC,
  extractOffer,
  type Component,
  type Opportunity,
} from "@onward/engine";
import type { GeminiAnalysis } from "./gemini";

export interface Clause {
  title: string;
  explanation: string;
  flag: "standard" | "watch" | "negotiate";
  action: string;
}

export interface OfferAnalysis {
  annualCTC: number;
  variableShare: number;
  fixedAnnual: number;
  noticePeriodDays?: number;
  /** Monthly earning lines. */
  components: Component[];
  grossMonthly: number;
  epfMonthly: number;
  tdsMonthly: number;
  netMonthly: number;
  netAnnual: number;
  regime: { taxNew: number; taxOld: number; newWins: boolean };
  opportunities: Opportunity[];
  clauses: Clause[];
  actions: string[];
  warnings: string[];
}

/** Default post-offer checklist appended to whatever the model returns. */
const BASE_ACTIONS = [
  "When your first payslip arrives, reconcile every line against this offer — Basic, HRA, deductions and net should match.",
  "Confirm the exact conditions and payout schedule for any variable/bonus pay before counting on it.",
  "Declare rent (for HRA), 80C investments and other deductions to payroll early so TDS isn't over-deducted.",
  "Compare the old vs new tax regime for your numbers and pick the cheaper one at declaration time.",
];

function fromComponents(comps: { name: string; monthly: number }[]): Component[] {
  return comps
    .filter((c) => c.monthly > 0)
    .map((c) => {
      const n = c.name.toLowerCase();
      const x = /basic/.test(n) ? "basic" : /hra|house rent/.test(n) ? "hra" : /special/.test(n) ? "special" : undefined;
      return { name: c.name, amount: Math.round(c.monthly), x };
    });
}

function assemble(
  annualCTC: number,
  variableShare: number,
  earnings: Component[],
  noticePeriodDays: number | undefined,
  clauses: Clause[],
  actions: string[],
  warnings: string[],
): OfferAnalysis {
  const salary = computeSalary({
    earnings,
    deductions: [{ name: "Professional tax", amount: 200, x: "pt" }],
    includeEPF: true,
    includeTDS: true,
  });
  return {
    annualCTC,
    variableShare,
    fixedAnnual: Math.round(annualCTC * (1 - variableShare)),
    noticePeriodDays,
    components: earnings,
    grossMonthly: salary.grossMonthly,
    epfMonthly: salary.epfMonthly,
    tdsMonthly: salary.tdsMonthly,
    netMonthly: salary.netMonthly,
    netAnnual: salary.netAnnual,
    regime: salary.regime,
    opportunities: salary.opportunities,
    clauses,
    actions: [...actions, ...BASE_ACTIONS],
    warnings,
  };
}

/** Build the full analysis from Gemini's structured output. */
export function analysisFromGemini(g: GeminiAnalysis): OfferAnalysis {
  const variableShare = Math.min(1, (g.variableSharePct || 0) / 100);
  // Prefer the model's component breakdown; else synthesise from the fixed CTC.
  const earnings =
    g.components?.length && g.monthlyGross > 0
      ? fromComponents(g.components)
      : earningsFromCTC(Math.round((g.annualCTC || 0) * (1 - variableShare)));
  return assemble(
    Math.round(g.annualCTC || 0),
    variableShare,
    earnings,
    g.noticePeriodDays > 0 ? Math.round(g.noticePeriodDays) : undefined,
    g.clauses ?? [],
    g.actions ?? [],
    g.warnings ?? [],
  );
}

/** Fallback when Gemini is unavailable: heuristic numbers + generic guidance. */
export function analysisFromText(text: string): OfferAnalysis {
  const ex = extractOffer(text);
  const annualCTC = ex.annualCTC ?? 0;
  const variableShare = ex.variableShare ?? 0;
  const clauses: Clause[] = [];
  if (ex.noticePeriodDays) {
    clauses.push({
      title: `Notice period — ${ex.noticePeriodDays} days`,
      explanation:
        ex.noticePeriodDays >= 90
          ? "A 90-day notice is on the longer side and can slow down your next move."
          : "A standard notice period.",
      flag: ex.noticePeriodDays >= 90 ? "negotiate" : "standard",
      action: ex.noticePeriodDays >= 90 ? "Ask if it can be reduced to 60 days, or a buy-out option." : "No action needed.",
    });
  }
  return assemble(
    annualCTC,
    variableShare,
    earningsFromCTC(Math.round(annualCTC * (1 - variableShare))),
    ex.noticePeriodDays,
    clauses,
    [],
    ex.warnings,
  );
}

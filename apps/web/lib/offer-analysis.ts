import {
  computeOfferBreakdown,
  evaluateOpportunities,
  extractOffer,
  type Component,
  type EquityGrant,
  type OfferBreakdown,
  type OfferLine,
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
  /** Whether the letter actually stated a component split. Drives the UI banner. */
  breakupStated: boolean;
  /** Monthly earning lines, each with a provenance badge. */
  components: OfferLine[];
  grossMonthly: number;
  /** Every deduction that reduces net pay, as its own visible line. */
  deductions: OfferLine[];
  epfMonthly: number;
  professionalTaxMonthly: number;
  tdsMonthly: number;
  netMonthly: number;
  netAnnual: number;
  /** Equity grants (ESOP/RSU) surfaced in the headline. */
  equity: EquityGrant[];
  regime: { taxNew: number; taxOld: number; newWins: boolean };
  opportunities: Opportunity[];
  /** Fields the user should confirm with HR (estimates/assumptions). */
  assumptions: string[];
  /** True when any headline figure depends on an estimated field. */
  estimated: boolean;
  clauses: Clause[];
  actions: string[];
  warnings: string[];
}

/**
 * The "analysis" half that sits behind the credit lock. The salary/component
 * breakdown (everything else) is free for everyone; these fields are only
 * returned after a credit is spent. See {@link freeAnalysis}.
 */
export const LOCKED_SECTIONS = ["regime", "opportunities", "assumptions", "clauses", "actions"] as const;

/**
 * Strip the locked analysis fields so only the free salary/component breakdown
 * reaches the browser. Locked collections are emptied and the tax-regime figures
 * are zeroed — the client renders a lock panel in their place.
 */
export function freeAnalysis(a: OfferAnalysis): OfferAnalysis {
  return {
    ...a,
    regime: { taxNew: 0, taxOld: 0, newWins: false },
    opportunities: [],
    assumptions: [],
    clauses: [],
    actions: [],
  };
}

/** Default post-offer checklist appended to whatever the model returns. */
const BASE_ACTIONS = [
  "When your first payslip arrives, reconcile every line against this offer — Basic, HRA, deductions and net should match.",
  "Confirm the exact conditions and payout schedule for any variable/bonus pay before counting on it.",
  "Declare rent (for HRA), 80C investments and other deductions to payroll early so TDS isn't over-deducted.",
  "Compare the old vs new tax regime for your numbers and pick the cheaper one at declaration time.",
];

/** Preset/explanation key for an earning line name. */
function keyFor(name: string): string | undefined {
  const n = name.toLowerCase();
  if (/basic/.test(n)) return "basic";
  if (/hra|house rent/.test(n)) return "hra";
  if (/special/.test(n)) return "special";
  return undefined;
}

/** Map an engine OfferLine to the legacy monthly `Component` (for opportunities). */
function toComponent(l: OfferLine): Component {
  return { name: l.name, amount: l.monthly, x: l.x };
}

function assemble(
  b: OfferBreakdown,
  noticePeriodDays: number | undefined,
  clauses: Clause[],
  actions: string[],
  warnings: string[],
): OfferAnalysis {
  const earnings = b.earnings.map(toComponent);
  const opportunities = evaluateOpportunities({
    basic: earnings.find((c) => c.x === "basic")?.amount ?? 0,
    hra: earnings.find((c) => c.x === "hra")?.amount ?? 0,
    special: earnings.find((c) => c.x === "special")?.amount ?? 0,
    grossAnnual: b.grossCashAnnual,
    taxNew: b.regime.taxNew,
    taxOldNoInv: b.regime.taxOld,
    fy: "FY2025-26",
  });

  const warn = [...warnings];
  if (!b.breakupStated) {
    warn.unshift(
      "Component split not found in the letter — the salary breakdown below is estimated. Confirm the exact figures with HR.",
    );
  }

  return {
    annualCTC: b.annualCTC,
    variableShare: b.atRiskCashShare,
    fixedAnnual: b.fixedAnnual,
    noticePeriodDays,
    breakupStated: b.breakupStated,
    components: b.earnings,
    grossMonthly: b.grossCashMonthly,
    deductions: b.deductions,
    epfMonthly: b.deductions.find((d) => d.x === "epf")?.monthly ?? 0,
    professionalTaxMonthly: b.deductions.find((d) => d.x === "pt")?.monthly ?? 0,
    tdsMonthly: b.deductions.find((d) => d.x === "tds")?.monthly ?? 0,
    netMonthly: b.takeHomeMonthly,
    netAnnual: b.takeHomeAnnual,
    equity: b.equity,
    regime: b.regime,
    opportunities,
    assumptions: b.assumptions,
    estimated: b.estimated,
    clauses,
    actions: [...actions, ...BASE_ACTIONS],
    warnings: warn,
  };
}

/** Build the full analysis from Gemini's structured output. */
export function analysisFromGemini(g: GeminiAnalysis): OfferAnalysis {
  const annualCTC = Math.round(g.annualCTC || 0);
  const breakupStated = Boolean(g.breakupFound) && (g.components?.length ?? 0) > 0;
  const cashVariableAnnual = Math.round(
    g.cashVariableAnnual || (annualCTC * (g.variableSharePct || 0)) / 100,
  );
  const equity: EquityGrant[] =
    g.esopValue && g.esopValue > 0
      ? [{
          name: "ESOP",
          value: Math.round(g.esopValue),
          inCTC: Boolean(g.esopInCTC),
          discretionary: Boolean(g.esopDiscretionary),
          vesting: g.esopVesting || undefined,
        }]
      : [];

  const b = computeOfferBreakdown({
    annualCTC,
    breakupStated,
    earnings: breakupStated
      ? g.components.map((c) => ({ name: c.name, annual: Math.round(c.annual), x: keyFor(c.name) }))
      : [],
    employerPF: g.employerPF > 0 ? Math.round(g.employerPF) : undefined,
    gratuity: g.gratuity > 0 ? Math.round(g.gratuity) : undefined,
    employeePF: g.employeePF > 0 ? Math.round(g.employeePF) : undefined,
    cashVariableAnnual,
    equity,
    stateOrCity: g.stateOrCity || undefined,
  });

  return assemble(
    b,
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
  const cashVariableAnnual = Math.round(annualCTC * (ex.variableShare ?? 0));
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

  // The heuristic parser never recovers a real component split → estimate + badge.
  const b = computeOfferBreakdown({
    annualCTC,
    breakupStated: false,
    earnings: [],
    cashVariableAnnual,
  });

  return assemble(b, ex.noticePeriodDays, clauses, [], ex.warnings);
}

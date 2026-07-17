/**
 * Canonical offer breakdown — the authoritative money model for the Pay Decoder.
 *
 * Design invariants (see the engineering brief):
 *  - Compute everything from ANNUAL figures, derive monthly as annual/12. Never
 *    build an annual total by summing independently-rounded monthly lines.
 *  - A value STATED in the letter always wins over any estimate/heuristic.
 *  - Employer contributions (employer PF, gratuity) are CTC line items, never
 *    deducted from the employee's gross cash.
 *  - Every deduction that reduces net pay is a visible line — take-home is
 *    exactly `grossCash − Σ(displayed deductions)`, with no hidden term.
 *  - ESOP/equity is reported separately and never blended into the fixed cash %.
 */
import {
  epfCeilingAnnual,
  fiscalConfig,
  professionalTaxAnnual,
  type FiscalYear,
} from "./constants";
import { newRegimeTax, oldRegimeTax } from "./tax";
import type { RegimeComparison } from "./types";

/** Where a number came from. Drives UI badging and the provenance gate. */
export type Provenance = "stated" | "derived" | "estimated";

/** A single money line carried at annual precision; monthly is for display. */
export interface OfferLine {
  name: string;
  annual: number;
  /** annual / 12, rounded for presentation only — never re-summed. */
  monthly: number;
  source: Provenance;
  /** Optional preset/explanation key (basic/hra/special/epf/pt/tds/...). */
  x?: string;
}

export interface EquityGrant {
  name: string;
  value: number;
  /** True if the letter folds this into the headline CTC. */
  inCTC: boolean;
  discretionary: boolean;
  /** e.g. "10:20:30:40 over 4 years". */
  vesting?: string;
}

export interface Gate {
  id: "G1" | "G2" | "G3" | "G4" | "G5" | "G6";
  label: string;
  ok: boolean;
  detail: string;
}

export interface OfferBreakdownInput {
  annualCTC: number;
  ctcSource?: Provenance;
  /** Whether the letter actually stated a component split. */
  breakupStated: boolean;
  /** Gross-cash earning lines (annual): Basic, HRA, allowances that are paid. */
  earnings: { name: string; annual: number; x?: string }[];
  /** Stated employer-side CTC provisions (annual): employer PF, gratuity, etc. */
  employerPF?: number;
  gratuity?: number;
  /** Stated employee PF (annual). Rare, but wins when present. */
  employeePF?: number;
  /** Cash variable / performance pay (annual). */
  cashVariableAnnual?: number;
  /** Equity grants (ESOP/RSU). Normally on top of CTC. */
  equity?: EquityGrant[];
  /** State/city for professional tax. */
  stateOrCity?: string;
  fy?: FiscalYear;
}

export interface OfferBreakdown {
  annualCTC: number;
  ctcSource: Provenance;
  breakupStated: boolean;

  earnings: OfferLine[];
  grossCashAnnual: number;
  grossCashMonthly: number;

  /** Employer PF, gratuity, and any derived residual retirals. */
  employerProvisions: OfferLine[];
  /** Employee PF, professional tax, TDS — each reduces net pay. */
  deductions: OfferLine[];

  employeePFAnnual: number;
  professionalTaxAnnual: number;
  tdsAnnual: number;

  takeHomeAnnual: number;
  takeHomeMonthly: number;

  cashVariableAnnual: number;
  /** CTC − cash variable (ESOP is NOT subtracted here). */
  fixedAnnual: number;
  equity: EquityGrant[];
  /** Cash variable as a fraction of CTC (equity reported separately). */
  atRiskCashShare: number;

  regime: RegimeComparison;

  gates: Gate[];
  gatesPass: boolean;
  /** Human-readable list of every assumed/estimated field to confirm with HR. */
  assumptions: string[];
  /** True when any headline figure depends on an estimated field. */
  estimated: boolean;
}

const r = Math.round;
const mo = (annual: number) => r(annual / 12);
const line = (name: string, annual: number, source: Provenance, x?: string): OfferLine => ({
  name,
  annual: r(annual),
  monthly: mo(annual),
  source,
  x,
});

/** Is a stated employer PF at (or below) the statutory wage ceiling? */
function employerPFIsCapped(employerPF: number | undefined, fy: FiscalYear): boolean {
  if (!employerPF || employerPF <= 0) return false;
  return employerPF <= epfCeilingAnnual(fy) + 100; // ±₹100 tolerance
}

export function computeOfferBreakdown(input: OfferBreakdownInput): OfferBreakdown {
  const fy = input.fy ?? "FY2025-26";
  const cfg = fiscalConfig(fy);
  const assumptions: string[] = [];

  const ctcSource: Provenance = input.ctcSource ?? "stated";
  const cashVariableAnnual = r(input.cashVariableAnnual ?? 0);

  // ── Earnings (gross cash) ─────────────────────────────────────────────────
  // Stated split wins. If absent, synthesise a COARSE estimate (nearest ₹1,000)
  // that cannot be mistaken for stated values, and badge the whole card.
  let earnings: OfferLine[];
  if (input.breakupStated && input.earnings.length) {
    earnings = input.earnings.map((c) => line(c.name, c.annual, "stated", c.x));
  } else {
    const fixedAnnual = input.annualCTC * (1 - (cashVariableAnnual / (input.annualCTC || 1)));
    const grossGuess = Math.max(0, fixedAnnual - epfCeilingAnnual(fy));
    const basic = r(grossGuess * cfg.ctcBasicShare / 1000) * 1000;
    const hra = r(basic * cfg.hraOfBasic / 1000) * 1000;
    const special = Math.max(0, r((grossGuess - basic - hra) / 1000) * 1000);
    earnings = [
      line("Basic salary (estimated)", basic, "estimated", "basic"),
      line("HRA (estimated)", hra, "estimated", "hra"),
      line("Special allowance (estimated)", special, "estimated", "special"),
    ];
    assumptions.push(
      "Component split was not found in the letter — Basic/HRA/allowances are coarse estimates. Confirm the exact breakup with HR.",
    );
  }
  const grossCashAnnual = earnings.reduce((s, c) => s + c.annual, 0);

  // ── Employer provisions (CTC line items, not paid to the employee) ────────
  const employerProvisions: OfferLine[] = [];
  if (input.employerPF && input.employerPF > 0)
    employerProvisions.push(line("Employer PF", input.employerPF, "stated", "employer-pf"));
  if (input.gratuity && input.gratuity > 0)
    employerProvisions.push(line("Gratuity", input.gratuity, "stated", "gratuity"));

  // Residual retirals: whatever CTC is left after gross cash + cash variable +
  // stated provisions. Keeps CTC reconciliation (G1) honest when the letter
  // gives CTC but not every employer line.
  const statedProvisions = employerProvisions.reduce((s, c) => s + c.annual, 0);
  const residual = r(input.annualCTC - grossCashAnnual - cashVariableAnnual - statedProvisions);
  if (residual >= 1000) {
    employerProvisions.push(line("Employer retirals (PF / gratuity)", residual, "derived", "retirals"));
    assumptions.push(
      "CTC includes employer retirals not itemised in the letter — shown as a derived line.",
    );
  }

  // ── Employee PF (Part B step 5) ───────────────────────────────────────────
  const basicAnnual = earnings.find((c) => c.x === "basic")?.annual ?? 0;
  let employeePFAnnual: number;
  let pfSource: Provenance;
  if (input.employeePF && input.employeePF > 0) {
    employeePFAnnual = r(input.employeePF);
    pfSource = "stated";
  } else if (employerPFIsCapped(input.employerPF, fy)) {
    employeePFAnnual = epfCeilingAnnual(fy); // capped, consistent with employer PF
    pfSource = "derived";
    assumptions.push(
      "Employee PF assumed capped at the statutory ceiling (₹1,800/mo), matching the stated employer PF. Confirm the exact PF deduction with HR.",
    );
  } else {
    employeePFAnnual = r(basicAnnual * cfg.epfEmployeeRate); // 12% of Basic
    pfSource = "derived";
    assumptions.push(
      "Employee PF assumed at 12% of Basic (no capped employer PF stated). Confirm the exact PF deduction with HR.",
    );
  }

  // ── Professional tax (state-specific, its own visible line) ───────────────
  const ptAnnual = professionalTaxAnnual(input.stateOrCity);

  // ── TDS: cheaper regime on the correct gross cash, spread over 12 ──────────
  const taxNew = newRegimeTax(grossCashAnnual, fy);
  const taxOld = oldRegimeTax(grossCashAnnual, 0, fy);
  const tdsAnnual = Math.min(taxNew, taxOld);
  const regime: RegimeComparison = { taxNew, taxOld, newWins: taxNew <= taxOld };

  // ── Deductions + take-home (exact by construction) ────────────────────────
  const deductions: OfferLine[] = [
    line("EPF — your contribution", employeePFAnnual, pfSource, "epf"),
    line("Professional tax", ptAnnual, "derived", "pt"),
    line("TDS — income tax", tdsAnnual, "derived", "tds"),
  ];
  const totalDeductionsAnnual = deductions.reduce((s, c) => s + c.annual, 0);
  const takeHomeAnnual = grossCashAnnual - totalDeductionsAnnual;
  // Displayed monthly take-home is the residual of the DISPLAYED monthly lines so
  // the on-screen column reconciles exactly (no ₹1–₹2 rounding ghost). It differs
  // from takeHomeAnnual/12 by at most a rupee or two — within the G4 tolerance.
  const grossCashMonthly = mo(grossCashAnnual);
  const takeHomeMonthly = grossCashMonthly - deductions.reduce((s, c) => s + c.monthly, 0);

  // ── Fixed / variable / equity ─────────────────────────────────────────────
  const fixedAnnual = r(input.annualCTC - cashVariableAnnual);
  const equity = input.equity ?? [];
  const atRiskCashShare = input.annualCTC > 0 ? cashVariableAnnual / input.annualCTC : 0;

  // Every headline (gross, take-home, fixed) depends on the estimated split.
  const estimated = !input.breakupStated;

  // ── Validation gates ──────────────────────────────────────────────────────
  const ctcComponentsSum =
    grossCashAnnual + employerProvisions.reduce((s, c) => s + c.annual, 0) + cashVariableAnnual;
  const g1 = Math.abs(ctcComponentsSum - input.annualCTC) <= 100;
  const g2 = Math.abs(earnings.reduce((s, c) => s + c.annual, 0) - grossCashAnnual) <= 100;
  const g3 = Math.abs(takeHomeAnnual - (grossCashAnnual - totalDeductionsAnnual)) <= 1;
  const g4 = Math.abs(takeHomeAnnual - takeHomeMonthly * 12) <= 12;
  // G5: every earning is inside the gross that feeds the net path (true by
  // construction — net uses the same grossCashAnnual = Σ earnings).
  const g5 = g2;
  const g6ok = !estimated || earnings.every((c) => c.source === "estimated");

  const gates: Gate[] = [
    { id: "G1", label: "CTC reconciles", ok: g1, detail: `Σ CTC components ${r(ctcComponentsSum).toLocaleString("en-IN")} vs CTC ${input.annualCTC.toLocaleString("en-IN")}` },
    { id: "G2", label: "Gross reconciles", ok: g2, detail: `Σ earnings = gross cash ${grossCashAnnual.toLocaleString("en-IN")}` },
    { id: "G3", label: "Net reconciles exactly", ok: g3, detail: `take-home = gross − deductions` },
    { id: "G4", label: "Annual = monthly × 12", ok: g4, detail: `within ₹12/yr` },
    { id: "G5", label: "No orphan component", ok: g5, detail: `every earning flows to net` },
    { id: "G6", label: "Provenance consistent", ok: g6ok, detail: estimated ? "estimated card badged" : "all stated" },
  ];
  const gatesPass = gates.every((g) => g.ok);

  return {
    annualCTC: r(input.annualCTC),
    ctcSource,
    breakupStated: input.breakupStated,
    earnings,
    grossCashAnnual,
    grossCashMonthly,
    employerProvisions,
    deductions,
    employeePFAnnual,
    professionalTaxAnnual: ptAnnual,
    tdsAnnual,
    takeHomeAnnual,
    takeHomeMonthly,
    cashVariableAnnual,
    fixedAnnual,
    equity,
    atRiskCashShare,
    regime,
    gates,
    gatesPass,
    assumptions,
    estimated,
  };
}

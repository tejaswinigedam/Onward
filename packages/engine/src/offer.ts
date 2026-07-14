import { computeSalary, earningsFromCTC } from "./salary";
import type { FiscalYear } from "./constants";

export interface OfferInput {
  label: string;
  annualCTC: number;
  /** Variable/at-risk pay as a fraction of CTC (e.g. 0.2 for 20%). */
  variableShare: number;
  fy?: FiscalYear;
}

export interface OfferResult {
  label: string;
  annualCTC: number;
  variableShare: number;
  fixedAnnual: number;
  /** Monthly take-home computed from the guaranteed (fixed) portion only. */
  netMonthly: number;
  netAnnualGuaranteed: number;
}

/**
 * Evaluate a single offer. The bigger CTC isn't the better deal â€” what matters
 * is guaranteed monthly take-home, so we build the payslip from the FIXED
 * portion (CTC minus at-risk variable) and run it through the salary engine.
 */
export function computeOffer(input: OfferInput): OfferResult {
  const fixedAnnual = Math.round(input.annualCTC * (1 - input.variableShare));
  const salary = computeSalary({
    earnings: earningsFromCTC(fixedAnnual, input.fy),
    deductions: [{ name: "Professional tax", amount: 200, x: "pt" }],
    includeEPF: true,
    includeTDS: true,
    fy: input.fy,
  });
  return {
    label: input.label,
    annualCTC: input.annualCTC,
    variableShare: input.variableShare,
    fixedAnnual,
    netMonthly: salary.netMonthly,
    netAnnualGuaranteed: salary.netAnnual,
  };
}

export interface OfferComparison {
  offers: OfferResult[];
  /** Index of the offer with higher guaranteed monthly take-home. */
  winnerIndex: number;
  /** Index of the offer with the larger headline CTC (may differ from winner). */
  biggerCtcIndex: number;
  monthlyTakeHomeGap: number;
}

/** Compare two or more offers on guaranteed take-home. */
export function compareOffers(inputs: OfferInput[]): OfferComparison {
  if (inputs.length < 2) throw new Error("compareOffers needs at least two offers");
  const offers = inputs.map(computeOffer);

  let winnerIndex = 0;
  let biggerCtcIndex = 0;
  offers.forEach((o, i) => {
    if (o.netMonthly > offers[winnerIndex]!.netMonthly) winnerIndex = i;
    if (o.annualCTC > offers[biggerCtcIndex]!.annualCTC) biggerCtcIndex = i;
  });

  const sortedNet = [...offers].sort((a, b) => b.netMonthly - a.netMonthly);
  const monthlyTakeHomeGap = sortedNet[0]!.netMonthly - sortedNet[1]!.netMonthly;

  return { offers, winnerIndex, biggerCtcIndex, monthlyTakeHomeGap };
}

import { fiscalConfig, type FiscalYear, type RegimeRules } from "./constants";

/** Progressive slab walk shared by both regimes. `taxable` is post-deduction. */
function slabTax(taxable: number, rules: RegimeRules, cess: number): number {
  if (taxable <= rules.rebateCeiling) return 0;
  let tax = 0;
  let prev = 0;
  for (const { upper, rate } of rules.bands) {
    if (taxable > prev) {
      tax += (Math.min(taxable, upper) - prev) * rate;
      prev = upper;
    } else break;
  }
  return Math.round(tax * cess);
}

/**
 * New-regime annual income tax.
 * Ported from salary-demystified.html:515 â€” standard deduction â‚¹75k, 87A
 * rebate up to â‚¹12L taxable, then FY2025-26 slabs + 4% cess.
 */
export function newRegimeTax(gross: number, fy: FiscalYear = "FY2025-26"): number {
  const cfg = fiscalConfig(fy);
  const taxable = gross - cfg.newRegime.standardDeduction;
  return slabTax(taxable, cfg.newRegime, cfg.cess);
}

/**
 * Old-regime annual income tax with optional investment/exemption deductions
 * (80C, HRA, etc.). Ported from salary-demystified.html:523 â€” standard
 * deduction â‚¹50k, 87A rebate up to â‚¹5L taxable, then old slabs + 4% cess.
 */
export function oldRegimeTax(
  gross: number,
  deductions = 0,
  fy: FiscalYear = "FY2025-26",
): number {
  const cfg = fiscalConfig(fy);
  const taxable = gross - cfg.oldRegime.standardDeduction - deductions;
  return slabTax(taxable, cfg.oldRegime, cfg.cess);
}

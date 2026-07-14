import { fiscalConfig, type FiscalYear } from "./constants";
import { newRegimeTax, oldRegimeTax } from "./tax";
import { evaluateOpportunities } from "./opportunities/evaluate";
import type { Component, SalaryInput, SalaryResult } from "./types";

const findAmt = (arr: Component[], key: string, re: RegExp): number => {
  const c = arr.find((c) => c.x === key || re.test(c.name));
  return c ? Number(c.amount) || 0 : 0;
};

export const basicAmt = (earnings: Component[]) => findAmt(earnings, "basic", /basic/i);
export const hraAmt = (earnings: Component[]) => findAmt(earnings, "hra", /hra/i);
export const specialAmt = (earnings: Component[]) => findAmt(earnings, "special", /special/i);

/**
 * Reverse-derive a realistic monthly payslip from an annual CTC.
 * Ported from salary-demystified.html:426.
 */
export function earningsFromCTC(annualCTC: number, fy: FiscalYear = "FY2025-26"): Component[] {
  const cfg = fiscalConfig(fy);
  const m = (annualCTC || 0) / 12;
  const basic = Math.round(m * cfg.ctcBasicShare);
  const hra = Math.round(basic * cfg.hraOfBasic);
  const employerPF = Math.round(basic * cfg.employerPfRate);
  const special = Math.max(0, Math.round(m - basic - hra - employerPF));
  return [
    { name: "Basic salary", amount: basic, x: "basic" },
    { name: "HRA", amount: hra, x: "hra" },
    { name: "Special allowance", amount: special, x: "special" },
  ];
}

/**
 * Authoritative salary computation. Ported from the client `recompute`
 * (salary-demystified.html:534) and generalised: TDS is the cheaper of the two
 * regimes (assuming no declared investments), spread over 12 months.
 */
export function computeSalary(input: SalaryInput): SalaryResult {
  const fy = input.fy ?? "FY2025-26";
  const cfg = fiscalConfig(fy);

  const grossMonthly = input.earnings.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const customDeductionsMonthly = input.deductions.reduce(
    (s, c) => s + (Number(c.amount) || 0),
    0,
  );
  const basic = basicAmt(input.earnings);
  const epfMonthly = input.includeEPF ? Math.round(basic * cfg.epfEmployeeRate) : 0;
  const grossAnnual = grossMonthly * 12;

  const taxNew = newRegimeTax(grossAnnual, fy);
  const taxOldNoInv = oldRegimeTax(grossAnnual, 0, fy);
  const tdsMonthly = input.includeTDS ? Math.round(Math.min(taxNew, taxOldNoInv) / 12) : 0;

  const netMonthly = grossMonthly - epfMonthly - tdsMonthly - customDeductionsMonthly;

  const regime = { taxNew, taxOld: taxOldNoInv, newWins: taxNew <= taxOldNoInv };

  const opportunities = evaluateOpportunities({
    basic,
    hra: hraAmt(input.earnings),
    special: specialAmt(input.earnings),
    grossAnnual,
    taxNew,
    taxOldNoInv,
    fy,
    profile: input.profile,
  });
  const totalAnnualSaving = opportunities.reduce((s, o) => s + o.savingValue, 0);

  return {
    grossMonthly,
    grossAnnual,
    epfMonthly,
    tdsMonthly,
    customDeductionsMonthly,
    netMonthly,
    netAnnual: netMonthly * 12,
    regime,
    opportunities,
    totalAnnualSaving,
  };
}

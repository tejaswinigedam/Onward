import type { FiscalYear } from "./constants";

/** A single payslip line (monthly amount). `x` is the explanation/preset key. */
export interface Component {
  name: string;
  amount: number;
  x?: string;
}

export type CityTier = "metro" | "non-metro";

/** Optional profile that unlocks personalised opportunities (see opportunities/). */
export interface Profile {
  role?: string;
  experienceYears?: number;
  cityTier?: CityTier;
  /** Actual monthly rent paid, if any â€” enables real HRA-exemption math. */
  monthlyRent?: number;
  /** Declared old-regime deductions (80C/80D/etc.), annual. */
  declaredDeductions?: number;
}

/** Inputs to a salary computation. Mirrors the legacy client state. */
export interface SalaryInput {
  earnings: Component[];
  deductions: Component[];
  includeEPF: boolean;
  includeTDS: boolean;
  fy?: FiscalYear;
  profile?: Profile;
}

export interface RegimeComparison {
  taxNew: number;
  taxOld: number;
  newWins: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  detail: string;
  /** Human-readable saving label, e.g. "Save â‚¹18,200/yr". */
  savingLabel: string;
  /** Numeric annual â‚¹ saving used for ranking + headline total (0 if unquantified). */
  savingValue: number;
  priority: number;
}

export interface SalaryResult {
  grossMonthly: number;
  grossAnnual: number;
  epfMonthly: number;
  tdsMonthly: number;
  customDeductionsMonthly: number;
  netMonthly: number;
  netAnnual: number;
  regime: RegimeComparison;
  opportunities: Opportunity[];
  totalAnnualSaving: number;
}

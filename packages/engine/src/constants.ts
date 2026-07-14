/**
 * FY-versioned tax & payroll constants.
 *
 * Ported verbatim from the inline logic in the legacy
 * `Onward/salary-demystified.html` (newRegimeTax :515, oldRegimeTax :523,
 * earningsFromCTC :426) so behaviour is provably preserved. When the Union
 * Budget changes slabs/limits, add a new FiscalYear entry — nothing else in
 * the engine hard-codes these numbers.
 */

export type FiscalYear = "FY2025-26";

export const DEFAULT_FY: FiscalYear = "FY2025-26";

/** A progressive tax band: everything up to `upper` (exclusive of the previous
 *  band's ceiling) is taxed at `rate`. The final band uses Infinity. */
export interface TaxBand {
  readonly upper: number;
  readonly rate: number;
}

export interface RegimeRules {
  /** Flat standard deduction applied to gross before slabs. */
  readonly standardDeduction: number;
  /** Taxable income at or below this pays zero (87A rebate ceiling). */
  readonly rebateCeiling: number;
  readonly bands: readonly TaxBand[];
}

export interface FiscalConfig {
  readonly cess: number; // health & education cess multiplier, e.g. 1.04 = 4%
  readonly epfEmployeeRate: number; // employee EPF as a fraction of Basic
  readonly employerPfRate: number; // employer PF as a fraction of Basic (part of CTC)
  readonly ctcBasicShare: number; // Basic as a fraction of monthly CTC
  readonly hraOfBasic: number; // HRA as a fraction of Basic
  readonly section80cLimit: number; // max 80C deduction (old regime)
  readonly newRegime: RegimeRules;
  readonly oldRegime: RegimeRules;
}

export const FISCAL: Record<FiscalYear, FiscalConfig> = {
  "FY2025-26": {
    cess: 1.04,
    epfEmployeeRate: 0.12,
    employerPfRate: 0.12,
    ctcBasicShare: 0.4,
    hraOfBasic: 0.5,
    section80cLimit: 150000,
    newRegime: {
      standardDeduction: 75000,
      rebateCeiling: 1200000,
      bands: [
        { upper: 400000, rate: 0 },
        { upper: 800000, rate: 0.05 },
        { upper: 1200000, rate: 0.1 },
        { upper: 1600000, rate: 0.15 },
        { upper: 2000000, rate: 0.2 },
        { upper: 2400000, rate: 0.25 },
        { upper: Infinity, rate: 0.3 },
      ],
    },
    oldRegime: {
      standardDeduction: 50000,
      rebateCeiling: 500000,
      bands: [
        { upper: 250000, rate: 0 },
        { upper: 500000, rate: 0.05 },
        { upper: 1000000, rate: 0.2 },
        { upper: Infinity, rate: 0.3 },
      ],
    },
  },
};

export function fiscalConfig(fy: FiscalYear = DEFAULT_FY): FiscalConfig {
  const cfg = FISCAL[fy];
  if (!cfg) throw new Error(`Unknown fiscal year: ${fy}`);
  return cfg;
}

/**
 * Role/experience benchmark data driving comparative opportunities.
 * Seeded here as a constant; later this can be sourced from a DB table
 * populated by anonymised computations without any code change.
 */

export interface Benchmark {
  /** Typical variable pay as a fraction of CTC for this band. */
  typicalVariableShare: number;
  /** Typical Basic as a fraction of CTC. */
  typicalBasicShare: number;
}

/** Coarse experience bands keyed by years. */
export function experienceBand(years: number | undefined): "junior" | "mid" | "senior" {
  if (years === undefined) return "mid";
  if (years < 3) return "junior";
  if (years < 8) return "mid";
  return "senior";
}

const BENCHMARKS: Record<string, Benchmark> = {
  junior: { typicalVariableShare: 0.1, typicalBasicShare: 0.4 },
  mid: { typicalVariableShare: 0.15, typicalBasicShare: 0.4 },
  senior: { typicalVariableShare: 0.2, typicalBasicShare: 0.4 },
};

export function benchmarkFor(years: number | undefined): Benchmark {
  return BENCHMARKS[experienceBand(years)] ?? BENCHMARKS.mid!;
}

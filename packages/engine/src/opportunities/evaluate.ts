import type { Opportunity } from "../types";
import { RULES, type EvalContext } from "./rules";

/**
 * Run every rule over the computed context and return the applicable
 * opportunities, ranked by estimated â‚¹ saved (then by declared priority for
 * unquantified tips). This replaces the hardcoded client `buildOpps`.
 */
export function evaluateOpportunities(ctx: EvalContext): Opportunity[] {
  return RULES.filter((r) => r.applies(ctx))
    .map((r) => r.build(ctx))
    .sort((a, b) => b.savingValue - a.savingValue || b.priority - a.priority);
}

export type { EvalContext };

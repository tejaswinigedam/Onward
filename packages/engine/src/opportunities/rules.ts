import { fiscalConfig, type FiscalYear } from "../constants";
import { oldRegimeTax } from "../tax";
import type { Opportunity, Profile } from "../types";
import { benchmarkFor } from "./benchmarks";

/** Everything a rule needs to decide if it applies and how much it saves. */
export interface EvalContext {
  basic: number; // monthly
  hra: number; // monthly
  special: number; // monthly
  grossAnnual: number;
  taxNew: number;
  taxOldNoInv: number;
  fy: FiscalYear;
  profile?: Profile;
}

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/**
 * A declarative opportunity rule. `applies` short-circuits; `build` returns the
 * opportunity (with a numeric saving used for ranking). Rules read the computed
 * context AND the optional profile, which is what makes the set dynamic.
 */
export interface Rule {
  id: string;
  applies: (ctx: EvalContext) => boolean;
  build: (ctx: EvalContext) => Opportunity;
}

export const RULES: Rule[] = [
  // 1. Regime choice — port of buildOpps rule 1 (salary-demystified.html:583).
  {
    id: "regime-choice",
    applies: (ctx) => Math.abs(ctx.taxNew - ctx.taxOldNoInv) >= 500,
    build: (ctx) => {
      const save = Math.abs(ctx.taxNew - ctx.taxOldNoInv);
      const cheaper = ctx.taxNew < ctx.taxOldNoInv ? "new" : "old";
      return {
        id: "regime-choice",
        title: `Pick the ${cheaper} regime`,
        detail: `On these numbers the ${cheaper} regime is cheaper.`,
        savingLabel: `Save ${fmt(save)}/yr`,
        savingValue: save,
        priority: 100,
      };
    },
  },

  // 2. 80C headroom — port of buildOpps rule 2 (:594). Uses declared deductions
  //    if the profile has them, else assumes the full limit is unused.
  {
    id: "80c-headroom",
    applies: (ctx) => {
      const limit = fiscalConfig(ctx.fy).section80cLimit;
      const declared = ctx.profile?.declaredDeductions ?? 0;
      const headroom = Math.max(0, limit - declared);
      return (
        headroom > 0 &&
        ctx.taxOldNoInv - oldRegimeTax(ctx.grossAnnual, headroom, ctx.fy) >= 500
      );
    },
    build: (ctx) => {
      const limit = fiscalConfig(ctx.fy).section80cLimit;
      const declared = ctx.profile?.declaredDeductions ?? 0;
      const headroom = Math.max(0, limit - declared);
      const save = ctx.taxOldNoInv - oldRegimeTax(ctx.grossAnnual, headroom, ctx.fy);
      return {
        id: "80c-headroom",
        title: `Use your ${fmt(headroom)} of 80C headroom`,
        detail:
          "EPF, ELSS, PPF and insurance count — in the old regime this lowers taxable income.",
        savingLabel: `Save up to ${fmt(save)}/yr`,
        savingValue: save,
        priority: 80,
      };
    },
  },

  // 3. HRA claim — port of buildOpps rule 3 (:604). When real rent is known we
  //    compute the actual exemption; otherwise we keep the qualitative nudge.
  {
    id: "hra-claim",
    applies: (ctx) => ctx.hra > 0,
    build: (ctx) => {
      const rent = ctx.profile?.monthlyRent;
      if (rent && rent > 0) {
        // Standard HRA exemption = least of: actual HRA, rent − 10% of basic,
        // and 50% (metro) / 40% (non-metro) of basic. Monthly, then annualised.
        const metro = ctx.profile?.cityTier !== "non-metro";
        const capPct = metro ? 0.5 : 0.4;
        const exemptMonthly = Math.max(
          0,
          Math.min(ctx.hra, rent - 0.1 * ctx.basic, capPct * ctx.basic),
        );
        const exemptAnnual = Math.round(exemptMonthly * 12);
        return {
          id: "hra-claim",
          title: "Claim your HRA exemption",
          detail: `Paying ${fmt(rent)}/mo rent in a ${metro ? "metro" : "non-metro"} city makes about ${fmt(exemptAnnual)}/yr of HRA tax-exempt (old regime).`,
          savingLabel: `${fmt(exemptAnnual)}/yr exempt`,
          savingValue: 0, // exemption, not a direct tax saving figure
          priority: 60,
        };
      }
      return {
        id: "hra-claim",
        title: "Claim HRA if you pay rent",
        detail: `You get ${fmt(ctx.hra)}/mo as HRA. Declaring rent can make a big part of it tax-exempt (old regime).`,
        savingLabel: "Often ₹1,000s/yr",
        savingValue: 0,
        priority: 60,
      };
    },
  },

  // 4. Special-allowance-heavy structure — port of buildOpps rule 4 (:613).
  {
    id: "structure-special-heavy",
    applies: (ctx) => ctx.special > ctx.basic,
    build: () => ({
      id: "structure-special-heavy",
      title: "Your special allowance is high",
      detail:
        "It's fully taxable. Shifting some into Basic or tax-friendly components can help — worth asking HR.",
      savingLabel: "Structure tip",
      savingValue: 0,
      priority: 40,
    }),
  },

  // 5. NEW dynamic rule: variable pay vs role benchmark. Needs profile.
  {
    id: "variable-vs-benchmark",
    applies: (ctx) => {
      if (!ctx.profile) return false;
      const variable = ctx.special; // treat special allowance as the flexible chunk
      const monthlyCtcish = ctx.basic + ctx.hra + ctx.special;
      if (monthlyCtcish <= 0) return false;
      const share = variable / monthlyCtcish;
      return share > benchmarkFor(ctx.profile.experienceYears).typicalVariableShare + 0.05;
    },
    build: (ctx) => {
      const bm = benchmarkFor(ctx.profile?.experienceYears);
      return {
        id: "variable-vs-benchmark",
        title: "Your flexible/variable pay looks high for your band",
        detail: `Typical is around ${Math.round(bm.typicalVariableShare * 100)}% for your experience — a higher fixed split is worth negotiating.`,
        savingLabel: "Negotiation tip",
        savingValue: 0,
        priority: 30,
      };
    },
  },
];

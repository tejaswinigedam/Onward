export * from "./constants";
export * from "./types";
export { newRegimeTax, oldRegimeTax } from "./tax";
export { computeSalary, earningsFromCTC, basicAmt, hraAmt, specialAmt } from "./salary";
export { computeOffer, compareOffers } from "./offer";
export type { OfferInput, OfferResult, OfferComparison } from "./offer";
export { computeOfferBreakdown } from "./breakdown";
export type {
  OfferBreakdown,
  OfferBreakdownInput,
  OfferLine,
  EquityGrant,
  Gate,
  Provenance,
} from "./breakdown";
export { epfCeilingAnnual, professionalTaxAnnual } from "./constants";
export { evaluateOpportunities } from "./opportunities/evaluate";
export { RULES } from "./opportunities/rules";
export type { Rule, EvalContext } from "./opportunities/rules";
export { benchmarkFor, experienceBand } from "./opportunities/benchmarks";
export { extractOffer, parseAmount } from "./extract";
export type { ExtractedOffer } from "./extract";

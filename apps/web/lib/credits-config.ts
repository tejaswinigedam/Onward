/**
 * Config-driven pricing & payment settings for the credits paywall.
 *
 * Per the PRD, prices / credit amounts / offer copy must NOT be hardcoded in
 * components — they live here (and UPI/WhatsApp details are env-overridable) so
 * the beta offer can change without touching UI code.
 */

export type PlanId = "STARTER_149" | "POPULAR_299" | "PRO_499";

export interface Plan {
  id: PlanId;
  /** Short name shown on the plan card. */
  name: string;
  /** Rupee amount charged (encoded into the plan's UPI QR). */
  amount: number;
  /** Credits granted on activation. */
  credits: number;
  /** Optional highlight chip, e.g. "Popular" / "Best value". */
  badge?: string;
  /** Short one-line "who this is for" description shown on plan cards. */
  tagline: string;
}

/** Ordered list of purchasable plans (order = display order on the QR screen). */
export const PLANS: Plan[] = [
  { id: "STARTER_149", name: "Starter", amount: 149, credits: 1, tagline: "Perfect for understanding your first offer or payslip" },
  { id: "POPULAR_299", name: "Popular", amount: 299, credits: 3, badge: "Popular", tagline: "Ideal during job offers and salary negotiations" },
  { id: "PRO_499", name: "Pro", amount: 499, credits: 6, tagline: "For frequent salary reviews, comparisons, and long-term tracking" },
];

export const PLAN_BY_ID: Record<PlanId, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.id, p]),
) as Record<PlanId, Plan>;

export function getPlan(id: string | null | undefined): Plan | undefined {
  return id ? PLAN_BY_ID[id as PlanId] : undefined;
}

/** Effective price per credit, e.g. "₹99.7" — for the pricing table copy. */
export function pricePerCredit(plan: Plan): string {
  const v = plan.amount / plan.credits;
  return `₹${Math.round(v * 10) / 10}`;
}

// ── Free vs paid (single source of truth for pricing/landing/decoder copy) ──
/** What every visitor gets for free — the salary/component breakdown. */
export const FREE_FEATURES = [
  "Full salary & component breakdown — base, HRA, variable, PF",
  "Gross, deductions & your real monthly take-home",
  "Equity / ESOP surfaced separately",
];
/** What 1 credit unlocks — the analysis. */
export const PAID_FEATURES = [
  "Which tax regime is cheaper — old vs new",
  "Money you could save — HRA, 80C & more",
  "Clauses & red flags, in plain English",
  "What to do next + what to confirm with HR",
];
/** How credits map to work — used on the pricing page. */
export const CREDIT_RULE = "1 credit unlocks the full analysis for one run — however many documents you upload together.";

// ── Copy (config-driven, changes post-beta) ────────────────────────────────
export const OFFER_LABEL = "Early bird discounted price";
export const CREDITS_FOOTER = "Want more credits at a discounted price? Contact us.";
export const EDU_DISCLAIMER =
  "Onward is an educational tool. Our analysis is for learning purposes only and is not financial, tax, or legal advice.";

// ── UPI / WhatsApp (env-overridable) ───────────────────────────────────────
export const UPI_VPA = process.env.UPI_VPA ?? "subhranta227742@okicici";
export const UPI_PAYEE = process.env.UPI_PAYEE ?? "Onward";
/** Digits only, country code included, for wa.me / web.whatsapp links. */
export const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? "917008939228";

/** UPI deep link that a payer's app opens; amount is plan-specific. */
export function upiUri(plan: Plan): string {
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: UPI_PAYEE,
    am: String(plan.amount),
    cu: "INR",
    tn: `Onward ${plan.credits} credit${plan.credits > 1 ? "s" : ""}`,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Pre-filled WhatsApp message body (PRD §6). The final quoted line stays
 * exactly as specified.
 */
export function whatsappMessage(name: string, email: string): string {
  return (
    `Hi, ${name} holding email ${email} has made the payment.\n\n` +
    `"You must take screenshot of the payment with Transaction ID clearly visible ` +
    `for us to verify and activate your account with the credits."`
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  PLANS,
  pricePerCredit,
  FREE_FEATURES,
  PAID_FEATURES,
  CREDIT_RULE,
  OFFER_LABEL,
  CREDITS_FOOTER,
  EDU_DISCLAIMER,
} from "@/lib/credits-config";
import "../landing.css";

export const metadata: Metadata = {
  title: "Pricing — Onward",
  description:
    "The salary breakdown is free for everyone. Buy credits to unlock the full analysis — tax regime, savings, clauses and red flags. Early-bird pricing for beta.",
};

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12 9 17 20 6" />
  </svg>
);
const Lock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="13 5 20 12 13 19" />
  </svg>
);

export default function PricingPage() {
  return (
    <div className="onward-landing">
      <SiteHeader />

      <section className="wrap pricing-hero">
        <div className="sec-head">
          <span className="eyebrow">Pricing</span>
          <h2>Pay only for the analysis</h2>
          <p className="sec-sub">
            The salary breakdown is <strong>free for everyone</strong> — no account needed. Buy credits
            to unlock the deeper analysis. No subscription; credits don&apos;t expire.
          </p>
        </div>
      </section>

      {/* What's free vs paid */}
      <section className="wrap pricing-split">
        <div className="pcol pcol-free">
          <div className="pcol-head"><span className="ptag free">Always free</span></div>
          <ul>
            {FREE_FEATURES.map((f) => <li key={f}><span className="pi free"><Check /></span>{f}</li>)}
          </ul>
        </div>
        <div className="pcol pcol-paid">
          <div className="pcol-head"><span className="ptag paid"><Lock /> Unlocked with 1 credit</span></div>
          <ul>
            {PAID_FEATURES.map((f) => <li key={f}><span className="pi paid"><Lock /></span>{f}</li>)}
          </ul>
        </div>
      </section>

      <p className="wrap credit-rule">{CREDIT_RULE}</p>

      {/* Plans */}
      <section className="wrap plans-section">
        <p className="plans-offer">{OFFER_LABEL}</p>
        <div className="plans-grid">
          {PLANS.map((p) => (
            <div className={`plan-tile${p.badge ? " featured" : ""}`} key={p.id}>
              {p.badge && <span className="plan-tile-badge">{p.badge}</span>}
              <span className="plan-tile-name">{p.name}</span>
              <span className="plan-tile-price">₹{p.amount}</span>
              <span className="plan-tile-credits">{p.credits} credit{p.credits > 1 ? "s" : ""}</span>
              <span className="plan-tile-per">{pricePerCredit(p)} / credit</span>
              <Link href="/offer" className="btn btn-accent plan-tile-cta" data-ev="pricing_plan" data-ev-label={p.id}>
                Get started <ArrowRight />
              </Link>
            </div>
          ))}
        </div>
        <p className="plans-foot">{CREDITS_FOOTER}</p>
      </section>

      <section className="wrap pricing-cta">
        <h2>See it on your own document first</h2>
        <p className="sec-sub">Upload an offer or payslip and get the full breakdown free — decide on the analysis after.</p>
        <Link href="/offer" className="btn btn-accent btn-lg" data-ev="cta_click" data-ev-label="pricing_try">
          Try Pay Decoder <ArrowRight />
        </Link>
        <p className="pricing-disclaimer">{EDU_DISCLAIMER}</p>
      </section>

      <SiteFooter />
    </div>
  );
}

"use client";
import { useState } from "react";
import { PayFlow } from "@/components/PayFlow";
import { PLANS, pricePerCredit, type PlanId } from "@/lib/credits-config";

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" />
  </svg>
);

/**
 * Pricing plan tiles. "Get started" begins the purchase for that plan (QR →
 * Payment Done → WhatsApp) rather than sending the user off to the decoder.
 */
export function PricingPlans({ signedIn }: { signedIn: boolean }) {
  const [plan, setPlan] = useState<PlanId | null>(null);

  return (
    <>
      <div className="plans-grid">
        {PLANS.map((p) => (
          <div className={`plan-tile${p.badge ? " featured" : ""}`} key={p.id}>
            {p.badge && <span className="plan-tile-badge">{p.badge}</span>}
            <span className="plan-tile-name">{p.name}</span>
            <span className="plan-tile-price">₹{p.amount}</span>
            <span className="plan-tile-credits">{p.credits} credit{p.credits > 1 ? "s" : ""}</span>
            <span className="plan-tile-per">{pricePerCredit(p)} / credit</span>
            <button
              className="btn btn-accent plan-tile-cta"
              onClick={() => setPlan(p.id)}
              data-ev="pricing_plan"
              data-ev-label={p.id}
            >
              Get started <ArrowRight />
            </button>
          </div>
        ))}
      </div>

      {plan && (
        <div className="pay-modal-backdrop" onClick={() => setPlan(null)}>
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <PayFlow
              signedIn={signedIn}
              initialPlan={plan}
              onClose={() => setPlan(null)}
              onActivated={() => setPlan(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

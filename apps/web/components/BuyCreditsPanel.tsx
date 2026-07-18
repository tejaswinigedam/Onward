"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayFlow } from "./PayFlow";
import { PLANS, pricePerCredit, OFFER_LABEL, type PlanId } from "@/lib/credits-config";

/**
 * "Buy credits" with the pricing plans inline. Picking a plan opens the QR
 * purchase flow preset to that plan, so a user can buy straight from their
 * dashboard without going through the decoder.
 *
 * `compact` renders the slimmer prompt used once a user already has credits.
 */
export function BuyCreditsPanel({ compact = false }: { compact?: boolean }) {
  const [plan, setPlan] = useState<PlanId | null>(null);
  const router = useRouter();

  const close = () => setPlan(null);
  const activated = () => {
    setPlan(null);
    router.refresh(); // pick up a new balance if it was activated meanwhile
  };

  if (compact) {
    return (
      <>
        <div className="acct-buy">
          <p className="acct-buy-txt">Running low? Top up your credits — from ₹149.</p>
          <button className="btn btn-accent" onClick={() => setPlan(PLANS[1].id)} data-ev="dash_buy_more">
            Buy credits
          </button>
        </div>
        {plan && <PayModal plan={plan} onClose={close} onActivated={activated} />}
      </>
    );
  }

  return (
    <>
      <section className="acct-sec dash-buy">
        <h2 className="acct-h2">Buy credits to unlock your analysis</h2>
        <p className="acct-lead">
          Uploading and your salary breakdown are always free. A credit unlocks the full
          analysis — tax regime, savings, clauses and what to ask HR.
        </p>
        <p className="dash-offer">{OFFER_LABEL}</p>
        <div className="dash-plans">
          {PLANS.map((p) => (
            <button
              key={p.id}
              className={`dash-plan${p.badge ? " featured" : ""}`}
              onClick={() => setPlan(p.id)}
              data-ev="dash_plan"
              data-ev-label={p.id}
            >
              {p.badge && <span className="dash-plan-badge">{p.badge}</span>}
              <span className="dash-plan-name">{p.name}</span>
              <span className="dash-plan-price">₹{p.amount}</span>
              <span className="dash-plan-credits">{p.credits} credit{p.credits > 1 ? "s" : ""}</span>
              <span className="dash-plan-per">{pricePerCredit(p)} / credit</span>
              <span className="dash-plan-cta">Buy</span>
            </button>
          ))}
        </div>
        <Link href="/pricing" className="dash-pricing-link">See what each credit unlocks →</Link>
      </section>
      {plan && <PayModal plan={plan} onClose={close} onActivated={activated} />}
    </>
  );
}

function PayModal({ plan, onClose, onActivated }: { plan: PlanId; onClose: () => void; onActivated: () => void }) {
  return (
    <div className="pay-modal-backdrop" onClick={onClose}>
      <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
        {/* Signed-in is implied: this panel only renders on the dashboard. */}
        <PayFlow signedIn onClose={onClose} onActivated={onActivated} initialPlan={plan} />
      </div>
    </div>
  );
}

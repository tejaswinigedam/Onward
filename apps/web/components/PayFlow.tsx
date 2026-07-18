"use client";
import { useState } from "react";
import {
  PLANS,
  getPlan,
  pricePerCredit,
  OFFER_LABEL,
  CREDITS_FOOTER,
  EDU_DISCLAIMER,
  type PlanId,
} from "@/lib/credits-config";

/**
 * QR purchase flow: pick a plan → scan the amount-specific UPI QR → Payment Done
 * (logs the request + opens WhatsApp) → waiting screen. Shared by the decoder's
 * unlock paywall and the dashboard's "Buy credits" panel.
 */
export function PayFlow({
  signedIn,
  onClose,
  onActivated,
  initialPlan,
}: {
  signedIn: boolean;
  onClose: () => void;
  onActivated: () => void;
  /** Preselect a plan (e.g. the tile the user clicked). Defaults to "Popular". */
  initialPlan?: PlanId;
}) {
  const [planId, setPlanId] = useState<PlanId>(initialPlan ?? PLANS[1].id);
  const [step, setStep] = useState<"qr" | "done">("qr");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Kept so the waiting screen can re-open WhatsApp WITHOUT logging another
  // request (the request is already recorded — server-side dedup also guards it).
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const plan = getPlan(planId)!;

  function openWhatsApp(url: string) {
    window.open(url, "_blank", "noopener");
  }

  async function paymentDone() {
    if (!signedIn) {
      const back = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/offer";
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(back)}`;
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      // Open WhatsApp: desktop → web.whatsapp.com; mobile → app via wa.me.
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const url = isMobile ? json.whatsapp.waMeUrl : json.whatsapp.webUrl;
      setWaUrl(url);
      openWhatsApp(url);
      setStep("done");
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  if (step === "done") {
    return (
      <div className="upload-card wait-card">
        <button type="button" className="modal-close-x" onClick={onActivated} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="paywall-head">
          <span className="paywall-credits ok">✓ Request sent</span>
          <p className="um-t">Almost done</p>
          <p className="um-s">Make sure to share the transaction screenshot. Then you are done.</p>
        </div>

        <div className="wait-panel">
          <p className="wait-relax">
            Sit back and relax while our team verifies the payment. Once done,
            you&apos;ll be notified and your account will receive the credits.
          </p>
        </div>

        {/* Retry is ONLY for the failure case: WhatsApp never opened / message not sent.
            It re-opens the same chat and does NOT create a new request. */}
        {waUrl && (
          <button className="pay-now-btn ghost" onClick={() => openWhatsApp(waUrl)}>
            Failed to send the WhatsApp message? Try Again
          </button>
        )}
        <p className="paywall-disclaimer">{EDU_DISCLAIMER}</p>
      </div>
    );
  }

  return (
    <div className="upload-card">
      <button className="decoder-back" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="12" x2="4" y2="12" />
          <polyline points="11 19 4 12 11 5" />
        </svg>
        Back
      </button>

      <p className="um-t" style={{ textAlign: "center" }}>Scan &amp; pay with any UPI app</p>
      <p className="offer-tag">{OFFER_LABEL}</p>

      <div className="qr-wrap">
        {/* Amount-specific QR; swaps when the plan changes. */}
        <img
          key={planId}
          className="qr-img"
          src={`/api/upi-qr?plan=${planId}`}
          alt={`UPI QR for ${plan.name} — ₹${plan.amount}`}
          width={216}
          height={216}
        />
        <p className="qr-amount">₹{plan.amount} · {plan.credits} credit{plan.credits > 1 ? "s" : ""}</p>
      </div>

      <div className="plan-grid">
        {PLANS.map((p) => (
          <button
            key={p.id}
            className={`plan-card${p.id === planId ? " selected" : ""}`}
            onClick={() => setPlanId(p.id)}
          >
            {p.badge && <span className="plan-badge">{p.badge}</span>}
            <span className="plan-name">{p.name}</span>
            <span className="plan-price">₹{p.amount}</span>
            <span className="plan-credits">{p.credits} credit{p.credits > 1 ? "s" : ""}</span>
            <span className="plan-per">{pricePerCredit(p)}/credit</span>
          </button>
        ))}
      </div>

      {error && <p className="opp-none" style={{ color: "var(--amber-d)" }}>{error}</p>}

      <button className="pay-now-btn" disabled={busy} onClick={paymentDone} data-ev="payment_done">
        {busy ? "Logging…" : signedIn ? "Payment Done" : "Sign in to continue"}
      </button>
      <p className="paywall-foot">{CREDITS_FOOTER}</p>
      <p className="paywall-disclaimer">{EDU_DISCLAIMER}</p>
    </div>
  );
}

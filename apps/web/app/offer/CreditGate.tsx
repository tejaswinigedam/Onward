"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { DecoderUpload } from "./DecoderUpload";
import type { DecoderModeConfig } from "./decoder-modes";
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
 * Credit-gated upload (PRD §4–5). Browsing is open; analysis needs ≥1 credit.
 * 0 credits → paywall → QR screen → Payment Done (login required) → WhatsApp
 * handoff + next steps. Each successful analysis spends a credit server-side;
 * we refetch the balance after each run.
 */
export function CreditGate({ mode }: { mode: DecoderModeConfig }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [showPay, setShowPay] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/credits", { cache: "no-store" });
      const json = await res.json();
      setBalance(typeof json.balance === "number" ? json.balance : 0);
    } catch {
      setBalance(0);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) void refresh();
  }, [isLoaded, refresh]);

  if (!isLoaded || balance === null) {
    return <div className="upload-card"><p className="um-s">Loading…</p></div>;
  }

  if (showPay) {
    return (
      <PayFlow
        signedIn={Boolean(isSignedIn)}
        onClose={() => setShowPay(false)}
        onActivated={() => {
          setShowPay(false);
          void refresh();
        }}
      />
    );
  }

  if (balance <= 0) {
    return (
      <div className="upload-card">
        <div className="paywall-head">
          <span className="paywall-credits">Available credits: 0</span>
          <p className="um-t">Make a payment to analyze</p>
          <p className="um-s">
            Browsing is free. Running an analysis costs 1 credit — buy credits to
            decode {mode.multi ? "your documents" : "your document"}.
          </p>
        </div>
        <button className="pay-now-btn" onClick={() => setShowPay(true)} data-ev="pay_now">
          Pay Now
        </button>
        <p className="paywall-disclaimer">{EDU_DISCLAIMER}</p>
      </div>
    );
  }

  // Has credits → allow upload, cap in-flight files to the balance, refetch after each run.
  return (
    <div>
      <div className="credit-badge-row">
        <span className="credit-badge">{balance} credit{balance === 1 ? "" : "s"} left</span>
        <button className="credit-buy-link" onClick={() => setShowPay(true)}>Buy more</button>
      </div>
      <DecoderUpload mode={mode} maxQueueable={balance} onExtracted={refresh} />
    </div>
  );
}

// ── Payment flow: QR screen → Payment Done → next steps ─────────────────────

function PayFlow({
  signedIn,
  onClose,
  onActivated,
}: {
  signedIn: boolean;
  onClose: () => void;
  onActivated: () => void;
}) {
  const [planId, setPlanId] = useState<PlanId>(PLANS[1].id); // default to "Popular"
  const [step, setStep] = useState<"qr" | "done">("qr");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = getPlan(planId)!;

  async function paymentDone() {
    if (!signedIn) {
      // Preserve where they are; return to the tool after sign-in.
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
      window.open(isMobile ? json.whatsapp.waMeUrl : json.whatsapp.webUrl, "_blank", "noopener");
      setStep("done");
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  if (step === "done") {
    return (
      <div className="upload-card">
        <div className="paywall-head">
          <span className="paywall-credits ok">Payment logged</span>
          <p className="um-t">One last step</p>
          <p className="um-s">
            Send the pre-filled WhatsApp message and <strong>attach a screenshot of your
            payment showing the Transaction ID</strong>. We&apos;ll verify and activate your
            credits, usually within a few hours.
          </p>
          <p className="um-s" style={{ marginTop: 10 }}>
            Didn&apos;t open? WhatsApp <strong>+91 70089 39228</strong> with your payment
            screenshot.
          </p>
        </div>
        <button className="pay-now-btn ghost" onClick={onActivated}>Done</button>
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

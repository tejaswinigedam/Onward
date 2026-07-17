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
  // Latch: once this session has held credits and entered the upload view, stay
  // there even after the balance hits 0 — so spending the LAST credit still shows
  // that analysis instead of snapping back to the paywall and hiding the result.
  // Only a real reset (page reload, or leaving and returning) clears this.
  const [started, setStarted] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/credits", { cache: "no-store" });
      const json = await res.json();
      const b = typeof json.balance === "number" ? json.balance : 0;
      if (b >= 1) setStarted(true);
      setBalance(b);
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

  // Paywall only before a working session starts. Once latched (started), we keep
  // the upload view even at 0 balance so the last result stays on screen.
  if (balance <= 0 && !started) {
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

  // Working view. Balance may be 0 here (last credit just spent) — the results
  // stay visible; uploads are capped to the balance so no further run is allowed
  // until they buy more.
  const empty = balance <= 0;
  return (
    <div>
      <div className="credit-badge-row">
        <span className={`credit-badge${empty ? " empty" : ""}`}>
          {balance} credit{balance === 1 ? "" : "s"} left
        </span>
        <button className="credit-buy-link" onClick={() => setShowPay(true)}>
          {empty ? "Buy credits" : "Buy more"}
        </button>
      </div>
      {empty && (
        <p className="credit-empty-note">
          You&apos;ve used all your credits — your latest analysis is below. Buy more to run another.
        </p>
      )}
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
  // Kept so the waiting screen can re-open WhatsApp WITHOUT logging another
  // request (the request is already recorded — server-side dedup also guards it).
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const plan = getPlan(planId)!;

  function openWhatsApp(url: string) {
    window.open(url, "_blank", "noopener");
  }

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
      <div className="upload-card">
        <div className="paywall-head">
          <span className="paywall-credits ok">✓ Request received</span>
          <p className="um-t">Almost done</p>
          <p className="um-s">
            Make sure to share the transaction screenshot. Then you are done.
          </p>
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
        <button className="wait-close" onClick={onActivated}>Close</button>
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

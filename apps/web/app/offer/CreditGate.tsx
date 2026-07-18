"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { DecoderUpload } from "./DecoderUpload";
import type { DecoderModeConfig } from "./decoder-modes";
import { PayFlow } from "@/components/PayFlow";

/**
 * Freemium gate. Uploading and the salary/component breakdown require a free
 * account — {@link SignInGate} blocks the upload UI until the user signs in.
 * The analysis half of each report is locked separately and costs 1 credit to
 * unlock ({@link DecoderUpload} handles the per-report unlock). A 0-credit
 * unlock opens the QR pay flow (Payment Done → WhatsApp handoff); coming back
 * to the same report, the lock stays until the user clicks Unlock again —
 * at that point, if the credit has landed, it unlocks immediately.
 */
export function CreditGate({ mode }: { mode: DecoderModeConfig }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [balance, setBalance] = useState(0);
  const [showPay, setShowPay] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/credits", { cache: "no-store" });
      const json = await res.json();
      setBalance(typeof json.balance === "number" ? json.balance : 0);
    } catch {
      /* leave balance as-is */
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) void refresh();
  }, [isLoaded, isSignedIn, refresh]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <SignInGate />;

  return (
    <div>
      {balance > 0 && (
        <div className="credit-badge-row">
          <span className="credit-badge">{balance} credit{balance === 1 ? "" : "s"} left</span>
          <button className="credit-buy-link" onClick={() => setShowPay(true)}>Buy more</button>
        </div>
      )}

      <DecoderUpload
        mode={mode}
        signedIn
        credits={balance}
        onUnlocked={refresh}
        onNeedPayment={() => setShowPay(true)}
      />

      {showPay && (
        <div className="pay-modal-backdrop" onClick={() => setShowPay(false)}>
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <PayFlow
              signedIn
              onClose={() => setShowPay(false)}
              onActivated={() => {
                setShowPay(false);
                void refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Blocks the upload UI until the user signs in — no document is read before that. */
function SignInGate() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const qs = sp.toString();
  const backUrl = qs ? `${pathname}?${qs}` : pathname;
  const redirect = encodeURIComponent(backUrl);

  return (
    <div className="lock-card">
      <div className="lock-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </div>
      <p className="lock-title">Sign in to upload your document</p>
      <p className="lock-hint" style={{ marginTop: 0 }}>
        Create a free account (or sign in) to upload your offer letter or payslip and see your
        breakdown.
      </p>
      <Link href={`/sign-in?redirect_url=${redirect}`} className="lock-btn" data-ev="decoder_gate_signin">
        Sign in to continue
      </Link>
      <p className="lock-hint">
        New here? <Link href={`/sign-up?redirect_url=${redirect}`}>Create an account</Link>
      </p>
    </div>
  );
}

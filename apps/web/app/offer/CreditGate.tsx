"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { DecoderUpload } from "./DecoderUpload";
import type { DecoderModeConfig } from "./decoder-modes";
import { PayFlow } from "@/components/PayFlow";

/**
 * Freemium gate. The caller (PayDecoder's ModeFlowGate) only ever mounts this
 * once the user is signed in — sign-in is gated a level up, before any mode
 * content (not just the upload) is shown to an anonymous visitor. The analysis
 * half of each report is locked separately and costs 1 credit to unlock
 * ({@link DecoderUpload} handles the per-report unlock). A 0-credit unlock
 * opens the QR pay flow (Payment Done → WhatsApp handoff); coming back to the
 * same report, the lock stays until the user clicks Unlock again — at that
 * point, if the credit has landed, it unlocks immediately.
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

"use client";
import { useEffect } from "react";

/**
 * Runs once on the account page after a user is signed in: if a referral code
 * was captured at sign-up, attribute it now, then clear it. Renders nothing.
 */
export function ReferralClaimer() {
  useEffect(() => {
    let code: string | null = null;
    try {
      code = localStorage.getItem("onward_ref");
    } catch {
      return;
    }
    if (!code) return;
    fetch("/api/referral/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .catch(() => {})
      .finally(() => {
        try {
          localStorage.removeItem("onward_ref");
        } catch {
          /* ignore */
        }
      });
  }, []);
  return null;
}

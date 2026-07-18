"use client";
import { useEffect } from "react";

/**
 * Captures a `?ref=CODE` on the sign-up page and stashes it in localStorage, so
 * that after the new user first authenticates {@link ReferralClaimer} can attribute
 * the sign-up to the referrer. Renders nothing.
 */
export function RefCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("onward_ref", ref);
    } catch {
      /* storage blocked — referral just won't be attributed */
    }
  }, []);
  return null;
}

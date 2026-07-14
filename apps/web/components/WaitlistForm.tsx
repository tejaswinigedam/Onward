"use client";
import { useState } from "react";

/** Posts to our own /api/waitlist (replaces the legacy Apps Script webhook). */
export function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="cta-success show" role="status">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#4ADE80" strokeWidth="1.6" />
          <path d="M6 10.2l2.6 2.6L14 7.4" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        You&apos;re on the list! We&apos;ll be in touch.
      </div>
    );
  }

  return (
    <>
      <form className="cta-form" onSubmit={onSubmit}>
        <input
          className="cta-input"
          type="email"
          name="email"
          placeholder="your@email.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="cta-btn" disabled={status === "loading"}>
          {status === "loading" ? "Joining…" : status === "error" ? "Try again" : "Join Waitlist"}
        </button>
      </form>
      <p className="cta-note">No spam. Just a heads-up when we launch.</p>
    </>
  );
}

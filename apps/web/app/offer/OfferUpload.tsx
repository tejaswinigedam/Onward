"use client";
import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  computeOffer,
  computeSalary,
  earningsFromCTC,
  type ExtractedOffer,
} from "@onward/engine";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");

export function OfferUpload() {
  const { isLoaded, isSignedIn } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [ctc, setCtc] = useState(0);
  const [variablePct, setVariablePct] = useState(0);
  const [notice, setNotice] = useState<number | undefined>();
  const [warnings, setWarnings] = useState<string[]>([]);

  if (clerkEnabled && isLoaded && !isSignedIn) {
    return (
      <div className="upload-card">
        <p className="um-t">Upload your offer letter</p>
        <p className="um-s"><a href="/sign-in" style={{ color: "var(--indigo)", fontWeight: 700 }}>Sign in</a> to upload a PDF and get it decoded automatically.</p>
      </div>
    );
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("reading");
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/offer/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't read that file.");
        setStatus("error");
        return;
      }
      const ex = json.extracted as ExtractedOffer;
      setCtc(ex.annualCTC ?? 0);
      setVariablePct(Number(((ex.variableShare ?? 0) * 100).toFixed(1)));
      setNotice(ex.noticePeriodDays);
      setWarnings(ex.warnings ?? []);
      setStatus("done");
    } catch {
      setError("Upload failed. Try again.");
      setStatus("error");
    }
  }

  const hasResult = status === "done" && ctc > 0;
  const offer = hasResult
    ? computeOffer({ label: "Your offer", annualCTC: ctc, variableShare: variablePct / 100 })
    : null;
  const opps = hasResult
    ? computeSalary({
        earnings: earningsFromCTC(offer!.fixedAnnual),
        deductions: [{ name: "Professional tax", amount: 200, x: "pt" }],
        includeEPF: true,
        includeTDS: true,
      }).opportunities
    : [];

  return (
    <div className="upload-card">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={onFile}
      />
      <div className="upload-drop" onClick={() => fileRef.current?.click()}>
        <svg width="38" height="38" viewBox="0 0 42 42" fill="none">
          <rect x="8" y="5" width="26" height="32" rx="4" stroke="var(--ink-mute)" strokeWidth="1.6" />
          <path d="M14 14h14M14 19h14M14 24h9" stroke="var(--border-s)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="31" cy="31" r="9" fill="var(--indigo)" />
          <path d="M31 35v-8M27.5 30.5L31 27l3.5 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="um-t">{status === "reading" ? "Reading your offer…" : "Drop your offer letter PDF"}</p>
        <p className="um-s">Text-based PDF · decoded on our server · never stored</p>
      </div>

      {error && <p className="opp-none" style={{ color: "var(--coral-d)" }}>{error}</p>}

      {hasResult && offer && (
        <div style={{ marginTop: 18 }}>
          <p className="slip-group-label">Read from your file — correct anything</p>
          <div className="offer-wrap" style={{ gridTemplateColumns: "1fr" }}>
            <div className="offer-card win">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label className="offer-field" style={{ flex: 1 }}>
                  Annual CTC (₹)
                  <input type="number" value={ctc} onChange={(e) => setCtc(Number(e.target.value) || 0)} />
                </label>
                <label className="offer-field" style={{ flex: 1 }}>
                  Variable / at-risk (%)
                  <input type="number" value={variablePct} onChange={(e) => setVariablePct(Number(e.target.value) || 0)} />
                </label>
              </div>
              <div className="offer-out">
                <div className="offer-out-row"><span>Fixed pay</span><b>{inr(offer.fixedAnnual)}</b></div>
                <div className="offer-out-row"><span>Guaranteed take-home / mo</span><b>{inr(offer.netMonthly)}</b></div>
                <div className="offer-out-row"><span>In hand / year</span><b>{inr(offer.netAnnualGuaranteed)}</b></div>
                {notice != null && (
                  <div className="offer-out-row"><span>Notice period</span><b>{notice} days</b></div>
                )}
              </div>
            </div>
          </div>

          {opps.length > 0 && (
            <div className="opps" style={{ marginTop: 16 }}>
              <div className="opps-h">★ Opportunities we spotted</div>
              {opps.map((o) => (
                <div className="opp" key={o.id}>
                  <span className="opp-txt"><strong>{o.title}</strong>{o.detail}</span>
                  <span className="opp-save">{o.savingLabel}</span>
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <p className="calc-note" style={{ textAlign: "left" }}>
              {warnings.join(" ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

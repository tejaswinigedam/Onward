"use client";
import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { track } from "@/lib/analytics";
import { GlossaryProvider, GlossaryPanel, Term } from "@/components/Glossary";
import type { OfferAnalysis } from "@/lib/offer-analysis";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");

export function OfferUpload() {
  const { isLoaded, isSignedIn } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState<OfferAnalysis | null>(null);

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
    setA(null);
    track("offer_upload_start", { size_kb: Math.round(file.size / 1024) });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/offer/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't read that file.");
        setStatus("error");
        track("offer_upload_error", { status: res.status });
        return;
      }
      setA(json.analysis as OfferAnalysis);
      setStatus("done");
      track("offer_upload_success", { via: json.via ?? "unknown" });
    } catch {
      setError("Upload failed. Try again.");
      setStatus("error");
      track("offer_upload_error", { status: 0 });
    }
  }

  return (
    <div className="upload-card">
      <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={onFile} />
      <div className="upload-drop" onClick={() => fileRef.current?.click()}>
        <svg width="38" height="38" viewBox="0 0 42 42" fill="none">
          <rect x="8" y="5" width="26" height="32" rx="4" stroke="var(--ink-mute)" strokeWidth="1.6" />
          <path d="M14 14h14M14 19h14M14 24h9" stroke="var(--border-s)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="31" cy="31" r="9" fill="var(--indigo)" />
          <path d="M31 35v-8M27.5 30.5L31 27l3.5 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="um-t">{status === "reading" ? "Decoding your offer… (up to a minute)" : "Drop your offer letter PDF"}</p>
        <p className="um-s">Decoded on our server · never stored</p>
      </div>

      {error && <p className="opp-none" style={{ color: "var(--coral-d)" }}>{error}</p>}

      {status === "done" && a && (
        <GlossaryProvider>
        <div className="rep">
          <p className="rep-hint">Tap any <span className="rep-hint-term">underlined term</span> to see what it means.</p>
          {/* headline */}
          <div className="rep-top">
            <div className="rep-stat"><div className="l"><Term>Annual CTC</Term></div><div className="v">{inr(a.annualCTC)}</div></div>
            <div className="rep-stat"><div className="l"><Term k="fixed">Fixed (guaranteed)</Term></div><div className="v">{inr(a.fixedAnnual)}</div></div>
            <div className="rep-stat"><div className="l"><Term k="variable">Variable / at-risk</Term></div><div className="v">{(a.variableShare * 100).toFixed(1)}%</div></div>
          </div>

          {/* salary breakdown */}
          <div className="rep-card">
            <div className="rep-h">Monthly salary breakdown</div>
            {a.components.map((c, i) => (
              <div className="rep-row" key={i}><span><Term>{c.name}</Term></span><b>{inr(c.amount)}</b></div>
            ))}
            <div className="rep-row" style={{ fontWeight: 700 }}><span><Term k="gross">Gross (monthly)</Term></span><b>{inr(a.grossMonthly)}</b></div>
            <div className="rep-row deduct"><span><Term k="epf">EPF — your 12%</Term></span><b>− {inr(a.epfMonthly)}</b></div>
            <div className="rep-row deduct"><span><Term k="tds">TDS — income tax</Term></span><b>− {inr(a.tdsMonthly)}</b></div>
            <div className="rep-row total"><span><Term k="takehome">Take-home / month</Term></span><b>{inr(a.netMonthly)}</b></div>
            <div className="rep-row"><span><Term k="takehome">In hand / year (fixed)</Term></span><b>{inr(a.netAnnual)}</b></div>
          </div>

          {/* regime */}
          <div className="rep-card">
            <div className="rep-h"><Term k="regime">Tax regime</Term> — pick the cheaper</div>
            <div className="regime">
              <div className={`regime-card${a.regime.newWins ? " win" : ""}`}>
                <div className="regime-lbl"><Term k="regime">New regime</Term></div><div className="regime-val">{inr(a.regime.taxNew)}</div>
                {a.regime.newWins && <span className="regime-tag">✓ Lower</span>}
              </div>
              <div className={`regime-card${!a.regime.newWins ? " win" : ""}`}>
                <div className="regime-lbl"><Term k="regime">Old regime</Term></div><div className="regime-val">{inr(a.regime.taxOld)}</div>
                {!a.regime.newWins && <span className="regime-tag">✓ Lower</span>}
              </div>
            </div>
          </div>

          {/* opportunities */}
          {a.opportunities.length > 0 && (
            <div className="opps">
              <div className="opps-h">★ Money you could save</div>
              {a.opportunities.map((o) => (
                <div className="opp" key={o.id}>
                  <span className="opp-txt"><strong>{o.title}</strong>{o.detail}</span>
                  <span className="opp-save">{o.savingLabel}</span>
                </div>
              ))}
            </div>
          )}

          {/* clauses */}
          {a.clauses.length > 0 && (
            <div className="rep-card">
              <div className="rep-h">Clauses, in plain English</div>
              {a.clauses.map((c, i) => (
                <div className={`clause ${c.flag}`} key={i}>
                  <div className="clause-head">
                    <span className="clause-title"><Term>{c.title}</Term></span>
                    <span className={`clause-flag ${c.flag}`}>{c.flag}</span>
                  </div>
                  <div className="clause-exp">{c.explanation}</div>
                  {c.action && <div className="clause-action"><b>Do this:</b> {c.action}</div>}
                </div>
              ))}
            </div>
          )}

          {/* actions */}
          {a.actions.length > 0 && (
            <div className="rep-card">
              <div className="rep-h">What to do after reading this offer</div>
              <ul className="rep-actions">
                {a.actions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {a.warnings.length > 0 && <p className="rep-warn">{a.warnings.join(" ")}</p>}
        </div>
        <GlossaryPanel />
        </GlossaryProvider>
      )}
    </div>
  );
}

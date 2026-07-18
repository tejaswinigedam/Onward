import type { ReactNode } from "react";
import type { OfferAnalysis } from "@/lib/offer-analysis";
import type { OfferLine, Provenance } from "@onward/engine";
import { Term } from "@/components/Glossary";

/**
 * A collapsible report section. Uses native <details>/<summary> so it's
 * accordion-like on mobile (less scroll) with zero JS state — `open` only
 * sets the initial state, the browser handles toggling from then on.
 */
function Section({ title, defaultOpen = true, children }: { title: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="rep-card rep-acc" open={defaultOpen}>
      <summary className="rep-h">{title}</summary>
      <div className="rep-acc-body">{children}</div>
    </details>
  );
}

const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");

/** A small provenance tag. Stated values render nothing (they're authoritative). */
function Badge({ source }: { source: Provenance }) {
  if (source === "stated") return null;
  const label = source === "estimated" ? "estimated" : "assumed";
  const color = source === "estimated" ? "var(--coral-d, #c0392b)" : "var(--amber-d, #b7791f)";
  return (
    <span
      style={{
        marginLeft: 6,
        fontSize: "0.62rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        color,
        border: `1px solid ${color}`,
        borderRadius: 4,
        padding: "1px 4px",
        verticalAlign: "middle",
      }}
    >
      {label}
    </span>
  );
}

const termKey = (l: OfferLine) =>
  l.x === "epf" ? "epf" : l.x === "tds" ? "tds" : l.x === "pt" ? "pt" : undefined;

export interface LockProps {
  /** When true, the analysis sections are withheld and a lock panel shows instead. */
  locked?: boolean;
  /** Panel heading; defaults to "Unlock the full analysis". */
  title?: string;
  /** Bullet list of what unlocking reveals; has a sensible default. */
  items?: string[];
  /** Label for the unlock button (varies by sign-in / credit state). */
  unlockLabel?: string;
  /** Sub-line under the unlock button (e.g. "1 credit" / "You have 2 credits"). */
  unlockHint?: string;
  unlockBusy?: boolean;
  unlockError?: string | null;
  onUnlock?: () => void;
}

const DEFAULT_LOCK_ITEMS = [
  "Which tax regime is cheaper for you",
  "Money you could save (HRA, 80C & more)",
  "Clauses & red flags in plain English",
  "What to do — and what to confirm with HR",
];

/** The decoded report for a single offer. Shared by single- and multi-upload. */
export function OfferReport({ a, lock }: { a: OfferAnalysis; lock?: LockProps }) {
  const locked = Boolean(lock?.locked);
  return (
    <div className="rep">
      {/* headline */}
      <div className="rep-top">
        <div className="rep-stat"><div className="l"><Term k="ctc">Annual CTC</Term></div><div className="v">{inr(a.annualCTC)}</div></div>
        <div className="rep-stat"><div className="l"><Term k="fixed">Fixed (guaranteed)</Term></div><div className="v">{inr(a.fixedAnnual)}</div></div>
        <div className="rep-stat"><div className="l"><Term k="variable">Variable / at-risk (cash)</Term></div><div className="v">{(a.variableShare * 100).toFixed(1)}%</div></div>
      </div>

      {/* equity (ESOP/RSU) — surfaced separately, never blended into the cash % */}
      {a.equity.length > 0 && (
        <Section title="Equity / ESOP — on top of CTC">
          {a.equity.map((e, i) => (
            <div className="rep-row" key={i}>
              <span>
                {e.name}
                {e.discretionary && <Badge source="estimated" />}
              </span>
              <b>{inr(e.value)}</b>
            </div>
          ))}
          {a.equity.some((e) => e.vesting) && (
            <p className="rep-hint" style={{ marginTop: 6 }}>
              Vesting: {a.equity.map((e) => e.vesting).filter(Boolean).join("; ")}
              {a.equity.some((e) => e.discretionary) && " · discretionary — not guaranteed"}
            </p>
          )}
        </Section>
      )}

      {/* missing-breakup banner */}
      {!a.breakupStated && (
        <div className="rep-warn" style={{ marginBottom: 12 }}>
          We couldn't find a component-wise salary split in this letter. The breakdown below is
          <b> estimated</b> from the CTC — confirm the exact figures with HR before relying on them.
        </div>
      )}

      {/* salary breakdown — monthly always open, yearly starts collapsed */}
      <Section title="Monthly salary breakdown" defaultOpen>
        {a.components.map((c, i) => (
          <div className="rep-row" key={i}>
            <span><Term>{c.name}</Term><Badge source={c.source} /></span>
            <b>{inr(c.monthly)}</b>
          </div>
        ))}
        <div className="rep-row" style={{ fontWeight: 700 }}><span><Term k="gross">Gross (monthly)</Term></span><b>{inr(a.grossMonthly)}</b></div>
        {a.deductions.map((d, i) => (
          <div className="rep-row deduct" key={i}>
            <span><Term k={termKey(d)}>{d.name}</Term><Badge source={d.source} /></span>
            <b>− {inr(d.monthly)}</b>
          </div>
        ))}
        <div className="rep-row total"><span><Term k="takehome">Take-home / month</Term></span><b>{inr(a.netMonthly)}</b></div>
      </Section>

      <Section title="Yearly salary breakdown" defaultOpen={false}>
        {a.components.map((c, i) => (
          <div className="rep-row" key={i}>
            <span><Term>{c.name}</Term><Badge source={c.source} /></span>
            <b>{inr(c.monthly * 12)}</b>
          </div>
        ))}
        <div className="rep-row" style={{ fontWeight: 700 }}><span><Term k="gross">Gross (yearly)</Term></span><b>{inr(a.grossMonthly * 12)}</b></div>
        {a.deductions.map((d, i) => (
          <div className="rep-row deduct" key={i}>
            <span><Term k={termKey(d)}>{d.name}</Term><Badge source={d.source} /></span>
            <b>− {inr(d.monthly * 12)}</b>
          </div>
        ))}
        <div className="rep-row total"><span><Term k="takehome">Take-home / year</Term></span><b>{inr(a.netAnnual)}</b></div>
      </Section>

      {/* ── Locked analysis: tax regime, savings, clauses, actions, assumptions ── */}
      {locked ? (
        <LockPanel lock={lock!} />
      ) : (
        <>
          {/* regime */}
          <Section title={<><Term k="regime">Tax regime</Term> — pick the cheaper</>}>
            <div className="regime">
              <div className={`regime-card${a.regime.newWins ? " win" : ""}`}>
                <div className="regime-lbl">New regime</div><div className="regime-val">{inr(a.regime.taxNew)}</div>
                {a.regime.newWins && <span className="regime-tag">✓ Lower</span>}
              </div>
              <div className={`regime-card${!a.regime.newWins ? " win" : ""}`}>
                <div className="regime-lbl">Old regime</div><div className="regime-val">{inr(a.regime.taxOld)}</div>
                {!a.regime.newWins && <span className="regime-tag">✓ Lower</span>}
              </div>
            </div>
          </Section>

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
            <Section title="Clauses, in plain English">
              {a.clauses.map((c, i) => (
                <div className={`clause ${c.flag}`} key={i}>
                  <div className="clause-head">
                    <span className="clause-title">{c.title}</span>
                    <span className={`clause-flag ${c.flag}`}>{c.flag}</span>
                  </div>
                  <div className="clause-exp">{c.explanation}</div>
                  {c.action && <div className="clause-action"><b>Do this:</b> {c.action}</div>}
                </div>
              ))}
            </Section>
          )}

          {/* actions */}
          {a.actions.length > 0 && (
            <Section title="What to do after reading this offer">
              <ul className="rep-actions">
                {a.actions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </Section>
          )}

          {/* assumptions & what we couldn't find */}
          {a.assumptions.length > 0 && (
            <Section title="Assumptions — confirm these with HR">
              <ul className="rep-actions">
                {a.assumptions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </Section>
          )}
        </>
      )}

      {a.warnings.length > 0 && <p className="rep-warn">{a.warnings.join(" ")}</p>}
    </div>
  );
}

/** The paywall shown in place of the analysis sections until a credit is spent. */
export function LockPanel({ lock }: { lock: LockProps }) {
  const items = lock.items ?? DEFAULT_LOCK_ITEMS;
  return (
    <div className="lock-card">
      <div className="lock-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <p className="lock-title">{lock.title ?? "Unlock the full analysis"}</p>
      <ul className="lock-list">
        {items.map((it) => <li key={it}>{it}</li>)}
      </ul>
      {lock.unlockError && <p className="lock-error">{lock.unlockError}</p>}
      <button className="lock-btn" disabled={lock.unlockBusy} onClick={lock.onUnlock} data-ev="unlock_analysis">
        {lock.unlockBusy ? "Unlocking…" : lock.unlockLabel ?? "Unlock"}
      </button>
      {lock.unlockHint && <p className="lock-hint">{lock.unlockHint}</p>}
    </div>
  );
}

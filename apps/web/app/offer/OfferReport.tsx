import type { OfferAnalysis } from "@/lib/offer-analysis";
import type { OfferLine, Provenance } from "@onward/engine";
import { Term } from "@/components/Glossary";

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

/** The full decoded report for a single offer. Shared by single- and multi-upload. */
export function OfferReport({ a }: { a: OfferAnalysis }) {
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
        <div className="rep-card">
          <div className="rep-h">Equity / ESOP — on top of CTC</div>
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
        </div>
      )}

      {/* missing-breakup banner */}
      {!a.breakupStated && (
        <div className="rep-warn" style={{ marginBottom: 12 }}>
          We couldn't find a component-wise salary split in this letter. The breakdown below is
          <b> estimated</b> from the CTC — confirm the exact figures with HR before relying on them.
        </div>
      )}

      {/* salary breakdown */}
      <div className="rep-card">
        <div className="rep-h">Monthly salary breakdown</div>
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
        <div className="rep-row"><span><Term k="takehome">In hand / year (fixed)</Term></span><b>{inr(a.netAnnual)}</b></div>
      </div>

      {/* regime */}
      <div className="rep-card">
        <div className="rep-h"><Term k="regime">Tax regime</Term> — pick the cheaper</div>
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
                <span className="clause-title">{c.title}</span>
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

      {/* assumptions & what we couldn't find */}
      {a.assumptions.length > 0 && (
        <div className="rep-card">
          <div className="rep-h">Assumptions — confirm these with HR</div>
          <ul className="rep-actions">
            {a.assumptions.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      {a.warnings.length > 0 && <p className="rep-warn">{a.warnings.join(" ")}</p>}
    </div>
  );
}

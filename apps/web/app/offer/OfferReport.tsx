import type { OfferAnalysis } from "@/lib/offer-analysis";

const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");

/** The full decoded report for a single offer. Shared by single- and multi-upload. */
export function OfferReport({ a }: { a: OfferAnalysis }) {
  return (
    <div className="rep">
      {/* headline */}
      <div className="rep-top">
        <div className="rep-stat"><div className="l">Annual CTC</div><div className="v">{inr(a.annualCTC)}</div></div>
        <div className="rep-stat"><div className="l">Fixed (guaranteed)</div><div className="v">{inr(a.fixedAnnual)}</div></div>
        <div className="rep-stat"><div className="l">Variable / at-risk</div><div className="v">{(a.variableShare * 100).toFixed(1)}%</div></div>
      </div>

      {/* salary breakdown */}
      <div className="rep-card">
        <div className="rep-h">Monthly salary breakdown</div>
        {a.components.map((c, i) => (
          <div className="rep-row" key={i}><span>{c.name}</span><b>{inr(c.amount)}</b></div>
        ))}
        <div className="rep-row" style={{ fontWeight: 700 }}><span>Gross (monthly)</span><b>{inr(a.grossMonthly)}</b></div>
        <div className="rep-row deduct"><span>EPF — your 12%</span><b>− {inr(a.epfMonthly)}</b></div>
        <div className="rep-row deduct"><span>TDS — income tax</span><b>− {inr(a.tdsMonthly)}</b></div>
        <div className="rep-row total"><span>Take-home / month</span><b>{inr(a.netMonthly)}</b></div>
        <div className="rep-row"><span>In hand / year (fixed)</span><b>{inr(a.netAnnual)}</b></div>
      </div>

      {/* regime */}
      <div className="rep-card">
        <div className="rep-h">Tax regime — pick the cheaper</div>
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

      {a.warnings.length > 0 && <p className="rep-warn">{a.warnings.join(" ")}</p>}
    </div>
  );
}

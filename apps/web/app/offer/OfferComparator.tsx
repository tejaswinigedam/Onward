"use client";
import { useMemo, useState } from "react";
import { compareOffers, type OfferInput } from "@onward/engine";

const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");

export interface Draft {
  label: string;
  annualCTC: number;
  variablePct: number;
}

const DEFAULT_DRAFTS: Draft[] = [
  { label: "Offer A", annualCTC: 1800000, variablePct: 20 },
  { label: "Offer B", annualCTC: 1740000, variablePct: 10 },
];

interface OfferComparatorProps {
  /** Seed the comparison (e.g. from uploaded offers). Falls back to two demo drafts. */
  seedDrafts?: Draft[];
  /** Show "Add offer" / per-card remove controls. Defaults to true. */
  allowAddRemove?: boolean;
}

export function OfferComparator({ seedDrafts, allowAddRemove = true }: OfferComparatorProps) {
  // seedDrafts is the initial state only. The parent forces a remount (via `key`)
  // when the set of uploaded offers changes, so manual edits aren't clobbered by
  // an in-place sync.
  const [drafts, setDrafts] = useState<Draft[]>(seedDrafts?.length ? seedDrafts : DEFAULT_DRAFTS);

  const inputs: OfferInput[] = useMemo(
    () => drafts.map((d) => ({ label: d.label, annualCTC: d.annualCTC, variableShare: d.variablePct / 100 })),
    [drafts],
  );
  const cmp = useMemo(() => compareOffers(inputs), [inputs]);

  const patch = (i: number, field: keyof Draft, value: string) =>
    setDrafts((arr) => arr.map((d, j) => (j === i ? { ...d, [field]: field === "label" ? value : Number(value) || 0 } : d)));

  const addOffer = () =>
    setDrafts((arr) => [
      ...arr,
      { label: `Offer ${String.fromCharCode(65 + arr.length)}`, annualCTC: 1500000, variablePct: 10 },
    ]);

  const removeOffer = (i: number) => setDrafts((arr) => (arr.length > 2 ? arr.filter((_, j) => j !== i) : arr));

  const winner = cmp.offers[cmp.winnerIndex]!;
  const gapAnnual = cmp.monthlyTakeHomeGap * 12;

  return (
    <div>
      <div className="offer-wrap">
        {drafts.map((d, i) => {
          const out = cmp.offers[i]!;
          return (
            <div key={i} className={`offer-card${i === cmp.winnerIndex ? " win" : ""}`}>
              <div className="offer-card-head">
                <input
                  className="slip-name-input"
                  value={d.label}
                  onChange={(e) => patch(i, "label", e.target.value)}
                  style={{ maxWidth: 130 }}
                />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {i === cmp.winnerIndex ? (
                    <span className="offer-badge win">Pays more</span>
                  ) : i === cmp.biggerCtcIndex ? (
                    <span className="offer-badge big">Bigger CTC</span>
                  ) : null}
                  {allowAddRemove && drafts.length > 2 && (
                    <button className="offer-remove" title="Remove offer" onClick={() => removeOffer(i)}>
                      ×
                    </button>
                  )}
                </span>
              </div>
              <label className="offer-field">
                Annual CTC (₹)
                <input type="number" value={d.annualCTC} onChange={(e) => patch(i, "annualCTC", e.target.value)} />
              </label>
              <label className="offer-field">
                Variable / at-risk (%)
                <input type="number" value={d.variablePct} onChange={(e) => patch(i, "variablePct", e.target.value)} />
              </label>
              <div className="offer-out">
                <div className="offer-out-row"><span>Fixed pay</span><b>{inr(out.fixedAnnual)}</b></div>
                <div className="offer-out-row"><span>Guaranteed take-home / mo</span><b>{inr(out.netMonthly)}</b></div>
                <div className="offer-out-row"><span>In hand / year</span><b>{inr(out.netAnnualGuaranteed)}</b></div>
              </div>
            </div>
          );
        })}
      </div>
      {allowAddRemove && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="slip-add-btn" onClick={addOffer}>+ Add another offer</button>
        </div>
      )}
      <p className="offer-verdict">
        <span className="hl">{winner.label}</span> pays more — about {inr(gapAnnual)}/yr more
        guaranteed in hand, despite {cmp.biggerCtcIndex !== cmp.winnerIndex ? "a smaller headline CTC" : "the numbers"}.
      </p>
    </div>
  );
}

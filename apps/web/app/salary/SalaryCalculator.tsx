"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeSalary,
  earningsFromCTC,
  type Component,
  type Profile,
  type SalaryResult,
} from "@onward/engine";

const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");

const EARN_PRESETS = [
  { name: "LTA", x: "lta" },
  { name: "Conveyance", x: "conveyance" },
  { name: "Medical allowance", x: "medical" },
  { name: "Bonus / Variable", x: "variable" },
  { name: "Food coupons", x: "food" },
];
const DEDUCT_PRESETS = [
  { name: "Health insurance", x: "insurance" },
  { name: "VPF (extra PF)", x: "vpf" },
  { name: "Loan / advance", x: "loan" },
];

export function SalaryCalculator() {
  const [ctc, setCtc] = useState(1200000);
  const [earnings, setEarnings] = useState<Component[]>(() => earningsFromCTC(1200000));
  const [deductions, setDeductions] = useState<Component[]>([
    { name: "Professional tax", amount: 200, x: "pt" },
  ]);
  const [includeEPF] = useState(true);
  const [includeTDS] = useState(true);
  const [profile, setProfile] = useState<Profile>({});
  const [serverResult, setServerResult] = useState<SalaryResult | null>(null);

  const input = useMemo(
    () => ({ earnings, deductions, includeEPF, includeTDS, profile }),
    [earnings, deductions, includeEPF, includeTDS, profile],
  );

  // Instant local preview using the shared engine.
  const preview = useMemo(() => computeSalary(input), [input]);

  // Authoritative server compute (debounced). Server value wins when present.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/calc/salary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (res.ok) setServerResult((await res.json()).result as SalaryResult);
      } catch {
        /* keep the local preview */
      }
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [input]);

  const r = serverResult ?? preview;

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  async function save() {
    setSaveMsg("Saving…");
    try {
      const res = await fetch("/api/me/computations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "salary", inputs: input, results: r }),
      });
      if (res.status === 401) setSaveMsg("Sign in to save.");
      else if (res.ok) setSaveMsg("Saved to your account.");
      else setSaveMsg("Could not save.");
    } catch {
      setSaveMsg("Could not save.");
    }
  }

  function applyCTC(v: number) {
    setCtc(v);
    const std = earningsFromCTC(v);
    setEarnings((prev) => {
      const extras = prev.filter(
        (c) => !["basic", "hra", "special"].includes(c.x ?? "") && !/basic|hra|special/i.test(c.name),
      );
      return [...std, ...extras];
    });
  }
  const patch = (
    set: React.Dispatch<React.SetStateAction<Component[]>>,
    i: number,
    field: "name" | "amount",
    value: string,
  ) => set((arr) => arr.map((c, j) => (j === i ? { ...c, [field]: field === "amount" ? Number(value) || 0 : value } : c)));

  return (
    <div>
      <div className="calc">
        {/* editable payslip */}
        <div className="slip">
          <div className="slip-head">
            <span className="slip-title">Monthly payslip</span>
            <span className="slip-edit-hint">Editable</span>
          </div>
          <div className="slip-body">
            <div className="slip-ctc">
              <span className="slip-ctc-lbl">Annual CTC</span>
              <span className="slip-amount">
                <span className="slip-cur">₹</span>
                <input
                  className="slip-input"
                  type="number"
                  value={ctc}
                  onChange={(e) => applyCTC(Number(e.target.value) || 0)}
                />
              </span>
            </div>

            <p className="slip-group-label">Earnings</p>
            {earnings.map((c, i) => (
              <div className="slip-row" key={`e${i}`}>
                <span className="slip-lbl">
                  <input
                    className="slip-name-input"
                    value={c.name}
                    onChange={(e) => patch(setEarnings, i, "name", e.target.value)}
                  />
                </span>
                <span className="slip-amount">
                  <span className="slip-cur">₹</span>
                  <input
                    className="slip-input"
                    type="number"
                    value={c.amount}
                    onChange={(e) => patch(setEarnings, i, "amount", e.target.value)}
                  />
                  <button className="slip-remove" title="Remove" onClick={() => setEarnings((a) => a.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </span>
              </div>
            ))}
            <div className="slip-add">
              {EARN_PRESETS.map((p) => (
                <button key={p.x} className="slip-add-btn" onClick={() => setEarnings((a) => [...a, { name: p.name, amount: 0, x: p.x }])}>
                  + {p.name}
                </button>
              ))}
            </div>
            <div className="slip-row">
              <span className="slip-lbl" style={{ fontWeight: 700 }}>Gross (monthly)</span>
              <span className="slip-static">{inr(r.grossMonthly)}</span>
            </div>

            <p className="slip-group-label">Deductions</p>
            {deductions.map((c, i) => (
              <div className="slip-row" key={`d${i}`}>
                <span className="slip-lbl">
                  <input
                    className="slip-name-input"
                    value={c.name}
                    onChange={(e) => patch(setDeductions, i, "name", e.target.value)}
                  />
                </span>
                <span className="slip-amount">
                  <span className="slip-cur">₹</span>
                  <input
                    className="slip-input"
                    type="number"
                    value={c.amount}
                    onChange={(e) => patch(setDeductions, i, "amount", e.target.value)}
                  />
                  <button className="slip-remove" title="Remove" onClick={() => setDeductions((a) => a.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </span>
              </div>
            ))}
            <div className="slip-row">
              <span className="slip-lbl">EPF — your 12% <span className="slip-tag-auto">auto</span></span>
              <span className="slip-static deduct">− {inr(r.epfMonthly)}</span>
            </div>
            <div className="slip-row">
              <span className="slip-lbl">TDS — income tax <span className="slip-tag-auto">auto</span></span>
              <span className="slip-static deduct">− {inr(r.tdsMonthly)}</span>
            </div>
            <div className="slip-add">
              {DEDUCT_PRESETS.map((p) => (
                <button key={p.x} className="slip-add-btn" onClick={() => setDeductions((a) => [...a, { name: p.name, amount: 0, x: p.x }])}>
                  + {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="slip-total">
            <div>
              <div className="slip-total-lbl">Take-home / month</div>
              <div className="slip-total-sub">{inr(r.netAnnual)} / year in hand</div>
            </div>
            <div className="slip-total-val">{inr(r.netMonthly)}</div>
          </div>
        </div>

        {/* opportunities + regime + profile */}
        <div className="panel">
          <div className="opps">
            <div className="opps-h">★ Opportunities we spotted</div>
            {r.totalAnnualSaving >= 500 && (
              <div className="opps-total">
                <div className="ot-lbl">You could be keeping up to</div>
                <div className="ot-val">
                  {inr(r.totalAnnualSaving)} <small>/ year</small>
                </div>
              </div>
            )}
            {r.opportunities.length === 0 ? (
              <p className="opp-none">Tweak the payslip and we&apos;ll surface where you could save.</p>
            ) : (
              r.opportunities.map((o) => (
                <div className="opp" key={o.id}>
                  <span className="opp-txt">
                    <strong>{o.title}</strong>
                    {o.detail}
                  </span>
                  <span className="opp-save">{o.savingLabel}</span>
                </div>
              ))
            )}
            <div className="regime">
              <div className={`regime-card${r.regime.newWins ? " win" : ""}`}>
                <div className="regime-lbl">New regime</div>
                <div className="regime-val">{inr(r.regime.taxNew)}</div>
                {r.regime.newWins && <span className="regime-tag">✓ Lower for you</span>}
              </div>
              <div className={`regime-card${!r.regime.newWins ? " win" : ""}`}>
                <div className="regime-lbl">Old regime</div>
                <div className="regime-val">{inr(r.regime.taxOld)}</div>
                {!r.regime.newWins && <span className="regime-tag">✓ Lower for you</span>}
              </div>
            </div>
          </div>

          <div className="explain">
            <div className="explain-tag">Personalise your opportunities</div>
            <div className="explain-title">Tell us a bit about you</div>
            <div className="explain-body">These unlock rent-based HRA and role benchmarks — the same math a signed-in profile uses.</div>
            <div className="prof">
              <label>
                Monthly rent (₹)
                <input type="number" value={profile.monthlyRent ?? ""} onChange={(e) => setProfile((p) => ({ ...p, monthlyRent: Number(e.target.value) || undefined }))} />
              </label>
              <label>
                City
                <select value={profile.cityTier ?? "metro"} onChange={(e) => setProfile((p) => ({ ...p, cityTier: e.target.value as Profile["cityTier"] }))}>
                  <option value="metro">Metro</option>
                  <option value="non-metro">Non-metro</option>
                </select>
              </label>
              <label>
                Experience (yrs)
                <input type="number" value={profile.experienceYears ?? ""} onChange={(e) => setProfile((p) => ({ ...p, experienceYears: Number(e.target.value) || undefined }))} />
              </label>
              <label>
                Declared 80C (₹/yr)
                <input type="number" value={profile.declaredDeductions ?? ""} onChange={(e) => setProfile((p) => ({ ...p, declaredDeductions: Number(e.target.value) || undefined }))} />
              </label>
            </div>
          </div>
        </div>
      </div>
      <p className="calc-note">
        Figures are estimates for FY 2025–26 to help you learn, not tax advice. Computed on our
        server via the shared engine.
      </p>
      <p className="auth-cta">
        <button className="slip-add-btn" onClick={save}>Save this calculation</button>
        {saveMsg ? <span style={{ marginLeft: 10 }}>{saveMsg}</span> : (
          <> — <a href="/sign-in">sign in</a> to save and get fully personalised opportunities.</>
        )}
      </p>
    </div>
  );
}

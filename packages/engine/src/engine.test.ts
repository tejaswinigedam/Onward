import { describe, it, expect } from "vitest";
import { newRegimeTax, oldRegimeTax } from "./tax";
import { earningsFromCTC, computeSalary } from "./salary";
import { compareOffers } from "./offer";
import type { Profile } from "./types";

// â”€â”€ Tax parity: values recomputed by hand from the legacy inline engine â”€â”€
describe("tax engines (FY2025-26 parity)", () => {
  it("new regime: zero up to the 87A rebate ceiling", () => {
    expect(newRegimeTax(1142400)).toBe(0); // taxable 1,067,400 â‰¤ 12L
  });
  it("old regime: matches hand-walked slabs + cess", () => {
    expect(oldRegimeTax(1142400, 0)).toBe(145829);
    expect(oldRegimeTax(1142400, 150000)).toBe(105019);
  });
});

// â”€â”€ Payslip reverse-derivation parity â”€â”€
describe("earningsFromCTC", () => {
  it("splits a â‚¹12L CTC exactly as the legacy page did", () => {
    expect(earningsFromCTC(1200000)).toEqual([
      { name: "Basic salary", amount: 40000, x: "basic" },
      { name: "HRA", amount: 20000, x: "hra" },
      { name: "Special allowance", amount: 35200, x: "special" },
    ]);
  });
});

// â”€â”€ Full computation parity for the default â‚¹12L template â”€â”€
describe("computeSalary â€” â‚¹12L default template", () => {
  const res = computeSalary({
    earnings: earningsFromCTC(1200000),
    deductions: [{ name: "Professional tax", amount: 200, x: "pt" }],
    includeEPF: true,
    includeTDS: true,
  });

  it("computes gross, EPF, TDS and net", () => {
    expect(res.grossMonthly).toBe(95200);
    expect(res.epfMonthly).toBe(4800);
    expect(res.tdsMonthly).toBe(0); // new regime is 0 â†’ min is 0
    expect(res.netMonthly).toBe(90200);
  });

  it("new regime wins here", () => {
    expect(res.regime.newWins).toBe(true);
  });

  it("surfaces regime + 80C + HRA opportunities, ranked by â‚¹ saved", () => {
    const ids = res.opportunities.map((o) => o.id);
    expect(ids).toEqual(["regime-choice", "80c-headroom", "hra-claim"]);
    expect(res.opportunities[0]!.savingValue).toBe(145829);
    expect(res.opportunities[1]!.savingValue).toBe(40810);
  });
});

// â”€â”€ Dynamic behaviour: same CTC, different profile â†’ different opportunities â”€â”€
describe("dynamic opportunities (profile-driven)", () => {
  const base = {
    earnings: earningsFromCTC(1200000),
    deductions: [{ name: "Professional tax", amount: 200, x: "pt" }],
    includeEPF: true,
    includeTDS: true,
  };
  const hra = (profile: Profile) =>
    computeSalary({ ...base, profile }).opportunities.find((o) => o.id === "hra-claim")!;

  it("metro vs non-metro yields different HRA exemption amounts", () => {
    const metro = hra({ monthlyRent: 25000, cityTier: "metro" });
    const nonMetro = hra({ monthlyRent: 25000, cityTier: "non-metro" });
    expect(metro.detail).toContain("2,40,000"); // 20000/mo exempt
    expect(nonMetro.detail).toContain("1,92,000"); // 16000/mo exempt
    expect(metro.detail).not.toBe(nonMetro.detail);
  });

  it("variable-vs-benchmark rule only fires when a profile is present", () => {
    const withProfile = computeSalary({ ...base, profile: { experienceYears: 4 } });
    const withoutProfile = computeSalary(base);
    expect(withProfile.opportunities.map((o) => o.id)).toContain("variable-vs-benchmark");
    expect(withoutProfile.opportunities.map((o) => o.id)).not.toContain(
      "variable-vs-benchmark",
    );
  });
});

// â”€â”€ Offer comparison: bigger CTC is not always the winner â”€â”€
describe("compareOffers", () => {
  const cmp = compareOffers([
    { label: "Offer A", annualCTC: 1800000, variableShare: 0.2 },
    { label: "Offer B", annualCTC: 1740000, variableShare: 0.1 },
  ]);

  it("picks the offer with higher guaranteed take-home, not the bigger CTC", () => {
    expect(cmp.biggerCtcIndex).toBe(0); // A has the larger headline CTC
    expect(cmp.winnerIndex).toBe(1); // B pays more guaranteed
    expect(cmp.monthlyTakeHomeGap).toBeGreaterThan(0);
  });
});

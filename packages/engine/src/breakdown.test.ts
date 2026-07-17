import { describe, it, expect } from "vitest";
import { computeOfferBreakdown } from "./breakdown";

const gatesById = (b: ReturnType<typeof computeOfferBreakdown>) =>
  Object.fromEntries(b.gates.map((g) => [g.id, g.ok]));

// ── Test 2 — Mosaic Wellness (Param): breakup in Annexure A on a later page ──
describe("Mosaic Wellness offer (stated Annexure A, capped PF, ESOP on top)", () => {
  const b = computeOfferBreakdown({
    annualCTC: 2765000,
    breakupStated: true,
    earnings: [
      { name: "Basic", annual: 1382500, x: "basic" },
      { name: "HRA", annual: 691250, x: "hra" },
      { name: "Special allowance", annual: 603151, x: "special" },
    ],
    employerPF: 21600,
    gratuity: 66499,
    equity: [
      { name: "ESOP", value: 1000000, inCTC: false, discretionary: true, vesting: "10:20:30:40" },
    ],
    stateOrCity: "Mumbai, Maharashtra",
  });

  it("G1: CTC reconciles exactly to Annexure A", () => {
    expect(gatesById(b).G1).toBe(true);
    expect(b.grossCashAnnual + 21600 + 66499).toBe(2765000);
  });

  it("gross cash excludes employer PF & gratuity", () => {
    expect(b.grossCashAnnual).toBe(2676901);
    expect(b.grossCashMonthly).toBe(223075);
  });

  it("employee PF is capped at ₹1,800/mo, not 12% of full basic", () => {
    expect(b.employeePFAnnual).toBe(21600);
    expect(b.deductions.find((d) => d.x === "epf")!.monthly).toBe(1800);
  });

  it("new-regime tax ≈ ₹3.75L", () => {
    expect(b.regime.taxNew).toBe(374993);
  });

  it("take-home ≈ ₹1,89,800/mo and reconciles exactly (G3)", () => {
    expect(gatesById(b).G3).toBe(true);
    expect(b.takeHomeMonthly).toBeGreaterThanOrEqual(189000);
    expect(b.takeHomeMonthly).toBeLessThanOrEqual(190500);
    const shownDeductions = b.deductions.reduce((s, d) => s + d.annual, 0);
    expect(b.takeHomeAnnual).toBe(b.grossCashAnnual - shownDeductions);
  });

  it("surfaces the ₹10L ESOP as equity, not a 0% variable", () => {
    expect(b.equity[0]!.value).toBe(1000000);
    expect(b.equity[0]!.discretionary).toBe(true);
    expect(b.atRiskCashShare).toBe(0); // no cash variable
  });

  it("all gates pass; nothing estimated", () => {
    expect(b.gatesPass).toBe(true);
    expect(b.estimated).toBe(false);
  });
});

// ── Test 1 — Zenoti (Subhranta): salary table in body, 12% PF assumption ──
describe("Zenoti offer (stated table, bonus 10% of gross, uncapped PF)", () => {
  const grossLines = [
    { name: "Basic", annual: 1155000, x: "basic" as const },
    { name: "HRA", annual: 462000, x: "hra" as const },
    { name: "Books", annual: 12000 },
    { name: "Children Education Allowance", annual: 2400 },
    { name: "Special allowance", annual: 590850, x: "special" as const },
    { name: "LTA", annual: 57750 },
    { name: "Telephone", annual: 30000 },
  ];
  const b = computeOfferBreakdown({
    annualCTC: 2619929,
    breakupStated: true,
    earnings: grossLines,
    cashVariableAnnual: 231000, // 10% of gross 23,10,000
    stateOrCity: "Telangana",
  });

  it("monthly gross is exactly ₹1,92,500 (annual/12, no rounded re-sum)", () => {
    expect(b.grossCashAnnual).toBe(2310000);
    expect(b.grossCashMonthly).toBe(192500);
  });

  it("Children Education ₹200 stays in the gross that feeds net (G5)", () => {
    expect(b.earnings.find((c) => c.name.includes("Children"))!.annual).toBe(2400);
    expect(gatesById(b).G5).toBe(true);
  });

  it("employee EPF is 12% of basic (₹11,550/mo) — uncapped", () => {
    expect(b.employeePFAnnual).toBe(138600);
    expect(b.deductions.find((d) => d.x === "epf")!.monthly).toBe(11550);
  });

  it("new ≈ ₹2,69,100 and old ≈ ₹5,10,120 tax", () => {
    expect(b.regime.taxNew).toBe(269100);
    expect(b.regime.taxOld).toBe(510120);
  });

  it("take-home reconciles exactly and lands ≈ ₹1,58,300/mo", () => {
    expect(gatesById(b).G3).toBe(true);
    expect(b.takeHomeMonthly).toBeGreaterThanOrEqual(158000);
    expect(b.takeHomeMonthly).toBeLessThanOrEqual(158600);
  });

  it("fixed (guaranteed) = CTC − cash variable = ₹23,88,929", () => {
    expect(b.fixedAnnual).toBe(2388929);
  });

  it("CTC reconciles via a derived employer-retirals residual (G1)", () => {
    expect(gatesById(b).G1).toBe(true);
  });
});

// ── Missing breakup → coarse, badged estimate, never fabricated precision ──
describe("missing breakup (CTC only)", () => {
  const b = computeOfferBreakdown({
    annualCTC: 2000000,
    breakupStated: false,
    earnings: [],
  });

  it("marks the whole card estimated and lists an assumption", () => {
    expect(b.estimated).toBe(true);
    expect(b.earnings.every((c) => c.source === "estimated")).toBe(true);
    expect(b.assumptions.some((a) => /split was not found/i.test(a))).toBe(true);
  });

  it("estimated earnings are rounded to the nearest ₹1,000", () => {
    expect(b.earnings.every((c) => c.annual % 1000 === 0)).toBe(true);
  });
});

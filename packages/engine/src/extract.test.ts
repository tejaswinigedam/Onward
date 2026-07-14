import { describe, it, expect } from "vitest";
import { parseAmount, extractOffer } from "./extract";

describe("parseAmount (Indian formats)", () => {
  it("parses grouped digits, lakh, crore and LPA", () => {
    expect(parseAmount("₹18,00,000")).toBe(1800000);
    expect(parseAmount("Rs. 1800000")).toBe(1800000);
    expect(parseAmount("18 LPA")).toBe(1800000);
    expect(parseAmount("18 lakhs")).toBe(1800000);
    expect(parseAmount("1.2 cr")).toBe(12000000);
  });
});

describe("extractOffer", () => {
  it("pulls CTC, variable % and notice period from a typical offer", () => {
    const text = `
      Dear Candidate,
      We are pleased to offer you the position of Senior Engineer.
      Annual CTC: ₹18,00,000 per annum.
      Your variable pay is 20% of CTC, payable on performance.
      Notice period: 90 days.
    `;
    const r = extractOffer(text);
    expect(r.annualCTC).toBe(1800000);
    expect(r.variableShare).toBeCloseTo(0.2, 5);
    expect(r.noticePeriodDays).toBe(90);
  });

  it("derives variable share from an amount when no % is given", () => {
    const text = "Total CTC 20,00,000. Variable pay 2,00,000 per year.";
    const r = extractOffer(text);
    expect(r.annualCTC).toBe(2000000);
    expect(r.variableShare).toBeCloseTo(0.1, 5);
  });

  it("converts a notice period in months to days", () => {
    expect(extractOffer("Notice period of 2 months applies.").noticePeriodDays).toBe(60);
  });

  it("takes the ANNUAL column from a monthly/annual annexure table", () => {
    // Real-world layout: "Label  <monthly>  <annual>".
    const text =
      "We offer you Rs. 1,200,000.00/- per annum as total cost to the Company. " +
      "CTC ANNEXURE Components MONTHLY ANNUAL Basic (35% of Fixed CTC) 32,375.00 388,500.00 " +
      "Fixed CTC 92,500.00 1,110,000.00 Variable Pay 7,500.00 90,000.00 " +
      "Total CTC 100,000.00 1,200,000.00";
    const r = extractOffer(text);
    expect(r.annualCTC).toBe(1200000); // annual, not the 100,000 monthly
    expect(r.variableShare).toBeCloseTo(0.075, 3); // 90,000 / 12,00,000
  });

  it("warns when CTC is missing", () => {
    const r = extractOffer("This letter confirms your joining date.");
    expect(r.annualCTC).toBeUndefined();
    expect(r.warnings.join(" ")).toMatch(/CTC/i);
  });
});

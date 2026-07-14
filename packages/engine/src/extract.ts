/**
 * Heuristic offer-letter parser — turns raw extracted text into the numbers the
 * engine understands. No LLM: pattern/keyword matching tuned for Indian offer
 * letters. Best-effort by design — the UI pre-fills an editable form so the user
 * confirms/corrects anything mis-read.
 */

export interface ExtractedOffer {
  annualCTC?: number;
  /** Variable/at-risk pay as a fraction of CTC (0..1). */
  variableShare?: number;
  noticePeriodDays?: number;
  /** Human-readable notes about what was (or wasn't) found. */
  warnings: string[];
}

/** Parse an Indian-format amount into a rupee number.
 *  Handles "18,00,000", "₹18,00,000", "Rs. 1800000", "18 LPA", "18 lakhs", "1.2 cr". */
export function parseAmount(raw: string): number | undefined {
  const s = raw.toLowerCase().replace(/[₹,]/g, "").replace(/rs\.?/g, "").trim();

  const crore = s.match(/([\d.]+)\s*(cr|crore)/);
  if (crore) return Math.round(parseFloat(crore[1]!) * 10_000_000);

  const lakh = s.match(/([\d.]+)\s*(lpa|lakh|lac|l\b)/);
  if (lakh) return Math.round(parseFloat(lakh[1]!) * 100_000);

  const plain = s.match(/([\d.]+)/);
  if (plain) {
    const n = parseFloat(plain[1]!);
    return Number.isFinite(n) ? Math.round(n) : undefined;
  }
  return undefined;
}

/** Find the first amount that appears near any of the given keywords. */
function amountNear(text: string, keywords: string[]): number | undefined {
  for (const kw of keywords) {
    // keyword ... up to ~40 chars ... an amount (with optional ₹/Rs and lakh/cr suffix)
    const re = new RegExp(
      `${kw}[^\\d₹]{0,40}((?:₹|rs\\.?)?\\s*[\\d.,]+\\s*(?:lpa|lakhs?|lac|cr|crore)?)`,
      "i",
    );
    const m = text.match(re);
    if (m) {
      const amt = parseAmount(m[1]!);
      if (amt && amt > 0) return amt;
    }
  }
  return undefined;
}

export function extractOffer(text: string): ExtractedOffer {
  const warnings: string[] = [];
  const flat = text.replace(/\s+/g, " ");

  const annualCTC = amountNear(flat, [
    "total ctc", "annual ctc", "ctc", "cost to company", "total compensation", "gross salary",
  ]);
  if (!annualCTC) warnings.push("Couldn't find the CTC — please enter it.");

  // Variable: prefer an explicit percentage, else derive from a variable amount.
  let variableShare: number | undefined;
  const pct = flat.match(
    /(variable|performance|at[-\s]?risk|bonus)[^%\d]{0,30}(\d{1,2}(?:\.\d+)?)\s*%/i,
  );
  if (pct) {
    variableShare = Math.min(1, parseFloat(pct[2]!) / 100);
  } else {
    const varAmt = amountNear(flat, ["variable pay", "variable", "performance pay", "performance bonus"]);
    if (varAmt && annualCTC && annualCTC > 0) {
      variableShare = Math.min(1, varAmt / annualCTC);
    }
  }
  if (variableShare === undefined) warnings.push("No variable/at-risk pay detected — assumed 0%.");

  // Notice period (days; convert months → days).
  let noticePeriodDays: number | undefined;
  const noticeDays = flat.match(/notice\s*period[^\d]{0,20}(\d{1,3})\s*days?/i);
  const noticeMonths = flat.match(/notice\s*period[^\d]{0,20}(\d{1,2})\s*months?/i);
  if (noticeDays) noticePeriodDays = parseInt(noticeDays[1]!, 10);
  else if (noticeMonths) noticePeriodDays = parseInt(noticeMonths[1]!, 10) * 30;

  return { annualCTC, variableShare, noticePeriodDays, warnings };
}

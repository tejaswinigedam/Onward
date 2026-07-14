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

const AMT = "(?:₹|rs\\.?)?\\s*[\\d,]+(?:\\.\\d+)?(?:\\s*(?:lpa|lakhs?|lac|cr|crore))?";

/**
 * Find the amount near a keyword. Offer annexures list a MONTHLY and an ANNUAL
 * column, so we capture up to two consecutive amounts after the label and return
 * the LARGER one (annual ≥ monthly). For a single figure it just returns that.
 */
function annualAmountNear(text: string, keywords: string[]): number | undefined {
  for (const kw of keywords) {
    const re = new RegExp(`${kw}[^\\d₹]{0,25}(${AMT})(?:\\s+(${AMT}))?`, "i");
    const m = text.match(re);
    if (m) {
      const vals = [m[1], m[2]]
        .map((x) => (x ? parseAmount(x) : undefined))
        .filter((v): v is number => !!v && v > 0);
      if (vals.length) return Math.max(...vals);
    }
  }
  return undefined;
}

/** An amount explicitly tagged "per annum" / "p.a." — the most reliable CTC signal. */
function perAnnumAmount(text: string): number | undefined {
  const m = text.match(new RegExp(`(${AMT})\\s*/?-?\\s*(?:per\\s*annum|p\\.?\\s*a\\.?|/\\s*annum)`, "i"));
  return m ? parseAmount(m[1]!) : undefined;
}

export function extractOffer(text: string): ExtractedOffer {
  const warnings: string[] = [];
  const flat = text.replace(/\s+/g, " ");

  // CTC: prefer an explicitly labelled total, then a "per annum" figure, then
  // looser fallbacks — each using annual (larger-of-two) logic for tables.
  const annualCTC =
    annualAmountNear(flat, ["total ctc", "annual ctc"]) ??
    perAnnumAmount(flat) ??
    annualAmountNear(flat, ["cost to company", "gross earning", "total compensation", "ctc", "gross salary"]);
  if (!annualCTC) warnings.push("Couldn't find the CTC — please enter it.");

  // Variable: prefer an explicit % tied to variable/performance/at-risk; else
  // derive from a labelled variable amount (annual) over CTC.
  let variableShare: number | undefined;
  const pct = flat.match(/(variable|performance|at[-\s]?risk)[^%\d]{0,30}(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (pct) {
    variableShare = Math.min(1, parseFloat(pct[2]!) / 100);
  } else {
    const varAmt = annualAmountNear(flat, ["variable pay", "variable", "performance pay", "performance bonus"]);
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

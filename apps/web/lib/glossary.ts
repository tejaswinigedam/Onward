/**
 * Plain-English glossary for the terminology that shows up in a decoded offer
 * letter. Each entry has a `short` line (shown on hover) and a longer `long`
 * explanation (shown in the side panel on click).
 *
 * `lookup()` resolves a label (e.g. "Gross (monthly)", "EPF — your 12%",
 * "HRA") to an entry via a set of synonyms, so component names coming straight
 * from the analysis still match.
 */
export interface GlossaryEntry {
  key: string;
  term: string;
  short: string;
  long: string;
  /** Lowercased substrings that should resolve to this entry. */
  match: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    key: "ctc",
    term: "CTC (Cost to Company)",
    short: "The total annual cost your employer bears for you — not what lands in your bank.",
    long:
      "CTC is everything the company spends on you in a year: your salary plus employer contributions (PF, gratuity, insurance) and any variable/bonus pay. Because it includes money that never reaches your account — and pay that depends on performance — your actual take-home is always lower than CTC. Always look at fixed pay and monthly take-home, not just the CTC headline.",
    match: ["ctc", "cost to company", "annual ctc"],
  },
  {
    key: "fixed",
    term: "Fixed pay",
    short: "The guaranteed part of your pay that doesn't depend on performance.",
    long:
      "Fixed pay is the portion of your CTC you're guaranteed regardless of individual or company performance. It's the number to plan your life around — rent, EMIs, savings — because unlike variable pay it doesn't shrink in a bad year.",
    match: ["fixed", "guaranteed"],
  },
  {
    key: "variable",
    term: "Variable / at-risk pay",
    short: "Pay that's conditional on performance — you might not get all of it.",
    long:
      "Variable pay (performance bonus, incentive, at-risk pay) is paid only if you and/or the company hit targets. It's quoted at 100% in the offer but often pays out at 60–90%. Ask about historical payout rates, and never assume the full amount when comparing offers.",
    match: ["variable", "at-risk", "at risk", "performance pay", "incentive"],
  },
  {
    key: "basic",
    term: "Basic salary",
    short: "The core of your salary that most other components are calculated from.",
    long:
      "Basic salary is the foundation of your pay structure. HRA, PF and gratuity are all computed as a percentage of Basic, so a higher Basic means higher PF and gratuity (more forced saving) but can also mean a slightly lower in-hand today. It's usually 40–50% of gross.",
    match: ["basic"],
  },
  {
    key: "hra",
    term: "HRA (House Rent Allowance)",
    short: "An allowance for rent that can be partly tax-free if you actually pay rent.",
    long:
      "HRA is paid to cover housing. If you live in rented accommodation you can claim a tax exemption on part of it (the least of: actual HRA, rent paid minus 10% of Basic, or 50%/40% of Basic for metro/non-metro). The exemption only applies under the old tax regime and only if you're paying rent.",
    match: ["hra", "house rent"],
  },
  {
    key: "special",
    term: "Special allowance",
    short: "A fully taxable balancing component with no special tax benefit.",
    long:
      "Special allowance is the 'balancing figure' left after Basic, HRA and other components are set. It's fully taxable and carries no exemption, so a large special allowance means more of your pay is taxed at your slab rate.",
    match: ["special allowance", "special"],
  },
  {
    key: "lta",
    term: "LTA (Leave Travel Allowance)",
    short: "Reimbursement for domestic travel that can be tax-free with proof.",
    long:
      "LTA covers travel costs for you and your family within India. It's tax-exempt (old regime) for two journeys in a block of four years, against actual travel bills. Without bills, it's paid out but fully taxed.",
    match: ["lta", "leave travel"],
  },
  {
    key: "gross",
    term: "Gross salary",
    short: "Your total earnings before any deductions like PF and tax.",
    long:
      "Gross is the sum of all your earning components (Basic + HRA + allowances) before deductions. Your take-home is gross minus PF, professional tax and TDS. Don't confuse gross with CTC — gross excludes employer contributions.",
    match: ["gross"],
  },
  {
    key: "epf",
    term: "EPF (Employees' Provident Fund)",
    short: "A retirement saving where 12% of Basic is deducted and matched by your employer.",
    long:
      "EPF is a mandatory retirement fund. 12% of your Basic is deducted from your salary each month, and your employer contributes a matching amount. It earns tax-free interest and is your money — you get it on retirement or job change. It lowers your in-hand today but is forced long-term saving.",
    match: ["epf", "pf", "provident fund"],
  },
  {
    key: "vpf",
    term: "VPF (Voluntary Provident Fund)",
    short: "Extra PF you choose to contribute beyond the mandatory 12%.",
    long:
      "VPF lets you put more than the compulsory 12% of Basic into your PF account, earning the same tax-free interest. It's optional, and a low-risk way to save more — but the money is locked until retirement or withdrawal conditions are met.",
    match: ["vpf", "voluntary provident"],
  },
  {
    key: "tds",
    term: "TDS (Tax Deducted at Source)",
    short: "Income tax your employer deducts from your salary every month.",
    long:
      "TDS is your income tax, collected in advance by your employer and paid to the government monthly, so you don't face a large bill at year-end. The amount depends on your projected annual income, chosen tax regime and declared investments. Declaring deductions early reduces monthly TDS.",
    match: ["tds", "tax deducted", "income tax"],
  },
  {
    key: "takehome",
    term: "Take-home / net salary",
    short: "What actually reaches your bank after PF, tax and other deductions.",
    long:
      "Take-home (net) salary is gross minus all deductions — EPF, professional tax, TDS and any others. This is the real number to budget with. Two offers with the same CTC can have very different take-home depending on structure and variable share.",
    match: ["take-home", "take home", "net", "in hand", "in-hand"],
  },
  {
    key: "gratuity",
    term: "Gratuity",
    short: "A lump sum you get for long service — usually only after 5 years.",
    long:
      "Gratuity is a reward for continued service, paid when you leave after completing (generally) 5 years. It's ~4.81% of Basic set aside in CTC. If you leave before the vesting period you typically forfeit it — so counting it in CTC for a job you may not stay 5 years in can overstate your real pay.",
    match: ["gratuity"],
  },
  {
    key: "professionalTax",
    term: "Professional tax",
    short: "A small state-levied tax on your income, capped at ₹2,500/year.",
    long:
      "Professional tax is charged by some state governments on salaried income. It's small (max ₹2,500 a year) and deducted monthly. It's not related to your profession's skill — just a state levy, and it's deductible under the old regime.",
    match: ["professional tax", "p tax", "ptax"],
  },
  {
    key: "regime",
    term: "Tax regime (Old vs New)",
    short: "Two ways to calculate income tax — pick whichever costs you less.",
    long:
      "India has two tax regimes. The OLD regime has higher rates but lets you claim deductions (80C, HRA, home loan). The NEW regime has lower rates but almost no deductions. Which is cheaper depends on how much you invest/claim — Onward computes both and flags the lower one for you.",
    match: ["regime", "new regime", "old regime"],
  },
  {
    key: "noticePeriod",
    term: "Notice period",
    short: "How long you must keep working after resigning before you can leave.",
    long:
      "The notice period is the time you must serve between resigning and your last day (often 30–90 days). A long notice period can delay a new job or force a 'buyout' where you pay to leave early. It's worth negotiating before you sign.",
    match: ["notice period", "notice"],
  },
  {
    key: "probation",
    term: "Probation",
    short: "An initial trial period with easier exit terms for both sides.",
    long:
      "Probation is an evaluation window at the start of employment (typically 3–6 months). During it, notice periods are usually shorter and some benefits may not yet apply. Confirmation at the end makes you a permanent employee.",
    match: ["probation"],
  },
  {
    key: "clawback",
    term: "Bonus clawback / recovery",
    short: "A clause forcing you to repay a joining bonus if you leave early.",
    long:
      "A clawback (or recovery) clause lets the employer reclaim a joining bonus, relocation payment or training cost if you resign within a set period. Read the trigger window and amount carefully — it can make leaving early expensive.",
    match: ["clawback", "claw back", "recovery", "joining bonus recovery", "retention"],
  },
  {
    key: "nonCompete",
    term: "Non-compete clause",
    short: "A restriction on joining competitors for a period after you leave.",
    long:
      "A non-compete tries to stop you working for competitors for a period after leaving. In India these are largely unenforceable after employment ends, but they can still cause friction. Understand its scope before signing.",
    match: ["non-compete", "non compete", "noncompete"],
  },
  {
    key: "bond",
    term: "Employment bond",
    short: "A commitment to stay a minimum period or pay a penalty.",
    long:
      "A service bond requires you to stay for a minimum duration (or repay training/onboarding costs if you leave early). Check the penalty amount and whether it's proportionate — courts only uphold reasonable, actual costs.",
    match: ["bond", "service agreement", "minimum service"],
  },
];

const INDEX: GlossaryEntry[] = GLOSSARY;

/** Resolve a label/component name to a glossary entry, or null if unknown. */
export function lookup(label: string): GlossaryEntry | null {
  const s = label.toLowerCase();
  // Prefer the longest matching synonym so "professional tax" beats "tax".
  let best: GlossaryEntry | null = null;
  let bestLen = 0;
  for (const entry of INDEX) {
    for (const m of entry.match) {
      if (s.includes(m) && m.length > bestLen) {
        best = entry;
        bestLen = m.length;
      }
    }
  }
  return best;
}

export function byKey(key: string): GlossaryEntry | null {
  return INDEX.find((e) => e.key === key) ?? null;
}

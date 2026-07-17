import { compareOffers, type OfferInput } from "@onward/engine";
import { Term } from "@/components/Glossary";
import type { UploadedDoc } from "./OfferMultiUpload";

const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");
const labelFromName = (name: string) => name.replace(/\.pdf$/i, "").slice(0, 24) || "Offer";

type Dir = "high" | "low"; // which direction is "better" for highlighting

interface Row {
  key: string;
  label: string;
  values: number[];
  fmt: (n: number) => string;
  better: Dir;
}

export function OfferComparisonSummary({ docs }: { docs: UploadedDoc[] }) {
  const analyses = docs.map((d) => d.analysis!);
  const labels = docs.map((d) => labelFromName(d.fileName));

  const inputs: OfferInput[] = docs.map((d, i) => ({
    label: labels[i]!,
    annualCTC: analyses[i]!.annualCTC,
    variableShare: analyses[i]!.variableShare,
  }));
  const cmp = compareOffers(inputs);

  const winner = cmp.offers[cmp.winnerIndex]!;
  const sortedNet = [...cmp.offers].sort((a, b) => b.netMonthly - a.netMonthly);
  const gapAnnual = (sortedNet[0]!.netMonthly - sortedNet[1]!.netMonthly) * 12;
  const ctcMismatch = cmp.biggerCtcIndex !== cmp.winnerIndex;

  const watchCounts = analyses.map(
    (a) => a.clauses.filter((c) => c.flag === "negotiate" || c.flag === "watch").length,
  );

  const rows: Row[] = [
    { key: "ctc", label: "Annual CTC", values: analyses.map((a) => a.annualCTC), fmt: inr, better: "high" },
    { key: "var", label: "Variable / at-risk", values: analyses.map((a) => a.variableShare * 100), fmt: (n) => `${n.toFixed(1)}%`, better: "low" },
    { key: "fixed", label: "Fixed (guaranteed)", values: cmp.offers.map((o) => o.fixedAnnual), fmt: inr, better: "high" },
    { key: "net", label: "Take-home / month", values: cmp.offers.map((o) => o.netMonthly), fmt: inr, better: "high" },
    { key: "netyr", label: "In hand / year", values: cmp.offers.map((o) => o.netAnnualGuaranteed), fmt: inr, better: "high" },
    { key: "notice", label: "Notice period (days)", values: analyses.map((a) => a.noticePeriodDays ?? 0), fmt: (n) => (n > 0 ? String(n) : "—"), better: "low" },
    { key: "watch", label: "Clauses to watch", values: watchCounts, fmt: (n) => String(n), better: "low" },
  ];

  const bestIndex = (r: Row): number => {
    let bi = 0;
    r.values.forEach((v, i) => {
      const cur = r.values[bi]!;
      if (r.better === "high" ? v > cur : v < cur) bi = i;
    });
    return bi;
  };

  return (
    <div className="cmp-summary">
      <p className="offer-verdict" style={{ margin: "0 auto 18px" }}>
        <span className="hl">{winner.label}</span> is our pick — about {inr(gapAnnual)}/yr more guaranteed
        in hand{ctcMismatch ? ", despite a smaller headline CTC" : ""}.
      </p>

      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <thead>
            <tr>
              <th />
              {labels.map((l, i) => (
                <th key={i} className={i === cmp.winnerIndex ? "win" : ""}>
                  {l}
                  {i === cmp.winnerIndex && <span className="cmp-pick">✓ pick</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const bi = bestIndex(r);
              return (
                <tr key={r.key}>
                  <td className="cmp-metric"><Term>{r.label}</Term></td>
                  {r.values.map((v, i) => (
                    <td key={i} className={i === bi ? "best" : ""}>{r.fmt(v)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="cmp-note">
        Recommendation is based on guaranteed monthly take-home (CTC minus at-risk variable), not the
        headline CTC. Green cells are the best value in each row.
      </p>
    </div>
  );
}

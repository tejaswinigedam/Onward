"use client";
import { useEffect, useState } from "react";

interface Signup {
  referred_id: string;
  referrer_id: string;
  code: string;
  signed_up_at: string;
  converted_at: string | null;
  referrer_email: string;
  referrer_name: string;
  referred_email: string;
  referred_name: string;
}
interface Rollup { referrer_id: string; email: string; name: string; signups: number; converted: number }

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** Show the person: name + email, falling back to the id if Clerk lookup failed. */
function Person({ name, email, id }: { name?: string; email?: string; id: string }) {
  if (!email && !name) return <span className="admin-dim" title={id}>{id.slice(0, 14)}…</span>;
  return (
    <span className="ref-person">
      {name && <span className="ref-name">{name}</span>}
      <span className="ref-email" title={id}>{email || `${id.slice(0, 14)}…`}</span>
    </span>
  );
}

export function AdminReferrals() {
  const [data, setData] = useState<{ items: Signup[]; rollup: Rollup[]; totals: { signups: number; converted: number } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/referrals", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => (j.items ? setData(j) : setError(j.error ?? "Failed to load")))
      .catch(() => setError("Network error"));
  }, []);

  if (error) return <p className="opp-none" style={{ color: "var(--amber-d)" }}>{error}</p>;
  if (!data) return <p className="admin-empty">Loading…</p>;

  return (
    <>
      <p className="um-s" style={{ marginBottom: 14 }}>
        {data.totals.signups} referred sign-up{data.totals.signups === 1 ? "" : "s"} · {data.totals.converted} became paying.
      </p>

      <h3 className="admin-subh">By referrer</h3>
      <div className="admin-table-scroll" style={{ marginBottom: 22 }}>
        <table className="admin-table">
          <thead><tr><th>Referrer</th><th>Sign-ups</th><th>Converted</th></tr></thead>
          <tbody>
            {data.rollup.length === 0 ? (
              <tr><td colSpan={3} className="admin-empty">No referrals yet.</td></tr>
            ) : data.rollup.map((r) => (
              <tr key={r.referrer_id}>
                <td><Person name={r.name} email={r.email} id={r.referrer_id} /></td>
                <td>{r.signups}</td>
                <td>{r.converted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="admin-subh">Referred sign-ups</h3>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Referred user</th><th>Referrer</th><th>Code</th><th>Signed up</th><th>Converted</th></tr></thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr><td colSpan={5} className="admin-empty">No referrals yet.</td></tr>
            ) : data.items.map((s) => (
              <tr key={s.referred_id}>
                <td><Person name={s.referred_name} email={s.referred_email} id={s.referred_id} /></td>
                <td><Person name={s.referrer_name} email={s.referrer_email} id={s.referrer_id} /></td>
                <td>{s.code}</td>
                <td className="admin-dim">{fmt(s.signed_up_at)}</td>
                <td>{s.converted_at
                  ? <span className="admin-status s-VERIFIED">Paid</span>
                  : <span className="admin-status s-PENDING_SCREENSHOT">Not yet</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

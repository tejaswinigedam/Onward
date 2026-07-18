"use client";
import { useCallback, useEffect, useState } from "react";

interface PaymentRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  amount: number;
  credits_requested: number;
  status: "PENDING_SCREENSHOT" | "SCREENSHOT_RECEIVED" | "VERIFIED" | "REJECTED";
  notes: string | null;
  created_at: string;
  verified_at: string | null;
  verified_by: string | null;
  referred: boolean;
  referred_by_email: string;
  referred_by_name: string;
  referred_by_id: string;
}

interface Revenue { total: number; payments: number; credits: number }

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const FILTERS: { key: string; label: string; value: string }[] = [
  { key: "actionable", label: "Actionable", value: "PENDING_SCREENSHOT,SCREENSHOT_RECEIVED" },
  { key: "pending", label: "Pending screenshot", value: "PENDING_SCREENSHOT" },
  { key: "received", label: "Screenshot received", value: "SCREENSHOT_RECEIVED" },
  { key: "verified", label: "Verified", value: "VERIFIED" },
  { key: "rejected", label: "Rejected", value: "REJECTED" },
  { key: "all", label: "All", value: "" },
];

const STATUS_LABEL: Record<PaymentRow["status"], string> = {
  PENDING_SCREENSHOT: "Pending screenshot",
  SCREENSHOT_RECEIVED: "Screenshot received",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function AdminPayments({ embedded = false }: { embedded?: boolean }) {
  const [filter, setFilter] = useState("actionable");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const status = FILTERS.find((f) => f.key === filter)?.value ?? "";
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    try {
      const res = await fetch(`/api/admin/payments?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load");
        setRows([]);
      } else {
        setRows(json.items ?? []);
        setRevenue(json.revenue ?? null);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }, [filter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: string, notes?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...(notes !== undefined ? { notes } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Action failed");
      else await load();
    } catch {
      setError("Network error");
    }
    setBusyId(null);
  }

  /** Undo an accidental verify/reject. Verified rows give their credits back. */
  function reopen(row: PaymentRow) {
    const warning =
      row.status === "VERIFIED"
        ? `Move this back to actionable?\n\n${row.credits_requested} credit(s) granted to ${row.email} will be taken back (clamped at 0 if already spent).`
        : "Move this rejected payment back to actionable?";
    if (window.confirm(warning)) void act(row.id, "reopen");
  }

  function editNotes(row: PaymentRow) {
    const next = window.prompt("Notes (txn id / follow-up):", row.notes ?? "");
    if (next !== null) void act(row.id, "edit_notes", next);
  }

  const Wrapper = embedded ? "div" : "main";
  return (
    <Wrapper className={embedded ? "" : "admin-wrap"}>
      <h1 className="admin-title">Payment requests</h1>
      <p className="um-s">Verify screenshots in WhatsApp, then activate credits here.</p>

      {revenue && (
        <div className="rev-strip">
          <div className="rev-stat">
            <span className="rev-label">Revenue</span>
            <span className="rev-value">{inr(revenue.total)}</span>
          </div>
          <div className="rev-stat">
            <span className="rev-label">Verified payments</span>
            <span className="rev-value">{revenue.payments}</span>
          </div>
          <div className="rev-stat">
            <span className="rev-label">Credits sold</span>
            <span className="rev-value">{revenue.credits}</span>
          </div>
        </div>
      )}

      <div className="admin-controls">
        <div className="admin-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`admin-chip${filter === f.key ? " on" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="admin-search"
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="opp-none" style={{ color: "var(--amber-d)" }}>{error}</p>}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Plan</th><th>Amount</th><th>Credits</th>
              <th>Status</th><th>Referred</th><th>Referred by</th>
              <th>Created</th><th>Verified by</th><th>Notes</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="admin-empty">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={12} className="admin-empty">No requests.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="admin-email">{r.email}</td>
                  <td>{r.plan}</td>
                  <td>₹{r.amount}</td>
                  <td>{r.credits_requested}</td>
                  <td><span className={`admin-status s-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td>
                    <span className={`ref-yn ${r.referred ? "yes" : "no"}`}>{r.referred ? "Yes" : "No"}</span>
                  </td>
                  <td>
                    {r.referred ? (
                      <span className="ref-person">
                        {r.referred_by_name && <span className="ref-name">{r.referred_by_name}</span>}
                        <span className="ref-email" title={r.referred_by_id}>
                          {r.referred_by_email || `${r.referred_by_id.slice(0, 14)}…`}
                        </span>
                      </span>
                    ) : <span className="admin-dim">—</span>}
                  </td>
                  <td className="admin-dim">{fmt(r.created_at)}</td>
                  <td className="admin-dim">{r.verified_by ? `${r.verified_by.slice(0, 12)}…` : "—"}</td>
                  <td className="admin-notes">{r.notes || "—"}</td>
                  <td className="admin-actions">
                    {(r.status === "PENDING_SCREENSHOT") && (
                      <button disabled={busyId === r.id} onClick={() => act(r.id, "mark_received")}>Screenshot received</button>
                    )}
                    {(r.status === "PENDING_SCREENSHOT" || r.status === "SCREENSHOT_RECEIVED") && (
                      <>
                        <button className="ok" disabled={busyId === r.id} onClick={() => act(r.id, "verify")}>Verify &amp; activate</button>
                        <button className="bad" disabled={busyId === r.id} onClick={() => act(r.id, "reject")}>Reject</button>
                      </>
                    )}
                    {/* Undo an accidental verify/reject. */}
                    {(r.status === "VERIFIED" || r.status === "REJECTED") && (
                      <button className="undo" disabled={busyId === r.id} onClick={() => reopen(r)}>
                        Move to actionable
                      </button>
                    )}
                    <button onClick={() => editNotes(r)}>Notes</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Wrapper>
  );
}

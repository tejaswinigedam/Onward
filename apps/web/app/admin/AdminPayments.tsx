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
}

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

  function editNotes(row: PaymentRow) {
    const next = window.prompt("Notes (txn id / follow-up):", row.notes ?? "");
    if (next !== null) void act(row.id, "edit_notes", next);
  }

  const Wrapper = embedded ? "div" : "main";
  return (
    <Wrapper className={embedded ? "" : "admin-wrap"}>
      <h1 className="admin-title">Payment requests</h1>
      <p className="um-s">Verify screenshots in WhatsApp, then activate credits here.</p>

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
              <th>Status</th><th>Created</th><th>Verified by</th><th>Notes</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="admin-empty">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} className="admin-empty">No requests.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="admin-email">{r.email}</td>
                  <td>{r.plan}</td>
                  <td>₹{r.amount}</td>
                  <td>{r.credits_requested}</td>
                  <td><span className={`admin-status s-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
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

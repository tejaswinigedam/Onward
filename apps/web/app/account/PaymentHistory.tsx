"use client";
import { useEffect, useState } from "react";

interface Payment {
  id: string;
  plan: string;
  amount: number;
  credits_requested: number;
  status: "PENDING_SCREENSHOT" | "SCREENSHOT_RECEIVED" | "VERIFIED" | "REJECTED";
  created_at: string;
  verified_at: string | null;
}

const STATUS_LABEL: Record<Payment["status"], string> = {
  PENDING_SCREENSHOT: "Awaiting screenshot",
  SCREENSHOT_RECEIVED: "Under review",
  VERIFIED: "Activated",
  REJECTED: "Rejected",
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });

export function PaymentHistory() {
  const [items, setItems] = useState<Payment[] | null>(null);

  useEffect(() => {
    fetch("/api/me/payments", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setItems(j.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <p className="um-s">Loading your payments…</p>;
  if (items.length === 0) return <p className="acct-empty">No payments yet.</p>;

  return (
    <div className="pay-history">
      {items.map((p) => (
        <div className="pay-row" key={p.id}>
          <div className="pay-main">
            <span className="pay-amt">₹{p.amount}</span>
            <span className="pay-credits">{p.credits_requested} credit{p.credits_requested > 1 ? "s" : ""}</span>
          </div>
          <span className="pay-date">{fmt(p.created_at)}</span>
          <span className={`pay-status s-${p.status}`}>{STATUS_LABEL[p.status]}</span>
        </div>
      ))}
    </div>
  );
}

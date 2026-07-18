"use client";
import { useState } from "react";
import { AdminPayments } from "./AdminPayments";
import { AdminReferrals } from "./AdminReferrals";

/** Admin portal shell with Payments / Referrals tabs. */
export function AdminTabs() {
  const [tab, setTab] = useState<"payments" | "referrals">("payments");
  return (
    <main className="admin-wrap">
      <div className="admin-tabs">
        <button className={`admin-tab${tab === "payments" ? " on" : ""}`} onClick={() => setTab("payments")}>Payments</button>
        <button className={`admin-tab${tab === "referrals" ? " on" : ""}`} onClick={() => setTab("referrals")}>Referrals</button>
      </div>
      {tab === "payments" ? <AdminPayments embedded /> : (
        <>
          <h1 className="admin-title">Referrals</h1>
          <AdminReferrals />
        </>
      )}
    </main>
  );
}

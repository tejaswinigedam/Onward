"use client";
import { useState } from "react";
import { AdminStats } from "./AdminStats";
import { AdminPayments } from "./AdminPayments";
import { AdminReferrals } from "./AdminReferrals";

/** Admin portal shell with Overview / Payments / Referrals tabs. */
export function AdminTabs() {
  const [tab, setTab] = useState<"overview" | "payments" | "referrals">("overview");
  return (
    <main className="admin-wrap">
      <div className="admin-tabs">
        <button className={`admin-tab${tab === "overview" ? " on" : ""}`} onClick={() => setTab("overview")}>Overview</button>
        <button className={`admin-tab${tab === "payments" ? " on" : ""}`} onClick={() => setTab("payments")}>Payments</button>
        <button className={`admin-tab${tab === "referrals" ? " on" : ""}`} onClick={() => setTab("referrals")}>Referrals</button>
      </div>
      {tab === "overview" && (
        <>
          <h1 className="admin-title">Overview</h1>
          <AdminStats />
        </>
      )}
      {tab === "payments" && <AdminPayments embedded />}
      {tab === "referrals" && (
        <>
          <h1 className="admin-title">Referrals</h1>
          <AdminReferrals />
        </>
      )}
    </main>
  );
}

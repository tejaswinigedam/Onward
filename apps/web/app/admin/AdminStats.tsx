"use client";
import { useEffect, useState } from "react";

interface Stats {
  users: number;
  referrals: number;
  payments: number;
  referralPayments: number;
}

const TILES: { key: keyof Stats; label: string }[] = [
  { key: "users", label: "Number of users" },
  { key: "referrals", label: "Number of referrals" },
  { key: "payments", label: "Number of payments" },
  { key: "referralPayments", label: "Referral payments" },
];

/** Admin overview: the four headline counters. */
export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => (j.error ? setError(j.error) : setStats(j)))
      .catch(() => setError("Couldn't load stats."));
  }, []);

  if (error) return <p className="um-s">{error}</p>;
  if (!stats) return <p className="um-s">Loading…</p>;

  return (
    <div className="admin-stat-grid">
      {TILES.map((t) => (
        <div className="admin-stat" key={t.key}>
          <div className="admin-stat-v">{stats[t.key].toLocaleString("en-IN")}</div>
          <div className="admin-stat-l">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

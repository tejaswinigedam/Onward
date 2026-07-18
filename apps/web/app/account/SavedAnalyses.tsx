"use client";
import { useEffect, useState } from "react";
import type { OfferAnalysis } from "@/lib/offer-analysis";
import { OfferReport } from "../offer/OfferReport";
import { GlossaryProvider, GlossaryPanel } from "@/components/Glossary";

interface SavedItem {
  id: string;
  analysis: OfferAnalysis;
  unlocked: boolean;
  title: string | null;
  created_at: string;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
const ctcFmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

/**
 * The user's saved analyses — one row per document with the key facts up
 * front (uploaded date, annual CTC, unlock status); "View Analysis" expands
 * that row in place to the full report.
 */
export function SavedAnalyses() {
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/analyses", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setItems(j.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <p className="um-s">Loading your saved analyses…</p>;
  if (items.length === 0) return null;

  return (
    <GlossaryProvider>
      <h2 className="acct-h2">Your Analyses ({items.length})</h2>
      <div className="saved-list">
        {items.map((it) => {
          const open = openId === it.id;
          return (
            <div className="saved-item" key={it.id}>
              <button
                type="button"
                className="saved-row"
                onClick={() => setOpenId(open ? null : it.id)}
                aria-expanded={open}
                data-ev="dash_view_analysis"
              >
                <span className="saved-icon"><DocIcon /></span>
                <span className="saved-info">
                  <span className="saved-title">{it.title || "Saved analysis"}</span>
                  <span className="saved-meta">Uploaded {fmt(it.created_at)}</span>
                  <span className="saved-meta">Annual CTC {ctcFmt(it.analysis.annualCTC)}</span>
                  <span className={`saved-status${it.unlocked ? " done" : ""}`}>
                    Status: {it.unlocked ? "Complete" : "Locked"}
                  </span>
                </span>
                <span className="saved-view">
                  {open ? "Hide" : "View Analysis"} <span aria-hidden="true">→</span>
                </span>
              </button>

              {open && (
                <div className="saved-detail">
                  <OfferReport
                    a={it.analysis}
                    lock={it.unlocked ? undefined : { locked: true, unlockLabel: "Unlock in the decoder", unlockHint: "Open the Pay Decoder to unlock the full analysis" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <GlossaryPanel />
    </GlossaryProvider>
  );
}

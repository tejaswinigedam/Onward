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

const StackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

/**
 * Saved analyses, collapsed to a single summary card (icon + count + a one-line
 * brief) until the user taps it — expanding into the full reports in place.
 */
export function SavedAnalyses() {
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [open, setOpen] = useState(false);

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
      <button
        type="button"
        className="analyses-summary"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-ev="dash_analyses_toggle"
      >
        <span className="analyses-summary-icon">
          <StackIcon />
          <span className="analyses-summary-count">{items.length}</span>
        </span>
        <span className="analyses-summary-body">
          <span className="analyses-summary-title">
            {items.length} saved analys{items.length === 1 ? "is" : "es"}
          </span>
          <span className="analyses-summary-sub">
            {open ? "Tap to collapse" : "Your salary & offer breakdowns so far — tap to view"}
          </span>
        </span>
        <span className={`analyses-summary-chev${open ? " open" : ""}`} aria-hidden="true">›</span>
      </button>

      {open && (
        <div className="saved-list">
          {items.map((it) => (
            <div className="saved-item" key={it.id}>
              <div className="saved-head">
                <span className="saved-title">{it.title || "Saved analysis"}</span>
                <span className="saved-date">{fmt(it.created_at)}</span>
              </div>
              <OfferReport a={it.analysis} lock={it.unlocked ? undefined : { locked: true, unlockLabel: "Unlock in the decoder", unlockHint: "Open the Pay Decoder to unlock the full analysis" }} />
            </div>
          ))}
        </div>
      )}
      <GlossaryPanel />
    </GlossaryProvider>
  );
}

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

/** Renders the user's saved analysis reports (full when unlocked, else the free breakdown). */
export function SavedAnalyses() {
  const [items, setItems] = useState<SavedItem[] | null>(null);

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
      <GlossaryPanel />
    </GlossaryProvider>
  );
}

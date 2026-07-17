"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DECODER_MODES, getDecoderMode, type DecoderModeConfig, type DecoderModeId } from "./decoder-modes";
import { DecoderModeIcon } from "./decoder-icons";
import { DecoderUpload } from "./DecoderUpload";
import { CreditGate } from "./CreditGate";
import { FREE_FEATURES, PAID_FEATURES } from "@/lib/credits-config";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const LockGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** Shows exactly what's free vs behind the 1-credit lock for the chosen mode. */
function FreePaidStrip({ mode }: { mode: DecoderModeConfig }) {
  const isCompare = mode.id === "two-offers";
  const free = isCompare ? ["We decode every offer you upload"] : FREE_FEATURES;
  const paid = isCompare
    ? ["Which offer pays more, guaranteed in hand", "Side-by-side comparison + where the fine print differs", "Tax regime & savings on each"]
    : PAID_FEATURES;
  return (
    <div className="fp-strip">
      <div className="fp-col fp-free">
        <div className="fp-head"><span className="fp-tag free">Free</span><span className="fp-sub">No account needed</span></div>
        <ul>{free.map((f) => <li key={f}><span className="fp-tick"><Check /></span>{f}</li>)}</ul>
      </div>
      <div className="fp-col fp-paid">
        <div className="fp-head"><span className="fp-tag paid"><LockGlyph /> 1 credit</span><span className="fp-sub">Unlocks the analysis</span></div>
        <ul>{paid.map((f) => <li key={f}><span className="fp-lock"><LockGlyph /></span>{f}</li>)}</ul>
      </div>
    </div>
  );
}

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="13 5 20 12 13 19" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12 9 17 20 6" />
  </svg>
);

export function PayDecoder() {
  const sp = useSearchParams();
  const initial = getDecoderMode(sp.get("mode")) ? (sp.get("mode") as DecoderModeId) : null;
  const [modeId, setModeId] = useState<DecoderModeId | null>(initial);
  const mode = modeId ? getDecoderMode(modeId) : undefined;

  if (!mode) return <ModePicker onPick={setModeId} />;
  return <ModeFlow mode={mode} onBack={() => setModeId(null)} />;
}

function ModePicker({ onPick }: { onPick: (id: DecoderModeId) => void }) {
  return (
    <div className="decoder-modes">
      {DECODER_MODES.map((m) => (
        <button key={m.id} className="decoder-mode-card" onClick={() => onPick(m.id)}>
          <span className="dm-icon"><DecoderModeIcon id={m.id} /></span>
          <span className="dm-chip">{m.multi ? `${m.minFiles === m.maxFiles ? m.minFiles : `${m.minFiles}+`} documents` : "Single document"}</span>
          <span className="dm-title">{m.title}</span>
          <span className="dm-tag">{m.tagline}</span>
          <ul className="dm-list">
            {m.whatYouGet.map((w) => (
              <li key={w}><span className="dm-tick"><Check /></span>{w}</li>
            ))}
          </ul>
          <span className="dm-go">Start <ArrowRight /></span>
        </button>
      ))}
    </div>
  );
}

function ModeFlow({ mode, onBack }: { mode: DecoderModeConfig; onBack: () => void }) {
  return (
    <div className="decoder-flow">
      <button className="decoder-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="20" y1="12" x2="4" y2="12" />
          <polyline points="11 19 4 12 11 5" />
        </svg>
        Choose a different document
      </button>

      <div className="decoder-flow-head">
        <span className="dm-icon"><DecoderModeIcon id={mode.id} /></span>
        <div>
          <h3 className="decoder-flow-title">{mode.title}</h3>
          <p className="decoder-flow-tag">{mode.tagline}</p>
        </div>
      </div>
      <ul className="decoder-flow-list">
        {mode.whatYouGet.map((w) => (
          <li key={w}><span className="dm-tick"><Check /></span>{w}</li>
        ))}
      </ul>

      <FreePaidStrip mode={mode} />

      <DecoderGate mode={mode} />
    </div>
  );
}

/**
 * Credit-gated when Clerk is configured (browsing open, analysis costs credits;
 * see {@link CreditGate}). Local dev without Clerk keys decodes freely.
 */
function DecoderGate({ mode }: { mode: DecoderModeConfig }) {
  return clerkEnabled ? <CreditGate mode={mode} /> : <DecoderUpload mode={mode} />;
}

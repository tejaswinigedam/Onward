"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { DECODER_MODES, getDecoderMode, type DecoderModeConfig, type DecoderModeId } from "./decoder-modes";
import { DecoderModeIcon } from "./decoder-icons";
import { DecoderUpload } from "./DecoderUpload";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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

      <DecoderGate mode={mode} />
    </div>
  );
}

/** Preserves the sign-in gate: uploading requires an account when Clerk is on. */
function DecoderGate({ mode }: { mode: DecoderModeConfig }) {
  return clerkEnabled ? <GatedUpload mode={mode} /> : <DecoderUpload mode={mode} />;
}

function GatedUpload({ mode }: { mode: DecoderModeConfig }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && !isSignedIn) {
    return (
      <div className="upload-card">
        <p className="um-t">Sign in to decode your document</p>
        <p className="um-s">
          <a href="/sign-up" style={{ color: "var(--accent)", fontWeight: 700 }}>Create a free account</a> to
          upload and decode {mode.multi ? "your documents" : "your document"} — processed in memory, never stored.
        </p>
      </div>
    );
  }
  return <DecoderUpload mode={mode} />;
}

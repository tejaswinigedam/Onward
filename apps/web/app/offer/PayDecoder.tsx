"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
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

/**
 * Once a mode is picked, nothing about that mode — not even the free/paid
 * breakdown — renders for a signed-out visitor. They see only the back
 * button and a sign-in prompt; the mode header, "what you get" list, and
 * upload UI only appear once they're authenticated.
 */
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

      <ModeFlowGate mode={mode} />
    </div>
  );
}

/** Gates the whole mode flow (not just the upload) behind sign-in. */
function ModeFlowGate({ mode }: { mode: DecoderModeConfig }) {
  return clerkEnabled ? <AuthedModeFlow mode={mode} /> : <ModeFlowBody mode={mode} />;
}

function AuthedModeFlow({ mode }: { mode: DecoderModeConfig }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <SignInGate />;
  return <ModeFlowBody mode={mode} />;
}

function ModeFlowBody({ mode }: { mode: DecoderModeConfig }) {
  return (
    <>
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

      <CreditGate mode={mode} />
    </>
  );
}

/** Sign-in prompt shown in place of the entire mode flow for anonymous visitors. */
function SignInGate() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const qs = sp.toString();
  const backUrl = qs ? `${pathname}?${qs}` : pathname;
  const redirect = encodeURIComponent(backUrl);

  return (
    <div className="lock-card">
      <div className="lock-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </div>
      <p className="lock-title">Sign in to continue</p>
      <p className="lock-hint" style={{ marginTop: 0 }}>
        Create a free account (or sign in) to upload your document and see your breakdown.
      </p>
      <Link href={`/sign-in?redirect_url=${redirect}`} className="lock-btn" data-ev="decoder_gate_signin">
        Sign in to continue
      </Link>
      <p className="lock-hint">
        New here? <Link href={`/sign-up?redirect_url=${redirect}`}>Create an account</Link>
      </p>
    </div>
  );
}

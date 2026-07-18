import Link from "next/link";
import { ReferFriend } from "./ReferFriend";
import { LearningTeaser } from "./LearningTeaser";
import { BuyCreditsPanel } from "./BuyCreditsPanel";
import { SavedAnalyses } from "@/app/account/SavedAnalyses";
import { DECODER_MODES } from "@/app/offer/decoder-modes";

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" />
  </svg>
);

/**
 * The main event on the dashboard: a large, properly explained Pay Decoder
 * section with every flow one click away. This leads the page — credits and
 * buying sit further down.
 */
function DecoderShowcase() {
  return (
    <section className="dash-hero">
      <span className="dash-eyebrow">Pay Decoder</span>
      <h2 className="dash-hero-h">Start your analysis</h2>
      <p className="dash-hero-sub">
        Upload an offer letter or a payslip and Onward reads it like a friend who works in
        finance — every component, every deduction, and what actually lands in your account.
        Your full salary breakdown is <strong>free</strong>; one credit unlocks the deeper
        analysis.
      </p>

      <div className="dash-modes">
        {DECODER_MODES.map((m) => (
          <Link key={m.id} href={`/offer?mode=${m.id}`} className="dash-mode" data-ev="dash_mode" data-ev-label={m.id}>
            <span className="dash-mode-chip">{m.multi ? `${m.minFiles}+ documents` : "Single document"}</span>
            <span className="dash-mode-title">{m.title}</span>
            <span className="dash-mode-tag">{m.tagline}</span>
            <span className="dash-mode-go">Start <ArrowRight /></span>
          </Link>
        ))}
      </div>

      <div className="dash-hero-foot">
        <Link href="/offer" className="btn btn-accent btn-lg" data-ev="dash_decoder">
          Explore Decoder <ArrowRight />
        </Link>
        <span className="dash-free-note">
          <span className="dfn-free">Free — your full salary breakdown</span>
          <span className="dfn-dot">•</span>
          <span className="dfn-paid">1 credit — the analysis</span>
        </span>
      </div>
    </section>
  );
}

/**
 * The signed-in user's dashboard. Shown on /account and, once signed in, on the
 * landing page too.
 *
 * Order: name + credits, then (if any) a one-line saved-analyses summary, then
 * the Pay Decoder, then the learning teaser, then buy-credits last.
 */
export function UserDashboard({
  name,
  balance,
  hasSaved = false,
}: {
  name: string;
  balance: number;
  hasSaved?: boolean;
}) {
  const empty = balance <= 0;
  return (
    <>
      <div className="acct-top">
        <div>
          <h1 className="acct-hi">Hi, {name}</h1>
          <p className={`acct-credits${empty ? " empty" : ""}`}>
            {balance} credit{balance === 1 ? "" : "s"}{empty ? "" : " left"}
          </p>
        </div>
        <ReferFriend />
      </div>

      {hasSaved && (
        <section className="acct-sec">
          <SavedAnalyses />
        </section>
      )}

      <DecoderShowcase />

      <section className="acct-sec"><LearningTeaser /></section>

      {/* Credits last — the decoder is what they came for. */}
      <BuyCreditsPanel compact={!empty} />
    </>
  );
}

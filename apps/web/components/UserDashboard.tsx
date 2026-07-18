import Link from "next/link";
import { ReferFriend } from "./ReferFriend";
import { LearningTeaser } from "./LearningTeaser";
import { BuyCreditsPanel } from "./BuyCreditsPanel";
import { SavedAnalyses } from "@/app/account/SavedAnalyses";

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" />
  </svg>
);

/** "Start your analysis" — the decoder entry point, with a line about what it does. */
function StartAnalysis() {
  return (
    <section className="acct-sec dash-start">
      <h2 className="acct-h2">Start your analysis</h2>
      <p className="acct-lead">
        Upload an offer letter or payslip and we&apos;ll decode every line — your full salary
        and component breakdown, free. Compare two offers, or check an offer against a payslip.
      </p>
      <Link href="/offer" className="btn btn-accent btn-lg" data-ev="dash_decoder">
        Explore Decoder <ArrowRight />
      </Link>
    </section>
  );
}

/**
 * The signed-in user's dashboard. Shown on /account and, once signed in, on the
 * landing page too.
 *
 * - 0 credits  → name · 0 credits · buy credits (pricing plans) · start analysis · learning
 * - has credits → name · credits · saved analyses · start analysis · learning · buy more
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

      {empty ? (
        <>
          <BuyCreditsPanel />
          <StartAnalysis />
          <section className="acct-sec"><LearningTeaser /></section>
        </>
      ) : (
        <>
          {hasSaved && (
            <section className="acct-sec">
              <h2 className="acct-h2">Your saved analyses</h2>
              <SavedAnalyses />
            </section>
          )}
          <StartAnalysis />
          <section className="acct-sec"><LearningTeaser /></section>
          <BuyCreditsPanel compact />
        </>
      )}
    </>
  );
}

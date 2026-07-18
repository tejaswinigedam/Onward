import Link from "next/link";

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" />
  </svg>
);

const TOPICS = [
  "How your CTC becomes your in-hand salary",
  "Understanding taxes, deductions and benefits",
  "Salary terms — HRA, ESOPs, gratuity — in plain English",
];

/** "No documents? No problem" learning block, reused on the account page. */
export function LearningTeaser() {
  return (
    <div className="learn-teaser">
      <div className="learn-teaser-head">
        <h3>No documents? No problem</h3>
        <p>Learn the fundamentals of salary and compensation — before an offer ever lands.</p>
      </div>
      <ul className="learn-teaser-list">
        {TOPICS.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <Link href="/salary" className="btn btn-ghost" data-ev="account_learning">
        Explore Learning <ArrowRight />
      </Link>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Onward — Understand your pay. Own your money.",
  description:
    "Whether you're opening your first offer letter or checking your latest payslip, Onward helps you understand what it means, spot what matters, and make smarter money decisions.",
};

const arrow = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const QUESTIONS: { q: string; c: string }[] = [
  { q: "What is variable pay?", c: "c1" },
  { q: "Why is my in-hand salary lower?", c: "c2" },
  { q: "What does gratuity actually mean?", c: "c3" },
  { q: "Why am I paying professional tax?", c: "c4" },
  { q: "Should I care about my notice period?", c: "c5" },
  { q: "What are ESOPs?", c: "c6" },
  { q: "Is this deduction normal?", c: "c7" },
];

const MATTERS = [
  "What's completely normal.",
  "What deserves another look.",
  "What you should ask HR.",
  "What could affect your future income.",
  "Where you could negotiate.",
  "What you might be missing.",
];

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <h1 className="lp-h1">
              Understand your pay. <span className="g">Own your money.</span>
            </h1>
            <p className="lp-lead">
              Whether you&apos;re opening your first offer letter or checking your latest payslip,
              Onward helps you understand what it means, spot what matters, and make smarter money
              decisions.
            </p>
            <div className="lp-cta-row">
              <Link href="/offer" className="lp-btn p">Explore Pay Decoder {arrow}</Link>
              <Link href="/salary" className="lp-btn s">Start Learning</Link>
            </div>
          </div>
        </section>

        {/* SECTION 1 — pay is confusing */}
        <section className="lp-sec">
          <div className="lp-wrap lp-center">
            <p className="lp-kicker">The problem</p>
            <h2 className="lp-h2">Pay is confusing. It shouldn&apos;t be.</h2>
            <p className="lp-sub">Most people only know two numbers:</p>
            <div className="lp-nums">
              <div className="lp-num"><div className="k">You know</div><div className="v">Your CTC</div></div>
              <div className="lp-num two"><div className="k">You know</div><div className="v">Your in-hand salary</div></div>
            </div>
            <p className="lp-mystery">Everything in between? Usually a mystery.</p>
            <p className="lp-sub">
              Onward helps you understand what you&apos;re earning, what&apos;s being deducted, what
              to look out for, and where you can make better decisions.
            </p>
          </div>
        </section>

        {/* SECTION 2 — two paths */}
        <section className="lp-sec alt">
          <div className="lp-wrap lp-center">
            <p className="lp-kicker">Two ways in</p>
            <h2 className="lp-h2">However you start, we&apos;ve got you.</h2>
          </div>
          <div className="lp-wrap">
            <div className="lp-paths">
              {/* learn */}
              <div className="lp-path learn">
                <span className="lp-path-tag">I&apos;m here to learn</span>
                <h3>No documents? No problem.</h3>
                <p>You don&apos;t need an offer letter to become pay-smart.</p>
                <div className="lp-tiles">
                  <Link href="/salary" className="lp-tile">
                    <span className="ic" style={{ background: "var(--green-0)" }}>📖</span>
                    Offer Explorer — read an offer before you get one
                    <span className="ar">{arrow}</span>
                  </Link>
                  <Link href="/offer" className="lp-tile">
                    <span className="ic" style={{ background: "var(--green-0)" }}>⚖️</span>
                    Choose the Better Offer — what actually makes one better
                    <span className="ar">{arrow}</span>
                  </Link>
                </div>
                <Link href="/salary" className="lp-btn s">Explore Learning</Link>
              </div>

              {/* documents */}
              <div className="lp-path docs">
                <span className="lp-path-tag">I have documents</span>
                <h3>Bring your offer letter or payslip.</h3>
                <p>We&apos;ll explain everything — and tell you what actually matters.</p>
                <div className="lp-tiles">
                  <Link href="/offer" className="lp-tile"><span className="ic" style={{ background: "var(--indigo-0)" }}>📄</span>Offer Letter<span className="ar">{arrow}</span></Link>
                  <Link href="/offer" className="lp-tile"><span className="ic" style={{ background: "var(--indigo-0)" }}>🧾</span>Payslip<span className="ar">{arrow}</span></Link>
                  <Link href="/offer" className="lp-tile"><span className="ic" style={{ background: "var(--indigo-0)" }}>🔀</span>Compare Two Offers<span className="ar">{arrow}</span></Link>
                  <Link href="/offer" className="lp-tile"><span className="ic" style={{ background: "var(--indigo-0)" }}>🔎</span>Offer Letter vs Payslip<span className="ar">{arrow}</span></Link>
                </div>
                <Link href="/offer" className="lp-btn p">Open Pay Decoder {arrow}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — what matters */}
        <section className="lp-sec">
          <div className="lp-wrap">
            <div className="lp-dark">
              <p className="lp-kicker" style={{ color: "#C4BBFF" }}>Not just a report</p>
              <h2 className="lp-h2">
                We don&apos;t just explain your pay.
                <br />We tell you what actually matters.
              </h2>
              <p className="lp-sub" style={{ color: "rgba(255,255,255,.6)" }}>
                Instead of leaving you with a complicated report, Onward helps you understand:
              </p>
              <div className="lp-matters">
                {MATTERS.map((m) => (
                  <div className="lp-matter" key={m}><span className="d">✓</span>{m}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — never Google again */}
        <section className="lp-sec alt">
          <div className="lp-wrap lp-center">
            <p className="lp-kicker">Answers, in plain English</p>
            <h2 className="lp-h2">Things you&apos;ll never have to Google again.</h2>
          </div>
          <div className="lp-wrap">
            <div className="lp-qgrid">
              {QUESTIONS.map(({ q, c }) => (
                <Link href="/offer" className={`lp-q ${c}`} key={q}>
                  <span className="qm">?</span>
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5 — lifecycle */}
        <section className="lp-sec">
          <div className="lp-wrap lp-center">
            <p className="lp-kicker">Grows with you</p>
            <h2 className="lp-h2">From your first offer to your fiftieth payslip.</h2>
            <p className="lp-sub">
              Whether you&apos;re starting your career or already working, Onward grows with you.
            </p>
            <div className="lp-steps">
              {["Learn", "Decode", "Compare", "Decide"].map((s, i) => (
                <div className="lp-step" key={s}><div className="n">0{i + 1}</div><div className="t">{s}</div></div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-final">
          <div className="cta-glow" />
          <h2>Your pay shouldn&apos;t feel like a puzzle. Let&apos;s fix that.</h2>
          <p>Decode your offer or payslip in seconds.</p>
          <div className="lp-cta-row">
            <Link href="/offer" className="lp-btn light">Explore Pay Decoder {arrow}</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

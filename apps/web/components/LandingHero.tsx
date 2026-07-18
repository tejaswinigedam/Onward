"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ReferFriendSection } from "./ReferFriendSection";
import { PLANS, pricePerCredit, FREE_FEATURES, PAID_FEATURES, OFFER_LABEL } from "@/lib/credits-config";

/* ---- inline outline icons (match the design's stroke SVGs) ---- */
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
const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);
const SlipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
    <line x1="9" y1="7" x2="15" y2="7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);
const FlagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 3v18" />
    <path d="M4 4h13l-3 4 3 4H4" />
  </svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9l10-5 10 5-10 5-10-5z" />
    <path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
  </svg>
);
const TrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 6" />
    <polyline points="14 6 21 6 21 13" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const ScalesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M5 8l-3 6a4 4 0 0 0 6 0zM19 8l-3 6a4 4 0 0 0 6 0zM5 8h14" />
  </svg>
);
const FlowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="10 8 14 12 10 16" />
  </svg>
);
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 5h7a3 3 0 0 1 3 3v11a2.5 2.5 0 0 0-2.5-2.5H2z" />
    <path d="M22 5h-7a3 3 0 0 0-3 3v11a2.5 2.5 0 0 1 2.5-2.5H22z" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
  </svg>
);

const YIELDS = [
  "Understand every salary component",
  "Compare offers side by side",
  "Check offer vs payslip",
  "Tax regime guidance",
  "Personalized insights",
  "Plain-English, always",
];

const TOPICS: { icon: React.ReactNode; title: string; why: string; last?: boolean }[] = [
  { icon: <DocIcon />, title: "Read an offer letter before you get one", why: "Know exactly what each clause means, before you're staring at one under pressure" },
  { icon: <ScalesIcon />, title: "What makes one offer better than another", why: "Compare more than the number on top — see what's really being offered" },
  { icon: <FlowIcon />, title: "How does your CTC become your in-hand salary", why: "Follow the exact path from the headline number to what actually lands in your account" },
  { icon: <TagIcon />, title: "Understanding taxes, deductions and benefits", why: "See where every deduction comes from and what you're actually paying for" },
  { icon: <BookIcon />, title: "Common salary terms explained in plain English", why: "No more Googling HRA, ESOPs or gratuity in the middle of a negotiation", last: true },
];

const FAQS = [
  { q: "What to ask HR before you sign", a: "We surface the specific questions worth raising — vesting schedules, bonus conditions, notice periods — before you commit to anything" },
  { q: "Where you can negotiate", a: "Not every number on the page is fixed. We point out the components that typically have room to move" },
  { q: "What's affecting your take-home pay", a: "From tax regime to PF contributions, we break down exactly what's shrinking the number between your CTC and your bank account" },
  { q: "What you might be missing", a: "Clauses, caps and fine print are easy to skim past. We flag the parts of your document most people miss" },
];

export function LandingHero() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll(".onward-landing [data-reveal]").forEach((el) => io.observe(el));

    const t = setTimeout(() => document.getElementById("heroDoc")?.classList.add("reveal"), 600);

    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  const toggleFaq = (e: React.MouseEvent<HTMLDivElement>) => {
    const item = (e.currentTarget as HTMLElement).closest(".faq-item");
    if (!item) return;
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".onward-landing .faq-item").forEach((i) => i.classList.remove("open"));
    if (!wasOpen) item.classList.add("open");
  };

  return (
    <div className="onward-landing">
      <SiteHeader />

      {/* HERO */}
      <section className="hero wrap">
        <div className="blob" />
        <div className="hero-copy" data-reveal>
          <span className="eyebrow">Salary, decoded</span>
          <h1>Understand your pay<br />Own your money</h1>
          <p className="hero-sub">
            Whether you&apos;re opening your first offer letter or checking your latest payslip, Onward
            helps you understand what it means, spot what matters, and make smarter money decisions
          </p>
          <p className="hero-tag">Get analysis in one go</p>
          <div className="hero-actions">
            <Link href="/offer" className="btn btn-accent btn-lg" data-ev="cta_click" data-ev-label="hero_decoder">
              Explore Pay Decoder <ArrowRight />
            </Link>
          </div>
        </div>

        <div className="doc-stage" data-reveal>
          <div className="doc-card" id="heroDoc">
            <div className="doc-head">
              <div>
                <span className="t1">Offer Letter</span>
                <div className="t2">Compensation Breakdown</div>
              </div>
              <span className="doc-badge">Decoded</span>
            </div>
            <div className="doc-line"><span>Base Salary</span><b className="mark-hl">₹9,60,000</b></div>
            <div className="doc-line"><span>HRA</span><b className="mark-hl">₹3,84,000</b></div>
            <div className="doc-line"><span>Variable Pay</span><b className="mark-hl">₹1,20,000</b></div>
            <div className="doc-line"><span>Employer PF</span><b>₹57,600</b></div>
            <div className="doc-line" style={{ borderBottom: "none" }}><span>Est In-Hand / mo</span><b className="mark-hl">₹1,08,400</b></div>
          </div>
          <div className="float-chip chip-1">
            <span className="ic"><TagIcon /></span>
            <span><span className="cl">Tax Regime</span><span className="cv">New saves ₹18k</span></span>
          </div>
          <div className="float-chip chip-2">
            <span className="ic"><FlagIcon /></span>
            <span><span className="cl">Flag</span><span className="cv">Below-market HRA</span></span>
          </div>
          <div className="float-chip chip-3">
            <span className="ic"><ChatIcon /></span>
            <span><span className="cl">Ask HR</span><span className="cv">Joining bonus terms</span></span>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="wrap trust-strip" data-reveal>
        <span className="trust-label">Trusted reading for</span>
        <div className="trust-grid">
          <div className="trust-card"><span className="ic"><CapIcon /></span><span className="lbl">First jobs</span></div>
          <div className="trust-card"><span className="ic"><TrendIcon /></span><span className="lbl">Job switches</span></div>
          <div className="trust-card"><span className="ic"><BriefcaseIcon /></span><span className="lbl">Freelancers</span></div>
          <div className="trust-card"><span className="ic"><SlipIcon /></span><span className="lbl">Anyone with a payslip</span></div>
        </div>
      </div>

      {/* PAY DECODER */}
      <section className="decoder" id="decoder">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">Pay Decoder</span>
            <h2>Upload any salary document</h2>
            <p className="sec-sub">
              Whether you have one document or two, Onward reads it like a friend who works in finance —
              and tells you what actually matters
            </p>
          </div>

          <div className="stepper" data-reveal>
            <Link href="/offer?mode=offer" className="step"><div className="step-node"><DocIcon /></div><span className="step-label">Offer Letter</span></Link>
            <div className="step-connector" />
            <Link href="/offer?mode=payslip" className="step"><div className="step-node"><SlipIcon /></div><span className="step-label">Payslip</span></Link>
            <div className="step-connector" />
            <Link href="/offer?mode=two-offers" className="step"><div className="step-node"><DocIcon /></div><span className="step-label">Two Offer Letters</span></Link>
            <div className="step-connector" />
            <Link href="/offer?mode=offer-payslip" className="step"><div className="step-node"><DocIcon /></div><span className="step-label">Offer Letter + Payslip</span></Link>
          </div>

          <div className="yield-grid" data-reveal>
            {YIELDS.map((y) => (
              <div className="yield-box" key={y}><span className="ico"><Check /></span>{y}</div>
            ))}
          </div>

          <div className="decoder-cta" data-reveal>
            <p className="privacy-strip">
              <ShieldIcon />
              Your documents are used exclusively to generate your personalized salary insights. Your
              personal information is never used for any purpose beyond delivering your analysis.
            </p>
            <Link href="/offer" className="btn btn-accent btn-lg" data-ev="cta_click" data-ev-label="decoder_try">
              Try Pay Decoder <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-panel" id="pricing">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">Pricing</span>
            <h2>Free to see. Pay to go deeper</h2>
            <p className="sec-sub">
              Your full salary breakdown is free for everyone. Spend a credit only when you want the
              analysis — what to fix, what to ask, and where the money really goes
            </p>
          </div>

          <div className="lp-split" data-reveal>
            <div className="lp-col">
              <span className="lp-tag free"><Check /> Free for everyone</span>
              <ul>{FREE_FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
            <div className="lp-col paid">
              <span className="lp-tag paid">1 credit unlocks</span>
              <ul>{PAID_FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          </div>

          <div className="lp-plans" data-reveal>
            <span className="lp-offer">{OFFER_LABEL}</span>
            <div className="lp-plan-row">
              {PLANS.map((p) => (
                <div className={`lp-plan${p.badge ? " featured" : ""}`} key={p.id}>
                  {p.badge && <span className="lp-plan-badge">{p.badge}</span>}
                  <span className="lp-plan-name">{p.name}</span>
                  <span className="lp-plan-price">₹{p.amount}</span>
                  <span className="lp-plan-sub">{p.credits} credit{p.credits > 1 ? "s" : ""} · {pricePerCredit(p)}/credit</span>
                  <span className="lp-plan-tagline">{p.tagline}</span>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="btn btn-accent btn-lg" data-ev="cta_click" data-ev-label="see_pricing">
              See full pricing <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* LEARN */}
      <section className="learn-panel" id="learn">
        <div className="wrap learn">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">Learn Before You Earn</span>
            <h2>No documents? No problem</h2>
            <p className="sec-sub">
              Start learning about salary and compensation through interactive explainers and real-world
              scenarios — before an offer ever lands in your inbox
            </p>
          </div>

          <div className="topic-list" data-reveal>
            {TOPICS.map((t) => (
              <div className="topic-row" key={t.title}>
                <span className="ic">{t.icon}</span>
                <div className="tx">
                  <p>{t.title}</p>
                  <span className="why">{t.why}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="learn-foot" data-reveal>
            <p>Built for first-time job seekers and working professionals who want the fundamentals, not the fine print</p>
            <Link href="/salary" className="btn btn-accent btn-lg" data-ev="cta_click" data-ev-label="explore_learning">
              Explore Learning <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* WHY ONWARD */}
      <section className="why-panel">
        <div className="wrap why">
          <div className="why-head" data-reveal>
            <span className="eyebrow">Why Onward</span>
            <h2>We don&apos;t just explain your pay<br />We tell you what actually matters</h2>
          </div>
          <div className="faq-list" data-reveal>
            {FAQS.map((f, i) => (
              <div className={`faq-item${i === 0 ? " open" : ""}`} key={f.q}>
                <div className="faq-q" onClick={toggleFaq}>
                  <span className="faq-q-left"><span className="tick"><Check /></span>{f.q}</span>
                  <span className="plus"><Plus /></span>
                </div>
                <div className="faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFER A FRIEND */}
      <div className="wrap">
        <ReferFriendSection />
      </div>

      {/* FINAL CTA */}
      <section className="final-cta wrap">
        <span className="eyebrow" data-reveal>Ready when you are</span>
        <h2 data-reveal>Your pay shouldn&apos;t feel like a puzzle</h2>
        <p className="sec-sub" data-reveal>Decode your offer letter or payslip in seconds</p>
        <div className="hero-actions" data-reveal>
          <Link href="/offer" className="btn btn-accent btn-lg" data-ev="cta_click" data-ev-label="final_decoder">
            Explore Pay Decoder <ArrowRight />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

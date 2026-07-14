import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";

const arrow = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="hero">
          <div className="hero-inner">
            <h1 className="hero-problem">
              Years of payslips. Lakhs in taxes.
              <br />
              <span className="mute">And still no idea where your money goes.</span>
            </h1>
            <p className="hero-answer">Decode it.</p>
            <p className="hero-sub">
              Onward turns your <strong>salary and offer letters</strong> into plain English —
              and shows you the money you&apos;re leaving on the table.
            </p>
            <div className="hero-actions">
              <Link href="/salary" className="btn-hero">
                Salary Demystifier {arrow}
              </Link>
              <Link href="/offer" className="btn-ghost">
                Offer Letter Analyzer {arrow}
              </Link>
            </div>
          </div>
        </section>

        <section className="cta-section" id="waitlist">
          <div className="cta-glow" />
          <div className="cta-inner">
            <p className="cta-kicker">Early access</p>
            <h2 className="cta-h2">
              Stop guessing.
              <br />
              Start keeping more.
            </h2>
            <p className="cta-sub">
              Join the waitlist — early members get Onward free at launch.
            </p>
            <WaitlistForm source="landing" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

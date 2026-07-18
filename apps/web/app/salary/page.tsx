import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SalaryCalculator } from "./SalaryCalculator";
import { ReferFriendSection } from "@/components/ReferFriendSection";

export const metadata: Metadata = {
  title: "Salary Demystified — Onward",
  description:
    "See a payslip like yours, edit the numbers, and watch your take-home update live — with the money you could save.",
};

export default function SalaryPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <div className="page-kicker">Salary Journey</div>
            <h1 className="page-h1">
              Your salary,
              <br />
              <span className="accent">finally in plain English.</span>
            </h1>
            <p className="page-lead">
              This is a sample payslip — explore it, or drop in your own numbers and watch the
              take-home and opportunities recalculate live. Nothing is saved unless you sign in.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SalaryCalculator />
          </div>
        </section>

        <section className="wrap">
          <ReferFriendSection />
        </section>

        <section className="cta-section">
          <div className="cta-glow" />
          <div className="cta-inner">
            <p className="cta-kicker">Got a real offer or payslip?</p>
            <h2 className="cta-h2">Decode the real thing.</h2>
            <p className="cta-sub">
              Upload your offer letter or payslip and Pay Decoder explains every line, flags what
              matters, and shows where you could save.
            </p>
            <Link href="/offer" className="lp-btn light" style={{ marginTop: 6 }}>
              Open Pay Decoder →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

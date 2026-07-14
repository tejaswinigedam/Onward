import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SalaryCalculator } from "./SalaryCalculator";

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

        <section className="cta-section" id="waitlist">
          <div className="cta-glow" />
          <div className="cta-inner">
            <p className="cta-kicker">Early access</p>
            <h2 className="cta-h2">This is just stage one.</h2>
            <p className="cta-sub">
              Auto-decoding your real offer and year-round tax planning are next. Join the waitlist.
            </p>
            <WaitlistForm source="salary" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

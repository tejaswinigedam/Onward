import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OfferComparator } from "./OfferComparator";
import { OfferMultiUpload } from "./OfferMultiUpload";

export const metadata: Metadata = {
  title: "Pay Decoder — Onward",
  description:
    "Upload your offer letter or payslip and Onward decodes every line — the breakdown, the clauses that matter, and where you could save. Or compare two offers side by side.",
};

export default function OfferPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <div className="page-kicker">Pay Decoder</div>
            <h1 className="page-h1">
              Upload it.
              <br />
              <span className="accent">We&apos;ll explain everything.</span>
            </h1>
            <p className="page-lead">
              Drop in your offer letter or payslip. Onward decodes the full breakdown, flags the
              clauses that matter, shows what to ask HR, and where you could save — in plain English.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <OfferMultiUpload />
          </div>
        </section>

        <section className="sec" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="wrap">
            <div className="section-head" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 28px" }}>
              <p className="page-kicker">No PDF handy?</p>
              <h2 className="sec-h2" style={{ fontSize: 28 }}>Compare offers by hand.</h2>
              <p className="page-lead" style={{ marginTop: 8 }}>
                Type in the CTC and variable split and we&apos;ll show which pays more.
              </p>
            </div>
            <OfferComparator />
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-glow" />
          <div className="cta-inner">
            <p className="cta-kicker">New to this?</p>
            <h2 className="cta-h2">Learn to read pay first.</h2>
            <p className="cta-sub">
              No document yet? The Salary Demystifier teaches you how a payslip works, line by line.
            </p>
            <Link href="/salary" className="lp-btn light" style={{ marginTop: 6 }}>
              Start with Salary Demystifier →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import { OfferComparator } from "./OfferComparator";

export const metadata: Metadata = {
  title: "Offer Letter Analyzer — Onward",
  description:
    "Compare two offers on what actually matters — real monthly take-home and how much is guaranteed vs at-risk.",
};

export default function OfferPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <div className="page-kicker">Offer Letter Analyzer</div>
            <h1 className="page-h1">
              The bigger CTC
              <br />
              <span className="accent">isn&apos;t always the better deal.</span>
            </h1>
            <p className="page-lead">
              Enter two offers. Onward lines them up on real monthly take-home and how much is
              guaranteed vs at-risk — so the winner is obvious.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <OfferComparator />
          </div>
        </section>

        <section className="cta-section" id="waitlist">
          <div className="cta-glow" />
          <div className="cta-inner">
            <p className="cta-kicker">Early access</p>
            <h2 className="cta-h2">Decode the whole letter next.</h2>
            <p className="cta-sub">
              Clause-by-clause decoding of your real offer is coming. Join the waitlist.
            </p>
            <WaitlistForm source="offer" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

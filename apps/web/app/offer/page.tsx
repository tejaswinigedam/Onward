import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PayDecoder } from "./PayDecoder";
import "../landing.css";

export const metadata: Metadata = {
  title: "Pay Decoder — Onward",
  description:
    "Analyze an offer letter or payslip, compare two offers, or check an offer against a payslip — Onward decodes every line in plain English.",
};

export default function OfferPage() {
  return (
    <div className="onward-landing">
      <SiteHeader />

      {/* HERO */}
      <section className="wrap decoder-page-hero">
        <div className="sec-head">
          <span className="eyebrow">Pay Decoder</span>
          <h2>What would you like to decode?</h2>
          <p className="sec-sub">
            Pick what you have. We&apos;ll tell you exactly what analysis to expect — then you upload.
          </p>
          <p className="decoder-free-note">
            <span className="dfn-free">Free — your full salary &amp; component breakdown</span>
            <span className="dfn-dot">•</span>
            <span className="dfn-paid">1 credit — the analysis: tax regime, savings, clauses &amp; what to ask HR</span>
          </p>
        </div>
      </section>

      {/* MODE PICKER → UPLOAD */}
      <section className="wrap decoder-page-tool">
        <Suspense fallback={<div className="upload-card" />}>
          <PayDecoder />
        </Suspense>
      </section>

      <SiteFooter />
    </div>
  );
}

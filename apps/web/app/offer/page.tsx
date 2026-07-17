import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OfferMultiUpload } from "./OfferMultiUpload";
import "../landing.css";

export const metadata: Metadata = {
  title: "Pay Decoder — Onward",
  description:
    "Upload your offer letter or payslip and Onward decodes every line — the breakdown, the clauses that matter, and where you could save.",
};

export default function OfferPage() {
  return (
    <div className="onward-landing">
      <SiteHeader />

      {/* HERO */}
      <section className="wrap decoder-page-hero">
        <div className="sec-head">
          <span className="eyebrow">Pay Decoder</span>
          <h2>Upload any salary document</h2>
          <p className="sec-sub">
            Drop in your offer letter or payslip. Onward decodes the full breakdown, flags the
            clauses that matter, shows what to ask HR, and where you could save — in plain English.
          </p>
        </div>
      </section>

      {/* UPLOAD / DECODER TOOL */}
      <section className="wrap decoder-page-tool">
        <OfferMultiUpload />
      </section>

      <SiteFooter />
    </div>
  );
}

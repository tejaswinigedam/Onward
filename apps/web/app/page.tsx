import type { Metadata } from "next";
import { LandingHero } from "@/components/LandingHero";
import "./landing.css";

export const metadata: Metadata = {
  title: "Onward — Understand your pay. Own your money.",
  description:
    "Whether you're opening your first offer letter or checking your latest payslip, Onward helps you understand what it means, spot what matters, and make smarter money decisions.",
};

export default function LandingPage() {
  return <LandingHero />;
}

import Link from "next/link";
import { BrandMark } from "./BrandMark";

/**
 * Shared site footer in the new (landing) design system. Must be rendered
 * inside a `.onward-landing` scope so the `.lp-footer` styles apply.
 */
export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="wrap foot-row">
        <Link href="/">
          <span className="logo">
            <span className="mark"><BrandMark className="" /></span>
            Onward
          </span>
        </Link>
        <div className="foot-links">
          <a href="/#decoder">Pay Decoder</a>
          <a href="/pricing">Pricing</a>
          <a href="/#learn">Learning</a>
          <a href="#">Privacy</a>
          <a href="#">Contact</a>
          <a href="https://www.instagram.com/join.onward/" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
        <span className="foot-mono">© 2026 Onward — Clarity, on every payslip</span>
      </div>
    </footer>
  );
}

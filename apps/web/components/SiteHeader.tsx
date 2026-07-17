"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BrandMark } from "./BrandMark";
import { LandingAuthActions } from "./LandingAuthActions";

/**
 * Shared site header in the new (landing) design system. Sticky, gains a
 * bottom border once scrolled. Auth-aware actions on the right. Used by the
 * landing page and the Pay Decoder page so both share one look.
 *
 * Must be rendered inside a `.onward-landing` scope so the design tokens and
 * `.lp-header` / `.nav` styles apply.
 */
export function SiteHeader() {
  useEffect(() => {
    const header = document.getElementById("lp-site-header");
    const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header id="lp-site-header" className="lp-header">
      <div className="nav">
        <Link href="/">
          <span className="logo">
            <span className="mark"><BrandMark className="" /></span>
            Onward
          </span>
        </Link>
        <div className="nav-actions">
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <LandingAuthActions />
        </div>
      </div>
    </header>
  );
}

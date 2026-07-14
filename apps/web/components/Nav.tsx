"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { AuthButtons } from "./AuthButtons";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function Nav() {
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`site-nav${lifted ? " lifted" : ""}`}>
      <div className="nav-inner">
        <Link href="/" className="brand">
          <BrandMark />
          <span className="brand-name">Onward</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {clerkEnabled ? (
            <AuthButtons />
          ) : (
            <Link href="/#waitlist" className="btn-nav">
              Join Waitlist
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

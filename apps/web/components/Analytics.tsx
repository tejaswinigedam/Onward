"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GA_ID, track } from "@/lib/analytics";

/**
 * Loads GA4 and wires up two things:
 *  1. A page_view on every client-side route change (GA sends the first one on
 *     load; App Router navigations don't reload the page, so we send them here).
 *  2. A single delegated click listener: any element with a `data-ev` attribute
 *     fires that event name (plus an optional `data-ev-label`). This lets us
 *     track server-rendered links/buttons without making them client components.
 *
 * Renders nothing (and loads no script) when NEXT_PUBLIC_GA_ID is unset.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID) return;
    track("page_view", { page_path: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-ev]");
      if (!el) return;
      const label = el.dataset.evLabel;
      track(el.dataset.ev!, label ? { label } : {});
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}

/**
 * Thin Google Analytics 4 wrapper. Analytics is only active when
 * NEXT_PUBLIC_GA_ID is set (so local dev / preview builds stay clean).
 *
 * GA4 automatically reports users, sessions and page_view (how many people are
 * using the app). `track()` layers on custom events for button clicks, uploads
 * and saves so you can see which actions people actually take.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type Params = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: Params = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("event", event, params);
}

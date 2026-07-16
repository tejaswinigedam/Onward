"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { lookup, type GlossaryEntry } from "@/lib/glossary";
import { track } from "@/lib/analytics";

/**
 * Glossary interaction for decoded offers.
 *  - <Term>Annual CTC</Term> underlines a term, shows a short definition on
 *    hover, and opens the full explanation in a right-hand panel on click.
 *  - <GlossaryPanel/> is the slide-in panel; drop it once inside a provider.
 * Wrap the report in <GlossaryProvider> so terms and the panel share state.
 */

interface Ctx {
  active: GlossaryEntry | null;
  open: (e: GlossaryEntry) => void;
  close: () => void;
}
const GlossaryContext = createContext<Ctx | null>(null);

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<GlossaryEntry | null>(null);
  return (
    <GlossaryContext.Provider
      value={{
        active,
        open: (e) => {
          setActive(e);
          track("glossary_open", { term: e.key });
        },
        close: () => setActive(null),
      }}
    >
      {children}
    </GlossaryContext.Provider>
  );
}

/**
 * Wrap a term. Pass `k` to force a specific glossary key; otherwise the text is
 * resolved automatically. Renders children unchanged when no entry matches, so
 * it's always safe to wrap a label.
 */
export function Term({ children, k }: { children: string; k?: string }) {
  const ctx = useContext(GlossaryContext);
  const entry = k ? lookup(k) ?? lookup(children) : lookup(children);
  if (!ctx || !entry) return <>{children}</>;

  return (
    <button
      type="button"
      className="gloss-term"
      data-tip={entry.short}
      aria-label={`${children} — ${entry.short} Click for full explanation.`}
      onClick={(e) => {
        e.stopPropagation();
        ctx.open(entry);
      }}
    >
      {children}
    </button>
  );
}

export function GlossaryPanel() {
  const ctx = useContext(GlossaryContext);
  if (!ctx) return null;
  const { active, close } = ctx;

  return (
    <>
      <div className={`gloss-scrim${active ? " show" : ""}`} onClick={close} aria-hidden={!active} />
      <aside className={`gloss-panel${active ? " open" : ""}`} role="dialog" aria-modal="false" aria-hidden={!active}>
        {active && (
          <div className="gloss-panel-inner">
            <div className="gloss-panel-head">
              <span className="gloss-panel-kicker">In plain English</span>
              <button type="button" className="gloss-close" onClick={close} aria-label="Close explanation">×</button>
            </div>
            <h3 className="gloss-panel-term">{active.term}</h3>
            <p className="gloss-panel-short">{active.short}</p>
            <p className="gloss-panel-long">{active.long}</p>
          </div>
        )}
      </aside>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";

interface ReferralData {
  link: string;
  code: string;
  share: { whatsapp: string; email: string; message: string };
  stats: { signups: number; converted: number };
}

/**
 * "Refer a friend" button + share popup. Fetches the user's referral link on
 * open and offers copy / WhatsApp / email. Tracking is server-side (a friend who
 * signs up via the link is attributed to this user).
 */
export function ReferFriend() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data) return;
    fetch("/api/referral", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => (j.link ? setData(j) : setError(j.error ?? "Couldn't load your link.")))
      .catch(() => setError("Couldn't load your link."));
  }, [open, data]);

  async function copy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can select the field manually */
    }
  }

  return (
    <>
      <button className="refer-btn" onClick={() => setOpen(true)} data-ev="refer_open">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
        </svg>
        Refer a friend
      </button>

      {open && (
        <div className="pay-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="pay-modal refer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="refer-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            <p className="refer-title">Refer a friend</p>
            <p className="refer-sub">Share Onward — they get the free breakdown, you help a friend decode their pay.</p>

            {error && <p className="opp-none" style={{ color: "var(--amber-d)" }}>{error}</p>}
            {!data && !error && <p className="um-s" style={{ textAlign: "center" }}>Loading your link…</p>}

            {data && (
              <>
                <div className="refer-linkrow">
                  <input className="refer-link" readOnly value={data.link} onFocus={(e) => e.currentTarget.select()} />
                  <button className="refer-copy" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
                </div>
                <div className="refer-actions">
                  <a className="refer-share wa" href={data.share.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
                  <a className="refer-share em" href={data.share.email}>Email</a>
                </div>
                <p className="refer-stats">
                  {data.stats.signups} signed up · {data.stats.converted} became paying
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

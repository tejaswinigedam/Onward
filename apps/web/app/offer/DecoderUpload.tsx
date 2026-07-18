"use client";
import { useMemo, useRef, useState } from "react";
import type { OfferAnalysis } from "@/lib/offer-analysis";
import { OfferComparator, type Draft } from "./OfferComparator";
import { OfferComparisonSummary } from "./OfferComparisonSummary";
import { OfferReport, LockPanel, type LockProps } from "./OfferReport";
import type { UploadedDoc } from "./OfferMultiUpload";
import type { DecoderModeConfig } from "./decoder-modes";
import { GlossaryProvider, GlossaryPanel } from "@/components/Glossary";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";

const MAX_BYTES = 8 * 1024 * 1024; // mirror the route's 8 MB limit
const CONCURRENCY = 2; // Gemini can take ~60s/file; keep a small pool

const labelFromName = (name: string) => name.replace(/\.pdf$/i, "").slice(0, 40) || "Document";

/**
 * The upload + decode flow, parametrized by the selected {@link DecoderModeConfig}.
 * Single-document modes accept one file and render one report; multi-document
 * modes accept several and either compare them (two offers) or decode each
 * (offer + payslip). All extraction goes through /api/offer/extract; the file
 * is processed in memory and never stored.
 */
export function DecoderUpload({
  mode,
  signedIn = false,
  credits = 0,
  onUnlocked,
  onNeedPayment,
}: {
  mode: DecoderModeConfig;
  /** Whether a user is signed in — drives the unlock CTA (sign in vs spend). */
  signedIn?: boolean;
  /** Current credit balance — for the unlock button label. */
  credits?: number;
  /** Called after a successful unlock so the gate can refetch the balance. */
  onUnlocked?: () => void;
  /** Called when an unlock needs credits the user doesn't have (opens the QR pay flow). */
  onNeedPayment?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  // One analysis run = 1 credit, however many documents. Unlock state is per-run
  // (not per-doc): unlocking releases the analysis for every uploaded document.
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  // "Save analysis for future" — keeps a report on the user's account page.
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Non-render state for the extraction pool.
  const filesRef = useRef<Map<string, File>>(new Map());
  const queueRef = useRef<string[]>([]);
  const runningRef = useRef(0);
  const fingerprintsRef = useRef<Set<string>>(new Set());

  const maxFiles = mode.maxFiles;

  const updateDoc = (id: string, patch: Partial<UploadedDoc>) =>
    setDocs((arr) => arr.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  async function extractOne(id: string) {
    const file = filesRef.current.get(id);
    if (!file) return;
    updateDoc(id, { status: "extracting", error: undefined });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/offer/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        updateDoc(id, { status: "error", error: json.error ?? "Couldn't read that file." });
        return;
      }
      updateDoc(id, {
        status: "done",
        analysis: json.analysis as OfferAnalysis,
        via: json.via,
        docType: "offer",
        analysisId: json.analysisId,
        locked: Boolean(json.locked),
      });
    } catch {
      updateDoc(id, { status: "error", error: "Upload failed. Try again." });
    }
  }

  /**
   * Spend 1 credit to unlock the analysis for the WHOLE run — every uploaded
   * document at once. One analysis in one go costs one credit, regardless of how
   * many documents are involved.
   */
  async function unlockRun() {
    const ids = docs.filter((d) => d.status === "done" && d.analysisId && d.locked).map((d) => d.analysisId!);
    if (ids.length === 0) return;
    if (!signedIn) {
      const back = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/offer";
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(back)}`;
      return;
    }
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/offer/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysisIds: ids }),
      });
      const json = await res.json();
      if (res.status === 402) {
        setUnlocking(false);
        onNeedPayment?.(); // no credits → open the QR pay flow
        return;
      }
      if (!res.ok) {
        setUnlocking(false);
        setUnlockError(json.error ?? "Couldn't unlock. Try again.");
        return;
      }
      // Swap each free subset for the full analysis so locked sections/comparison read real data.
      const byId = new Map<string, OfferAnalysis>(
        (json.analyses ?? []).map((a: { id: string; analysis: OfferAnalysis }) => [a.id, a.analysis]),
      );
      setDocs((arr) =>
        arr.map((d) => (d.analysisId && byId.has(d.analysisId)
          ? { ...d, analysis: byId.get(d.analysisId), locked: false }
          : d)),
      );
      setUnlocking(false);
      onUnlocked?.();
    } catch {
      setUnlocking(false);
      setUnlockError("Network error. Try again.");
    }
  }

  /** Persist a decoded report to the user's account ("save for future"). */
  async function saveAnalysis(d: UploadedDoc, title: string) {
    if (!d.analysisId) return;
    if (!signedIn) {
      const back = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/offer";
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(back)}`;
      return;
    }
    setSavingId(d.id);
    try {
      const res = await fetch("/api/me/analyses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysisId: d.analysisId, title: title.slice(0, 80) }),
      });
      if (res.ok) setSavedIds((s) => new Set(s).add(d.analysisId!));
    } catch {
      /* leave un-saved; the button stays available to retry */
    }
    setSavingId(null);
  }

  const unlockHintMulti = () =>
    !signedIn
      ? "1 credit unlocks the full analysis for all your documents"
      : credits >= 1
        ? `1 credit unlocks all your documents · you have ${credits}`
        : "1 credit unlocks all your documents — tap to buy";

  /** Shared unlock CTA props for the run (1 credit unlocks everything). */
  const runLockProps = (extra?: Partial<LockProps>): LockProps => ({
    locked: true,
    unlockBusy: unlocking,
    unlockError,
    onUnlock: unlockRun,
    unlockLabel: !signedIn
      ? "Sign in to unlock"
      : credits >= 1
        ? "Unlock full analysis — 1 credit"
        : "Unlock full analysis",
    unlockHint: !signedIn
      ? "1 credit unlocks the tax regime, savings, clauses & actions"
      : credits >= 1
        ? `You have ${credits} credit${credits === 1 ? "" : "s"}`
        : "You'll need 1 credit — tap to buy",
    ...extra,
  });

  function drain() {
    while (runningRef.current < CONCURRENCY && queueRef.current.length > 0) {
      const id = queueRef.current.shift()!;
      runningRef.current++;
      void extractOne(id).finally(() => {
        runningRef.current--;
        drain();
      });
    }
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking the same file after a remove
    if (picked.length === 0) return;
    setNotice(null);

    const messages: string[] = [];
    // Upload is free; cap only by the mode's file limit.
    let slots = maxFiles - docs.length;
    const additions: UploadedDoc[] = [];

    for (const file of picked) {
      if (slots <= 0) {
        messages.push(maxFiles === 1 ? "One file for this analysis." : `Up to ${maxFiles} files at a time.`);
        break;
      }
      const fingerprint = `${file.name}:${file.size}:${file.lastModified}`;
      if (fingerprintsRef.current.has(fingerprint)) {
        messages.push(`"${file.name}" is already added.`);
        continue;
      }
      if (file.type !== "application/pdf") {
        messages.push(`"${file.name}" isn't a PDF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        messages.push(`"${file.name}" is over 8 MB.`);
        continue;
      }
      const id = crypto.randomUUID();
      fingerprintsRef.current.add(fingerprint);
      filesRef.current.set(id, file);
      queueRef.current.push(id);
      additions.push({ id, fileName: file.name, size: file.size, fingerprint, status: "queued", docType: "offer" });
      slots--;
    }

    if (additions.length > 0) setDocs((arr) => [...arr, ...additions]);
    if (messages.length > 0) setNotice(messages.join(" "));
    drain();
  }

  function retry(id: string) {
    updateDoc(id, { status: "queued", error: undefined });
    queueRef.current.push(id);
    drain();
  }

  function remove(id: string) {
    setDocs((arr) => arr.filter((d) => d.id !== id));
    queueRef.current = queueRef.current.filter((q) => q !== id);
    const doc = docs.find((d) => d.id === id);
    if (doc) fingerprintsRef.current.delete(doc.fingerprint);
    filesRef.current.delete(id);
  }

  const doneDocs = useMemo(() => docs.filter((d) => d.status === "done" && d.analysis), [docs]);
  const seedDrafts: Draft[] = useMemo(
    () =>
      doneDocs.map((d) => ({
        label: labelFromName(d.fileName),
        annualCTC: d.analysis!.annualCTC,
        variablePct: Math.round(d.analysis!.variableShare * 1000) / 10,
      })),
    [doneDocs],
  );
  const comparatorKey = doneDocs.map((d) => d.id).join("|");
  const busy = docs.some((d) => d.status === "queued" || d.status === "extracting");
  const isCompare = mode.id === "two-offers";
  const canAddMore = mode.multi && docs.length < maxFiles;

  // Slot label for a decoded doc (offer+payslip → "Offer letter" / "Payslip").
  const slotLabel = (i: number) => mode.slots?.[i];

  return (
    <div className="upload-card">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        multiple={mode.multi}
        style={{ display: "none" }}
        onChange={onFiles}
      />

      {docs.length === 0 ? (
        <div className="upload-drop" onClick={() => fileRef.current?.click()}>
          <svg width="38" height="38" viewBox="0 0 42 42" fill="none">
            <rect x="8" y="5" width="26" height="32" rx="4" stroke="var(--ink-mute)" strokeWidth="1.6" />
            <path d="M14 14h14M14 19h14M14 24h9" stroke="var(--border-s)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="31" cy="31" r="9" fill="var(--indigo)" />
            <path d="M31 35v-8M27.5 30.5L31 27l3.5 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="um-t">{mode.uploadHint}</p>
          <p className="um-s">
            PDF · decoded on our server · never stored
            {mode.multi ? ` · up to ${maxFiles}` : ""}
          </p>
          <p className="upload-privacy">
            Your documents are used exclusively to generate your personalized salary insights. Your
            personal information is never used for any purpose beyond delivering your analysis.
          </p>
        </div>
      ) : (
        <>
          <div className="doc-list">
            {docs.map((d, i) => (
              <div className={`doc-row ${d.status}`} key={d.id}>
                <div className="doc-main">
                  <span className="doc-name">
                    {mode.slots?.[i] ? <span className="doc-slot">{mode.slots[i]}: </span> : null}
                    {d.fileName}
                  </span>
                  <span className="doc-meta">
                    {d.status === "queued" && "Queued…"}
                    {d.status === "extracting" && "Decoding… (up to a minute)"}
                    {d.status === "done" && (
                      <>
                        Decoded
                        {d.via === "heuristic" && <span className="doc-badge warn">estimated</span>}
                      </>
                    )}
                    {d.status === "error" && <span className="doc-err">{d.error}</span>}
                  </span>
                </div>
                <div className="doc-actions">
                  {d.status === "error" && <button className="doc-btn" onClick={() => retry(d.id)}>Retry</button>}
                  <button className="doc-btn" title="Remove" onClick={() => remove(d.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
          {mode.multi && (
            <div className="doc-add-bar">
              <button className="slip-add-btn" disabled={!canAddMore} onClick={() => fileRef.current?.click()}>
                ＋ Add another document
              </button>
              {docs.length >= maxFiles && <span className="doc-note">Max {maxFiles} reached</span>}
            </div>
          )}
        </>
      )}

      {notice && <p className="opp-none" style={{ color: "var(--amber-d)" }}>{notice}</p>}

      {/* ---- Output ---- */}
      <GlossaryProvider>
        {isCompare ? (
          doneDocs.length >= 2 && (
            doneDocs.some((d) => d.locked) ? (
              <div style={{ marginTop: 22 }}>
                <LockPanel
                  lock={runLockProps({
                    title: "Unlock the offer comparison",
                    items: [
                      "Which offer pays more, guaranteed in hand",
                      "Side-by-side breakdown of both offers",
                      "Where the fine print differs",
                      "The tax-regime and savings angle on each",
                    ],
                    unlockLabel: !signedIn ? "Sign in to unlock" : credits >= 1 ? "Unlock comparison — 1 credit" : "Unlock comparison",
                  })}
                />
              </div>
            ) : (
              <div style={{ marginTop: 22 }}>
                <div id="cmp-report">
                  <OfferComparisonSummary docs={doneDocs} />
                  <OfferComparator key={comparatorKey} seedDrafts={seedDrafts} allowAddRemove={false} />
                </div>
                <DownloadPdfButton targetId="cmp-report" fileName="Onward — Offer comparison" evLabel="compare" />
              </div>
            )
          )
        ) : (
          doneDocs.map((d, i) => {
            const reportId = `report-${d.id}`;
            const name = slotLabel(i) ?? d.fileName.replace(/\.pdf$/i, "");
            // 1 credit unlocks the whole run, so every locked report shares the
            // same unlock (clicking either reveals all your documents).
            const lock: LockProps | undefined = d.locked
              ? runLockProps(mode.multi ? { unlockHint: unlockHintMulti() } : undefined)
              : undefined;
            return (
              <div key={d.id} style={{ marginTop: i === 0 ? 8 : 22 }}>
                {slotLabel(i) && <p className="decoder-report-label">{slotLabel(i)}</p>}
                <div id={reportId}>
                  <OfferReport a={d.analysis!} lock={lock} />
                </div>
                <div className="report-actions">
                  {!d.locked && (
                    <DownloadPdfButton targetId={reportId} fileName={`Onward — ${name}`} evLabel={mode.id} />
                  )}
                  {d.analysisId && (
                    <button
                      className="save-analysis-btn"
                      disabled={savingId === d.id || savedIds.has(d.analysisId)}
                      onClick={() => saveAnalysis(d, name)}
                    >
                      {savedIds.has(d.analysisId)
                        ? "✓ Saved to your account"
                        : savingId === d.id
                          ? "Saving…"
                          : signedIn ? "Save analysis for future" : "Sign in to save"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Nudge to complete a multi flow. */}
        {mode.multi && !busy && doneDocs.length > 0 && doneDocs.length < mode.minFiles && (
          <p className="opp-none">Add {mode.minFiles - doneDocs.length} more to {isCompare ? "compare" : "see both"}.</p>
        )}

        <GlossaryPanel />
      </GlossaryProvider>
    </div>
  );
}

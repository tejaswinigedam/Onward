"use client";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { OfferAnalysis } from "@/lib/offer-analysis";
import { OfferComparator, type Draft } from "./OfferComparator";
import { OfferComparisonSummary } from "./OfferComparisonSummary";
import { OfferReport } from "./OfferReport";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024; // mirror the route's 8 MB limit
const CONCURRENCY = 2; // Gemini can take ~60s/file; keep a small pool

type DocStatus = "queued" | "extracting" | "done" | "error";

export interface UploadedDoc {
  id: string;
  fileName: string;
  size: number;
  fingerprint: string; // name + size + lastModified — for dedupe
  status: DocStatus;
  via?: string;
  analysis?: OfferAnalysis;
  docType: "offer" | "payslip" | "unknown"; // Phase 1: always "offer"
  error?: string;
}

const labelFromName = (name: string) => name.replace(/\.pdf$/i, "").slice(0, 40) || "Offer";

/**
 * Entry point. `useAuth` may only run inside a mounted <ClerkProvider>, which the
 * layout only mounts when Clerk is configured — so the auth-gated variant is the
 * only one that calls the hook, and we pick which to render at the top level.
 */
export function OfferMultiUpload() {
  return clerkEnabled ? <GatedMultiUpload /> : <MultiUploadBody />;
}

function GatedMultiUpload() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && !isSignedIn) {
    return (
      <div className="upload-card">
        <p className="um-t">Upload your offer letters</p>
        <p className="um-s">
          <a href="/sign-in" style={{ color: "var(--indigo)", fontWeight: 700 }}>Sign in</a> to upload one
          or more offer PDFs and compare them automatically.
        </p>
      </div>
    );
  }
  return <MultiUploadBody />;
}

function MultiUploadBody() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Non-render state for the extraction pool.
  const filesRef = useRef<Map<string, File>>(new Map());
  const queueRef = useRef<string[]>([]);
  const runningRef = useRef(0);
  const fingerprintsRef = useRef<Set<string>>(new Set());

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
      updateDoc(id, { status: "done", analysis: json.analysis as OfferAnalysis, via: json.via, docType: "offer" });
    } catch {
      updateDoc(id, { status: "error", error: "Upload failed. Try again." });
    }
  }

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
    let slots = MAX_FILES - docs.length;
    const additions: UploadedDoc[] = [];

    for (const file of picked) {
      if (slots <= 0) {
        messages.push(`Up to ${MAX_FILES} files at a time.`);
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
      additions.push({
        id,
        fileName: file.name,
        size: file.size,
        fingerprint,
        status: "queued",
        docType: "offer",
      });
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

  const offerDocs = useMemo(() => docs.filter((d) => d.status === "done" && d.analysis), [docs]);
  const seedDrafts: Draft[] = useMemo(
    () =>
      offerDocs.map((d) => ({
        label: labelFromName(d.fileName),
        annualCTC: d.analysis!.annualCTC,
        variablePct: Math.round(d.analysis!.variableShare * 1000) / 10,
      })),
    [offerDocs],
  );
  // Remount the comparator only when the SET of offers changes (not on every edit).
  const comparatorKey = offerDocs.map((d) => d.id).join("|");

  const busy = docs.some((d) => d.status === "queued" || d.status === "extracting");

  return (
    <div className="upload-card">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        multiple
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
          <p className="um-t">Drop your offer letters — one or several</p>
          <p className="um-s">PDF · decoded on our server · never stored · compare up to {MAX_FILES}</p>
        </div>
      ) : (
        <>
          <div className="doc-list">
            {docs.map((d) => (
              <div className={`doc-row ${d.status}`} key={d.id}>
                <div className="doc-main">
                  <span className="doc-name">{d.fileName}</span>
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
                  {d.status === "error" && (
                    <button className="doc-btn" onClick={() => retry(d.id)}>Retry</button>
                  )}
                  <button className="doc-btn" title="Remove" onClick={() => remove(d.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
          <div className="doc-add-bar">
            <button
              className="slip-add-btn"
              disabled={docs.length >= MAX_FILES}
              onClick={() => fileRef.current?.click()}
            >
              ＋ Add another offer
            </button>
            {docs.length >= MAX_FILES && <span className="doc-note">Max {MAX_FILES} reached</span>}
          </div>
        </>
      )}

      {notice && <p className="opp-none" style={{ color: "var(--amber-d)" }}>{notice}</p>}

      {/* Single decoded offer → the full rich report. */}
      {offerDocs.length === 1 && <OfferReport a={offerDocs[0]!.analysis!} />}

      {/* Two or more → comparison summary + the (editable) comparator. */}
      {offerDocs.length >= 2 && (
        <div style={{ marginTop: 22 }}>
          <OfferComparisonSummary docs={offerDocs} />
          <OfferComparator key={comparatorKey} seedDrafts={seedDrafts} allowAddRemove />
        </div>
      )}

      {offerDocs.length === 1 && !busy && (
        <p className="opp-none">Add one more offer to compare them side by side.</p>
      )}
    </div>
  );
}

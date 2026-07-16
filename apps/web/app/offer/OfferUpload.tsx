"use client";
import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { OfferAnalysis } from "@/lib/offer-analysis";
import { OfferReport } from "./OfferReport";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function OfferUpload() {
  return clerkEnabled ? <GatedOfferUpload /> : <OfferUploadBody />;
}

function GatedOfferUpload() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && !isSignedIn) {
    return (
      <div className="upload-card">
        <p className="um-t">Upload your offer letter</p>
        <p className="um-s"><a href="/sign-in" style={{ color: "var(--indigo)", fontWeight: 700 }}>Sign in</a> to upload a PDF and get it decoded automatically.</p>
      </div>
    );
  }
  return <OfferUploadBody />;
}

function OfferUploadBody() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState<OfferAnalysis | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("reading");
    setError(null);
    setA(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/offer/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't read that file.");
        setStatus("error");
        return;
      }
      setA(json.analysis as OfferAnalysis);
      setStatus("done");
    } catch {
      setError("Upload failed. Try again.");
      setStatus("error");
    }
  }

  return (
    <div className="upload-card">
      <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={onFile} />
      <div className="upload-drop" onClick={() => fileRef.current?.click()}>
        <svg width="38" height="38" viewBox="0 0 42 42" fill="none">
          <rect x="8" y="5" width="26" height="32" rx="4" stroke="var(--ink-mute)" strokeWidth="1.6" />
          <path d="M14 14h14M14 19h14M14 24h9" stroke="var(--border-s)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="31" cy="31" r="9" fill="var(--indigo)" />
          <path d="M31 35v-8M27.5 30.5L31 27l3.5 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="um-t">{status === "reading" ? "Decoding your offer… (up to a minute)" : "Drop your offer letter PDF"}</p>
        <p className="um-s">Decoded on our server · never stored</p>
      </div>

      {error && <p className="opp-none" style={{ color: "var(--coral-d)" }}>{error}</p>}

      {status === "done" && a && <OfferReport a={a} />}
    </div>
  );
}

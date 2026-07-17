"use client";
import { track } from "@/lib/analytics";

/**
 * "Download PDF" for a decoded report. Rather than pull in a PDF library, we
 * clone the on-screen report into a hidden same-origin iframe, carry over the
 * page's stylesheets so it looks identical, and invoke the browser's print
 * dialog — whose "Save as PDF" destination produces the download. This keeps
 * the output crisp (real text, not a raster) and always matches the UI.
 */
function printElement(el: HTMLElement, fileName: string) {
  // Collect the page's styles so the clone renders identically.
  const headStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((n) => n.outerHTML)
    .join("\n");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${fileName}</title>
${headStyles}
<style>
  @page { margin: 16mm; }
  html, body { background: #fff !important; margin: 0; }
  .pdf-doc { padding: 0; }
  .pdf-doc-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid rgba(18,23,43,.12); }
  .pdf-doc-title { font-family:'Fraunces',Georgia,serif; font-size:20px; font-weight:600; color:#12172B; }
  .pdf-doc-brand { font-family:'Fraunces',Georgia,serif; font-weight:600; font-size:15px; color:#12172B; }
  /* Never clip cards across pages, and drop interactive-only chrome. */
  .rep-card, .opps, .cmp-summary, .clause { break-inside: avoid; }
  .gloss-term { border:0 !important; background:none !important; padding:0 !important; color:inherit !important; font:inherit !important; cursor:auto !important; }
  .gloss-term::after { display:none !important; }
  .download-pdf-bar, .doc-actions, .slip-add-btn, .doc-add-bar { display:none !important; }
</style>
</head><body>
<div class="onward-landing"><div class="pdf-doc">
  <div class="pdf-doc-head">
    <span class="pdf-doc-title">${fileName}</span>
    <span class="pdf-doc-brand">Onward · Pay Decoder</span>
  </div>
  ${el.outerHTML}
</div></div>
</body></html>`);
  doc.close();

  const done = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // Give the print dialog time to grab the document before we clean up.
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }
  };

  // Wait for styles/fonts to settle so the first paint is complete.
  if (iframe.contentWindow) {
    iframe.contentWindow.onload = () => setTimeout(done, 250);
  } else {
    setTimeout(done, 400);
  }
}

export function DownloadPdfButton({
  targetId,
  fileName,
  evLabel,
}: {
  targetId: string;
  fileName: string;
  evLabel?: string;
}) {
  const onClick = () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    track("download_pdf", { label: evLabel ?? fileName });
    printElement(el, fileName);
  };

  return (
    <div className="download-pdf-bar">
      <button type="button" className="download-pdf-btn" onClick={onClick}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <polyline points="7 11 12 16 17 11" />
          <path d="M5 21h14" />
        </svg>
        Download PDF
      </button>
    </div>
  );
}

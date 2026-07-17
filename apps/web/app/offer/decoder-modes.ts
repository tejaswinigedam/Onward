/**
 * The four Pay Decoder flows. Shared by the landing stepper (which deep-links
 * into a flow via /offer?mode=<id>) and the Pay Decoder page's mode picker.
 */
export type DecoderModeId = "offer" | "payslip" | "two-offers" | "offer-payslip";

export interface DecoderModeConfig {
  id: DecoderModeId;
  /** Short label — matches the landing stepper. */
  label: string;
  /** Picker card / flow heading. */
  title: string;
  /** One-line summary. */
  tagline: string;
  /** What analysis to expect before uploading. */
  whatYouGet: string[];
  /** true = several documents, false = a single document. */
  multi: boolean;
  minFiles: number;
  maxFiles: number;
  /** Per-slot labels for multi flows (order the user should upload in). */
  slots?: string[];
  /** Empty-state upload hint. */
  uploadHint: string;
}

export const DECODER_MODES: DecoderModeConfig[] = [
  {
    id: "offer",
    label: "Offer Letter",
    title: "Analyze an offer letter",
    tagline: "Decode a single offer letter, line by line.",
    whatYouGet: [
      "Full CTC breakdown — base, HRA, variable, PF",
      "Estimated monthly in-hand",
      "Clauses to watch and what to ask HR",
    ],
    multi: false,
    minFiles: 1,
    maxFiles: 1,
    uploadHint: "Drop your offer letter — one PDF",
  },
  {
    id: "payslip",
    label: "Payslip",
    title: "Analyze a payslip",
    tagline: "Understand exactly where your salary goes.",
    whatYouGet: [
      "Every salary component explained",
      "Deductions broken down — PF, TDS, professional tax",
      "Your real take-home, in plain English",
    ],
    multi: false,
    minFiles: 1,
    maxFiles: 1,
    uploadHint: "Drop your payslip — one PDF",
  },
  {
    id: "two-offers",
    label: "Two Offer Letters",
    title: "Compare two offer letters",
    tagline: "See which offer actually pays more.",
    whatYouGet: [
      "Side-by-side breakdown of both offers",
      "Which pays more guaranteed in hand",
      "Where the fine print differs",
    ],
    multi: true,
    minFiles: 2,
    maxFiles: 5,
    slots: ["Offer letter 1", "Offer letter 2"],
    uploadHint: "Drop both offer letters — PDFs",
  },
  {
    id: "offer-payslip",
    title: "Offer letter + payslip",
    label: "Offer Letter + Payslip",
    tagline: "Check what you were promised against what you're paid.",
    whatYouGet: [
      "Your offer letter, fully decoded",
      "Your payslip, fully decoded",
      "See both breakdowns side by side",
    ],
    multi: true,
    minFiles: 2,
    maxFiles: 2,
    slots: ["Offer letter", "Payslip"],
    uploadHint: "Drop your offer letter and a payslip — PDFs",
  },
];

export const getDecoderMode = (id: string | null | undefined): DecoderModeConfig | undefined =>
  DECODER_MODES.find((m) => m.id === id);

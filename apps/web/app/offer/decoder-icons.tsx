import type { DecoderModeId } from "./decoder-modes";

const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);
const SlipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
    <line x1="9" y1="7" x2="15" y2="7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </svg>
);
const TwoDocsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="12" height="16" rx="2" />
    <path d="M8 4V3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14" />
    <line x1="6" y1="9" x2="12" y2="9" />
    <line x1="6" y1="13" x2="12" y2="13" />
  </svg>
);
const OfferVsSlipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2H4a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h5z" />
    <path d="M15 2h5a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1h-5z" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const ICONS: Record<DecoderModeId, () => React.ReactElement> = {
  offer: DocIcon,
  payslip: SlipIcon,
  "two-offers": TwoDocsIcon,
  "offer-payslip": OfferVsSlipIcon,
};

export function DecoderModeIcon({ id }: { id: DecoderModeId }) {
  const Icon = ICONS[id];
  return <Icon />;
}

/**
 * Flat, bold, two-tone vector icons — editorial style (no emojis).
 * Sized to sit in a ~34px rounded tile; colors are baked to pop on light tiles.
 */
type P = { size?: number };

export function IconDoc({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="9" y="6" width="19" height="28" rx="3" fill="#5B4CFF" />
      <path d="M28 6h-5v5h5" fill="#3F2CB8" />
      <path d="M13 16h11M13 21h11M13 26h7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconReceipt({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M10 7h20v24l-3.3-2.2L23.3 31 20 28.8 16.7 31l-3.4-2.2L10 31V7Z" fill="#16A34A" />
      <path d="M15 14h10M15 19h10M15 24h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCompare({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="6" y="9" width="12" height="22" rx="3" fill="#5B4CFF" />
      <rect x="22" y="9" width="12" height="22" rx="3" fill="#FF7A59" />
      <path d="M10 15h4M10 19h4M26 15h4M26 19h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconVs({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="7" y="8" width="16" height="22" rx="3" fill="#5B4CFF" />
      <path d="M31 12h-4v20l2.2-1.5L31 32V12Z" fill="#16A34A" />
      <rect x="19" y="12" width="14" height="20" rx="3" fill="#16A34A" />
      <path d="M23 18h6M23 22h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 14h8M11 18h8M11 22h5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconBook({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 11c-3-2-7-2-10-1v18c3-1 7-1 10 1 3-2 7-2 10-1V10c-3-1-7-1-10 1Z" fill="#16A34A" />
      <path d="M20 11v19" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconScales({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 8v22" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 14h24" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="20" cy="8" r="2.4" fill="#16A34A" />
      <path d="M8 14l-3 7h6l-3-7ZM32 14l-3 7h6l-3-7Z" fill="#FF7A59" />
      <path d="M14 30h12" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ size = 13 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 7.4l2.6 2.6L11 4.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

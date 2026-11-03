/** Lightweight isometric line art — inspired by isometric.buildlab.in (no package dependency). */
export function IsoStackFigure({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <g stroke="url(#g1)" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M60 150 L180 90 L300 150 L180 210 Z" fill="rgba(45,212,191,0.06)" />
        <path d="M90 130 L180 85 L270 130 L180 175 Z" fill="rgba(255,255,255,0.35)" />
        <path d="M120 112 L180 82 L240 112 L180 142 Z" fill="rgba(255,255,255,0.55)" />
        <path d="M180 82 V48" />
        <path d="M150 98 L180 82 L210 98" />
        <path d="M130 125 H230" opacity="0.55" />
        <path d="M140 135 H220" opacity="0.4" />
        <path d="M150 145 H210" opacity="0.28" />
        <circle cx="292" cy="58" r="18" fill="rgba(45,212,191,0.12)" />
        <path d="M284 58 H300 M292 50 V66" />
        <path d="M48 70 L78 55 L108 70 L78 85 Z" fill="rgba(255,255,255,0.4)" />
      </g>
    </svg>
  )
}

export function IsoCubeIcon({ tone = 'teal' }: { tone?: 'teal' | 'amber' | 'rose' | 'sky' }) {
  const stroke =
    tone === 'amber'
      ? '#d97706'
      : tone === 'rose'
        ? '#e11d48'
        : tone === 'sky'
          ? '#0284c7'
          : '#0f766e'
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <path
        d="M18 5 L30 12 V24 L18 31 L6 24 V12 Z"
        stroke={stroke}
        strokeWidth="1.5"
        fill={`${stroke}18`}
      />
      <path d="M18 5 V19 M18 19 L30 12 M18 19 L6 12" stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

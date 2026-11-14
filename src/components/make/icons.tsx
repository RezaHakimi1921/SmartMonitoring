import type { ReactNode } from 'react'

export function Icon({
  children,
  size = 18,
}: {
  children: ReactNode
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const Ico = {
  home: (
    <Icon>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
    </Icon>
  ),
  doc: (
    <Icon>
      <path d="M8 3h6l4 4v14H8z" />
      <path d="M14 3v4h4" />
      <path d="M10 12h6M10 16h6" />
    </Icon>
  ),
  chat: (
    <Icon>
      <path d="M5 18.5 3 21V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8z" />
    </Icon>
  ),
  help: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.6 1-1.6 2" />
      <path d="M12 17h.01" />
    </Icon>
  ),
  user: (
    <Icon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </Icon>
  ),
  gear: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 6.5l1.5 1.5M17.6 16l1.5 1.5M3 12h2M19 12h2M4.9 17.5l1.5-1.5M17.6 8l1.5-1.5" />
    </Icon>
  ),
  users: (
    <Icon>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M14 19a4.5 4.5 0 0 1 6.5 0" />
    </Icon>
  ),
  store: (
    <Icon>
      <path d="M4 10h16l-1.2-4.5A2 2 0 0 0 16.9 4H7.1a2 2 0 0 0-1.9 1.5L4 10z" />
      <path d="M5 10v9h14v-9" />
      <path d="M10 19v-5h4v5" />
    </Icon>
  ),
  search: (
    <Icon size={17}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 3.5 3.5" />
    </Icon>
  ),
  spark: (
    <Icon size={16}>
      <path d="M12 3v4M12 17v4M4 12h4M16 12h4" />
      <path d="m6.5 6.5 2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
    </Icon>
  ),
  cal: (
    <Icon>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" />
    </Icon>
  ),
  clock: (
    <Icon size={16}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </Icon>
  ),
  chart: (
    <Icon size={20}>
      <path d="M5 19V10M10 19V6M15 19v-7M20 19V8" />
    </Icon>
  ),
  arrow: (
    <Icon size={16}>
      <path d="M19 12H6" />
      <path d="m10 7-5 5 5 5" />
    </Icon>
  ),
  check: (
    <Icon size={13}>
      <path d="M5 12.5 9.5 17 19 7.5" />
    </Icon>
  ),
  send: (
    <Icon>
      <path d="M4 12 20 4l-6 16-2-7z" />
    </Icon>
  ),
  list: (
    <Icon>
      <path d="M8 7h12M8 12h12M8 17h12" />
      <path d="M4 7h.01M4 12h.01M4 17h.01" />
    </Icon>
  ),
}

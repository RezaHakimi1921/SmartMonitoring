import type { ReactNode, SVGProps } from 'react'

export type DidbanIconName =
  | 'home'
  | 'report'
  | 'message'
  | 'help'
  | 'user'
  | 'settings'
  | 'users'
  | 'search'
  | 'chevron'
  | 'chevronLeft'
  | 'plus'
  | 'close'
  | 'filter'
  | 'eye'
  | 'download'
  | 'send'
  | 'attachment'
  | 'more'
  | 'clock'
  | 'check'
  | 'chart'

const paths: Record<DidbanIconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  report: (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M14 3v4h4M9 11h6M9 15h6" />
    </>
  ),
  message: (
    <>
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.3 2.3 0 1 1 3.5 2c-.8.5-1.3 1-1.3 2M12 17h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2-.7-.6-1.4.9-2-2.1-2.1-2 .9-1.4-.6-.8-2H8l-.7 2-1.4.6-2-.9-2.1 2.1.9 2-.6 1.4-2 .7v3l2 .7.6 1.4-.9 2 2.1 2.1 2-.9 1.4.6.7 2h3l.8-2 1.4-.6 2 .9 2.1-2.1-.9-2 .6-1.4z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.5-3 2.5-5 6-5s5.5 2 6 5M16 5a3 3 0 0 1 0 6M17 14c2.3.3 3.7 1.8 4 4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  /** فلش باز کردن ردیف در لیست RTL — شکل ‹ */
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-4-4 4 4 4-4" />
      <path d="M4 19h16" />
    </>
  ),
  send: <path d="m4 12 16-7-7 16-2.5-6.5L4 12z" />,
  attachment: <path d="m8 12 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l8-8" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: <path d="m5.5 12.5 4 4 9-10" />,
  chart: (
    <>
      <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />
    </>
  ),
}

export function DidbanIcon({
  name,
  size = 20,
  ...rest
}: { name: DidbanIconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}

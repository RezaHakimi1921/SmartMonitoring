import type { FeedbackKind, FeedbackStatus } from './feedbackApi'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from './jalali'

export function faWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const time = toFaDigits(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  )
  return `${formatJalaliLong(gregorianToJalali(d))} · ${time}`
}

export function kindColor(
  k: FeedbackKind,
): 'error' | 'info' | 'warning' | 'default' {
  if (k === 'bug') return 'error'
  if (k === 'improvement') return 'info'
  if (k === 'change') return 'warning'
  return 'default'
}

export function statusColor(
  s: FeedbackStatus,
): 'default' | 'primary' | 'success' | 'warning' {
  if (s === 'open') return 'warning'
  if (s === 'in_progress') return 'primary'
  if (s === 'done') return 'success'
  return 'default'
}

export function truncateText(text: string, max = 140) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

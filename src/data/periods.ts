import {
  compareJalali,
  formatJalali,
  parseJalali,
  subtractJalaliMonths,
  todayJalali,
  type JDate,
} from '../lib/jalali'

export type PeriodKey = '1m' | '3m' | '6m' | '1y' | 'custom'

export const PERIOD_OPTIONS: { id: PeriodKey; label: string; months: number }[] =
  [
    { id: '1m', label: '۱ ماه اخیر', months: 1 },
    { id: '3m', label: '۳ ماه اخیر', months: 3 },
    { id: '6m', label: '۶ ماه اخیر', months: 6 },
    { id: '1y', label: '۱ سال اخیر', months: 12 },
    { id: 'custom', label: 'بازه دلخواه', months: 0 },
  ]

/** بازه شمسی؛ برای بازه دلخواه، تاریخ‌ها به‌صورت 1405/08/12 می‌آیند. */
export function periodRange(
  key: PeriodKey,
  from?: string | null,
  to?: string | null,
): { from: JDate; to: JDate } | null {
  if (key === 'custom') {
    const f = parseJalali(from)
    const t = parseJalali(to)
    if (!f || !t) return null
    return { from: f, to: t }
  }
  const months = PERIOD_OPTIONS.find((p) => p.id === key)?.months ?? 1
  const end = todayJalali()
  return { from: subtractJalaliMonths(end, months), to: end }
}

export function isRangeValid(from?: string | null, to?: string | null) {
  const f = parseJalali(from)
  const t = parseJalali(to)
  return !!f && !!t && compareJalali(f, t) <= 0
}

/** مثال: «۳ ماه اخیر (از ۱۴۰۵/۰۵/۱۲ تا ۱۴۰۵/۰۸/۱۲)» */
export function periodLabel(
  key: PeriodKey,
  from?: string | null,
  to?: string | null,
): string {
  const range = periodRange(key, from, to)
  const dates = range
    ? `از ${formatJalali(range.from)} تا ${formatJalali(range.to)}`
    : ''
  if (key === 'custom') return dates || 'بازه دلخواه'
  const label = PERIOD_OPTIONS.find((p) => p.id === key)?.label ?? '۱ ماه اخیر'
  return dates ? `${label} (${dates})` : label
}

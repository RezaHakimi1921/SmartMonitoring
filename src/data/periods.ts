export type PeriodKey = '1m' | '3m' | '6m' | '1y' | 'custom'

export const PERIOD_OPTIONS: { id: PeriodKey; label: string }[] = [
  { id: '1m', label: '۱ ماه' },
  { id: '3m', label: '۳ ماه' },
  { id: '6m', label: '۶ ماه' },
  { id: '1y', label: '۱ سال' },
  { id: 'custom', label: 'بازه دلخواه' },
]

export function periodLabel(
  key: PeriodKey,
  from?: string,
  to?: string,
): string {
  if (key === 'custom' && from && to) return `از ${from} تا ${to}`
  return PERIOD_OPTIONS.find((p) => p.id === key)?.label ?? '۱ ماه'
}

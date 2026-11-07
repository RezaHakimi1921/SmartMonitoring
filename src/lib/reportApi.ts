import type { FeatureId, ReportSection } from '../data/types'
import { periodRange, type PeriodKey } from '../data/periods'
import { serializeJalali } from './jalali'

export type DiagLiveItem = {
  id: number
  title: string
  value: string
  active: boolean
}

function apiUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base : `${base}/`
  return `${root}${path.replace(/^\//, '')}`
}

function rangeParams(period: PeriodKey, from?: string, to?: string) {
  const range = periodRange(period, from, to)
  if (!range) throw new Error('بازه تاریخ نامعتبر است')
  return {
    from: serializeJalali(range.from),
    to: serializeJalali(range.to),
  }
}

export async function fetchSection(args: {
  branchId: number | string
  feature: FeatureId
  period: PeriodKey
  from?: string
  to?: string
  signal?: AbortSignal
}): Promise<ReportSection> {
  const { from, to } = rangeParams(args.period, args.from, args.to)
  const q = new URLSearchParams({
    branchId: String(args.branchId),
    feature: args.feature,
    from,
    to,
  })
  const res = await fetch(apiUrl(`api/report/section?${q}`), {
    signal: args.signal,
    credentials: 'include',
  })
  const raw = await res.text()
  let data: { section?: ReportSection; error?: string }
  try {
    data = JSON.parse(raw) as { section?: ReportSection; error?: string }
  } catch {
    throw new Error(
      res.ok
        ? 'پاسخ سرور گزارش JSON نیست؛ سرور API را دوباره اجرا کنید'
        : `خطای سرور (${res.status})`,
    )
  }
  if (!res.ok || !data.section) {
    throw new Error(data.error || 'بارگذاری بخش ناموفق بود')
  }
  return data.section
}

export async function fetchDiag(args: {
  branchId: number | string
  types: number[]
  signal?: AbortSignal
}): Promise<DiagLiveItem[]> {
  const q = new URLSearchParams({
    branchId: String(args.branchId),
    types: args.types.join(','),
  })
  const res = await fetch(apiUrl(`api/report/diag?${q}`), {
    signal: args.signal,
    credentials: 'include',
  })
  const raw = await res.text()
  let data: { items?: DiagLiveItem[]; error?: string }
  try {
    data = JSON.parse(raw) as { items?: DiagLiveItem[]; error?: string }
  } catch {
    throw new Error(
      res.ok
        ? 'پاسخ سرور گزارش JSON نیست؛ سرور API را دوباره اجرا کنید'
        : `خطای سرور (${res.status})`,
    )
  }
  if (!res.ok) throw new Error(data.error || 'بارگذاری نکات ناموفق بود')
  return data.items ?? []
}

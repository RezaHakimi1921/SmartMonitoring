import { MESSAGE_TAG_VAR } from '../components/TemplateTagEditor'
import type { MonitoringConfig } from '../data/types'

function apiUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base : `${base}/`
  const rel = path.replace(/^\//, '')
  return `${root}${rel}`
}

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
  const raw = await res.text()
  try {
    return JSON.parse(raw) as T & { error?: string }
  } catch {
    throw new Error(
      res.ok ? 'پاسخ سرور JSON نیست' : `خطای سرور (${res.status})`,
    )
  }
}

export async function fetchConfig(): Promise<MonitoringConfig> {
  const res = await fetch(apiUrl('api/config'), { credentials: 'include' })
  const data = await parseJson<{ config: MonitoringConfig }>(res)
  if (!res.ok || !data.config) {
    throw new Error(data.error || 'بارگذاری تنظیمات ناموفق')
  }
  return data.config
}

export async function saveConfig(
  config: MonitoringConfig,
): Promise<MonitoringConfig> {
  const res = await fetch(apiUrl('api/config'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  })
  const data = await parseJson<{ config: MonitoringConfig }>(res)
  if (!res.ok || !data.config) {
    throw new Error(data.error || 'ذخیره تنظیمات ناموفق')
  }
  return data.config
}

export async function resetServerConfig(): Promise<MonitoringConfig> {
  const res = await fetch(apiUrl('api/config'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset: true }),
  })
  const data = await parseJson<{ config: MonitoringConfig }>(res)
  if (!res.ok || !data.config) {
    throw new Error(data.error || 'بازنشانی ناموفق')
  }
  return data.config
}

export type ReportStageKey =
  | 'summary'
  | 'section'
  | 'diag'
  | 'send'
  | 'sent'

export type ReportAuthor = {
  userId: string
  username: string
  displayName: string
}

export type ReportActivityAction =
  | 'created'
  | 'opened'
  | 'stage'
  | 'note'
  | 'sent'
  | 'unsent'
  | 'updated'

export type ReportActivity = {
  id: string
  at: string
  action: ReportActivityAction
  userId: string
  username: string
  displayName: string
  detail?: string
  stageKey?: ReportStageKey
  stageLabel?: string
}

export type ServerReport = {
  id: string
  /** مالک / سازنده — ثابت */
  userId: string
  username: string
  displayName: string
  /** آخرین ویرایشگر */
  lastActorUserId?: string
  lastActorUsername?: string
  lastActorDisplayName?: string
  typeId: string
  typeTitle: string
  branchId: number
  brandName: string
  branchName: string
  features: string[]
  status: 'draft' | 'sent'
  stageKey: ReportStageKey
  stageLabel: string
  stepIndex: number
  stepTotal: number
  query?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  note?: string
  activity?: ReportActivity[]
}

export async function postReportLog(body: {
  typeId: string
  typeTitle: string
  branchId: number
  brandName: string
  branchName: string
  features: string[]
  status?: 'draft' | 'sent'
  stageKey?: ReportStageKey
  stageLabel?: string
  stepIndex?: number
  stepTotal?: number
  query?: string
  note?: string
  markSent?: boolean
  action?: ReportActivityAction
}): Promise<ServerReport> {
  const res = await fetch(apiUrl('api/reports'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await parseJson<{ report: ServerReport }>(res)
  if (!res.ok || !data.report) {
    throw new Error(data.error || 'ثبت گزارش ناموفق')
  }
  return data.report
}

export async function fetchReports(params?: {
  userId?: string
  typeId?: string
  status?: 'draft' | 'sent'
  stageKey?: ReportStageKey
  from?: string
  to?: string
}): Promise<{ reports: ServerReport[]; authors: ReportAuthor[] }> {
  const q = new URLSearchParams()
  if (params?.userId) q.set('userId', params.userId)
  if (params?.typeId) q.set('typeId', params.typeId)
  if (params?.status) q.set('status', params.status)
  if (params?.stageKey) q.set('stageKey', params.stageKey)
  if (params?.from) q.set('from', params.from)
  if (params?.to) q.set('to', params.to)
  const qs = q.toString()
  const res = await fetch(apiUrl(`api/reports${qs ? `?${qs}` : ''}`), {
    credentials: 'include',
  })
  const data = await parseJson<{
    reports: ServerReport[]
    authors?: ReportAuthor[]
  }>(res)
  if (!res.ok) throw new Error(data.error || 'بارگذاری گزارش‌ها ناموفق')
  return {
    reports: data.reports ?? [],
    authors: data.authors ?? [],
  }
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
  for (const [tag, key] of Object.entries(MESSAGE_TAG_VAR)) {
    if (!out.includes(tag)) continue
    out = out.split(tag).join(vars[key] ?? '')
  }
  return out
}

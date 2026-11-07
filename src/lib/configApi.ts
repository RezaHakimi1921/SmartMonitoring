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

export type ServerReport = {
  id: string
  userId: string
  username: string
  displayName: string
  typeId: string
  typeTitle: string
  branchId: number
  brandName: string
  branchName: string
  features: string[]
  status: 'draft' | 'sent'
  createdAt: string
  updatedAt: string
  sentAt?: string
  note?: string
}

export async function postReportLog(body: {
  typeId: string
  typeTitle: string
  branchId: number
  brandName: string
  branchName: string
  features: string[]
  status?: 'draft' | 'sent'
  note?: string
  markSent?: boolean
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
  from?: string
  to?: string
}): Promise<ServerReport[]> {
  const q = new URLSearchParams()
  if (params?.userId) q.set('userId', params.userId)
  if (params?.typeId) q.set('typeId', params.typeId)
  if (params?.from) q.set('from', params.from)
  if (params?.to) q.set('to', params.to)
  const qs = q.toString()
  const res = await fetch(apiUrl(`api/reports${qs ? `?${qs}` : ''}`), {
    credentials: 'include',
  })
  const data = await parseJson<{ reports: ServerReport[] }>(res)
  if (!res.ok) throw new Error(data.error || 'بارگذاری گزارش‌ها ناموفق')
  return data.reports ?? []
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

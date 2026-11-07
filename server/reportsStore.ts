import fs from 'node:fs'
import path from 'node:path'

export type ReportLogStatus = 'draft' | 'sent'

/** مرحلهٔ فعلی در جریان ساخت گزارش */
export type ReportStageKey =
  | 'summary'
  | 'section'
  | 'diag'
  | 'send'
  | 'sent'

export type ReportLogEntry = {
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
  status: ReportLogStatus
  /** کلید مرحله: summary | section | diag | send | sent */
  stageKey: ReportStageKey
  /** برچسب فارسی مرحله برای صندوق */
  stageLabel: string
  stepIndex: number
  stepTotal: number
  /** query صفحه گزارش برای باز کردن دوباره */
  query?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  note?: string
}

export type ReportAuthor = {
  userId: string
  username: string
  displayName: string
}

type StoreFile = { reports: ReportLogEntry[] }

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'reports.json')
const MAX = 500

function normalizeEntry(raw: Partial<ReportLogEntry> & {
  id: string
  userId: string
}): ReportLogEntry {
  const status: ReportLogStatus = raw.status === 'sent' ? 'sent' : 'draft'
  const stageKey: ReportStageKey =
    status === 'sent'
      ? 'sent'
      : raw.stageKey === 'summary' ||
          raw.stageKey === 'section' ||
          raw.stageKey === 'diag' ||
          raw.stageKey === 'send' ||
          raw.stageKey === 'sent'
        ? raw.stageKey
        : 'summary'
  return {
    id: raw.id,
    userId: raw.userId,
    username: raw.username || '',
    displayName: raw.displayName || raw.username || '',
    typeId: raw.typeId || '',
    typeTitle: raw.typeTitle || raw.typeId || '',
    branchId: Number(raw.branchId) || 0,
    brandName: raw.brandName || '',
    branchName: raw.branchName || '',
    features: Array.isArray(raw.features) ? raw.features : [],
    status,
    stageKey,
    stageLabel:
      raw.stageLabel ||
      (status === 'sent'
        ? 'ارسال‌شده'
        : stageKey === 'send'
          ? 'آماده ارسال'
          : stageKey === 'diag'
            ? 'نکات پیگیری'
            : stageKey === 'section'
              ? 'بررسی بخش‌ها'
              : 'خلاصه'),
    stepIndex: Number(raw.stepIndex) || 0,
    stepTotal: Number(raw.stepTotal) || 0,
    query: typeof raw.query === 'string' ? raw.query : undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    sentAt: raw.sentAt,
    note: raw.note,
  }
}

function ensure(): StoreFile {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreFile = { reports: [] }
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreFile
    const reports = Array.isArray(raw.reports)
      ? raw.reports.map((r) => normalizeEntry(r))
      : []
    return { reports }
  } catch {
    return { reports: [] }
  }
}

function save(store: StoreFile) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify({ reports: store.reports.slice(0, MAX) }, null, 2),
    'utf8',
  )
}

export function listReports(filters?: {
  userId?: string
  typeId?: string
  status?: ReportLogStatus
  stageKey?: ReportStageKey
  fromIso?: string
  toIso?: string
}): ReportLogEntry[] {
  let list = ensure().reports
  if (filters?.userId) list = list.filter((r) => r.userId === filters.userId)
  if (filters?.typeId) list = list.filter((r) => r.typeId === filters.typeId)
  if (filters?.status) list = list.filter((r) => r.status === filters.status)
  if (filters?.stageKey) {
    list = list.filter((r) => r.stageKey === filters.stageKey)
  }
  if (filters?.fromIso) {
    const t = Date.parse(filters.fromIso)
    if (!Number.isNaN(t)) list = list.filter((r) => Date.parse(r.createdAt) >= t)
  }
  if (filters?.toIso) {
    const t = Date.parse(filters.toIso)
    if (!Number.isNaN(t)) list = list.filter((r) => Date.parse(r.createdAt) <= t)
  }
  return list
}

export function listReportAuthors(): ReportAuthor[] {
  const map = new Map<string, ReportAuthor>()
  for (const r of ensure().reports) {
    if (!map.has(r.userId)) {
      map.set(r.userId, {
        userId: r.userId,
        username: r.username,
        displayName: r.displayName,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'fa'),
  )
}

export function upsertReport(input: {
  userId: string
  username: string
  displayName: string
  typeId: string
  typeTitle: string
  branchId: number
  brandName: string
  branchName: string
  features: string[]
  status?: ReportLogStatus
  stageKey?: ReportStageKey
  stageLabel?: string
  stepIndex?: number
  stepTotal?: number
  query?: string
  note?: string
  markSent?: boolean
}): ReportLogEntry {
  const store = ensure()
  const id = `${input.userId}:${input.typeId}:${input.branchId}`
  const now = new Date().toISOString()
  const existing = store.reports.find((r) => r.id === id)
  const status: ReportLogStatus = input.markSent
    ? 'sent'
    : input.status || existing?.status || 'draft'
  const stageKey: ReportStageKey = input.markSent
    ? 'sent'
    : input.stageKey || existing?.stageKey || 'summary'
  const entry = normalizeEntry({
    id,
    userId: input.userId,
    username: input.username,
    displayName: input.displayName,
    typeId: input.typeId,
    typeTitle: input.typeTitle,
    branchId: input.branchId,
    brandName: input.brandName,
    branchName: input.branchName,
    features: input.features,
    status,
    stageKey,
    stageLabel: input.markSent
      ? 'ارسال‌شده'
      : input.stageLabel || existing?.stageLabel,
    stepIndex:
      input.stepIndex ??
      (input.markSent ? existing?.stepTotal : existing?.stepIndex) ??
      0,
    stepTotal: input.stepTotal ?? existing?.stepTotal ?? 0,
    query: input.query ?? existing?.query,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    sentAt: input.markSent
      ? now
      : status === 'sent'
        ? existing?.sentAt || now
        : undefined,
    note: input.note ?? existing?.note,
  })
  store.reports = [entry, ...store.reports.filter((r) => r.id !== id)]
  save(store)
  return entry
}

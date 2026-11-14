import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export type ReportLogStatus = 'draft' | 'sent'

/** مرحلهٔ فعلی در جریان ساخت گزارش */
export type ReportStageKey =
  | 'summary'
  | 'section'
  | 'diag'
  | 'send'
  | 'sent'

/** رویدادهای قابل ثبت روی یک گزارش تیمی */
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
  /** توضیح کوتاه فارسی برای صندوق/دیباگ */
  detail?: string
  stageKey?: ReportStageKey
  stageLabel?: string
}

export type ReportLogEntry = {
  /** کلید پایدار تیمی: typeId:branchId — مالک با باز شدن توسط دیگری عوض نمی‌شود */
  id: string
  /** سازندهٔ اولیه (immutable بعد از create) */
  userId: string
  username: string
  displayName: string
  /** آخرین کسی که پیشرفت/ارسال/یادداشت را زده */
  lastActorUserId: string
  lastActorUsername: string
  lastActorDisplayName: string
  typeId: string
  typeTitle: string
  branchId: number
  brandName: string
  branchName: string
  features: string[]
  status: ReportLogStatus
  stageKey: ReportStageKey
  stageLabel: string
  stepIndex: number
  stepTotal: number
  query?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  note?: string
  activity: ReportActivity[]
}

export type ReportAuthor = {
  userId: string
  username: string
  displayName: string
}

type StoreFile = { reports: ReportLogEntry[]; version?: number }

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'reports.json')
const MAX = 500
const MAX_ACTIVITY = 80
const STORE_VERSION = 2

function reportKey(typeId: string, branchId: number) {
  return `${typeId}:${Number(branchId) || 0}`
}

function stageLabelFallback(
  status: ReportLogStatus,
  stageKey: ReportStageKey,
): string {
  if (status === 'sent' || stageKey === 'sent') return 'ارسال‌شده'
  if (stageKey === 'send') return 'آماده ارسال'
  if (stageKey === 'diag') return 'نکات پیگیری'
  if (stageKey === 'section') return 'بررسی بخش‌ها'
  return 'خلاصه'
}

function normalizeStageKey(
  raw: unknown,
  status: ReportLogStatus,
): ReportStageKey {
  if (status === 'sent') return 'sent'
  if (
    raw === 'summary' ||
    raw === 'section' ||
    raw === 'diag' ||
    raw === 'send' ||
    raw === 'sent'
  ) {
    return raw
  }
  return 'summary'
}

function normalizeActivity(raw: Partial<ReportActivity>): ReportActivity | null {
  if (!raw.userId || !raw.at || !raw.action) return null
  return {
    id: raw.id || randomUUID(),
    at: raw.at,
    action: raw.action as ReportActivityAction,
    userId: raw.userId,
    username: raw.username || '',
    displayName: raw.displayName || raw.username || '',
    detail: raw.detail,
    stageKey: raw.stageKey,
    stageLabel: raw.stageLabel,
  }
}

function normalizeEntry(
  raw: Partial<ReportLogEntry> & { id: string; userId: string },
): ReportLogEntry {
  const status: ReportLogStatus = raw.status === 'sent' ? 'sent' : 'draft'
  const stageKey = normalizeStageKey(raw.stageKey, status)
  const activity = Array.isArray(raw.activity)
    ? raw.activity
        .map((a) => normalizeActivity(a))
        .filter((a): a is ReportActivity => !!a)
        .slice(0, MAX_ACTIVITY)
    : []

  return {
    id: raw.id,
    userId: raw.userId,
    username: raw.username || '',
    displayName: raw.displayName || raw.username || '',
    lastActorUserId: raw.lastActorUserId || raw.userId,
    lastActorUsername: raw.lastActorUsername || raw.username || '',
    lastActorDisplayName:
      raw.lastActorDisplayName || raw.displayName || raw.username || '',
    typeId: raw.typeId || '',
    typeTitle: raw.typeTitle || raw.typeId || '',
    branchId: Number(raw.branchId) || 0,
    brandName: raw.brandName || '',
    branchName: raw.branchName || '',
    features: Array.isArray(raw.features) ? raw.features : [],
    status,
    stageKey,
    stageLabel:
      raw.stageLabel || stageLabelFallback(status, stageKey),
    stepIndex: Number(raw.stepIndex) || 0,
    stepTotal: Number(raw.stepTotal) || 0,
    query: typeof raw.query === 'string' ? raw.query : undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    sentAt: raw.sentAt,
    note: raw.note,
    activity,
  }
}

/** مهاجرت از id قدیمی userId:typeId:branchId به typeId:branchId */
function migrateReports(rawList: Partial<ReportLogEntry>[]): ReportLogEntry[] {
  const byKey = new Map<string, ReportLogEntry>()

  for (const raw of rawList) {
    if (!raw || typeof raw !== 'object') continue
    const typeId = String(raw.typeId || '')
    const branchId = Number(raw.branchId) || 0
    if (!typeId) continue

    const userId = String(raw.userId || '')
    // id قدیم: user:type:branch | id جدید: type:branch
    const parts = String(raw.id || '').split(':')
    const key = reportKey(typeId, branchId)

    const candidate = normalizeEntry({
      ...raw,
      id: key,
      userId: userId || 'unknown',
      lastActorUserId: raw.lastActorUserId || userId,
      lastActorUsername: raw.lastActorUsername || raw.username,
      lastActorDisplayName: raw.lastActorDisplayName || raw.displayName,
      activity:
        Array.isArray(raw.activity) && raw.activity.length
          ? raw.activity
          : [
              {
                id: randomUUID(),
                at: raw.createdAt || new Date().toISOString(),
                action: 'created' as const,
                userId: userId || 'unknown',
                username: raw.username || '',
                displayName: raw.displayName || raw.username || '',
                detail: 'ایجاد گزارش (مهاجرت)',
              },
            ],
    })

    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, candidate)
      continue
    }

    // قدیمی‌تر = مالک؛ جدیدتر = آخرین بازیگر/مرحله
    const keepOwner =
      Date.parse(existing.createdAt) <= Date.parse(candidate.createdAt)
        ? existing
        : candidate
    const newer =
      Date.parse(existing.updatedAt) >= Date.parse(candidate.updatedAt)
        ? existing
        : candidate

    const mergedActivity = [...existing.activity, ...candidate.activity]
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
      .slice(-MAX_ACTIVITY)

    byKey.set(
      key,
      normalizeEntry({
        ...newer,
        id: key,
        userId: keepOwner.userId,
        username: keepOwner.username,
        displayName: keepOwner.displayName,
        createdAt: keepOwner.createdAt,
        lastActorUserId: newer.lastActorUserId,
        lastActorUsername: newer.lastActorUsername,
        lastActorDisplayName: newer.lastActorDisplayName,
        activity: mergedActivity,
      }),
    )

    // silence unused for lint when parts only used for docs
    void parts
  }

  return Array.from(byKey.values()).sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  )
}

function ensure(): StoreFile {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreFile = { reports: [], version: STORE_VERSION }
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreFile
    const list = Array.isArray(raw.reports) ? raw.reports : []
    const needsMigrate =
      raw.version !== STORE_VERSION ||
      list.some((r) => {
        const id = String(r?.id || '')
        const expected = reportKey(String(r?.typeId || ''), Number(r?.branchId) || 0)
        return id !== expected || !Array.isArray(r?.activity)
      })
    const reports = needsMigrate ? migrateReports(list) : list.map((r) => normalizeEntry(r as ReportLogEntry))
    if (needsMigrate) {
      const next = { reports: reports.slice(0, MAX), version: STORE_VERSION }
      save(next)
      return next
    }
    return { reports, version: STORE_VERSION }
  } catch {
    return { reports: [], version: STORE_VERSION }
  }
}

function save(store: StoreFile) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(
      { version: STORE_VERSION, reports: store.reports.slice(0, MAX) },
      null,
      2,
    ),
    'utf8',
  )
}

function pushActivity(
  entry: ReportLogEntry,
  act: Omit<ReportActivity, 'id'> & { id?: string },
): ReportLogEntry {
  const next: ReportActivity = {
    id: act.id || randomUUID(),
    at: act.at,
    action: act.action,
    userId: act.userId,
    username: act.username,
    displayName: act.displayName,
    detail: act.detail,
    stageKey: act.stageKey,
    stageLabel: act.stageLabel,
  }
  return {
    ...entry,
    activity: [...entry.activity, next].slice(-MAX_ACTIVITY),
  }
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
  // فیلتر کاربر = مالک گزارش (نه آخرین ویرایشگر)
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

export function getReport(id: string): ReportLogEntry | undefined {
  return ensure().reports.find((r) => r.id === id)
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
  /** نوع رویداد برای لاگ فعالیت */
  action?: ReportActivityAction
}): ReportLogEntry {
  const store = ensure()
  const id = reportKey(input.typeId, input.branchId)
  const now = new Date().toISOString()
  const existing = store.reports.find((r) => r.id === id)

  const status: ReportLogStatus = input.markSent
    ? 'sent'
    : input.status || existing?.status || 'draft'
  const stageKey: ReportStageKey = input.markSent
    ? 'sent'
    : normalizeStageKey(input.stageKey ?? existing?.stageKey, status)
  const stageLabel = input.markSent
    ? 'ارسال‌شده'
    : input.stageLabel ||
      existing?.stageLabel ||
      stageLabelFallback(status, stageKey)

  const action: ReportActivityAction = input.markSent
    ? 'sent'
    : input.action
      ? input.action
      : !existing
        ? 'created'
        : status === 'draft' && existing.status === 'sent'
          ? 'unsent'
          : input.note !== undefined && input.note !== existing.note
            ? 'note'
            : input.stageKey && input.stageKey !== existing.stageKey
              ? 'stage'
              : 'updated'

  let entry = normalizeEntry({
    id,
    // مالک فقط هنگام ایجاد ست می‌شود
    userId: existing?.userId || input.userId,
    username: existing?.username || input.username,
    displayName: existing?.displayName || input.displayName,
    lastActorUserId: input.userId,
    lastActorUsername: input.username,
    lastActorDisplayName: input.displayName,
    typeId: input.typeId,
    typeTitle: input.typeTitle,
    branchId: input.branchId,
    brandName: input.brandName,
    branchName: input.branchName,
    features: input.features,
    status,
    stageKey,
    stageLabel,
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
    activity: existing?.activity ?? [],
  })

  const detail =
    action === 'created'
      ? 'ایجاد گزارش'
      : action === 'sent'
        ? 'ثبت ارسال به مشتری'
        : action === 'unsent'
          ? 'لغو ثبت ارسال'
          : action === 'note'
            ? 'به‌روزرسانی یادداشت'
            : action === 'stage'
              ? `مرحله: ${stageLabel}`
              : action === 'opened'
                ? 'باز کردن گزارش'
                : 'به‌روزرسانی پیشرفت'

  entry = pushActivity(entry, {
    at: now,
    action,
    userId: input.userId,
    username: input.username,
    displayName: input.displayName,
    detail,
    stageKey,
    stageLabel,
  })

  store.reports = [entry, ...store.reports.filter((r) => r.id !== id)]
  save(store)
  return entry
}

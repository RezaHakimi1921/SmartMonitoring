import fs from 'node:fs'
import path from 'node:path'

export type ReportLogStatus = 'draft' | 'sent'

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
  createdAt: string
  updatedAt: string
  sentAt?: string
  note?: string
}

type StoreFile = { reports: ReportLogEntry[] }

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'reports.json')
const MAX = 500

function ensure(): StoreFile {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreFile = { reports: [] }
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreFile
    return { reports: Array.isArray(raw.reports) ? raw.reports : [] }
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
  fromIso?: string
  toIso?: string
}): ReportLogEntry[] {
  let list = ensure().reports
  if (filters?.userId) list = list.filter((r) => r.userId === filters.userId)
  if (filters?.typeId) list = list.filter((r) => r.typeId === filters.typeId)
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
  note?: string
  markSent?: boolean
}): ReportLogEntry {
  const store = ensure()
  const id = `${input.userId}:${input.typeId}:${input.branchId}`
  const now = new Date().toISOString()
  const existing = store.reports.find((r) => r.id === id)
  const entry: ReportLogEntry = {
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
    status: input.markSent
      ? 'sent'
      : input.status || existing?.status || 'draft',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    sentAt: input.markSent ? now : existing?.sentAt,
    note: input.note ?? existing?.note,
  }
  store.reports = [entry, ...store.reports.filter((r) => r.id !== id)]
  save(store)
  return entry
}

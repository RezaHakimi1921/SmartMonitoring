import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export type FeedbackKind = 'bug' | 'improvement' | 'change'
export type FeedbackStatus = 'open' | 'in_progress' | 'done' | 'wontfix'

/** بدون شاخص خاص از کاتالوگ کیفی */
export const FEEDBACK_METRIC_GENERAL = 'general'

export type FeedbackBrand = {
  branchId: number
  brandName: string
  branchName: string
  lockNumber?: string
}

export type FeedbackActivity = {
  id: string
  at: string
  userId: string
  username: string
  displayName: string
  action: 'created' | 'status' | 'comment' | 'updated'
  detail?: string
}

export type FeedbackCommentVisibility = 'public' | 'admin'

export type FeedbackComment = {
  id: string
  at: string
  userId: string
  username: string
  displayName: string
  body: string
  /** public = همه · admin = فقط ادمین/سوپرادمین */
  visibility: FeedbackCommentVisibility
}

export type FeedbackImage = {
  id: string
  fileName: string
  mime: string
  originalName?: string
}

export type FeedbackItem = {
  id: string
  userId: string
  username: string
  displayName: string
  kind: FeedbackKind
  /** شناسهٔ شاخص از metricRules یا `general` */
  metricId: string
  /** برچسب ذخیره‌شده برای نمایش پایدار */
  metricLabel: string
  /** یادداشت آزاد بخش / جزئیات */
  section: string
  title: string
  body: string
  brand?: FeedbackBrand
  images: FeedbackImage[]
  comments: FeedbackComment[]
  status: FeedbackStatus
  createdAt: string
  updatedAt: string
  activity: FeedbackActivity[]
}

type StoreFile = { items: FeedbackItem[]; version: number }

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'feedback.json')
const FILES_DIR = path.join(DATA_DIR, 'feedback-files')
const MAX = 800
const MAX_ACTIVITY = 80
const MAX_COMMENTS = 200
const MAX_IMAGES = 8
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024
const STORE_VERSION = 3

const KIND_SET = new Set<FeedbackKind>(['bug', 'improvement', 'change'])
const STATUS_SET = new Set<FeedbackStatus>([
  'open',
  'in_progress',
  'done',
  'wontfix',
])

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true })
}

function ensureFile(): StoreFile {
  ensureDirs()
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreFile = { items: [], version: STORE_VERSION }
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreFile
    const items = Array.isArray(raw.items)
      ? (raw.items.map(normalizeItem).filter(Boolean) as FeedbackItem[])
      : []
    return { items, version: STORE_VERSION }
  } catch {
    return { items: [], version: STORE_VERSION }
  }
}

function save(store: StoreFile) {
  ensureDirs()
  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(
      { version: STORE_VERSION, items: store.items.slice(0, MAX) },
      null,
      2,
    ),
    'utf8',
  )
}

function normalizeImages(raw: unknown): FeedbackImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((img) => {
      const o = img as Partial<FeedbackImage>
      if (!o?.id || !o.fileName || !o.mime) return null
      return {
        id: String(o.id),
        fileName: String(o.fileName),
        mime: String(o.mime),
        originalName: o.originalName ? String(o.originalName) : undefined,
      }
    })
    .filter(Boolean)
    .slice(0, MAX_IMAGES) as FeedbackImage[]
}

function normalizeItem(raw: Partial<FeedbackItem> & { moduleId?: string }): FeedbackItem | null {
  if (!raw?.id || !raw.userId || !raw.title) return null
  const kind = KIND_SET.has(raw.kind as FeedbackKind)
    ? (raw.kind as FeedbackKind)
    : 'bug'
  const status = STATUS_SET.has(raw.status as FeedbackStatus)
    ? (raw.status as FeedbackStatus)
    : 'open'
  const metricId = String(
    raw.metricId || raw.moduleId || FEEDBACK_METRIC_GENERAL,
  ).trim() || FEEDBACK_METRIC_GENERAL
  const metricLabel =
    String(raw.metricLabel || '').trim() ||
    (metricId === FEEDBACK_METRIC_GENERAL ? 'عمومی / بدون شاخص' : metricId)
  return {
    id: raw.id,
    userId: raw.userId,
    username: raw.username || '',
    displayName: raw.displayName || raw.username || '',
    kind,
    metricId,
    metricLabel,
    section: String(raw.section || '').trim(),
    title: String(raw.title).trim(),
    body: String(raw.body || '').trim(),
    brand: raw.brand?.branchId
      ? {
          branchId: Number(raw.brand.branchId) || 0,
          brandName: raw.brand.brandName || '',
          branchName: raw.brand.branchName || '',
          lockNumber: raw.brand.lockNumber,
        }
      : undefined,
    images: normalizeImages(raw.images),
    comments: normalizeComments(
      (raw as { comments?: unknown }).comments,
      Array.isArray(raw.activity) ? raw.activity : [],
    ),
    status,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    activity: Array.isArray(raw.activity) ? raw.activity.slice(-MAX_ACTIVITY) : [],
  }
}

function normalizeCommentVisibility(
  raw: unknown,
): FeedbackCommentVisibility {
  return raw === 'admin' ? 'admin' : 'public'
}

function normalizeComments(
  raw: unknown,
  activity: FeedbackActivity[],
): FeedbackComment[] {
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((c) => {
        const o = c as Partial<FeedbackComment>
        if (!o?.id || !o.body) return null
        return {
          id: String(o.id),
          at: o.at || new Date().toISOString(),
          userId: String(o.userId || ''),
          username: String(o.username || ''),
          displayName: String(o.displayName || o.username || ''),
          body: String(o.body).trim(),
          visibility: normalizeCommentVisibility(o.visibility),
        }
      })
      .filter(Boolean)
      .slice(-MAX_COMMENTS) as FeedbackComment[]
  }
  // مهاجرت از activityهای قدیمی نوع comment
  return activity
    .filter((a) => a.action === 'comment' && a.detail)
    .map((a) => ({
      id: a.id,
      at: a.at,
      userId: a.userId,
      username: a.username,
      displayName: a.displayName,
      body: String(a.detail || '').trim(),
      visibility: 'public' as const,
    }))
    .filter((c) => c.body)
    .slice(-MAX_COMMENTS)
}

/** برای پاسخ API: کامنت ادمین را از چشم کاربر عادی پنهان می‌کند */
export function redactFeedbackForViewer(
  item: FeedbackItem,
  canSeeAdmin: boolean,
): FeedbackItem {
  if (canSeeAdmin) return item
  return {
    ...item,
    comments: item.comments.filter((c) => c.visibility !== 'admin'),
  }
}

export function listFeedback(filters?: {
  userId?: string
  kind?: FeedbackKind
  status?: FeedbackStatus
  metricId?: string
  /** @deprecated alias of metricId */
  moduleId?: string
  mineOnlyUserId?: string
}): FeedbackItem[] {
  let list = ensureFile().items
  if (filters?.mineOnlyUserId) {
    list = list.filter((i) => i.userId === filters.mineOnlyUserId)
  } else if (filters?.userId) {
    list = list.filter((i) => i.userId === filters.userId)
  }
  if (filters?.kind) list = list.filter((i) => i.kind === filters.kind)
  if (filters?.status) list = list.filter((i) => i.status === filters.status)
  const metricFilter = filters?.metricId || filters?.moduleId
  if (metricFilter) {
    list = list.filter((i) => i.metricId === metricFilter)
  }
  return list.sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  )
}

export function getFeedback(id: string): FeedbackItem | undefined {
  return ensureFile().items.find((i) => i.id === id)
}

function extForMime(mime: string) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'jpg'
}

/** ذخیرهٔ عکس‌ها از data URL؛ حداکثر ۴ عدد */
export function saveFeedbackImagesFromDataUrls(
  dataUrls: string[] | undefined,
): FeedbackImage[] {
  if (!dataUrls?.length) return []
  ensureDirs()
  const out: FeedbackImage[] = []
  for (const raw of dataUrls.slice(0, MAX_IMAGES)) {
    const m = String(raw || '').match(
      /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i,
    )
    if (!m) {
      throw Object.assign(new Error('فرمت عکس نامعتبر است'), { status: 400 })
    }
    const mime = m[1].toLowerCase()
    if (!ALLOWED_MIME.has(mime)) {
      throw Object.assign(new Error('نوع فایل تصویر مجاز نیست'), { status: 400 })
    }
    const buf = Buffer.from(m[2].replace(/\s+/g, ''), 'base64')
    if (!buf.length || buf.length > MAX_IMAGE_BYTES) {
      throw Object.assign(
        new Error('حجم هر عکس حداکثر حدود ۲٫۵ مگابایت باشد'),
        { status: 400 },
      )
    }
    const id = randomUUID()
    const fileName = `${id}.${extForMime(mime)}`
    fs.writeFileSync(path.join(FILES_DIR, fileName), buf)
    out.push({ id, fileName, mime })
  }
  return out
}

export function resolveFeedbackImagePath(imageId: string): {
  absolutePath: string
  mime: string
} | null {
  const safe = String(imageId || '').replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safe) return null
  const store = ensureFile()
  for (const item of store.items) {
    const img = item.images.find((i) => i.id === safe)
    if (!img) continue
    const full = path.join(FILES_DIR, path.basename(img.fileName))
    if (!fs.existsSync(full)) return null
    return { absolutePath: full, mime: img.mime }
  }
  return null
}

export function createFeedback(input: {
  userId: string
  username: string
  displayName: string
  kind: FeedbackKind
  metricId: string
  metricLabel: string
  section?: string
  title: string
  body: string
  brand?: FeedbackBrand
  imageDataUrls?: string[]
}): FeedbackItem {
  const title = input.title.trim()
  const body = input.body.trim()
  if (!title || title.length < 3) {
    throw Object.assign(new Error('عنوان حداقل ۳ کاراکتر باشد'), { status: 400 })
  }
  if (!body || body.length < 5) {
    throw Object.assign(new Error('شرح حداقل ۵ کاراکتر باشد'), { status: 400 })
  }
  if (!KIND_SET.has(input.kind)) {
    throw Object.assign(new Error('نوع مورد نامعتبر است'), { status: 400 })
  }
  const metricId =
    String(input.metricId || FEEDBACK_METRIC_GENERAL).trim() ||
    FEEDBACK_METRIC_GENERAL
  const metricLabel =
    String(input.metricLabel || '').trim() ||
    (metricId === FEEDBACK_METRIC_GENERAL ? 'عمومی / بدون شاخص' : metricId)
  const images = saveFeedbackImagesFromDataUrls(input.imageDataUrls)
  const now = new Date().toISOString()
  const item: FeedbackItem = {
    id: randomUUID(),
    userId: input.userId,
    username: input.username,
    displayName: input.displayName,
    kind: input.kind,
    metricId,
    metricLabel,
    section: (input.section || '').trim(),
    title,
    body,
    brand: input.brand?.branchId ? input.brand : undefined,
    images,
    comments: [],
    status: 'open',
    createdAt: now,
    updatedAt: now,
    activity: [
      {
        id: randomUUID(),
        at: now,
        userId: input.userId,
        username: input.username,
        displayName: input.displayName,
        action: 'created',
        detail:
          images.length > 0
            ? `ثبت مورد جدید · ${images.length} عکس`
            : 'ثبت مورد جدید',
      },
    ],
  }
  const store = ensureFile()
  store.items = [item, ...store.items]
  save(store)
  return item
}

export function updateFeedbackStatus(input: {
  id: string
  status: FeedbackStatus
  actorUserId: string
  actorUsername: string
  actorDisplayName: string
  comment?: string
}): FeedbackItem {
  if (!STATUS_SET.has(input.status)) {
    throw Object.assign(new Error('وضعیت نامعتبر است'), { status: 400 })
  }
  const store = ensureFile()
  const idx = store.items.findIndex((i) => i.id === input.id)
  if (idx < 0) {
    throw Object.assign(new Error('مورد پیدا نشد'), { status: 404 })
  }
  const prev = store.items[idx]
  const now = new Date().toISOString()
  const next: FeedbackItem = {
    ...prev,
    status: input.status,
    updatedAt: now,
    activity: [
      ...prev.activity,
      {
        id: randomUUID(),
        at: now,
        userId: input.actorUserId,
        username: input.actorUsername,
        displayName: input.actorDisplayName,
        action: 'status',
        detail:
          input.comment?.trim() ||
          `تغییر وضعیت به ${statusLabel(input.status)}`,
      },
    ].slice(-MAX_ACTIVITY),
  }
  store.items = [next, ...store.items.filter((i) => i.id !== input.id)]
  save(store)
  return next
}

export function updateFeedback(input: {
  id: string
  actorUserId: string
  actorUsername: string
  actorDisplayName: string
  kind?: FeedbackKind
  metricId?: string
  metricLabel?: string
  section?: string
  title?: string
  body?: string
  status?: FeedbackStatus
  brand?: FeedbackBrand | null
  imageDataUrls?: string[]
}): FeedbackItem {
  const store = ensureFile()
  const idx = store.items.findIndex((i) => i.id === input.id)
  if (idx < 0) {
    throw Object.assign(new Error('مورد پیدا نشد'), { status: 404 })
  }
  const prev = store.items[idx]
  const title =
    input.title !== undefined ? input.title.trim() : prev.title
  const body = input.body !== undefined ? input.body.trim() : prev.body
  if (!title || title.length < 3) {
    throw Object.assign(new Error('عنوان حداقل ۳ کاراکتر باشد'), { status: 400 })
  }
  if (!body || body.length < 5) {
    throw Object.assign(new Error('شرح حداقل ۵ کاراکتر باشد'), { status: 400 })
  }
  if (input.kind !== undefined && !KIND_SET.has(input.kind)) {
    throw Object.assign(new Error('نوع مورد نامعتبر است'), { status: 400 })
  }
  if (input.status !== undefined && !STATUS_SET.has(input.status)) {
    throw Object.assign(new Error('وضعیت نامعتبر است'), { status: 400 })
  }
  const addedImages = saveFeedbackImagesFromDataUrls(input.imageDataUrls)
  const images = [...prev.images, ...addedImages].slice(0, MAX_IMAGES)
  const now = new Date().toISOString()
  const next: FeedbackItem = {
    ...prev,
    kind: input.kind ?? prev.kind,
    metricId: input.metricId ?? prev.metricId,
    metricLabel: input.metricLabel ?? prev.metricLabel,
    section:
      input.section !== undefined ? input.section.trim() : prev.section,
    title,
    body,
    status: input.status ?? prev.status,
    brand:
      input.brand === null
        ? undefined
        : input.brand?.branchId
          ? input.brand
          : prev.brand,
    images,
    updatedAt: now,
    activity: [
      ...prev.activity,
      {
        id: randomUUID(),
        at: now,
        userId: input.actorUserId,
        username: input.actorUsername,
        displayName: input.actorDisplayName,
        action: 'updated',
        detail: 'ویرایش مورد',
      },
    ].slice(-MAX_ACTIVITY),
  }
  store.items = [next, ...store.items.filter((i) => i.id !== input.id)]
  save(store)
  return next
}

export function addFeedbackComment(input: {
  id: string
  actorUserId: string
  actorUsername: string
  actorDisplayName: string
  body: string
  visibility?: FeedbackCommentVisibility
  /** فقط ادمین/سوپرادمین می‌تواند کامنت ادمین بزند */
  actorIsStaff?: boolean
}): FeedbackItem {
  const text = input.body.trim()
  if (!text || text.length < 1) {
    throw Object.assign(new Error('متن کامنت خالی است'), { status: 400 })
  }
  if (text.length > 4000) {
    throw Object.assign(new Error('کامنت خیلی طولانی است'), { status: 400 })
  }
  const visibility: FeedbackCommentVisibility =
    input.visibility === 'admin' && input.actorIsStaff ? 'admin' : 'public'
  if (input.visibility === 'admin' && !input.actorIsStaff) {
    throw Object.assign(new Error('فقط ادمین می‌تواند کامنت ادمین ثبت کند'), {
      status: 403,
    })
  }
  const store = ensureFile()
  const idx = store.items.findIndex((i) => i.id === input.id)
  if (idx < 0) {
    throw Object.assign(new Error('مورد پیدا نشد'), { status: 404 })
  }
  const prev = store.items[idx]
  const now = new Date().toISOString()
  const comment: FeedbackComment = {
    id: randomUUID(),
    at: now,
    userId: input.actorUserId,
    username: input.actorUsername,
    displayName: input.actorDisplayName,
    body: text,
    visibility,
  }
  const next: FeedbackItem = {
    ...prev,
    updatedAt: now,
    comments: [...prev.comments, comment].slice(-MAX_COMMENTS),
    activity: [
      ...prev.activity,
      {
        id: comment.id,
        at: now,
        userId: input.actorUserId,
        username: input.actorUsername,
        displayName: input.actorDisplayName,
        action: 'comment',
        detail:
          visibility === 'admin'
            ? `[ادمین] ${text.slice(0, 180)}`
            : text.slice(0, 200),
      },
    ].slice(-MAX_ACTIVITY),
  }
  store.items = [next, ...store.items.filter((i) => i.id !== input.id)]
  save(store)
  return next
}

export function statusLabel(s: FeedbackStatus): string {
  if (s === 'open') return 'باز'
  if (s === 'in_progress') return 'در حال بررسی'
  if (s === 'done') return 'انجام شد'
  return 'انصراف / انجام نمی‌شود'
}

export function kindLabel(k: FeedbackKind): string {
  if (k === 'bug') return 'باگ'
  if (k === 'improvement') return 'بهبود'
  return 'تغییر'
}

export type FeedbackKind = 'bug' | 'improvement' | 'change'
export type FeedbackStatus = 'open' | 'in_progress' | 'done' | 'wontfix'

export type FeedbackMetric = {
  id: string
  label: string
  featureId: string
  featureTitle: string
  enabled: boolean
}

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
  visibility?: FeedbackCommentVisibility
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
  metricId: string
  metricLabel: string
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

function apiUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base : `${base}/`
  return `${root}${path.replace(/^\//, '')}`
}

export function feedbackImageUrl(imageId: string) {
  return apiUrl(`api/feedback/files/${encodeURIComponent(imageId)}`)
}

/** کلید کوتاه شبیه Jira برای نمایش */
export function feedbackKey(id: string) {
  const short = id.replace(/-/g, '').slice(0, 6).toUpperCase()
  return `FB-${short}`
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

function normalizeItem(it: FeedbackItem): FeedbackItem {
  return {
    ...it,
    images: Array.isArray(it.images) ? it.images : [],
    comments: (Array.isArray(it.comments) ? it.comments : []).map((c) => ({
      ...c,
      visibility: c.visibility === 'admin' ? 'admin' : 'public',
    })),
    activity: Array.isArray(it.activity) ? it.activity : [],
    metricId: it.metricId || 'general',
    metricLabel: it.metricLabel || it.metricId || 'عمومی',
  }
}

export async function fetchFeedbackMeta(): Promise<{
  metrics: FeedbackMetric[]
  kinds: { id: FeedbackKind; label: string }[]
  statuses: { id: FeedbackStatus; label: string }[]
}> {
  const res = await fetch(apiUrl('api/feedback/meta'), {
    credentials: 'include',
  })
  const data = await parseJson<{
    metrics?: FeedbackMetric[]
    modules?: { id: string; label: string }[]
    kinds: { id: FeedbackKind; label: string }[]
    statuses: { id: FeedbackStatus; label: string }[]
  }>(res)
  if (!res.ok) throw new Error(data.error || 'بارگذاری متادیتا ناموفق')
  const metrics =
    data.metrics ??
    (data.modules || []).map((m) => ({
      id: m.id,
      label: m.label,
      featureId: '',
      featureTitle: '',
      enabled: true,
    }))
  return {
    metrics,
    kinds: data.kinds ?? [],
    statuses: data.statuses ?? [],
  }
}

export async function fetchFeedback(params?: {
  kind?: FeedbackKind
  status?: FeedbackStatus
  metricId?: string
  mine?: boolean
  userId?: string
}): Promise<FeedbackItem[]> {
  const q = new URLSearchParams()
  if (params?.kind) q.set('kind', params.kind)
  if (params?.status) q.set('status', params.status)
  if (params?.metricId) q.set('metricId', params.metricId)
  if (params?.mine) q.set('mine', '1')
  if (params?.userId) q.set('userId', params.userId)
  const qs = q.toString()
  const res = await fetch(apiUrl(`api/feedback${qs ? `?${qs}` : ''}`), {
    credentials: 'include',
  })
  const data = await parseJson<{ items: FeedbackItem[] }>(res)
  if (!res.ok) throw new Error(data.error || 'بارگذاری پیشنهادات ناموفق')
  return (data.items ?? []).map(normalizeItem)
}

export async function fetchFeedbackItem(id: string): Promise<FeedbackItem> {
  const res = await fetch(apiUrl(`api/feedback/${encodeURIComponent(id)}`), {
    credentials: 'include',
  })
  const data = await parseJson<{ item: FeedbackItem }>(res)
  if (!res.ok || !data.item) throw new Error(data.error || 'مورد پیدا نشد')
  return normalizeItem(data.item)
}

export async function createFeedbackItem(body: {
  kind: FeedbackKind
  metricId: string
  metricLabel?: string
  section?: string
  title: string
  body: string
  brand?: FeedbackBrand
  images?: string[]
}): Promise<FeedbackItem> {
  const res = await fetch(apiUrl('api/feedback'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await parseJson<{ item: FeedbackItem }>(res)
  if (!res.ok || !data.item) {
    throw new Error(data.error || 'ثبت مورد ناموفق')
  }
  return normalizeItem(data.item)
}

export async function updateFeedbackItem(
  id: string,
  body: {
    kind?: FeedbackKind
    metricId?: string
    metricLabel?: string
    section?: string
    title?: string
    body?: string
    status?: FeedbackStatus
    brand?: FeedbackBrand | null
    images?: string[]
  },
): Promise<FeedbackItem> {
  const res = await fetch(apiUrl(`api/feedback/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await parseJson<{ item: FeedbackItem }>(res)
  if (!res.ok || !data.item) {
    throw new Error(data.error || 'ویرایش ناموفق')
  }
  return normalizeItem(data.item)
}

export async function patchFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  comment?: string,
): Promise<FeedbackItem> {
  const res = await fetch(
    apiUrl(`api/feedback/${encodeURIComponent(id)}/status`),
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment }),
    },
  )
  const data = await parseJson<{ item: FeedbackItem }>(res)
  if (!res.ok || !data.item) {
    throw new Error(data.error || 'به‌روزرسانی وضعیت ناموفق')
  }
  return normalizeItem(data.item)
}

export async function postFeedbackComment(
  id: string,
  body: string,
  visibility: FeedbackCommentVisibility = 'public',
): Promise<FeedbackItem> {
  const res = await fetch(
    apiUrl(`api/feedback/${encodeURIComponent(id)}/comments`),
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, visibility }),
    },
  )
  const data = await parseJson<{ item: FeedbackItem }>(res)
  if (!res.ok || !data.item) {
    throw new Error(data.error || 'ثبت کامنت ناموفق')
  }
  return normalizeItem(data.item)
}

export function kindLabelFa(k: FeedbackKind) {
  if (k === 'bug') return 'باگ'
  if (k === 'improvement') return 'بهبود'
  return 'تغییر'
}

export function statusLabelFa(s: FeedbackStatus) {
  if (s === 'open') return 'باز'
  if (s === 'in_progress') return 'در حال بررسی'
  if (s === 'done') return 'انجام شد'
  return 'انصراف'
}

export function metricOptionLabel(m: FeedbackMetric) {
  if (!m.featureTitle) return m.label
  return `${m.featureTitle} · ${m.label}`
}

export function compressImageFile(
  file: File,
  maxWidth = 1600,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('فقط فایل تصویر مجاز است'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('خواندن فایل ناموفق'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('بارگذاری تصویر ناموفق'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas در دسترس نیست'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

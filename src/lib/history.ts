export type ReportStatus = 'draft' | 'sent'

export interface HistoryEntry {
  id: string
  typeId: string
  typeTitle: string
  brandName: string
  branchName: string
  branchId: string
  /** رشته query صفحه گزارش، برای باز کردن دوباره با همان تنظیمات */
  query: string
  savedAt: string
  /** پیش‌نویس یا ارسال‌شده برای مشتری */
  status?: ReportStatus
  sentAt?: string
  /** یادداشت کارشناس */
  note?: string
}

const KEY = 'sx-monitoring-history'
const MAX = 30

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as HistoryEntry[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    // ذخیره‌سازی در دسترس نیست؛ تاریخچه ساخته نمی‌شود ولی برنامه کار می‌کند
  }
}

export function historyId(typeId: string, branchId: string | number) {
  return `${typeId}:${branchId}`
}

export function getHistoryEntry(id: string) {
  return loadHistory().find((h) => h.id === id)
}

/**
 * هر مجموعه + نوع بررسی فقط یک ردیف دارد؛ آخرین تنظیمات جایگزین می‌شود
 * ولی وضعیت ارسال و یادداشت قبلی حفظ می‌شود.
 */
export function saveHistoryEntry(
  entry: Omit<HistoryEntry, 'id' | 'savedAt' | 'status' | 'sentAt' | 'note'>,
) {
  const id = historyId(entry.typeId, entry.branchId)
  const list = loadHistory()
  const old = list.find((h) => h.id === id)
  const rest = list.filter((h) => h.id !== id)
  write([
    {
      ...entry,
      id,
      savedAt: new Date().toISOString(),
      status: old?.status ?? 'draft',
      sentAt: old?.sentAt,
      note: old?.note,
    },
    ...rest,
  ])
}

export function updateHistoryEntry(
  id: string,
  patch: Partial<Pick<HistoryEntry, 'status' | 'sentAt' | 'note'>>,
) {
  write(loadHistory().map((h) => (h.id === id ? { ...h, ...patch } : h)))
}

export function removeHistoryEntry(id: string) {
  write(loadHistory().filter((h) => h.id !== id))
}

export function clearHistory() {
  write([])
}

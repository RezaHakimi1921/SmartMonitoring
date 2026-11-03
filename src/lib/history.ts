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

/** هر مجموعه + نوع بررسی فقط یک ردیف دارد؛ آخرین تنظیمات جایگزین می‌شود. */
export function saveHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'savedAt'>) {
  const id = `${entry.typeId}:${entry.branchId}`
  const rest = loadHistory().filter((h) => h.id !== id)
  write([{ ...entry, id, savedAt: new Date().toISOString() }, ...rest])
}

export function removeHistoryEntry(id: string) {
  write(loadHistory().filter((h) => h.id !== id))
}

export function clearHistory() {
  write([])
}

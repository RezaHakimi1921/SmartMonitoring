import { beforeEach, describe, expect, it } from 'vitest'
import {
  getHistoryEntry,
  historyId,
  loadHistory,
  saveHistoryEntry,
  updateHistoryEntry,
} from '../lib/history'

const store = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
}

const base = {
  typeId: 'quick',
  typeTitle: 'بررسی سریع',
  brandName: 'مجموعه',
  branchName: 'شعبه',
  branchId: '10',
  query: 'period=1m',
}

describe('تاریخچه گزارش‌ها', () => {
  beforeEach(() => store.clear())

  it('هر مجموعه و نوع بررسی فقط یک ردیف دارد', () => {
    saveHistoryEntry(base)
    saveHistoryEntry({ ...base, query: 'period=3m' })
    expect(loadHistory()).toHaveLength(1)
    expect(loadHistory()[0].query).toBe('period=3m')
  })

  it('وضعیت ارسال و یادداشت با ذخیره دوباره حفظ می‌شود', () => {
    saveHistoryEntry(base)
    const id = historyId('quick', '10')
    updateHistoryEntry(id, { status: 'sent', note: 'پیگیری' })
    saveHistoryEntry({ ...base, query: 'period=6m' })
    const e = getHistoryEntry(id)
    expect(e?.status).toBe('sent')
    expect(e?.note).toBe('پیگیری')
  })
})

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HistoryList } from '../components/HistoryList'
import {
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from '../lib/history'

type Filter = 'all' | 'draft' | 'sent'

export function HistoryPage() {
  const [items, setItems] = useState(() => loadHistory())
  const [confirmClear, setConfirmClear] = useState(false)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const shown = useMemo(() => {
    const q = text.trim()
    return items.filter((h) => {
      if (filter === 'sent' && h.status !== 'sent') return false
      if (filter === 'draft' && h.status === 'sent') return false
      if (!q) return true
      return `${h.brandName} ${h.branchName} ${h.typeTitle}`.includes(q)
    })
  }, [items, text, filter])

  return (
    <div className="flow">
      <header className="flow-head">
        <h2>گزارش‌ها</h2>
        <p className="muted">
          هر گزارشی که می‌سازید اینجا نگه داشته می‌شود تا بتوانید دوباره و با همان
          تنظیمات بازش کنید. این فهرست فقط روی همین مرورگر ذخیره می‌شود.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>
            <strong>هنوز گزارشی نساخته‌اید.</strong>
          </p>
          <p className="muted">با اولین بررسی، گزارش آن اینجا دیده می‌شود.</p>
          <Link to="/" className="btn btn-primary">
            شروع اولین بررسی
          </Link>
        </div>
      ) : (
        <>
          <div className="history-filters">
            <input
              className="input"
              type="search"
              placeholder="جستجوی نام مجموعه یا نوع بررسی…"
              aria-label="جستجو در گزارش‌ها"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="period-row" role="group" aria-label="فیلتر وضعیت">
              {(
                [
                  ['all', 'همه'],
                  ['draft', 'پیش‌نویس'],
                  ['sent', 'ارسال‌شده'],
                ] as [Filter, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`period-chip${filter === id ? ' active' : ''}`}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="muted">موردی با این فیلتر پیدا نشد.</p>
          ) : (
            <HistoryList
              items={shown}
              onRemove={(id) => {
                removeHistoryEntry(id)
                setItems(loadHistory())
              }}
            />
          )}
          <div className="actions">
            {confirmClear ? (
              <>
                <span>همه گزارش‌ها از این فهرست پاک شود؟</span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    clearHistory()
                    setItems([])
                    setConfirmClear(false)
                  }}
                >
                  بله، پاک شود
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirmClear(false)}
                >
                  انصراف
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmClear(true)}
              >
                پاک کردن فهرست
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

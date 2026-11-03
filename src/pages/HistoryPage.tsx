import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HistoryList } from '../components/HistoryList'
import {
  clearHistory,
  loadHistory,
  removeHistoryEntry,
} from '../lib/history'

export function HistoryPage() {
  const [items, setItems] = useState(() => loadHistory())
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="flow">
      <header className="flow-head">
        <h2>گزارش‌های اخیر</h2>
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
          <p className="muted">
            با اولین بررسی، گزارش آن اینجا دیده می‌شود.
          </p>
          <Link to="/" className="btn btn-primary">
            شروع اولین بررسی
          </Link>
        </div>
      ) : (
        <>
          <HistoryList
            items={items}
            onRemove={(id) => {
              removeHistoryEntry(id)
              setItems(loadHistory())
            }}
          />
          <div className="actions">
            {confirmClear ? (
              <>
                <span>همه گزارش‌های اخیر پاک شود؟</span>
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
                پاک کردن همه
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

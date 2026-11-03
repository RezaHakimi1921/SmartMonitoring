import { Link } from 'react-router-dom'
import { periodLabel, type PeriodKey } from '../data/periods'
import type { HistoryEntry } from '../lib/history'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'

function whenText(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = toFaDigits(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  )
  return `${formatJalaliLong(gregorianToJalali(d))} · ساعت ${time}`
}

type Props = {
  items: HistoryEntry[]
  onRemove?: (id: string) => void
}

export function HistoryList({ items, onRemove }: Props) {
  return (
    <ul className="history-list">
      {items.map((h) => {
        const q = new URLSearchParams(h.query)
        const range = periodLabel(
          (q.get('period') as PeriodKey) || '1m',
          q.get('from'),
          q.get('to'),
        )
        const place =
          h.branchName && h.branchName !== h.brandName
            ? `${h.brandName} — ${h.branchName}`
            : h.brandName
        return (
          <li key={h.id} className="history-item">
            <div className="history-main">
              <strong>
                {place}{' '}
                <span className={`status-badge ${h.status === 'sent' ? 'sent' : ''}`}>
                  {h.status === 'sent' ? 'ارسال‌شده' : 'پیش‌نویس'}
                </span>
              </strong>
              <span className="muted">
                {h.typeTitle} · {range}
              </span>
              <span className="muted history-when">
                {h.status === 'sent' && h.sentAt
                  ? `ارسال: ${whenText(h.sentAt)}`
                  : `آخرین تغییر: ${whenText(h.savedAt)}`}
              </span>
              {h.note ? <span className="history-note">یادداشت: {h.note}</span> : null}
            </div>
            <div className="actions">
              <Link
                className="btn btn-secondary"
                to={`/report/${h.typeId}/${h.branchId}?${h.query}`}
              >
                باز کردن
              </Link>
              {onRemove ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`حذف ${place} از فهرست`}
                  onClick={() => onRemove(h.id)}
                >
                  حذف
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

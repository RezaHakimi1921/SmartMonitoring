import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchReports,
  type ReportAuthor,
  type ReportStageKey,
  type ServerReport,
} from '../lib/configApi'
import { useAuth } from '../lib/authContext'
import { loadReviewTypes } from '../lib/storage'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'

function faWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const time = toFaDigits(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  )
  return `${formatJalaliLong(gregorianToJalali(d))} · ${time}`
}

const STAGE_FILTERS: { id: '' | ReportStageKey; label: string }[] = [
  { id: '', label: 'همه مراحل' },
  { id: 'summary', label: 'خلاصه' },
  { id: 'section', label: 'بررسی بخش‌ها' },
  { id: 'diag', label: 'نکات پیگیری' },
  { id: 'send', label: 'آماده ارسال' },
  { id: 'sent', label: 'ارسال‌شده' },
]

function stageBadgeClass(r: ServerReport) {
  if (r.status === 'sent' || r.stageKey === 'sent') return 'stage-badge sent'
  if (r.stageKey === 'send') return 'stage-badge send'
  if (r.stageKey === 'diag') return 'stage-badge diag'
  if (r.stageKey === 'section') return 'stage-badge section'
  return 'stage-badge summary'
}

function stageText(r: ServerReport) {
  if (r.status === 'sent' || r.stageKey === 'sent') return 'ارسال‌شده'
  if (r.stageLabel) return r.stageLabel
  return 'در حال بررسی'
}

function progressText(r: ServerReport) {
  if (!r.stepTotal) return '—'
  return `${toFaDigits(Math.min(r.stepIndex + 1, r.stepTotal))} از ${toFaDigits(r.stepTotal)}`
}

function openHref(r: ServerReport) {
  const base = `/report/${r.typeId}/${r.branchId}`
  return r.query ? `${base}?${r.query}` : base
}

export function ReportsDashboardPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ServerReport[]>([])
  const [authors, setAuthors] = useState<ReportAuthor[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [stageKey, setStageKey] = useState<'' | ReportStageKey>('')
  const [mineOnly, setMineOnly] = useState(false)
  const types = useMemo(() => loadReviewTypes(), [])

  const effectiveUserId = mineOnly && user ? user.id : userId

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchReports({
        userId: effectiveUserId || undefined,
        typeId: typeId || undefined,
        stageKey: stageKey || undefined,
      })
      setReports(data.reports)
      setAuthors(data.authors)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId, typeId, stageKey])

  const counts = useMemo(() => {
    const all = reports
    return {
      total: all.length,
      sent: all.filter((r) => r.status === 'sent' || r.stageKey === 'sent')
        .length,
      inProgress: all.filter(
        (r) => r.status !== 'sent' && r.stageKey !== 'sent',
      ).length,
    }
  }, [reports])

  return (
    <>
      <section className="page-intro">
        <h2 style={{ margin: 0, fontSize: 22 }}>صندوق گزارش‌ها</h2>
        <p>
          همه گزارش‌های ثبت‌شده تیم را ببینید، بر اساس کاربر و مرحله فیلتر کنید و
          وضعیت هر کدام را پیگیری کنید.
        </p>
      </section>

      <div className="inbox-stats">
        <div className="inbox-stat glass-card">
          <span className="muted">کل در فیلتر</span>
          <strong>{toFaDigits(counts.total)}</strong>
        </div>
        <div className="inbox-stat glass-card">
          <span className="muted">در حال انجام</span>
          <strong>{toFaDigits(counts.inProgress)}</strong>
        </div>
        <div className="inbox-stat glass-card">
          <span className="muted">ارسال‌شده</span>
          <strong>{toFaDigits(counts.sent)}</strong>
        </div>
      </div>

      <div className="panel glass-card history-filters inbox-filters">
        <div className="field-row">
          <label htmlFor="flt-user">کاربر</label>
          <select
            id="flt-user"
            className="select"
            value={mineOnly ? '' : userId}
            disabled={mineOnly}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">همه کاربران</option>
            {authors.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.displayName}
                {u.username ? ` (${u.username})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="flt-stage">مرحله</label>
          <select
            id="flt-stage"
            className="select"
            value={stageKey}
            onChange={(e) =>
              setStageKey(e.target.value as '' | ReportStageKey)
            }
          >
            {STAGE_FILTERS.map((s) => (
              <option key={s.id || 'all'} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="flt-type">نوع بررسی</label>
          <select
            id="flt-type"
            className="select"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">همه</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <label className="toggle-field inbox-mine">
          <button
            type="button"
            role="switch"
            aria-checked={mineOnly}
            className={`toggle${mineOnly ? ' on' : ''}`}
            onClick={() => {
              setMineOnly((v) => !v)
              if (!mineOnly) setUserId('')
            }}
          >
            <span className="toggle-knob" />
          </button>
          <span>فقط گزارش‌های من</span>
        </label>
      </div>

      {error ? <div className="report-notice">{error}</div> : null}

      <div className="panel glass-card inbox-panel">
        {loading ? (
          <p className="muted" aria-busy="true">
            در حال بارگذاری صندوق…
          </p>
        ) : reports.length === 0 ? (
          <p className="muted">گزارشی با این فیلتر پیدا نشد.</p>
        ) : (
          <div className="table-wrap">
            <table className="table inbox-table">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>نوع / مجموعه</th>
                  <th>مرحله</th>
                  <th>پیشرفت</th>
                  <th>آخرین فعالیت</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.displayName}</strong>
                      <div className="muted">{r.username}</div>
                    </td>
                    <td>
                      <strong>{r.typeTitle}</strong>
                      <div className="muted">
                        {r.brandName}
                        {r.branchName && r.branchName !== r.brandName
                          ? ` — ${r.branchName}`
                          : ''}
                      </div>
                    </td>
                    <td>
                      <span className={stageBadgeClass(r)}>
                        {stageText(r)}
                      </span>
                    </td>
                    <td>
                      <span className="inbox-progress">{progressText(r)}</span>
                    </td>
                    <td>{faWhen(r.updatedAt)}</td>
                    <td>
                      <Link
                        className="btn btn-ghost btn-sm"
                        to={openHref(r)}
                      >
                        باز کردن
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

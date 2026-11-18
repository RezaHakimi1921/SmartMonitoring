import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DidbanIcon } from '../components/didbanIcons'
import {
  fetchReports,
  type ReportAuthor,
  type ReportStageKey,
  type ServerReport,
} from '../lib/configApi'
import { useAuth } from '../lib/authContext'
import { loadReviewTypes } from '../lib/storage'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'
import styles from './ReportsInbox.module.css'

type TabId = 'all' | 'followup' | 'sent'

const PAGE_SIZE = 20

function faWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const time = toFaDigits(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  )
  return `${formatJalaliLong(gregorianToJalali(d))} · ${time}`
}

function stageText(r: ServerReport) {
  if (r.status === 'sent' || r.stageKey === 'sent') return 'ارسال‌شده'
  if (r.stageLabel) return r.stageLabel
  return 'در حال بررسی'
}

function isSent(r: ServerReport) {
  return r.status === 'sent' || r.stageKey === 'sent'
}

function needsFollowup(r: ServerReport) {
  if (isSent(r)) return false
  return r.stageKey === 'diag' || r.stageKey === 'send' || r.stageKey === 'section'
}

function progressPct(r: ServerReport) {
  if (!r.stepTotal) return 0
  return Math.round(
    (Math.min(r.stepIndex + 1, r.stepTotal) / r.stepTotal) * 100,
  )
}

function progressLabel(r: ServerReport) {
  if (!r.stepTotal) return '—'
  return `${toFaDigits(Math.min(r.stepIndex + 1, r.stepTotal))} از ${toFaDigits(r.stepTotal)}`
}

function openHref(r: ServerReport) {
  const base = `/report/${r.typeId}/${r.branchId}`
  return r.query ? `${base}?${r.query}` : base
}

function chipClass(r: ServerReport) {
  if (isSent(r)) return styles.chipOk
  if (r.stageKey === 'diag' || r.stageKey === 'send') return styles.chipWarn
  if (r.stageKey === 'section') return styles.chipInfo
  return styles.chipNeutral
}

function scoreClass(pct: number) {
  if (pct >= 80) return styles.score
  if (pct >= 50) return `${styles.score} ${styles.scoreWarn}`
  return `${styles.score} ${styles.scoreBad}`
}

function initials(name: string) {
  const t = name.trim()
  return t ? t.slice(-2) : '؟'
}

export function ReportsDashboardPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ServerReport[]>([])
  const [authors, setAuthors] = useState<ReportAuthor[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabId>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [userId, setUserId] = useState('all')
  const [typeId, setTypeId] = useState('all')
  const [stageKey, setStageKey] = useState('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const types = useMemo(() => loadReviewTypes(), [])

  const effectiveUserId =
    mineOnly && user ? user.id : userId === 'all' ? '' : userId

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchReports({
          userId: effectiveUserId || undefined,
          typeId: typeId === 'all' ? undefined : typeId,
          stageKey:
            stageKey === 'all' ? undefined : (stageKey as ReportStageKey),
        })
        if (cancelled) return
        setReports(data.reports)
        setAuthors(data.authors)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'خطا')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [effectiveUserId, typeId, stageKey])

  const counts = useMemo(() => {
    const q = query.trim()
    const base = !q
      ? reports
      : reports.filter(
          (r) =>
            r.brandName.includes(q) ||
            r.branchName.includes(q) ||
            r.typeTitle.includes(q) ||
            r.displayName.includes(q),
        )
    return {
      all: base.length,
      followup: base.filter(needsFollowup).length,
      sent: base.filter(isSent).length,
      rows: base,
    }
  }, [reports, query])

  const filtered = useMemo(() => {
    if (tab === 'followup') return counts.rows.filter(needsFollowup)
    if (tab === 'sent') return counts.rows.filter(isSent)
    return counts.rows
  }, [counts.rows, tab])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  useEffect(() => {
    setPage(1)
  }, [tab, query, effectiveUserId, typeId, stageKey, mineOnly])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  useEffect(() => {
    if (!pageRows.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !pageRows.some((r) => r.id === selectedId)) {
      setSelectedId(pageRows[0]!.id)
    }
  }, [pageRows, selectedId])

  const current = pageRows.find((r) => r.id === selectedId) ?? null
  const pct = current ? progressPct(current) : 0
  const rangeFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(safePage * PAGE_SIZE, filtered.length)

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>صندوق گزارش‌ها</div>
          <h1 className={styles.title}>گزارش‌های بررسی</h1>
          <p className={styles.sub}>
            همه گزارش‌های تیم را ببینید، پیگیری کنید و برای مشتری بفرستید.
          </p>
        </div>
        <Link className={styles.primaryBtn} to="/">
          <DidbanIcon name="plus" size={17} />
          بررسی جدید
        </Link>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <DidbanIcon name="search" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی مجموعه یا نوع بررسی…"
          />
        </label>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab}${tab === 'all' ? ` ${styles.tabOn}` : ''}`}
            onClick={() => {
              setTab('all')
            }}
          >
            همه <em>{toFaDigits(counts.all)}</em>
          </button>
          <button
            type="button"
            className={`${styles.tab}${tab === 'followup' ? ` ${styles.tabOn}` : ''}`}
            onClick={() => {
              setTab('followup')
            }}
          >
            نیازمند پیگیری <em>{toFaDigits(counts.followup)}</em>
          </button>
          <button
            type="button"
            className={`${styles.tab}${tab === 'sent' ? ` ${styles.tabOn}` : ''}`}
            onClick={() => {
              setTab('sent')
            }}
          >
            ارسال شده <em>{toFaDigits(counts.sent)}</em>
          </button>
        </div>
        <button
          type="button"
          className={`${styles.filterBtn}${showFilters ? ` ${styles.filterBtnOn}` : ''}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <DidbanIcon name="filter" size={17} />
          فیلترها
        </button>
      </div>

      {showFilters ? (
        <div className={styles.filterPanel}>
          <label className={styles.filterField}>
            <span>کاربر</span>
            <select
              value={mineOnly ? 'all' : userId}
              disabled={mineOnly}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="all">همه کاربران</option>
              {authors.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.username
                    ? `${u.displayName} (${u.username})`
                    : u.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>نوع بررسی</span>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="all">همه</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterField}>
            <span>مرحله</span>
            <select
              value={stageKey}
              onChange={(e) => setStageKey(e.target.value)}
            >
              <option value="all">همه مراحل</option>
              <option value="summary">خلاصه</option>
              <option value="section">بررسی بخش‌ها</option>
              <option value="diag">نکات پیگیری</option>
              <option value="send">آماده ارسال</option>
              <option value="sent">ارسال‌شده</option>
            </select>
          </label>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => {
                setMineOnly(e.target.checked)
                if (e.target.checked) setUserId('all')
              }}
            />
            فقط گزارش‌های من
          </label>
        </div>
      ) : null}

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.layout}>
        <section className={styles.table}>
          <div className={styles.tableHead}>
            <span>مجموعه</span>
            <span>نوع بررسی</span>
            <span>پیشرفت</span>
            <span>وضعیت</span>
            <span>تاریخ</span>
          </div>
          {loading ? (
            <div className={styles.empty}>در حال بارگذاری صندوق…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>گزارشی پیدا نشد.</div>
          ) : (
            pageRows.map((r) => {
              const selected = r.id === selectedId
              const p = progressPct(r)
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`${styles.tableRow}${selected ? ` ${styles.tableRowSelected}` : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <span className={styles.collection}>
                    <i className={styles.avatar}>{initials(r.brandName)}</i>
                    <strong>{r.brandName}</strong>
                    <small>{r.displayName}</small>
                  </span>
                  <span>{r.typeTitle}</span>
                  <span className={scoreClass(p)}>
                    {p > 0 ? toFaDigits(p) : '—'}
                  </span>
                  <span>
                    <em className={`${styles.chip} ${chipClass(r)}`}>
                      {stageText(r)}
                    </em>
                  </span>
                  <span className={styles.dateCell}>
                    <span className={styles.dateText}>{faWhen(r.updatedAt)}</span>
                    <span className={styles.rowChevron} aria-hidden="true">
                      <DidbanIcon name="chevronLeft" size={16} />
                    </span>
                  </span>
                </button>
              )
            })
          )}

          {!loading && filtered.length > 0 ? (
            <div className={styles.pager}>
              <span className={styles.pagerMeta}>
                نمایش {toFaDigits(rangeFrom)}–{toFaDigits(rangeTo)} از{' '}
                {toFaDigits(filtered.length)}
              </span>
              <div className={styles.pagerControls}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="صفحه قبل"
                >
                  <DidbanIcon name="chevron" size={15} />
                  قبلی
                </button>
                <div className={styles.pagerPages}>
                  {Array.from({ length: pageCount }, (_, i) => i + 1)
                    .filter((n) => {
                      if (pageCount <= 7) return true
                      if (n === 1 || n === pageCount) return true
                      return Math.abs(n - safePage) <= 1
                    })
                    .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                      if (idx > 0) {
                        const prev = arr[idx - 1]!
                        if (n - prev > 1) acc.push('…')
                      }
                      acc.push(n)
                      return acc
                    }, [])
                    .map((n, idx) =>
                      n === '…' ? (
                        <span key={`gap-${idx}`} className={styles.pagerGap}>
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          type="button"
                          className={`${styles.pagerPage}${
                            n === safePage ? ` ${styles.pagerPageOn}` : ''
                          }`}
                          onClick={() => setPage(n)}
                        >
                          {toFaDigits(n)}
                        </button>
                      ),
                    )}
                </div>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  aria-label="صفحه بعد"
                >
                  بعدی
                  <DidbanIcon name="chevronLeft" size={15} />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className={styles.drawer}>
          {!current ? (
            <div className={styles.empty}>یک گزارش را انتخاب کنید.</div>
          ) : (
            <>
              <div className={styles.drawerHead}>
                <span className={`${styles.chip} ${chipClass(current)}`}>
                  {stageText(current)}
                </span>
                <DidbanIcon name="more" size={18} />
              </div>
              <div className={styles.drawerTitle}>
                <span className={styles.avatar}>
                  {initials(current.brandName)}
                </span>
                <div>
                  <h2>{current.brandName}</h2>
                  <p>
                    {current.typeTitle} · {faWhen(current.updatedAt)}
                  </p>
                </div>
              </div>
              <div className={styles.drawerScore}>
                <div className={styles.smallScore}>
                  {pct > 0 ? toFaDigits(pct) : '—'}
                </div>
                <div>
                  <strong>پیشرفت گزارش</strong>
                  <small>{progressLabel(current)}</small>
                </div>
              </div>
              <div className={styles.facts}>
                <span>
                  <small>مسئول بررسی</small>
                  <strong>{current.displayName}</strong>
                </span>
                <span>
                  <small>شعبه</small>
                  <strong>{current.branchName || '—'}</strong>
                </span>
                <span>
                  <small>مرحله</small>
                  <strong>{stageText(current)}</strong>
                </span>
              </div>
              <div className={styles.actions}>
                <Link className={styles.actionPrimary} to={openHref(current)}>
                  <DidbanIcon name="eye" size={17} />
                  مشاهده گزارش
                </Link>
                <Link className={styles.actionSoft} to={openHref(current)}>
                  <DidbanIcon name="download" size={17} />
                  ادامه / ارسال
                </Link>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

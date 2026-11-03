import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { BrandSearch } from '../components/BrandSearch'
import { ExportSheet } from '../components/ExportSheet'
import { JalaliRangePicker } from '../components/JalaliRangePicker'
import { ReportOptions } from '../components/ReportOptions'
import { DEFAULT_DIAG_IDS, DIAG_ITEMS } from '../data/diagCatalog'
import { buildMockSections } from '../data/mockReport'
import {
  isRangeValid,
  PERIOD_OPTIONS,
  periodLabel,
  type PeriodKey,
} from '../data/periods'
import type { BrandBranch, FeatureId, ReportSection } from '../data/types'
import { exportReportAsPdf } from '../lib/exportReport'
import {
  formatJalaliLong,
  serializeJalali,
  toFaDigits,
  todayJalali,
} from '../lib/jalali'
import {
  buildCustomerMessage,
  sectionTalkingPoints,
  sectionTone,
  summarize,
  TONE_TEXT,
  type SummaryItem,
  type Tone,
} from '../lib/reportSummary'
import { SendStep } from '../components/SendStep'
import {
  getHistoryEntry,
  historyId,
  saveHistoryEntry,
  updateHistoryEntry,
} from '../lib/history'
import { loadFeatures, loadReviewTypes } from '../lib/storage'

type Step =
  | { key: 'summary'; title: string }
  | { key: 'section'; title: string; section: ReportSection; tone: Tone }
  | { key: 'diag'; title: string }
  | { key: 'send'; title: string }

function ItemList({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'ok' | 'warn' | 'bad' | 'nodata'
  items: SummaryItem[]
}) {
  if (items.length === 0) return null
  return (
    <div className={`sum-group sum-${tone}`}>
      <h4>
        {title} <span className="chip">{toFaDigits(items.length)}</span>
      </h4>
      <ul>
        {items.map((i, idx) => (
          <li key={`${i.section}-${idx}`}>
            <span className="sum-from">{i.section}</span>
            {i.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ReportPage() {
  const { typeId = '', branchId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const exportRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [step, setStep] = useState(0)
  const [editing, setEditing] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [note, setNote] = useState('')
  const [sentAt, setSentAt] = useState<string | undefined>()
  const [onlyAttention, setOnlyAttention] = useState(false)

  const type = loadReviewTypes().find((t) => t.id === typeId)
  const catalog = loadFeatures()
  const brandName = params.get('brandName') ?? 'مجموعه'
  const branchName = params.get('branchName') ?? ''
  const period = (params.get('period') as PeriodKey) || '1m'
  const fromDate = params.get('from') ?? ''
  const toDate = params.get('to') ?? ''
  const rangeText = periodLabel(period, fromDate, toDate)
  const reportDate = formatJalaliLong(todayJalali())

  const [brandDraft, setBrandDraft] = useState<BrandBranch | null>({
    brandId: 0,
    brandName,
    branchName,
    branchId: Number(branchId),
    smartwifiBranchId: '',
    lockNumber: '',
    brandNumber: '',
  })

  const featureIds = useMemo(() => {
    const raw = params.get('features')
    if (raw) return raw.split(',').filter(Boolean) as FeatureId[]
    if (!type) return [] as FeatureId[]
    return Object.entries(type.features)
      .filter(([, mode]) => mode === 'required' || mode === 'defaultOn')
      .map(([id]) => id as FeatureId)
  }, [params, type])

  const diagIds = useMemo(() => {
    const raw = params.get('diag')
    if (!raw) return [] as number[]
    return raw
      .split(',')
      .map((x) => Number(x))
      .filter((n) => !Number.isNaN(n) && n > 0)
  }, [params])

  const diagTitles = useMemo(() => {
    const ids = new Set(diagIds)
    return DIAG_ITEMS.filter((d) => ids.has(d.id)).map((d) => d.title)
  }, [diagIds])

  const sections = useMemo(() => buildMockSections(featureIds), [featureIds])
  const summary = useMemo(() => summarize(sections), [sections])

  const place =
    branchName && branchName !== brandName
      ? `${brandName} — ${branchName}`
      : brandName

  const steps: Step[] = useMemo(() => {
    const list: Step[] = [{ key: 'summary', title: 'خلاصه' }]
    for (const section of sections) {
      const t = sectionTone(section)
      if (onlyAttention && t !== 'bad' && t !== 'warn' && t !== 'nodata') continue
      list.push({
        key: 'section',
        title: section.title,
        section,
        tone: sectionTone(section),
      })
    }
    if (diagTitles.length > 0) list.push({ key: 'diag', title: 'نکات پیگیری' })
    list.push({ key: 'send', title: 'ارسال برای مشتری' })
    return list
  }, [sections, diagTitles.length, onlyAttention])

  const safeStep = Math.min(step, steps.length - 1)
  const current = steps[safeStep]

  const queryString = params.toString()
  useEffect(() => {
    if (!type) return
    saveHistoryEntry({
      typeId,
      typeTitle: type.title,
      brandName,
      branchName,
      branchId,
      query: queryString,
    })
  }, [type, typeId, brandName, branchName, branchId, queryString])

  const entryId = historyId(typeId, branchId)
  useEffect(() => {
    const entry = getHistoryEntry(entryId)
    setNote(entry?.note ?? '')
    setSentAt(entry?.status === 'sent' ? entry.sentAt : undefined)
  }, [entryId])

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    document
      .querySelector('.journey-chip.active')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [step])

  const message = useMemo(
    () =>
      buildCustomerMessage({
        typeTitle: type?.title ?? '',
        place,
        rangeText,
        reportDate,
        summary,
        note,
      }),
    [type, place, rangeText, reportDate, summary, note],
  )

  const flash = (text: string, ms = 2400) => {
    setToast(text)
    window.setTimeout(() => setToast(''), ms)
  }

  const updateParams = (mut: (q: URLSearchParams) => void) => {
    const q = new URLSearchParams(params)
    mut(q)
    setParams(q, { replace: true })
  }

  const changeBrand = (item: BrandBranch | null) => {
    setBrandDraft(item)
    if (!item) return
    const q = new URLSearchParams(params)
    q.set('brandName', item.brandName)
    q.set('branchName', item.branchName)
    setStep(0)
    navigate(`/report/${typeId}/${item.branchId}?${q.toString()}`, {
      replace: true,
    })
  }

  const changePeriod = (key: PeriodKey) => {
    updateParams((q) => {
      q.set('period', key)
      if (key !== 'custom') {
        q.delete('from')
        q.delete('to')
      }
    })
  }

  const changeRange = (f: string, t: string) => {
    updateParams((q) => {
      q.set('period', 'custom')
      q.set('from', f)
      q.set('to', t)
    })
  }

  const setFeatures = (ids: FeatureId[]) => {
    const order = catalog.map((f) => f.id)
    const sorted = [...new Set(ids)].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b),
    )
    updateParams((q) => q.set('features', sorted.join(',')))
  }

  const requiredSet = new Set(
    Object.entries(type?.features ?? {})
      .filter(([, mode]) => mode === 'required')
      .map(([id]) => id as FeatureId),
  )

  const toggleFeature = (id: FeatureId) => {
    if (requiredSet.has(id)) return
    setFeatures(
      featureIds.includes(id)
        ? featureIds.filter((f) => f !== id)
        : [...featureIds, id],
    )
  }

  const setCategory = (categoryId: string, checked: boolean) => {
    const inCat = catalog.filter((f) => f.category === categoryId).map((f) => f.id)
    const rest = featureIds.filter((f) => !inCat.includes(f))
    const keepRequired = inCat.filter((f) => requiredSet.has(f))
    setFeatures(checked ? [...rest, ...inCat] : [...rest, ...keepRequired])
  }

  const setDiag = (ids: number[]) => {
    updateParams((q) => q.set('diag', ids.join(',')))
  }

  const toggleDiag = (id: number) => {
    setDiag(diagIds.includes(id) ? diagIds.filter((x) => x !== id) : [...diagIds, id])
  }

  const downloadPdf = async () => {
    if (!exportRef.current || busy) return
    setBusy(true)
    try {
      const today = serializeJalali(todayJalali()).replace(/\//g, '-')
      const base = `${type?.title ?? 'گزارش'}-${place}-${today}`.replace(
        /[\\/:*?"<>|]/g,
        '-',
      )
      await exportReportAsPdf(
        exportRef.current,
        base,
        (p, total) =>
          `${place} · ${type?.title ?? ''} · ${reportDate} · صفحه ${toFaDigits(p)} از ${toFaDigits(total)}`,
      )
      flash('فایل PDF گزارش دانلود شد')
    } catch (e) {
      flash(
        e instanceof Error ? e.message : 'ساخت PDF ناموفق بود. دوباره تلاش کنید.',
        3200,
      )
    } finally {
      setBusy(false)
    }
  }

  const changeNote = (value: string) => {
    setNote(value)
    updateHistoryEntry(entryId, { note: value })
  }

  const toggleSent = () => {
    if (sentAt) {
      updateHistoryEntry(entryId, { status: 'draft', sentAt: undefined })
      setSentAt(undefined)
      flash('ثبت ارسال لغو شد')
    } else {
      const now = new Date().toISOString()
      updateHistoryEntry(entryId, { status: 'sent', sentAt: now })
      setSentAt(now)
      flash('به‌عنوان ارسال‌شده ثبت شد')
    }
  }

  if (!type) {
    return (
      <div className="panel">
        <p>این گزارش پیدا نشد. لطفاً از ابتدا شروع کنید.</p>
        <Link className="btn btn-secondary" to="/">
          بازگشت به صفحه اول
        </Link>
      </div>
    )
  }

  const customIncomplete = period === 'custom' && !isRangeValid(fromDate, toDate)

  return (
    <div className="flow report-flow" ref={topRef}>
      <header className="report-head">
        <div className="report-head-main">
          <div className="card-kicker">{type.title}</div>
          <h2>{place}</h2>
          <p className="muted">
            بازه: {rangeText} · تاریخ گزارش: {reportDate}
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-secondary"
            aria-expanded={editing}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? 'بستن تنظیمات' : 'تغییر مجموعه یا بازه'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || customIncomplete}
            onClick={() => void downloadPdf()}
          >
            {busy ? 'در حال ساخت…' : 'دانلود PDF'}
          </button>
        </div>
      </header>

      <div className="report-notice">
        داده‌های این گزارش فعلاً <strong>نمونه</strong> است و هنوز به سیستم‌های
        اصلی وصل نشده.
      </div>

      {editing ? (
        <section className="step-card edit-panel">
          <BrandSearch value={brandDraft} onChange={changeBrand} />

          <div>
            <div className="field-label">بازه زمانی (تاریخ‌ها شمسی هستند)</div>
            <div className="period-row">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`period-chip${period === p.id ? ' active' : ''}`}
                  aria-pressed={period === p.id}
                  onClick={() => changePeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'custom' ? (
              <div style={{ marginTop: 12 }}>
                <JalaliRangePicker
                  from={fromDate}
                  to={toDate}
                  onChange={changeRange}
                />
                {customIncomplete ? (
                  <p className="flow-reason" style={{ textAlign: 'start' }}>
                    تاریخ شروع و پایان را کامل انتخاب کنید.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <div className="summary-row">
              <span>
                <strong>{toFaDigits(featureIds.length)} بخش</strong> و{' '}
                <strong>{toFaDigits(diagIds.length)} نکته پیگیری</strong> در
                گزارش است.
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                aria-expanded={showOptions}
                onClick={() => setShowOptions((v) => !v)}
              >
                {showOptions ? 'بستن فهرست' : 'انتخاب بخش‌ها'}
              </button>
            </div>
            {showOptions ? (
              <div style={{ marginTop: 12 }}>
                <ReportOptions
                  features={catalog}
                  checked={new Set(featureIds)}
                  required={requiredSet}
                  diag={diagIds}
                  onToggleFeature={toggleFeature}
                  onSetCategory={setCategory}
                  onToggleDiag={toggleDiag}
                  onSetDiag={setDiag}
                  onReset={() => {
                    const defaults = Object.entries(type.features)
                      .filter(([, m]) => m === 'required' || m === 'defaultOn')
                      .map(([id]) => id as FeatureId)
                    setFeatures(defaults)
                    setDiag(DEFAULT_DIAG_IDS)
                  }}
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <nav className="journey" aria-label="مراحل گزارش">
        <ol>
          {steps.map((s, i) => {
            const tone = s.key === 'section' ? s.tone : 'info'
            return (
              <li key={`${s.key}-${i}`}>
                <button
                  type="button"
                  className={`journey-chip tone-${tone}${i === safeStep ? ' active' : ''}`}
                  aria-current={i === safeStep ? 'step' : undefined}
                  onClick={() => setStep(i)}
                >
                  <span className="journey-dot" />
                  {s.title}
                </button>
              </li>
            )
          })}
        </ol>
        <label className="attention-toggle">
          <input
            type="checkbox"
            checked={onlyAttention}
            onChange={(e) => {
              setOnlyAttention(e.target.checked)
              setStep(0)
            }}
          />
          فقط بخش‌های نیازمند توجه
        </label>
        <p className="muted journey-count">
          مرحله {toFaDigits(safeStep + 1)} از {toFaDigits(steps.length)}
        </p>
      </nav>

      <section className="section-block journey-body">
        {current.key === 'summary' ? (
          <>
            <h3 style={{ margin: '0 0 4px' }}>خلاصه برای شروع صحبت با مشتری</h3>
            <p className="muted" style={{ margin: '0 0 14px' }}>
              اول از این خلاصه شروع کنید؛ بعد با دکمه «بعدی» بخش‌ها را یکی‌یکی
              مرور کنید.
            </p>
            <div className="sum-counts">
              <div className="sum-count sum-bad">
                <strong>{toFaDigits(summary.bad.length)}</strong>
                <span>نیاز به اقدام</span>
              </div>
              <div className="sum-count sum-warn">
                <strong>{toFaDigits(summary.warn.length)}</strong>
                <span>قابل بهبود</span>
              </div>
              <div className="sum-count sum-ok">
                <strong>{toFaDigits(summary.ok.length)}</strong>
                <span>وضعیت خوب</span>
              </div>
            </div>
            <ItemList title="نیاز به اقدام" tone="bad" items={summary.bad} />
            <ItemList title="قابل بهبود" tone="warn" items={summary.warn} />
            <ItemList title="نقاط قوت" tone="ok" items={summary.ok} />
            <ItemList
              title="داده در دسترس نیست"
              tone="nodata"
              items={summary.nodata}
            />
            {sections.length === 0 ? (
              <p className="muted">هیچ بخشی برای گزارش انتخاب نشده است.</p>
            ) : null}
          </>
        ) : null}

        {current.key === 'section' ? (
          <>
            <div className="section-head">
              <h3 style={{ margin: 0 }}>{current.section.title}</h3>
              <span className={`chip ${current.tone === 'info' ? '' : current.tone}`}>
                {TONE_TEXT[current.tone]}
              </span>
            </div>
            <div className="kpi-grid">
              {current.section.metrics.map((m) => (
                <div key={m.label} className="kpi">
                  <div className={`kpi-bar ${m.tone ?? 'info'}`} />
                  <div className="kpi-body">
                    <div className="kpi-label">{m.label}</div>
                    <div className="kpi-value">{m.value}</div>
                    {m.note ? <div className="kpi-note">{m.note}</div> : null}
                  </div>
                </div>
              ))}
            </div>
            {current.section.rows ? (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>مورد</th>
                    <th>مقدار</th>
                  </tr>
                </thead>
                <tbody>
                  {current.section.rows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {(() => {
              const points = sectionTalkingPoints(current.section)
              return points.length > 0 ? (
                <div className="talk-box">
                  <h4>نکته برای گفتن به مشتری</h4>
                  <ul>
                    {points.map((p, i) => (
                      <li key={i}>{p.text}</li>
                    ))}
                  </ul>
                </div>
              ) : null
            })()}
          </>
        ) : null}

        {current.key === 'diag' ? (
          <>
            <h3 style={{ margin: '0 0 4px' }}>نکات قابل پیگیری</h3>
            <p className="muted" style={{ margin: '0 0 12px' }}>
              این موارد را برای مشتری پیگیری کنید.
            </p>
            <ul className="diag-screen-list">
              {diagTitles.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        ) : null}

        {current.key === 'send' ? (
          <SendStep
            generated={message}
            note={note}
            onNote={changeNote}
            sentAt={sentAt}
            onToggleSent={toggleSent}
            busy={busy}
            pdfDisabled={customIncomplete}
            onDownload={() => void downloadPdf()}
            onFlash={flash}
          />
        ) : null}
      </section>

      <div className="journey-nav">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={safeStep === 0}
          onClick={() => setStep(safeStep - 1)}
        >
          → قبلی
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={safeStep >= steps.length - 1}
          onClick={() => setStep(safeStep + 1)}
        >
          بعدی ←
        </button>
      </div>

      {/* ورق خارج از صفحه؛ فقط برای ساخت PDF */}
      <div className="export-host" aria-hidden="true">
        <div ref={exportRef}>
          <ExportSheet
            typeTitle={type.title}
            place={place}
            periodLabel={rangeText}
            reportDate={reportDate}
            sections={sections}
            diagTitles={diagTitles}
            summary={summary}
          />
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}

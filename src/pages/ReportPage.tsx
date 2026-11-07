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
import { ScoreRing } from '../components/ScoreRing'
import { SectionSkeleton } from '../components/SectionSkeleton'
import { SendStep } from '../components/SendStep'
import { ChevronLeft, FileText, Sparkles, TrendingUp } from 'lucide-react'
import { DEFAULT_DIAG_IDS, DIAG_ITEMS } from '../data/diagCatalog'
import {
  isRangeValid,
  PERIOD_OPTIONS,
  periodLabel,
  type PeriodKey,
} from '../data/periods'
import type { BrandBranch, FeatureId, ReportSection } from '../data/types'
import { exportReportAsPdf } from '../lib/exportReport'
import {
  getHistoryEntry,
  historyId,
  saveHistoryEntry,
  updateHistoryEntry,
} from '../lib/history'
import {
  formatJalaliLong,
  serializeJalali,
  toFaDigits,
  todayJalali,
} from '../lib/jalali'
import {
  fetchDiag,
  fetchSection,
  type DiagLiveItem,
} from '../lib/reportApi'
import { fillTemplate, postReportLog } from '../lib/configApi'
import {
  buildCustomerMessage,
  sectionTalkingPoints,
  sectionTone,
  summarize,
  TONE_TEXT,
  type Tone,
} from '../lib/reportSummary'
import {
  getCachedConfig,
  loadFeatures,
  loadReviewTypes,
} from '../lib/storage'

type Step =
  | { key: 'summary'; title: string }
  | { key: 'section'; title: string; featureId: FeatureId; tone: Tone }
  | { key: 'diag'; title: string }
  | { key: 'send'; title: string }

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; section: ReportSection }
  | { status: 'error'; message: string }

/** همان N بخش از اول تا آخر؛ هر بخش که آماده شد جایش با دیتا پر می‌شود (تعداد عوض نمی‌شود). */
function SummaryFeatureSlots({
  featureIds,
  catalog,
  sectionState,
}: {
  featureIds: FeatureId[]
  catalog: { id: FeatureId; title: string }[]
  sectionState: Partial<Record<FeatureId, LoadState>>
}) {
  const readyN = featureIds.filter(
    (id) => sectionState[id]?.status === 'ready',
  ).length
  return (
    <div className="sum-group sum-pending">
      <h4>
        بخش‌های گزارش{' '}
        <span className="chip">
          {toFaDigits(readyN)}/{toFaDigits(featureIds.length)}
        </span>
      </h4>
      <ul className="sum-slot-list">
        {featureIds.map((id) => {
          const title = featureTitle(id, catalog)
          const st = sectionState[id]
          if (st?.status === 'ready') {
            const lines: string[] = []
            for (const h of st.section.hints ?? []) {
              if (
                h.tone === 'bad' ||
                h.tone === 'warn' ||
                h.tone === 'ok' ||
                h.tone === 'nodata'
              ) {
                lines.push(h.text)
              }
            }
            for (const m of st.section.metrics) {
              if (
                m.tone === 'bad' ||
                m.tone === 'warn' ||
                m.tone === 'ok' ||
                m.tone === 'nodata'
              ) {
                const v = (m.value || '').trim()
                if (
                  m.tone === 'ok' &&
                  (v === '—' ||
                    v === '۰' ||
                    v === '۰.۰٪' ||
                    v === '0' ||
                    v === '0.0%')
                ) {
                  continue
                }
                lines.push(`${m.label}: ${m.value}`)
              }
            }
            if (lines.length === 0) {
              lines.push('بررسی شد — مورد خاصی برای نمایش نیست')
            }
            return (
              <li key={id} className="sum-slot ready sum-slot-block">
                <span className="sum-from">{title}</span>
                <ul className="sum-slot-lines">
                  {lines.map((text, idx) => (
                    <li key={idx}>{text}</li>
                  ))}
                </ul>
              </li>
            )
          }
          if (st?.status === 'error') {
            return (
              <li key={id} className="sum-slot error">
                <span className="sum-from">{title}</span>
                {st.message}
              </li>
            )
          }
          return (
            <li key={id} className="sum-slot loading" aria-busy="true">
              <span className="sum-from">{title}</span>
              <span className="sum-slot-skel">
                <span className="skel skel-line value" />
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function featureTitle(id: FeatureId, catalog: { id: FeatureId; title: string }[]) {
  return catalog.find((f) => f.id === id)?.title ?? id
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
  const [filterTone, setFilterTone] = useState<'bad' | 'warn' | 'ok' | null>(
    null,
  )
  const [sectionState, setSectionState] = useState<
    Partial<Record<FeatureId, LoadState>>
  >({})
  const [diagLive, setDiagLive] = useState<DiagLiveItem[] | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [diagError, setDiagError] = useState('')

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

  const sections = useMemo(() => {
    return featureIds
      .map((id) => {
        const st = sectionState[id]
        return st?.status === 'ready' ? st.section : null
      })
      .filter((s): s is ReportSection => !!s)
  }, [featureIds, sectionState])

  const summary = useMemo(() => summarize(sections), [sections])
  const loadingCount = featureIds.filter(
    (id) => sectionState[id]?.status === 'loading' || !sectionState[id],
  ).length
  const readyCount = sections.length

  const place =
    branchName && branchName !== brandName
      ? `${brandName} — ${branchName}`
      : brandName

  const steps: Step[] = useMemo(() => {
    const list: Step[] = [{ key: 'summary', title: 'خلاصه' }]
    for (const id of featureIds) {
      const st = sectionState[id]
      const tone =
        st?.status === 'ready' ? sectionTone(st.section) : ('info' as Tone)
      if (
        onlyAttention &&
        tone !== 'bad' &&
        tone !== 'warn' &&
        tone !== 'nodata'
      ) {
        continue
      }
      list.push({
        key: 'section',
        title: featureTitle(id, catalog),
        featureId: id,
        tone,
      })
    }
    if (diagIds.length > 0) list.push({ key: 'diag', title: 'نکات پیگیری' })
    list.push({ key: 'send', title: 'ارسال برای مشتری' })
    return list
  }, [featureIds, catalog, sectionState, diagIds.length, onlyAttention])

  const safeStep = Math.min(step, Math.max(0, steps.length - 1))
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
    void postReportLog({
      typeId,
      typeTitle: type.title,
      branchId: Number(branchId),
      brandName,
      branchName,
      features: featureIds,
      status: 'draft',
    }).catch(() => {
      /* لاگ سرور اختیاری است؛ تاریخچه محلی باقی می‌ماند */
    })
  }, [type, typeId, brandName, branchName, branchId, queryString, featureIds])

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

  // Load each feature independently (skeleton per box).
  useEffect(() => {
    if (!branchId || featureIds.length === 0) return
    if (period === 'custom' && !isRangeValid(fromDate, toDate)) return

    const ac = new AbortController()
    setSectionState((prev) => {
      const next: Partial<Record<FeatureId, LoadState>> = { ...prev }
      for (const id of featureIds) next[id] = { status: 'loading' }
      return next
    })

    for (const id of featureIds) {
      void fetchSection({
        branchId,
        feature: id,
        period,
        from: fromDate,
        to: toDate,
        signal: ac.signal,
      })
        .then((section) => {
          if (ac.signal.aborted) return
          setSectionState((prev) => ({
            ...prev,
            [id]: { status: 'ready', section },
          }))
        })
        .catch((e) => {
          if (ac.signal.aborted) return
          setSectionState((prev) => ({
            ...prev,
            [id]: {
              status: 'error',
              message:
                e instanceof Error ? e.message : 'بارگذاری این بخش ناموفق بود',
            },
          }))
        })
    }

    return () => ac.abort()
  }, [branchId, featureIds.join(','), period, fromDate, toDate])

  // Live diag items
  useEffect(() => {
    if (!branchId || diagIds.length === 0) {
      setDiagLive([])
      return
    }
    const ac = new AbortController()
    setDiagLoading(true)
    setDiagError('')
    void fetchDiag({ branchId, types: diagIds, signal: ac.signal })
      .then((items) => {
        if (ac.signal.aborted) return
        setDiagLive(items)
      })
      .catch((e) => {
        if (ac.signal.aborted) return
        setDiagError(e instanceof Error ? e.message : 'خطا در نکات پیگیری')
        setDiagLive([])
      })
      .finally(() => {
        if (!ac.signal.aborted) setDiagLoading(false)
      })
    return () => ac.abort()
  }, [branchId, diagIds.join(',')])

  const diagTitles = useMemo(() => {
    if (diagLive && diagLive.length > 0) {
      return diagLive.map((d) => d.title)
    }
    const ids = new Set(diagIds)
    return DIAG_ITEMS.filter((d) => ids.has(d.id)).map((d) => d.title)
  }, [diagLive, diagIds])

  const summaryLines = useMemo(() => {
    const lines: string[] = []
    const push = (title: string, items: { text: string }[], limit: number) => {
      if (!items.length) return
      lines.push(title)
      items.slice(0, limit).forEach((i) => lines.push(`• ${i.text}`))
    }
    push('نقاط قوت', summary.ok, 5)
    push('قابل بهبود', summary.warn, 8)
    push('نیاز به اقدام', summary.bad, 8)
    return lines.join('\n')
  }, [summary])

  const templateVars = useMemo(
    () => ({
      brand: brandName,
      branch: branchName,
      type: type?.title ?? '',
      period: rangeText,
      summaryLines,
      note: note.trim(),
      branchId: String(branchId),
      place,
      reportDate,
    }),
    [
      brandName,
      branchName,
      type,
      rangeText,
      summaryLines,
      note,
      branchId,
      place,
      reportDate,
    ],
  )

  const message = useMemo(() => {
    const tpl = getCachedConfig()?.customerMessageTemplate
    if (tpl?.trim()) return fillTemplate(tpl, templateVars)
    return buildCustomerMessage({
      typeTitle: type?.title ?? '',
      place,
      rangeText,
      reportDate,
      summary,
      note,
    })
  }, [type, place, rangeText, reportDate, summary, note, templateVars])

  const assistantForm = useMemo(() => {
    const tpl = getCachedConfig()?.assistantFormTemplate
    if (tpl?.trim()) return fillTemplate(tpl, templateVars)
    return [
      `برند: ${brandName}`,
      `شعبه: ${branchName}`,
      `نوع بررسی: ${type?.title ?? ''}`,
      `بازه: ${rangeText}`,
      summaryLines,
      note.trim() ? `یادداشت: ${note.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }, [brandName, branchName, type, rangeText, summaryLines, note, templateVars])

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
    if (loadingCount > 0) {
      flash('صبر کنید تا بخش‌ها کامل شوند', 2800)
      return
    }
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
      void postReportLog({
        typeId,
        typeTitle: type?.title ?? typeId,
        branchId: Number(branchId),
        brandName,
        branchName,
        features: featureIds,
        status: 'draft',
        note,
      }).catch(() => undefined)
      flash('ثبت ارسال لغو شد')
    } else {
      const now = new Date().toISOString()
      updateHistoryEntry(entryId, { status: 'sent', sentAt: now })
      setSentAt(now)
      void postReportLog({
        typeId,
        typeTitle: type?.title ?? typeId,
        branchId: Number(branchId),
        brandName,
        branchName,
        features: featureIds,
        markSent: true,
        note,
      }).catch(() => undefined)
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

  const renderSectionBody = (featureId: FeatureId) => {
    const st = sectionState[featureId]
    if (!st || st.status === 'loading') {
      return <SectionSkeleton cards={4} />
    }
    if (st.status === 'error') {
      return (
        <div className="hint bad" style={{ marginTop: 8 }}>
          {st.message}
        </div>
      )
    }
    const section = st.section
    return (
      <>
        <div className="section-head">
          <h3 style={{ margin: 0 }}>{section.title}</h3>
          <span
            className={`chip ${sectionTone(section) === 'info' ? '' : sectionTone(section)}`}
          >
            {TONE_TEXT[sectionTone(section)]}
          </span>
        </div>
        <div className="kpi-grid">
          {section.metrics.map((m) => (
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
        {section.rows ? (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>مورد</th>
                <th>مقدار</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {(() => {
          const points = sectionTalkingPoints(section)
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
    )
  }

  const ringFrom = (featureId: FeatureId, labelPart: string) => {
    const st = sectionState[featureId]
    if (st?.status !== 'ready') return null
    const m = st.section.metrics.find((x) => x.label.includes(labelPart))
    if (!m) return null
    const n = Number(
      String(m.value)
        .replace(/[^\d.,]/g, '')
        .replace(',', '.')
        .replace(/[^\d.]/g, ''),
    )
    return { value: m.value, progress: Number.isFinite(n) ? n : 0 }
  }
  const subRing = ringFrom('subscription', 'اشتراک')
  const engRing = ringFrom('survey', 'نرخ')
  const custRing = ringFrom('balance', 'یک سال')
  const topHint =
    summary.bad[0]?.text ||
    summary.warn[0]?.text ||
    'بخش‌های گزارش را یکی‌یکی مرور کنید و موارد مهم را برای پیگیری علامت بزنید.'

  return (
    <div className="flow report-flow" ref={topRef}>
      <section className="period-bar">
        <div>
          <span>{type.title}</span>
          <strong>
            {place} · {rangeText}
          </strong>
        </div>
        <div className="period-controls" style={{ gap: 0 }}>
          <button
            type="button"
            aria-label="تغییر بازه"
            onClick={() => setEditing((v) => !v)}
            title="تغییر مجموعه یا بازه"
          >
            {editing ? '✕' : '⚙'}
          </button>
        </div>
      </section>

      <div className="actions" style={{ marginBottom: 12, gap: 8 }}>
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
          className="export-button"
          disabled={busy || customIncomplete || loadingCount > 0}
          onClick={() => void downloadPdf()}
        >
          <FileText size={18} />
          {busy ? 'در حال ساخت…' : 'دانلود PDF'}
        </button>
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

      <div className="tabs-row" role="tablist" aria-label="مراحل گزارش">
        {steps.map((s, i) => {
          const tone =
            s.key === 'section'
              ? s.tone === 'bad'
                ? '#ef4444'
                : s.tone === 'warn'
                  ? '#e8911e'
                  : s.tone === 'ok'
                    ? '#169b72'
                    : '#147d74'
              : '#147d74'
          return (
            <button
              key={`${s.key}-${i}`}
              type="button"
              className={i === safeStep ? 'selected' : ''}
              role="tab"
              aria-selected={i === safeStep}
              onClick={() => setStep(i)}
            >
              <i style={{ backgroundColor: tone }} />
              {s.title}
            </button>
          )
        })}
      </div>

      <div className="filter-row">
        <label>
          <input
            type="checkbox"
            checked={onlyAttention}
            onChange={(e) => {
              setOnlyAttention(e.target.checked)
              setStep(0)
            }}
          />
          <span className="custom-checkbox" />
          فقط بخش‌های نیازمند توجه
        </label>
        <span>
          مرحله {toFaDigits(safeStep + 1)} از {toFaDigits(steps.length)}
        </span>
      </div>

      <section className="section-block journey-body">
        {current.key === 'summary' ? (
          <section className="overview-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <Sparkles size={16} />
                  خلاصه هوشمند
                </span>
                <h2>خلاصه برای شروع صحبت با مشتری</h2>
                <p>
                  اول از این خلاصه شروع کنید؛ سپس بخش‌ها را یکی‌یکی مرور کنید.
                  {loadingCount > 0
                    ? ` هنوز ${toFaDigits(loadingCount)} بخش در حال بارگذاری است.`
                    : ''}
                </p>
              </div>
              <div className="updated-at">تاریخ گزارش: {reportDate}</div>
            </div>

            {featureIds.length === 0 ? (
              <p className="muted">هیچ بخشی برای گزارش انتخاب نشده است.</p>
            ) : (
              <>
                <div className="summary-grid" aria-busy={loadingCount > 0}>
                  {(
                    [
                      ['bad', 'danger', 'نیاز به اقدام', summary.bad.length],
                      ['warn', 'warning', 'قابل بهبود', summary.warn.length],
                      ['ok', 'success', 'وضعیت خوب', summary.ok.length],
                    ] as const
                  ).map(([tone, card, label, count]) => (
                    <button
                      key={tone}
                      type="button"
                      className={`summary-card ${card}${filterTone === tone ? ' is-active' : ''}`}
                      disabled={loadingCount > 0}
                      aria-pressed={filterTone === tone}
                      onClick={() =>
                        setFilterTone((cur) => (cur === tone ? null : tone))
                      }
                      style={{ cursor: 'pointer', width: '100%', textAlign: 'right' }}
                    >
                      <div className="summary-icon">
                        {tone === 'ok' ? (
                          <Sparkles size={19} />
                        ) : tone === 'warn' ? (
                          <TrendingUp size={19} />
                        ) : (
                          <FileText size={19} />
                        )}
                      </div>
                      <div>
                        <strong>
                          {loadingCount > 0 ? '…' : toFaDigits(count)}
                        </strong>
                        <span>{label}</span>
                      </div>
                      <small>کلیک برای جزئیات</small>
                    </button>
                  ))}
                </div>

                {filterTone ? (
                  <ul className="sum-filter-list">
                    {(summary[filterTone] ?? []).length === 0 ? (
                      <li className="muted">موردی در این وضعیت نیست.</li>
                    ) : (
                      summary[filterTone].map((item) => (
                        <li key={`${item.section}-${item.text}`}>
                          <strong>{item.section}</strong>
                          <div>{item.text}</div>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ marginTop: 6 }}
                            onClick={() => {
                              const idx = steps.findIndex(
                                (s) =>
                                  s.key === 'section' &&
                                  s.title === item.section,
                              )
                              if (idx >= 0) setStep(idx)
                            }}
                          >
                            برو به بخش
                            <ChevronLeft size={14} />
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}

                <div className="insight-grid">
                  <div className="scores-panel">
                    <div className="panel-title">
                      <div>
                        <h3>شاخص‌های کلیدی</h3>
                        <p>از دادهٔ زنده SmartBi در همین بازه</p>
                      </div>
                      <span className="positive-badge">
                        {toFaDigits(readyCount)}/{toFaDigits(featureIds.length)} آماده
                      </span>
                    </div>
                    <div className="rings">
                      <ScoreRing
                        progress={subRing?.progress ?? 0}
                        displayValue={subRing?.value ?? '—'}
                        label="اشتراک‌گیری"
                      />
                      <ScoreRing
                        progress={engRing?.progress ?? 0}
                        displayValue={engRing?.value ?? '—'}
                        label="مشارکت"
                      />
                      <ScoreRing
                        progress={
                          custRing
                            ? Math.min(100, (custRing.progress / 50) || 0)
                            : 0
                        }
                        displayValue={custRing?.value ?? '—'}
                        label="مشتریان"
                      />
                    </div>
                  </div>
                  <div className="recommendation">
                    <span className="recommendation-icon">
                      <Sparkles size={20} />
                    </span>
                    <div>
                      <span>پیشنهاد شروع صحبت</span>
                      <h3>
                        {summary.bad.length > 0
                          ? 'اول موارد نیازمند اقدام را مطرح کنید'
                          : summary.warn.length > 0
                            ? 'روی نقاط قابل بهبود تمرکز کنید'
                            : 'نقاط قوت را برجسته کنید'}
                      </h3>
                      <p>{topHint}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const idx = steps.findIndex((s) => s.key === 'section')
                          if (idx >= 0) setStep(idx)
                        }}
                      >
                        شروع مرور بخش‌ها
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="reports-section" style={{ marginTop: 15, padding: 0, border: 0, boxShadow: 'none', background: 'transparent' }}>
                  <div className="reports-title">
                    <div>
                      <h2>بخش‌های گزارش</h2>
                      <p>وضعیت هر بخش بعد از بارگذاری داده مشخص می‌شود.</p>
                    </div>
                    <span>
                      {toFaDigits(readyCount)} از {toFaDigits(featureIds.length)}
                    </span>
                  </div>
                  <SummaryFeatureSlots
                    featureIds={featureIds}
                    catalog={catalog}
                    sectionState={sectionState}
                  />
                </div>
              </>
            )}
          </section>
        ) : null}

        {current.key === 'section'
          ? renderSectionBody(current.featureId)
          : null}

        {current.key === 'diag' ? (
          <>
            <h3 style={{ margin: '0 0 4px' }}>نکات قابل پیگیری</h3>
            <p className="muted" style={{ margin: '0 0 12px' }}>
              موارد فعال تشخیصی مجموعه در همین لحظه.
            </p>
            {diagLoading ? (
              <SectionSkeleton cards={2} />
            ) : diagError ? (
              <div className="hint bad">{diagError}</div>
            ) : diagLive && diagLive.length > 0 ? (
              <ul className="diag-live-list">
                {diagLive.map((d) => (
                  <li key={d.id}>
                    <strong>{d.title}</strong>
                    <span>{d.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="hint ok">
                برای نکات انتخاب‌شده مورد فعالی پیدا نشد.
              </div>
            )}
          </>
        ) : null}

        {current.key === 'send' ? (
          <SendStep
            customerMessage={message}
            assistantForm={assistantForm}
            note={note}
            onNote={changeNote}
            sentAt={sentAt}
            onToggleSent={toggleSent}
            busy={busy}
            pdfDisabled={customIncomplete || loadingCount > 0}
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

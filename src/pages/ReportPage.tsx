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
import { ReportSummaryView } from '../components/ReportSummaryView'
import { SectionSkeleton } from '../components/SectionSkeleton'
import { DidbanToast } from '../components/DidbanToast'
import { SendStep } from '../components/SendStep'
import { Ico } from '../components/make/icons'
import { FileText } from 'lucide-react'
import rp from './ReportPage.module.css'
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
  const [sectionState, setSectionState] = useState<
    Partial<Record<FeatureId, LoadState>>
  >({})
  const [diagLive, setDiagLive] = useState<DiagLiveItem[] | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [diagError, setDiagError] = useState('')
  const [diagDone, setDiagDone] = useState<Set<number>>(() => new Set())

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
  }, [type, typeId, brandName, branchName, branchId, queryString])

  useEffect(() => {
    if (!type || !current) return
    const stageKey =
      current.key === 'summary' ||
      current.key === 'section' ||
      current.key === 'diag' ||
      current.key === 'send'
        ? current.key
        : 'summary'
    const stageLabel =
      sentAt && stageKey === 'send'
        ? 'ارسال‌شده'
        : current.title
    void postReportLog({
      typeId,
      typeTitle: type.title,
      branchId: Number(branchId),
      brandName,
      branchName,
      features: featureIds,
      status: sentAt ? 'sent' : 'draft',
      stageKey: sentAt ? 'sent' : stageKey,
      stageLabel: sentAt ? 'ارسال‌شده' : stageLabel,
      stepIndex: safeStep,
      stepTotal: steps.length,
      query: queryString,
    }).catch(() => {
      /* لاگ سرور اختیاری است؛ تاریخچه محلی باقی می‌ماند */
    })
  }, [
    type,
    typeId,
    brandName,
    branchName,
    branchId,
    queryString,
    featureIds,
    current,
    safeStep,
    steps.length,
    sentAt,
  ])

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
        stageKey: 'send',
        stageLabel: 'آماده ارسال',
        stepIndex: safeStep,
        stepTotal: steps.length,
        query: queryString,
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
        stageKey: 'sent',
        stageLabel: 'ارسال‌شده',
        stepIndex: safeStep,
        stepTotal: steps.length,
        query: queryString,
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

  const sectionSteps = steps.filter((s) => s.key === 'section')
  const sectionOrdinal =
    current?.key === 'section'
      ? sectionSteps.findIndex(
          (s) => s.key === 'section' && s.featureId === current.featureId,
        ) + 1
      : 0

  const tonePillClass = (tone: Tone) => {
    if (tone === 'ok') return rp.toneOk
    if (tone === 'warn') return rp.toneWarn
    if (tone === 'bad') return rp.toneBad
    if (tone === 'nodata') return rp.toneNodata
    return rp.toneInfo
  }

  const metricCardClass = (tone?: Tone) => {
    if (tone === 'ok') return rp.metricOk
    if (tone === 'warn') return rp.metricWarn
    if (tone === 'bad') return rp.metricBad
    if (tone === 'nodata') return rp.metricNodata
    return rp.metricInfo
  }

  const hintClass = (tone?: Tone) => {
    if (tone === 'bad') return rp.hintBad
    if (tone === 'warn') return rp.hintWarn
    if (tone === 'ok') return rp.hintOk
    return rp.hintItem
  }

  const sectionScoreOf = (section: ReportSection) => {
    const weight = { ok: 88, warn: 68, bad: 42, nodata: 50, info: 70 } as const
    const tones = section.metrics
      .map((m) => (m.tone as Tone | undefined) ?? 'info')
      .filter(Boolean)
    if (!tones.length) return 0
    return Math.round(
      tones.reduce((a, t) => a + (weight[t] ?? 70), 0) / tones.length,
    )
  }

  const renderSectionBody = (featureId: FeatureId) => {
    const st = sectionState[featureId]
    if (!st || st.status === 'loading') {
      return <SectionSkeleton cards={4} />
    }
    if (st.status === 'error') {
      return (
        <div className={rp.hintBad} style={{ marginTop: 8 }}>
          {st.message}
        </div>
      )
    }
    const section = st.section
    const tone = sectionTone(section)
    const score = sectionScoreOf(section)
    const points = sectionTalkingPoints(section)
    return (
      <>
        <div className={rp.sectionTop}>
          <div className={rp.panelIcon}>{Ico.chart}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>
              {section.title}
            </h2>
            <div className={rp.panelSub}>
              بخش {toFaDigits(sectionOrdinal)} از{' '}
              {toFaDigits(sectionSteps.length)}
              {score > 0 ? ` · امتیاز ${toFaDigits(score)}` : ''}
            </div>
          </div>
          <span className={tonePillClass(tone)}>{TONE_TEXT[tone]}</span>
        </div>

        <div className={rp.metricGrid}>
          {section.metrics.map((m) => (
            <div key={m.label} className={metricCardClass(m.tone as Tone)}>
              <div className={rp.metricLabel}>{m.label}</div>
              <div className={rp.metricValue}>{m.value}</div>
              <div className={rp.metricTone}>
                {TONE_TEXT[(m.tone as Tone) || 'info']}
              </div>
              {m.note &&
              !/(Fact_|BI_|dbo\.|SmartPowerBI|SmartProjectDW|SmartBi|MinFacture|HowManydays|V_BI_)/i.test(
                m.note,
              ) ? (
                <div className={rp.diagNote} style={{ marginTop: 6 }}>
                  {m.note}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {section.rows?.length ? (
          <table className={rp.rowsTable}>
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

        {points.length > 0 ? (
          <ul className={rp.hintList}>
            {points.map((p, i) => {
              const hintTone =
                section.hints?.find((h) => h.text === p.text)?.tone ??
                (p.text.includes('—') ? 'nodata' : 'warn')
              return (
                <li key={i} className={hintClass(hintTone as Tone)}>
                  {p.text}
                </li>
              )
            })}
          </ul>
        ) : null}
      </>
    )
  }

  const checklistItems = DIAG_ITEMS.filter((d) => diagIds.includes(d.id))

  const toggleDiagDone = (id: number) => {
    setDiagDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllDiagDone = () => {
    const allSelected =
      checklistItems.length > 0 &&
      checklistItems.every((d) => diagDone.has(d.id))
    if (allSelected) setDiagDone(new Set())
    else setDiagDone(new Set(checklistItems.map((d) => d.id)))
  }

  const renderDiagBody = () => {
    const doneCount = checklistItems.filter((d) => diagDone.has(d.id)).length
    const allDone =
      checklistItems.length > 0 && doneCount === checklistItems.length
    const someDone = doneCount > 0 && !allDone
    return (
      <>
        <div className={rp.panelHead}>
          <div className={rp.panelIcon}>{Ico.list}</div>
          <div>
            <h2>نکات پیگیری</h2>
            <div className={rp.panelSub}>
              {toFaDigits(doneCount)} از {toFaDigits(checklistItems.length)}{' '}
              انجام شده
            </div>
          </div>
        </div>

        {checklistItems.length === 0 ? (
          <div className={rp.hintOk}>هیچ نکتهٔ پیگیری‌ای انتخاب نشده است.</div>
        ) : (
          <>
            <label className={rp.diagSelectAll}>
              <input
                type="checkbox"
                checked={allDone}
                ref={(el) => {
                  if (el) el.indeterminate = someDone
                }}
                onChange={toggleAllDiagDone}
              />
              <span>انتخاب همه</span>
            </label>
            <div className={rp.diagList}>
              {checklistItems.map((d) => {
                const live = diagLive?.find((x) => x.id === d.id)
                const done = diagDone.has(d.id)
                return (
                  <label
                    key={d.id}
                    className={done ? rp.diagRowDone : rp.diagRow}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleDiagDone(d.id)}
                    />
                    <div>
                      <div className={rp.diagTitle}>{d.title}</div>
                      <div className={rp.diagNote}>
                        {live?.value || d.hint}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </>
        )}

        {diagLoading ? (
          <div className={rp.diagLive}>
            <SectionSkeleton cards={2} />
          </div>
        ) : null}

        {!diagLoading && diagError ? (
          <div className={rp.hintBad} style={{ marginTop: 12 }}>
            {diagError}
          </div>
        ) : null}

        {!diagLoading && diagLive && diagLive.length > 0 ? (
          <div className={rp.diagLive}>
            <div className={rp.diagLiveTitle}>وضعیت زنده تشخیصی</div>
            <div className={rp.diagList}>
              {diagLive.map((d) => (
                <div key={`live-${d.id}`} className={rp.diagRow}>
                  <div>
                    <div className={rp.diagTitle}>{d.title}</div>
                    <div className={rp.diagNote}>{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </>
    )
  }

  const journeyStage: 'summary' | 'section' | 'diag' | 'send' =
    current.key === 'section' ? 'section' : current.key

  const goJourney = (stage: 'summary' | 'section' | 'diag' | 'send') => {
    const idx = steps.findIndex((s) =>
      stage === 'section' ? s.key === 'section' : s.key === stage,
    )
    if (idx >= 0) setStep(idx)
  }

  const stageOrder = ['summary', 'section', 'diag', 'send'] as const
  const stageIndex = stageOrder.indexOf(journeyStage)

  const primaryLabel =
    journeyStage === 'summary'
      ? 'ادامه بررسی'
      : journeyStage === 'section'
        ? safeStep < steps.length - 1 && steps[safeStep + 1]?.key === 'section'
          ? 'بخش بعدی'
          : 'نکات پیگیری'
        : journeyStage === 'diag'
          ? 'رفتن به ارسال'
          : sentAt
            ? 'رفتن به صندوق گزارش'
            : 'ثبت ارسال'

  const goPrimary = () => {
    if (journeyStage === 'send') {
      if (sentAt) navigate('/reports')
      else toggleSent()
      return
    }
    if (safeStep < steps.length - 1) setStep(safeStep + 1)
  }

  return (
    <div className={rp.page} ref={topRef}>
      <div className={rp.head}>
        <div className={rp.headCopy}>
          <h1>{place}</h1>
          <p>
            گزارش زنده · {type.title} · {rangeText}
          </p>
        </div>
        <div className={rp.headActions}>
          <button
            type="button"
            className={rp.btnGhost}
            aria-expanded={editing}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? 'بستن' : 'بروزرسانی'}
          </button>
          <button
            type="button"
            className={rp.btnGhost}
            disabled={busy || customIncomplete || loadingCount > 0}
            onClick={() => void downloadPdf()}
          >
            <FileText size={16} />
            {busy ? 'در حال ساخت…' : 'خروجی PDF'}
          </button>
        </div>
      </div>

      {editing ? (
        <section className={rp.editPanel}>
          <BrandSearch value={brandDraft} onChange={changeBrand} />

          <div style={{ marginTop: 12 }}>
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

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className={rp.btnGhost}
              aria-expanded={showOptions}
              onClick={() => setShowOptions((v) => !v)}
            >
              {showOptions ? 'بستن فهرست بخش‌ها' : 'انتخاب بخش‌ها'}
            </button>
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

      <div className={rp.stages} role="tablist" aria-label="مراحل گزارش">
        {(
          [
            ['summary', 'خلاصه گزارش', 1],
            ['section', 'بررسی بخش‌ها', 2],
            ['diag', 'نکات پیگیری', 3],
            ['send', 'ارسال گزارش', 4],
          ] as const
        ).map(([id, label, n]) => {
          const idx = stageOrder.indexOf(id)
          const on = journeyStage === id
          const done = idx < stageIndex
          const available =
            id === 'summary' ||
            (id === 'section' && steps.some((s) => s.key === 'section')) ||
            (id === 'diag' && steps.some((s) => s.key === 'diag')) ||
            id === 'send'
          return (
            <button
              key={id}
              type="button"
              role="tab"
              disabled={!available}
              aria-selected={on}
              className={
                on ? rp.stageOn : done ? rp.stageDone : rp.stage
              }
              onClick={() => goJourney(id)}
            >
              <span className={rp.stageNum}>
                {done && !on ? Ico.check : toFaDigits(n)}
              </span>
              {label}
            </button>
          )
        })}
      </div>

      {journeyStage === 'section' ? (
        <div className={rp.sectionNav}>
          <label className={rp.sectionChip} style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyAttention}
              onChange={(e) => {
                setOnlyAttention(e.target.checked)
                setStep(0)
              }}
              style={{ marginLeft: 6 }}
            />
            فقط نیازمند توجه
          </label>
          {steps.map((s, i) =>
            s.key === 'section' ? (
              <button
                key={`${s.featureId}-${i}`}
                type="button"
                className={i === safeStep ? rp.sectionChipOn : rp.sectionChip}
                onClick={() => setStep(i)}
              >
                {s.title}
              </button>
            ) : null,
          )}
        </div>
      ) : null}

      {current.key === 'summary' ? (
        featureIds.length === 0 ? (
          <section className={rp.panel}>
            <p className={rp.panelSub}>هیچ بخشی برای گزارش انتخاب نشده است.</p>
          </section>
        ) : (
          <ReportSummaryView
            sections={sections}
            summary={summary}
            loadingCount={loadingCount}
            onFollowUps={() => goJourney('diag')}
          />
        )
      ) : (
        <section className={rp.panel}>
          {current.key === 'section'
            ? renderSectionBody(current.featureId)
            : null}
          {current.key === 'diag' ? renderDiagBody() : null}
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
      )}

      <footer className={rp.footer}>
        <div className={rp.footerHint}>
          {journeyStage === 'section' && sectionOrdinal > 0 ? (
            <>
              <span className={rp.panelIcon} style={{ width: 28, height: 28 }}>
                {Ico.chart}
              </span>
              بخش {toFaDigits(sectionOrdinal)} از{' '}
              {toFaDigits(sectionSteps.length)}
              {current.key === 'section'
                ? ` · ${featureTitle(current.featureId, catalog)}`
                : ''}
            </>
          ) : (
            <>
              <span style={{ color: '#668100' }}>{Ico.check}</span>
              تغییرات به‌صورت خودکار ذخیره می‌شود
            </>
          )}
        </div>
        <div className={rp.footerActions}>
          <button
            type="button"
            className={rp.btnGhost}
            onClick={() => {
              if (safeStep === 0) navigate('/')
              else setStep(safeStep - 1)
            }}
          >
            {safeStep === 0 ? 'بازگشت به ویزارد' : 'مرحله قبل'}
          </button>
          <button
            type="button"
            className={rp.btnPrimary}
            onClick={goPrimary}
          >
            {Ico.arrow}
            {primaryLabel}
          </button>
        </div>
      </footer>

      <div className="export-host" aria-hidden="true">
        <div ref={exportRef}>
          <ExportSheet
            typeTitle={type.title}
            brandName={brandName}
            branchName={branchName}
            place={place}
            periodLabel={rangeText}
            reportDate={reportDate}
            sections={sections}
            diagTitles={diagTitles}
            summary={summary}
          />
        </div>
      </div>

      <DidbanToast message={toast} />
    </div>
  )
}

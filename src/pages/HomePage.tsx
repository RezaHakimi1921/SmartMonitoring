import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ico } from '../components/make/icons'
import type { BrandBranch } from '../data/types'
import { loadHistory } from '../lib/history'
import { loadBrands, searchBrands } from '../lib/brands'
import {
  serializeJalali,
  toFaDigits,
  todayJalali,
  jalaliToGregorian,
  gregorianToJalali,
} from '../lib/jalali'
import {
  diagDefaultsForType,
  loadFeatures,
  loadReviewTypes,
  selectionForType,
} from '../lib/storage'
import { useAuth } from '../lib/authContext'

type Step = 1 | 2 | 3

type WizardBrand = {
  id: string
  name: string
  branch: string
  initials: string
  tint: string
  ink: string
  raw: BrandBranch
}

type WizardTemplate = {
  id: string
  catalogId: string
  title: string
  description: string
  sections: number
  minutes: number
  icon: 'spark' | 'check' | 'clock'
  recommended?: boolean
}

type WizardPeriod = { id: string; label: string }

const STEPS = [
  { n: 1 as const, title: 'انتخاب مجموعه' },
  { n: 2 as const, title: 'انتخاب قالب' },
  { n: 3 as const, title: 'تنظیم بازه' },
]

const TEMPLATES: WizardTemplate[] = [
  {
    id: 'quick',
    catalogId: 'quick',
    title: 'بررسی سریع',
    description: 'نمای کلی وضعیت مجموعه و شاخص‌های ضروری',
    sections: 5,
    minutes: 3,
    icon: 'spark',
    recommended: true,
  },
  {
    id: 'delivery',
    catalogId: 'first',
    title: 'پس از تحویل',
    description: 'کیفیت تحویل، آموزش و تجربه شروع مشتری',
    sections: 8,
    minutes: 6,
    icon: 'check',
  },
  {
    id: 'renewal',
    catalogId: 'after-renewal',
    title: 'تماس بعد از تمدید',
    description: 'رضایت از تمدید، پشتیبانی و عملکرد سرویس',
    sections: 6,
    minutes: 4,
    icon: 'clock',
  },
]

const PERIODS: WizardPeriod[] = [
  { id: 'today', label: 'امروز' },
  { id: '7d', label: '۷ روز گذشته' },
  { id: '30d', label: '۳۰ روز گذشته' },
  { id: 'custom', label: 'بازه دلخواه' },
]

const TINTS = [
  { tint: '#d7ef8a', ink: '#4e6300' },
  { tint: '#f3d9b0', ink: '#8a5a12' },
  { tint: '#f8c9d8', ink: '#9d174d' },
  { tint: '#c9e7e2', ink: '#0f766e' },
]

function toWizardBrand(item: BrandBranch, idx: number): WizardBrand {
  const tone = TINTS[idx % TINTS.length]!
  const initials = (item.brandName || item.branchName || '?')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2)
  return {
    id: String(item.branchId),
    name: item.brandName,
    branch: item.branchName,
    initials,
    tint: tone.tint,
    ink: tone.ink,
    raw: item,
  }
}

function subtractJalaliDays(days: number) {
  const end = todayJalali()
  const g = jalaliToGregorian(end)
  g.setDate(g.getDate() - days)
  return gregorianToJalali(g)
}

function periodQuery(periodId: string, fromDate: string, toDate: string) {
  if (periodId === 'today') {
    const t = serializeJalali(todayJalali())
    return { period: 'custom', from: t, to: t }
  }
  if (periodId === '7d') {
    return {
      period: 'custom',
      from: serializeJalali(subtractJalaliDays(7)),
      to: serializeJalali(todayJalali()),
    }
  }
  if (periodId === '30d') {
    return { period: '1m' as const }
  }
  return { period: 'custom', from: fromDate, to: toDate }
}

export function HomePage() {
  const navigate = useNavigate()
  const { configReady } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [query, setQuery] = useState('')
  const [allBrands, setAllBrands] = useState<WizardBrand[]>([])
  const [brandId, setBrandId] = useState('')
  const [templateId, setTemplateId] = useState('quick')
  const [periodId, setPeriodId] = useState('7d')
  const [fromDate, setFromDate] = useState(serializeJalali(subtractJalaliDays(7)))
  const [toDate, setToDate] = useState(serializeJalali(todayJalali()))
  const [loadingBrands, setLoadingBrands] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const items = await loadBrands()
        if (cancelled) return
        const history = loadHistory()
        const recentIds = history
          .map((h) => String(h.branchId))
          .filter(Boolean)
        const recent = recentIds
          .map((id) => items.find((b) => String(b.branchId) === id))
          .filter(Boolean) as BrandBranch[]
        const seed =
          recent.length >= 4
            ? recent.slice(0, 8)
            : [
                ...recent,
                ...items.filter(
                  (b) => !recentIds.includes(String(b.branchId)),
                ),
              ].slice(0, 8)
        const mapped = seed.map(toWizardBrand)
        setAllBrands(mapped)
        if (!brandId && mapped[0]) setBrandId(mapped[0].id)
      } catch {
        if (!cancelled) setAllBrands([])
      } finally {
        if (!cancelled) setLoadingBrands(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [configReady])

  const brands = useMemo(() => {
    if (!query.trim()) return allBrands.slice(0, 8)
    // search across full catalog when typing
    return allBrands
  }, [allBrands, query])

  const [searchHits, setSearchHits] = useState<WizardBrand[]>([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const q = query.trim()
      if (!q) {
        setSearchHits([])
        return
      }
      const items = await loadBrands()
      if (cancelled) return
      setSearchHits(searchBrands(items, q, 12).map(toWizardBrand))
    })()
    return () => {
      cancelled = true
    }
  }, [query])

  const visibleBrands = query.trim() ? searchHits : brands
  const brand =
    visibleBrands.find((b) => b.id === brandId) ||
    allBrands.find((b) => b.id === brandId) ||
    allBrands[0]
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]!
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[1]!

  const canNext =
    (step === 1 && !!brand) ||
    (step === 2 && !!templateId) ||
    (step === 3 &&
      (periodId !== 'custom' || (!!fromDate && !!toDate && fromDate <= toDate)))

  const primaryLabel =
    step === 1
      ? 'انتخاب قالب بررسی'
      : step === 2
        ? 'تنظیم بازه گزارش'
        : 'شروع بررسی'

  const last = loadHistory()[0]

  const startReview = () => {
    if (!brand || !canNext) return
    const types = loadReviewTypes()
    const type =
      types.find((t) => t.id === template.catalogId) ??
      types.find((t) => t.id === 'quick')
    if (!type) return
    const catalog = loadFeatures()
    const selected = selectionForType(type, catalog)
    const ids = selected.filter((f) => f.checked).map((f) => f.id)
    const diag = diagDefaultsForType(type)
    const pq = periodQuery(periodId, fromDate, toDate)
    const q = new URLSearchParams({
      features: ids.join(','),
      brandName: brand.raw.brandName,
      branchName: brand.raw.branchName,
      period: pq.period,
      diag: diag.join(','),
    })
    if (pq.from) q.set('from', pq.from)
    if (pq.to) q.set('to', pq.to)
    navigate(`/report/${type.id}/${brand.raw.branchId}?${q.toString()}`)
  }

  const goNext = () => {
    if (!canNext) return
    if (step < 3) setStep((s) => (s + 1) as Step)
    else startReview()
  }

  return (
    <section className="stage">
      {last ? (
        <aside className="last-card">
          <div className="last-card-kicker">
            {Ico.clock}
            آخرین بررسی
          </div>
          <div className="last-card-body">
            {last.brandName || 'مجموعه'} · {last.typeTitle || 'گزارش'}
          </div>
          <button
            type="button"
            className="linkish"
            style={{ marginTop: 8 }}
            onClick={() =>
              navigate(`/report/${last.typeId}/${last.branchId}?${last.query}`)
            }
          >
            مشاهده ←
          </button>
        </aside>
      ) : null}

      <div className="hero">
        <div className="eyebrow">بررسی جدید</div>
        <h1>بیایید یک بررسی بسازیم</h1>
        <p>
          انتخاب مجموعه و قالب کمتر از یک دقیقه طول می‌کشد؛ بعد گزارش زنده را
          می‌بینید.
        </p>
      </div>

      <div className="stepper stepper-bar">
        {STEPS.map((s, i) => {
          const active = step === s.n
          const doneStep = step > s.n
          return (
            <div key={s.n} style={{ display: 'contents' }}>
              <button
                type="button"
                className={`step ${active ? 'active' : ''} ${doneStep ? 'done' : ''}`}
                onClick={() => {
                  if (s.n <= step) setStep(s.n)
                }}
              >
                <span className="dot">
                  {doneStep && !active ? Ico.check : toFaDigits(s.n)}
                </span>
                <span style={{ fontSize: 13 }}>{s.title}</span>
              </button>
              {i < STEPS.length - 1 ? (
                <div className={`step-line ${step > s.n ? 'on' : ''}`} />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="panel-wrap">
        {step === 1 ? (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-icon">{Ico.store}</div>
              <div>
                <h2>کدام مجموعه را بررسی می‌کنید؟</h2>
                <div className="sub">نام مجموعه یا شعبه را جست‌وجو کنید</div>
              </div>
            </div>
            <label className="search">
              <span className="mag">{Ico.search}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جست‌وجوی نام مجموعه یا شعبه…"
              />
              <kbd>⌘ K</kbd>
            </label>
            <div className="recent-label">
              {query.trim() ? 'نتایج جست‌وجو' : 'شعبه‌های اخیر'}
            </div>
            {loadingBrands ? (
              <p className="muted">در حال بارگذاری مجموعه‌ها…</p>
            ) : (
              <div className="grid-2">
                {visibleBrands.map((b) => {
                  const on = b.id === brandId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`pick ${on ? 'on' : ''}`}
                      onClick={() => setBrandId(b.id)}
                    >
                      <div className="pick-row">
                        <div
                          className="avatar"
                          style={{ background: b.tint, color: b.ink }}
                        >
                          {b.initials}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="pick-title">{b.name}</div>
                          <div className="pick-sub">{b.branch}</div>
                        </div>
                        <span className="radio">{on ? Ico.check : null}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-icon round">{Ico.spark}</div>
              <div>
                <h2>چه نوع بررسی‌ای نیاز دارید؟</h2>
                <div className="sub">
                  قالب مناسب را براساس هدف بررسی انتخاب کنید.
                </div>
              </div>
            </div>
            <div className="tpl-grid">
              {TEMPLATES.map((t) => {
                const on = t.id === templateId
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`tpl-card ${on ? 'on' : ''} ${t.recommended ? 'reco' : ''}`}
                    onClick={() => setTemplateId(t.id)}
                  >
                    {t.recommended ? (
                      <span className="tpl-badge">پیشنهاد دیدبان</span>
                    ) : null}
                    <div className="tpl-top">
                      <span className={`radio ${on ? 'on' : ''}`}>
                        {on ? Ico.check : null}
                      </span>
                      <span className="tpl-ico">{tplIcon(t.icon)}</span>
                    </div>
                    <div className="tpl-title">{t.title}</div>
                    <div className="tpl-desc">{t.description}</div>
                    <div className="tpl-meta">
                      {toFaDigits(t.sections)} بخش - حدود{' '}
                      {toFaDigits(t.minutes)} دقیقه
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-icon">{Ico.cal}</div>
              <div>
                <h2>بازه گزارش را مشخص کنید</h2>
                <div className="sub">
                  یک بازه سریع انتخاب کنید یا تاریخ دلخواه وارد کنید
                </div>
              </div>
            </div>
            <div className="period-grid">
              {PERIODS.map((p) => {
                const on = p.id === periodId
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`period-card ${on ? 'on' : ''}`}
                    onClick={() => setPeriodId(p.id)}
                  >
                    {on ? <span className="check">{Ico.check}</span> : null}
                    {p.label}
                  </button>
                )
              })}
            </div>
            {periodId === 'custom' ? (
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <label className="pick" style={{ cursor: 'text' }}>
                  <div className="pick-sub">از تاریخ</div>
                  <input
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    dir="ltr"
                    className="naked-input"
                    placeholder="1405/07/16"
                  />
                </label>
                <label className="pick" style={{ cursor: 'text' }}>
                  <div className="pick-sub">تا تاریخ</div>
                  <input
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    dir="ltr"
                    className="naked-input"
                    placeholder="1405/07/23"
                  />
                </label>
              </div>
            ) : null}
            <div className="summary">
              <div className="summary-item">
                <div className="ico">{Ico.store}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="lbl">مجموعه</div>
                  <div className="val">{brand?.name || '—'}</div>
                </div>
              </div>
              <div className="summary-item">
                <div className="ico">{Ico.spark}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="lbl">قالب بررسی</div>
                  <div className="val">{template.title}</div>
                </div>
              </div>
              <div className="summary-item">
                <div className="ico">{Ico.cal}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="lbl">بازه گزارش</div>
                  <div className="val">
                    {periodId === 'custom'
                      ? `${fromDate} تا ${toDate}`
                      : period.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="footer">
        <div className="sel-brand">
          {brand ? (
            <>
              <div
                className="avatar"
                style={{
                  width: 40,
                  height: 40,
                  background: brand.tint,
                  color: brand.ink,
                }}
              >
                {brand.initials}
              </div>
              <div className="meta">
                <div className="lbl">مجموعه انتخاب‌شده</div>
                <div className="val">{brand.name}</div>
              </div>
            </>
          ) : (
            <div className="meta">
              <div className="lbl">مجموعه انتخاب‌شده</div>
              <div className="val">هنوز انتخاب نشده</div>
            </div>
          )}
        </div>
        <div className="actions">
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              مرحله قبل
            </button>
          ) : (
            <span className="footer-hint">
              با انتخاب مجموعه، قالب‌های مناسب نمایش داده می‌شوند
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canNext}
            onClick={goNext}
          >
            {Ico.arrow}
            {primaryLabel}
          </button>
        </div>
      </footer>
    </section>
  )
}

function tplIcon(kind: WizardTemplate['icon']): ReactNode {
  if (kind === 'clock') return Ico.clock
  if (kind === 'check') return Ico.check
  return Ico.spark
}

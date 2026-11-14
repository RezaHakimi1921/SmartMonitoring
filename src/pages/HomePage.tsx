import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ico } from '../components/make/icons'
import type { BrandBranch } from '../data/types'
import { useAuth } from '../lib/authContext'
import { loadBrands, searchBrands } from '../lib/brands'
import { loadHistory } from '../lib/history'
import {
  gregorianToJalali,
  jalaliToGregorian,
  serializeJalali,
  toFaDigits,
  todayJalali,
} from '../lib/jalali'
import {
  diagDefaultsForType,
  loadFeatures,
  loadReviewTypes,
  selectionForType,
} from '../lib/storage'
import styles from './HomePage.module.css'

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

const PERIODS = [
  { id: 'today', label: 'امروز' },
  { id: '7d', label: '۷ روز گذشته' },
  { id: '30d', label: '۳۰ روز گذشته' },
  { id: 'custom', label: 'بازه دلخواه' },
] as const

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

function tplIcon(kind: WizardTemplate['icon']): ReactNode {
  if (kind === 'clock') return Ico.clock
  if (kind === 'check') return Ico.check
  return Ico.spark
}

export function HomePage() {
  const navigate = useNavigate()
  const { configReady } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [query, setQuery] = useState('')
  const [allBrands, setAllBrands] = useState<WizardBrand[]>([])
  const [searchHits, setSearchHits] = useState<WizardBrand[]>([])
  const [brandId, setBrandId] = useState('')
  const [templateId, setTemplateId] = useState('quick')
  const [periodId, setPeriodId] = useState('7d')
  const [fromDate, setFromDate] = useState(
    serializeJalali(subtractJalaliDays(7)),
  )
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
        const seen = new Set<string>()
        const recent: BrandBranch[] = []
        for (const id of recentIds) {
          if (seen.has(id)) continue
          const hit = items.find((b) => String(b.branchId) === id)
          if (!hit) continue
          seen.add(id)
          recent.push(hit)
        }
        const seed =
          recent.length >= 4
            ? recent.slice(0, 8)
            : [
                ...recent,
                ...items.filter((b) => {
                  const id = String(b.branchId)
                  if (seen.has(id)) return false
                  seen.add(id)
                  return true
                }),
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

  const visibleBrands = query.trim() ? searchHits : allBrands.slice(0, 8)
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

  const last = useMemo(() => loadHistory()[0], [configReady])

  const startReview = () => {
    if (!brand || !canNext) return
    const types = loadReviewTypes()
    const type =
      types.find((t) => t.id === template.catalogId) ||
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
    <section className={styles.page}>
      <div className={styles.head}>
        <div className={styles.headMain}>
          <div className={styles.eyebrow}>بررسی جدید</div>
          <h1 className={styles.title}>بیایید یک بررسی بسازیم</h1>
          <p className={styles.lead}>
            انتخاب مجموعه و قالب کمتر از یک دقیقه طول می‌کشد؛ بعد گزارش زنده را
            می‌بینید.
          </p>
        </div>
        {last ? (
          <aside className={styles.lastCard}>
            <div className={styles.lastKicker}>
              {Ico.clock}
              آخرین بررسی
            </div>
            <div className={styles.lastBody}>
              {last.brandName || 'مجموعه'} · {last.typeTitle || 'گزارش'}
            </div>
            <button
              type="button"
              className={styles.lastLink}
              onClick={() =>
                navigate(
                  `/report/${last.typeId}/${last.branchId}?${last.query}`,
                )
              }
            >
              مشاهده ←
            </button>
          </aside>
        ) : null}
      </div>

      <div className={styles.stepper} aria-label="مراحل بررسی">
        {STEPS.map((s, i) => {
          const active = step === s.n
          const doneStep = step > s.n
          const stepClass = active
            ? styles.stepActive
            : doneStep
              ? styles.stepDone
              : styles.step
          return (
            <div key={s.n} style={{ display: 'contents' }}>
              <button
                type="button"
                className={stepClass}
                onClick={() => {
                  if (s.n <= step) setStep(s.n)
                }}
              >
                <span className={styles.dot}>
                  {doneStep && !active ? Ico.check : toFaDigits(s.n)}
                </span>
                <span>{s.title}</span>
              </button>
              {i < STEPS.length - 1 ? (
                <div
                  className={step > s.n ? styles.stepLineOn : styles.stepLine}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {step === 1 ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelIcon}>{Ico.store}</div>
            <div>
              <h2>کدام مجموعه را بررسی می‌کنید؟</h2>
              <div className={styles.panelSub}>
                نام مجموعه یا شعبه را جست‌وجو کنید
              </div>
            </div>
          </div>
          <label className={styles.search}>
            <span>{Ico.search}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی نام مجموعه یا شعبه…"
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className={styles.recentLabel}>
            {query.trim() ? 'نتایج جست‌وجو' : 'شعبه‌های اخیر'}
          </div>
          {loadingBrands ? (
            <p className={styles.empty}>در حال بارگذاری مجموعه‌ها…</p>
          ) : visibleBrands.length === 0 ? (
            <p className={styles.empty}>مجموعه‌ای با این جست‌وجو پیدا نشد.</p>
          ) : (
            <div className={styles.brandGrid}>
              {visibleBrands.map((b) => {
                const on = b.id === brandId
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={on ? styles.pickOn : styles.pick}
                    onClick={() => setBrandId(b.id)}
                  >
                    <div className={styles.pickRow}>
                      <div
                        className={styles.avatar}
                        style={{ background: b.tint, color: b.ink }}
                      >
                        {b.initials}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className={styles.pickTitle}>{b.name}</div>
                        <div className={styles.pickSub}>{b.branch}</div>
                      </div>
                      <span className={styles.radio}>
                        {on ? Ico.check : null}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelIconRound}>{Ico.spark}</div>
            <div>
              <h2>چه نوع بررسی‌ای نیاز دارید؟</h2>
              <div className={styles.panelSub}>
                قالب مناسب را براساس هدف بررسی انتخاب کنید.
              </div>
            </div>
          </div>
          <div className={styles.templateGrid}>
            {TEMPLATES.map((t) => {
              const on = t.id === templateId
              return (
                <button
                  key={t.id}
                  type="button"
                  className={
                    on ? styles.templateCardOn : styles.templateCard
                  }
                  onClick={() => setTemplateId(t.id)}
                >
                  {t.recommended ? (
                    <span className={styles.templateBadge}>
                      پیشنهاد دیدبان
                    </span>
                  ) : null}
                  <div className={styles.templateTop}>
                    <span className={styles.radio}>
                      {on ? Ico.check : null}
                    </span>
                    <span className={styles.templateIco}>
                      {tplIcon(t.icon)}
                    </span>
                  </div>
                  <div className={styles.templateTitle}>{t.title}</div>
                  <div className={styles.templateDesc}>{t.description}</div>
                  <div className={styles.templateMeta}>
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
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelIcon}>{Ico.cal}</div>
            <div>
              <h2>بازه گزارش را مشخص کنید</h2>
              <div className={styles.panelSub}>
                یک بازه سریع انتخاب کنید یا تاریخ دلخواه وارد کنید
              </div>
            </div>
          </div>
          <div className={styles.periodGrid}>
            {PERIODS.map((p) => {
              const on = p.id === periodId
              return (
                <button
                  key={p.id}
                  type="button"
                  className={on ? styles.periodCardOn : styles.periodCard}
                  onClick={() => setPeriodId(p.id)}
                >
                  {on ? (
                    <span className={styles.periodCheck}>{Ico.check}</span>
                  ) : null}
                  {p.label}
                </button>
              )
            })}
          </div>
          {periodId === 'custom' ? (
            <div className={styles.customRow}>
              <label className={styles.customField}>
                <div className={styles.pickSub}>از تاریخ</div>
                <input
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  dir="ltr"
                  className={styles.nakedInput}
                  placeholder="1405/07/16"
                />
              </label>
              <label className={styles.customField}>
                <div className={styles.pickSub}>تا تاریخ</div>
                <input
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  dir="ltr"
                  className={styles.nakedInput}
                  placeholder="1405/07/23"
                />
              </label>
            </div>
          ) : null}
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryIco}>{Ico.store}</div>
              <div style={{ minWidth: 0 }}>
                <div className={styles.summaryLbl}>مجموعه</div>
                <div className={styles.summaryVal}>{brand?.name || '—'}</div>
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryIco}>{Ico.spark}</div>
              <div style={{ minWidth: 0 }}>
                <div className={styles.summaryLbl}>قالب بررسی</div>
                <div className={styles.summaryVal}>{template.title}</div>
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryIco}>{Ico.cal}</div>
              <div style={{ minWidth: 0 }}>
                <div className={styles.summaryLbl}>بازه گزارش</div>
                <div className={styles.summaryVal}>
                  {periodId === 'custom'
                    ? `${fromDate} تا ${toDate}`
                    : period.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <footer className={styles.footer}>
        <div className={styles.selBrand}>
          {brand ? (
            <>
              <div
                className={styles.avatar}
                style={{ background: brand.tint, color: brand.ink }}
              >
                {brand.initials}
              </div>
              <div className={styles.selMeta}>
                <div className={styles.lbl}>مجموعه انتخاب‌شده</div>
                <div className={styles.val}>{brand.name}</div>
              </div>
            </>
          ) : (
            <div className={styles.selMeta}>
              <div className={styles.lbl}>مجموعه انتخاب‌شده</div>
              <div className={styles.val}>هنوز انتخاب نشده</div>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          {step > 1 ? (
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              مرحله قبل
            </button>
          ) : (
            <span className={styles.hint}>
              با انتخاب مجموعه، قالب‌های مناسب نمایش داده می‌شوند
            </span>
          )}
          <button
            type="button"
            className={styles.btnPrimary}
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

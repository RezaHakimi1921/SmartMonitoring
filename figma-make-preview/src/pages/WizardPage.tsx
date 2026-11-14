import { useMemo, useState, type ReactNode } from 'react'
import {
  BRANDS,
  PERIODS,
  TEMPLATES,
  toFa,
  type Brand,
  type Template,
} from '../data/demo'
import { Ico } from '../icons'

type Step = 1 | 2 | 3

const STEPS = [
  { n: 1 as const, title: 'انتخاب مجموعه' },
  { n: 2 as const, title: 'انتخاب قالب' },
  { n: 3 as const, title: 'تنظیم بازه' },
]

export function WizardPage({
  brandId,
  templateId,
  periodId,
  onBrand,
  onTemplate,
  onPeriod,
  onStart,
}: {
  brandId: string
  templateId: string
  periodId: string
  onBrand: (id: string) => void
  onTemplate: (id: string) => void
  onPeriod: (id: string) => void
  onStart: () => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('1405/07/16')
  const [toDate, setToDate] = useState('1405/07/23')

  const brands = useMemo(() => {
    const q = query.trim()
    if (!q) return BRANDS
    return BRANDS.filter(
      (b) => b.name.includes(q) || b.branch.includes(q) || b.initials.includes(q),
    )
  }, [query])

  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0]!
  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]!
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[1]!

  const canNext =
    (step === 1 && !!brandId) ||
    (step === 2 && !!templateId) ||
    (step === 3 && (periodId !== 'custom' || (!!fromDate && !!toDate)))

  const primaryLabel =
    step === 1
      ? 'انتخاب قالب بررسی'
      : step === 2
        ? 'تنظیم بازه گزارش'
        : 'شروع بررسی'

  const goNext = () => {
    if (!canNext) return
    if (step < 3) setStep((s) => (s + 1) as Step)
    else onStart()
  }

  return (
    <section className="stage">
      <aside className="last-card">
        <div className="last-card-kicker">
          {Ico.clock}
          آخرین بررسی
        </div>
        <div className="last-card-body">امروز، ۱۰:۴۵ · مجموعه ونک</div>
        <button type="button" className="linkish" style={{ marginTop: 8 }}>
          مشاهده ←
        </button>
      </aside>

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
                  {doneStep && !active ? Ico.check : toFa(s.n)}
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
          <BrandStep
            query={query}
            setQuery={setQuery}
            brands={brands}
            brandId={brandId}
            onBrand={onBrand}
          />
        ) : null}
        {step === 2 ? (
          <TemplateStep templateId={templateId} onTemplate={onTemplate} />
        ) : null}
        {step === 3 ? (
          <PeriodStep
            brand={brand}
            template={template}
            periodId={periodId}
            onPeriod={onPeriod}
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
            periodLabel={period.label}
          />
        ) : null}
      </div>

      <footer className="footer">
        <div className="sel-brand">
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
          ) : null}
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

function BrandStep({
  query,
  setQuery,
  brands,
  brandId,
  onBrand,
}: {
  query: string
  setQuery: (v: string) => void
  brands: Brand[]
  brandId: string
  onBrand: (id: string) => void
}) {
  return (
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
      <div className="recent-label">شعبه‌های اخیر</div>
      <div className="grid-2">
        {brands.map((b) => {
          const on = b.id === brandId
          return (
            <button
              key={b.id}
              type="button"
              className={`pick ${on ? 'on' : ''}`}
              onClick={() => onBrand(b.id)}
            >
              <div className="pick-row">
                <div className="avatar" style={{ background: b.tint, color: b.ink }}>
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
    </div>
  )
}

function TemplateStep({
  templateId,
  onTemplate,
}: {
  templateId: string
  onTemplate: (id: string) => void
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon round">{Ico.spark}</div>
        <div>
          <h2>چه نوع بررسی‌ای نیاز دارید؟</h2>
          <div className="sub">قالب مناسب را براساس هدف بررسی انتخاب کنید.</div>
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
              onClick={() => onTemplate(t.id)}
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
                {toFa(t.sections)} بخش - حدود {toFa(t.minutes)} دقیقه
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function tplIcon(kind: Template['icon']): ReactNode {
  if (kind === 'clock') return Ico.clock
  if (kind === 'check') return Ico.check
  return Ico.spark
}

function PeriodStep({
  brand,
  template,
  periodId,
  onPeriod,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  periodLabel,
}: {
  brand: Brand
  template: Template
  periodId: string
  onPeriod: (id: string) => void
  fromDate: string
  toDate: string
  setFromDate: (v: string) => void
  setToDate: (v: string) => void
  periodLabel: string
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">{Ico.cal}</div>
        <div>
          <h2>بازه گزارش را مشخص کنید</h2>
          <div className="sub">یک بازه سریع انتخاب کنید یا تاریخ دلخواه وارد کنید</div>
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
              onClick={() => onPeriod(p.id)}
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
            />
          </label>
          <label className="pick" style={{ cursor: 'text' }}>
            <div className="pick-sub">تا تاریخ</div>
            <input
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              dir="ltr"
              className="naked-input"
            />
          </label>
        </div>
      ) : null}

      <div className="summary">
        <div className="summary-item">
          <div className="ico">{Ico.store}</div>
          <div style={{ minWidth: 0 }}>
            <div className="lbl">مجموعه</div>
            <div className="val">{brand.name}</div>
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
              {periodId === 'custom' ? `${fromDate} تا ${toDate}` : periodLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

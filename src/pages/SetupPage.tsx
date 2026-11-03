import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BrandSearch } from '../components/BrandSearch'
import { JalaliRangePicker } from '../components/JalaliRangePicker'
import { ReportOptions } from '../components/ReportOptions'
import { DIAG_ITEMS } from '../data/diagCatalog'
import {
  isRangeValid,
  PERIOD_OPTIONS,
  periodLabel,
  type PeriodKey,
} from '../data/periods'
import type { BrandBranch, FeatureId, FeatureMode } from '../data/types'
import { toFaDigits } from '../lib/jalali'
import {
  loadFeatures,
  loadReviewTypes,
  selectionForType,
} from '../lib/storage'

export function SetupPage() {
  const { typeId = '' } = useParams()
  const navigate = useNavigate()
  const types = loadReviewTypes()
  const features = loadFeatures()
  const type = types.find((t) => t.id === typeId)

  const [brand, setBrand] = useState<BrandBranch | null>(null)
  const [period, setPeriod] = useState<PeriodKey>('1m')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showCustomize, setShowCustomize] = useState(false)
  const [selected, setSelected] = useState<
    { id: FeatureId; mode: FeatureMode | null; checked: boolean }[]
  >([])
  const [diagSelected, setDiagSelected] = useState<number[]>(() =>
    DIAG_ITEMS.slice(0, 8).map((d) => d.id),
  )

  useEffect(() => {
    const current = loadReviewTypes().find((t) => t.id === typeId)
    const catalog = loadFeatures()
    if (current) setSelected(selectionForType(current, catalog))
  }, [typeId])

  const enabledCount = selected.filter((s) => s.checked).length

  if (!type) {
    return (
      <div className="panel">
        <p>این نوع بررسی پیدا نشد.</p>
        <Link className="btn btn-secondary" to="/">
          بازگشت به صفحه اول
        </Link>
      </div>
    )
  }

  const toggle = (id: FeatureId, mode: FeatureMode | null) => {
    if (mode === 'required') return
    setSelected((prev) =>
      prev.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f)),
    )
  }

  const setCategory = (categoryId: string, checked: boolean) => {
    const ids = new Set(
      features.filter((f) => f.category === categoryId).map((f) => f.id),
    )
    setSelected((prev) =>
      prev.map((f) => {
        if (!ids.has(f.id) || f.mode === 'required') return f
        return { ...f, checked }
      }),
    )
  }

  const toggleDiag = (id: number) => {
    setDiagSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const rangeOk = period !== 'custom' || isRangeValid(fromDate, toDate)
  const hasBrand = !!brand
  const canStart = hasBrand && enabledCount > 0 && rangeOk

  // دلیل غیرفعال بودن دکمه، به زبان ساده
  let blockReason = ''
  if (!hasBrand) blockReason = 'برای ادامه، اول مجموعه را انتخاب کنید.'
  else if (period === 'custom' && !rangeOk)
    blockReason =
      fromDate && toDate
        ? 'تاریخ شروع باید قبل از تاریخ پایان باشد.'
        : 'تاریخ شروع و پایان را کامل انتخاب کنید.'
  else if (enabledCount === 0)
    blockReason = 'حداقل یک بخش برای گزارش انتخاب کنید.'

  const start = () => {
    if (!brand || !canStart) return
    const ids = selected.filter((f) => f.checked).map((f) => f.id)
    const q = new URLSearchParams({
      features: ids.join(','),
      brandName: brand.brandName,
      branchName: brand.branchName,
      period,
      diag: diagSelected.join(','),
    })
    if (period === 'custom') {
      q.set('from', fromDate)
      q.set('to', toDate)
    }
    navigate(`/report/${type.id}/${brand.branchId}?${q.toString()}`)
  }

  return (
    <div className="flow">
      <div className="flow-back">
        <Link to="/" className="btn btn-ghost">
          → بازگشت
        </Link>
      </div>

      <header className="flow-head">
        <div className="card-kicker">نوع بررسی</div>
        <h2>{type.title}</h2>
        <p className="muted">{type.description}</p>
      </header>

      <section className="step-card">
        <div className="step-title">
          <span className="step-num">۱</span>
          <div>
            <h3>مجموعه را پیدا کنید</h3>
            <p className="muted">
              نام مجموعه یا شماره قفل را بنویسید و از لیست انتخاب کنید.
            </p>
          </div>
        </div>
        <BrandSearch value={brand} onChange={setBrand} />
      </section>

      <section className="step-card">
        <div className="step-title">
          <span className="step-num">۲</span>
          <div>
            <h3>بازه زمانی گزارش</h3>
            <p className="muted">
              گزارش از چه تاریخی تا امروز بررسی شود؟ (تاریخ‌ها شمسی هستند)
            </p>
          </div>
        </div>
        <div className="period-row">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`period-chip${period === p.id ? ' active' : ''}`}
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' ? (
          <JalaliRangePicker
            from={fromDate}
            to={toDate}
            onChange={(f, t) => {
              setFromDate(f)
              setToDate(t)
            }}
          />
        ) : null}
        <p className="period-summary">
          بازه انتخاب‌شده: <bdi>{periodLabel(period, fromDate, toDate)}</bdi>
        </p>
      </section>

      <section className="step-card">
        <div className="step-title">
          <span className="step-num">۳</span>
          <div>
            <h3>محتوای گزارش</h3>
            <p className="muted">
              برای این نوع بررسی، بخش‌های لازم از قبل انتخاب شده‌اند؛ معمولاً
              نیازی به تغییر نیست.
            </p>
          </div>
        </div>
        <div className="summary-row">
          <span>
            گزارش شامل <strong>{toFaDigits(enabledCount)} بخش</strong> و{' '}
            <strong>{toFaDigits(diagSelected.length)} نکته پیگیری</strong> است.
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            aria-expanded={showCustomize}
            onClick={() => setShowCustomize((v) => !v)}
          >
            {showCustomize ? 'بستن' : 'تغییر بخش‌ها (اختیاری)'}
          </button>
        </div>

        {showCustomize ? (
          <ReportOptions
            features={features}
            checked={new Set(selected.filter((f) => f.checked).map((f) => f.id))}
            required={
              new Set(
                selected.filter((f) => f.mode === 'required').map((f) => f.id),
              )
            }
            diag={diagSelected}
            onToggleFeature={(id) =>
              toggle(id, selected.find((f) => f.id === id)?.mode ?? null)
            }
            onSetCategory={setCategory}
            onToggleDiag={toggleDiag}
            onSetDiag={setDiagSelected}
          />
        ) : null}
      </section>

      <div className="flow-submit">
        <button
          type="button"
          className="btn btn-primary btn-large"
          disabled={!canStart}
          onClick={start}
        >
          ساخت گزارش
        </button>
        {blockReason ? <p className="flow-reason">{blockReason}</p> : null}
      </div>
    </div>
  )
}

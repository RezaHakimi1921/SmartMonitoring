import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BrandSearch } from '../components/BrandSearch'
import { JalaliDatePicker } from '../components/JalaliDatePicker'
import { FEATURE_CATEGORIES } from '../data/catalog'
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

  const grouped = useMemo(() => {
    return FEATURE_CATEGORIES.map((cat) => ({
      ...cat,
      items: selected
        .map((s) => {
          const meta = features.find((f) => f.id === s.id)
          return meta ? { ...s, meta } : null
        })
        .filter(
          (x): x is NonNullable<typeof x> => !!x && x.meta.category === cat.id,
        ),
    })).filter((g) => g.items.length > 0)
  }, [selected, features])

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
          <div className="custom-dates">
            <JalaliDatePicker
              label="از تاریخ"
              value={fromDate}
              onChange={setFromDate}
            />
            <JalaliDatePicker
              label="تا تاریخ"
              value={toDate}
              onChange={setToDate}
            />
          </div>
        ) : null}
        <p className="period-summary">
          بازه انتخاب‌شده: <strong>{periodLabel(period, fromDate, toDate)}</strong>
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
          <div className="category-stack">
            {grouped.map((group) => {
              const onCount = group.items.filter((i) => i.checked).length
              return (
                <section key={group.id} className="category-block">
                  <div className="category-head">
                    <div>
                      <h4>{group.title}</h4>
                      <p className="muted">{group.description}</p>
                    </div>
                    <div className="actions">
                      <span className="chip">
                        {toFaDigits(onCount)} از {toFaDigits(group.items.length)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ height: 36 }}
                        onClick={() => setCategory(group.id, true)}
                      >
                        انتخاب همه
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ height: 36 }}
                        onClick={() => setCategory(group.id, false)}
                      >
                        برداشتن همه
                      </button>
                    </div>
                  </div>
                  <div className="feature-list">
                    {group.items.map((item) => (
                      <label
                        key={item.id}
                        className={`feature-item${item.mode === 'required' ? ' required' : ''}${item.checked ? ' is-on' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled={item.mode === 'required'}
                          onChange={() => toggle(item.id, item.mode)}
                        />
                        <span>
                          <strong>
                            {item.meta.title}
                            {item.mode === 'required' ? ' (الزامی)' : ''}
                          </strong>
                          <span className="muted">{item.meta.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              )
            })}

            <section className="category-block">
              <div className="category-head">
                <div>
                  <h4>نکات قابل پیگیری</h4>
                  <p className="muted">
                    مواردی که در پایان گزارش برای پیگیری فهرست می‌شوند
                  </p>
                </div>
                <div className="actions">
                  <span className="chip">
                    {toFaDigits(diagSelected.length)} از{' '}
                    {toFaDigits(DIAG_ITEMS.length)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ height: 36 }}
                    onClick={() => setDiagSelected(DIAG_ITEMS.map((d) => d.id))}
                  >
                    انتخاب همه
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ height: 36 }}
                    onClick={() => setDiagSelected([])}
                  >
                    برداشتن همه
                  </button>
                </div>
              </div>
              <div className="feature-list">
                {DIAG_ITEMS.map((d) => (
                  <label
                    key={d.id}
                    className={`feature-item${diagSelected.includes(d.id) ? ' is-on' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={diagSelected.includes(d.id)}
                      onChange={() => toggleDiag(d.id)}
                    />
                    <span>
                      <strong>{d.title}</strong>
                      <span className="muted">{d.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>
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

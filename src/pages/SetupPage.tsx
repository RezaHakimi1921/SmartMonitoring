import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BrandSearch } from '../components/BrandSearch'
import { FEATURE_CATEGORIES } from '../data/catalog'
import { DIAG_ITEMS } from '../data/diagCatalog'
import { PERIOD_OPTIONS, type PeriodKey } from '../data/periods'
import type { BrandBranch, FeatureId, FeatureMode } from '../data/types'
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
        <p>نوع بررسی پیدا نشد.</p>
        <Link className="btn btn-secondary" to="/">
          بازگشت
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

  const canStart =
    !!brand &&
    enabledCount > 0 &&
    (period !== 'custom' || (!!fromDate && !!toDate))

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
    <>
      <div className="setup-topbar">
        <div className="setup-topbar-main">
          <div>
            <div className="card-kicker">{type.title}</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>{type.description}</h2>
          </div>
          <button
            type="button"
            className="btn btn-primary setup-start-btn"
            disabled={!canStart}
            onClick={start}
          >
            شروع و ساخت گزارش
          </button>
        </div>

        <div className="setup-topbar-grid">
          <div>
            <BrandSearch value={brand} onChange={setBrand} />
          </div>
          <div>
            <div className="field-label">بازه محاسبات</div>
            <div className="period-row">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`period-chip${period === p.id ? ' active' : ''}`}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'custom' ? (
              <div className="custom-dates">
                <input
                  type="date"
                  className="input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label="از تاریخ"
                />
                <input
                  type="date"
                  className="input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  aria-label="تا تاریخ"
                />
              </div>
            ) : null}
          </div>
        </div>
        {!brand ? (
          <p className="muted" style={{ margin: '10px 0 0' }}>
            اول مجموعه را انتخاب کنید، بعد گزارش ساخته می‌شود.
          </p>
        ) : (
          <p className="muted" style={{ margin: '10px 0 0' }}>
            {enabledCount} مورد از گزارش + {diagSelected.length} نکته تشخیصی
            انتخاب شده
          </p>
        )}
      </div>

      <div className="panel">
        <div className="section-head">
          <h3 className="panel-title" style={{ margin: 0 }}>
            بخش‌های گزارش
          </h3>
          <span className="chip">قابل کم و زیاد کردن</span>
        </div>

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
                      {onCount}/{group.items.length}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ height: 36 }}
                      onClick={() => setCategory(group.id, true)}
                    >
                      همه
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ height: 36 }}
                      onClick={() => setCategory(group.id, false)}
                    >
                      هیچ‌کدام
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
                        <strong>{item.meta.title}</strong>
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
                <h4>نکات تشخیصی مجموعه</h4>
                <p className="muted">
                  موارد آماده برای پیگیری سریع وضعیت مجموعه
                </p>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ height: 36 }}
                  onClick={() => setDiagSelected(DIAG_ITEMS.map((d) => d.id))}
                >
                  همه
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ height: 36 }}
                  onClick={() => setDiagSelected([])}
                >
                  هیچ‌کدام
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
      </div>

      <div className="actions sticky-mobile-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canStart}
          onClick={start}
        >
          شروع و ساخت گزارش
        </button>
        <Link to="/" className="btn btn-ghost">
          بازگشت
        </Link>
      </div>
    </>
  )
}

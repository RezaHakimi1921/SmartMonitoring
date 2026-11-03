import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BrandSearch } from '../components/BrandSearch'
import {
  FEATURE_CATEGORIES,
  SOURCE_LABEL,
} from '../data/catalog'
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
  const [selected, setSelected] = useState<
    { id: FeatureId; mode: FeatureMode | null; checked: boolean }[]
  >([])

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
        .filter((x): x is NonNullable<typeof x> => !!x && x.meta.category === cat.id),
    })).filter((g) => g.items.length > 0)
  }, [selected, features])

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

  const start = () => {
    if (!brand) return
    const ids = selected.filter((f) => f.checked).map((f) => f.id)
    const q = new URLSearchParams({
      features: ids.join(','),
      brandName: brand.brandName,
      branchName: brand.branchName,
      lockNumber: brand.lockNumber,
      brandId: String(brand.brandId),
      branchId: String(brand.branchId),
    })
    navigate(`/report/${type.id}/${brand.branchId}?${q.toString()}`)
  }

  return (
    <>
      <section className="page-intro">
        <h2 style={{ margin: 0, fontSize: 22 }}>{type.title}</h2>
        <p>{type.description}</p>
      </section>

      <div className="panel">
        <h3 className="panel-title">۱. انتخاب مجموعه</h3>
        <BrandSearch value={brand} onChange={setBrand} />
      </div>

      <div className="panel">
        <div className="section-head">
          <h3 className="panel-title" style={{ margin: 0 }}>
            ۲. ویژگی‌ها به‌تفکیک دسته
          </h3>
          <span className="chip">پیش‌فرض نوع · قابل تغییر</span>
        </div>

        <div className="category-stack">
          {grouped.map((group) => {
            const enabledCount = group.items.filter((i) => i.checked).length
            return (
              <section key={group.id} className="category-block">
                <div className="category-head">
                  <div>
                    <h4>{group.title}</h4>
                    <p className="muted">{group.description}</p>
                  </div>
                  <div className="actions">
                    <span className="chip">
                      {enabledCount}/{group.items.length} فعال
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
                        <span className="muted">
                          {item.meta.description} ·{' '}
                          {SOURCE_LABEL[item.meta.source]}
                          {item.mode === 'required'
                            ? ' · اجباری'
                            : item.mode
                              ? ''
                              : ' · خارج از پیش‌فرض نوع'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!brand || selected.every((s) => !s.checked)}
          onClick={start}
        >
          شروع ساخت گزارش
        </button>
        <Link to="/" className="btn btn-ghost">
          انصراف
        </Link>
      </div>
    </>
  )
}

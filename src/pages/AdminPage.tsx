import { useState } from 'react'
import { FEATURES, SOURCE_LABEL } from '../data/catalog'
import type { FeatureMode, ReviewType } from '../data/types'
import {
  loadFeatures,
  loadReviewTypes,
  resetCatalog,
  saveReviewTypes,
} from '../lib/storage'

const MODES: { id: FeatureMode; label: string }[] = [
  { id: 'required', label: 'اجباری' },
  { id: 'defaultOn', label: 'پیش‌فرض روشن' },
  { id: 'defaultOff', label: 'پیش‌فرض خاموش' },
]

export function AdminPage() {
  const [types, setTypes] = useState<ReviewType[]>(() => loadReviewTypes())
  const features = loadFeatures()
  const [activeTypeId, setActiveTypeId] = useState(types[0]?.id ?? '')
  const [toast, setToast] = useState('')

  const active = types.find((t) => t.id === activeTypeId)

  const setMode = (featureId: string, mode: FeatureMode | '') => {
    setTypes((prev) =>
      prev.map((t) => {
        if (t.id !== activeTypeId) return t
        const next = { ...t.features }
        if (!mode) delete next[featureId as keyof typeof next]
        else next[featureId as keyof typeof next] = mode
        return { ...t, features: next }
      }),
    )
  }

  const persist = () => {
    saveReviewTypes(types)
    setToast('ذخیره شد (localStorage)')
    window.setTimeout(() => setToast(''), 2000)
  }

  const reset = () => {
    resetCatalog()
    const fresh = loadReviewTypes()
    setTypes(fresh)
    setActiveTypeId(fresh[0]?.id ?? '')
    setToast('بازگشت به پیش‌فرض')
    window.setTimeout(() => setToast(''), 2000)
  }

  return (
    <>
      <section className="page-intro">
        <h2 style={{ margin: 0, fontSize: 22 }}>انواع و ویژگی‌ها</h2>
        <p>
          نوع بررسی را تعریف کن، ویژگی را وصل کن با حالت اجباری / روشن / خاموش.
          اپراتور موقع اجرا تیک‌ها را می‌بیند و می‌تواند بردارد (جز اجباری).
        </p>
      </section>

      <div className="admin-grid">
        <div className="panel">
          <h3 className="panel-title">انواع بررسی</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                className="iso-card"
                style={{
                  padding: 16,
                  outline:
                    t.id === activeTypeId
                      ? '2px solid var(--primary)'
                      : undefined,
                }}
                onClick={() => setActiveTypeId(t.id)}
              >
                <strong>{t.title}</strong>
                <div className="muted">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">
            اتصال ویژگی‌ها
            {active ? ` · ${active.title}` : ''}
          </h3>
          {!active ? (
            <p className="muted">یک نوع را انتخاب کن.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ویژگی</th>
                  <th>منبع</th>
                  <th>حالت</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => {
                  const current = active.features[f.id] ?? ''
                  return (
                    <tr key={f.id}>
                      <td>
                        <strong>{f.title}</strong>
                        <div className="muted">{f.description}</div>
                      </td>
                      <td>{SOURCE_LABEL[f.source]}</td>
                      <td>
                        <select
                          className="select"
                          style={{ height: 40 }}
                          value={current}
                          onChange={(e) =>
                            setMode(f.id, e.target.value as FeatureMode | '')
                          }
                        >
                          <option value="">وصل نیست</option>
                          {MODES.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">کاتالوگ ویژگی‌ها (فقط نمایش)</h3>
        <div className="feature-list">
          {FEATURES.map((f) => (
            <div key={f.id} className="feature-item">
              <span>
                <strong>{f.title}</strong>
                <span className="muted">
                  {f.description} · {SOURCE_LABEL[f.source]}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={persist}>
          ذخیره پیکربندی
        </button>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          بازنشانی پیش‌فرض
        </button>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}

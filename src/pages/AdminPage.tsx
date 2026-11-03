import { useEffect, useState } from 'react'
import { FEATURES, SOURCE_LABEL } from '../data/catalog'
import type { FeatureMode, ReviewType } from '../data/types'
import {
  loadFeatures,
  loadReviewTypes,
  resetCatalog,
  saveReviewTypes,
} from '../lib/storage'

/** سه حالت روشن برای هر بخش؛ «غیرفعال» یعنی پیش‌فرض خاموش (کاربر می‌تواند روشنش کند). */
const MODES: { id: FeatureMode | 'off'; label: string; hint: string }[] = [
  { id: 'required', label: 'اجباری', hint: 'همیشه در گزارش است و کاربر نمی‌تواند بردارد' },
  { id: 'defaultOn', label: 'پیشنهادی', hint: 'از قبل انتخاب شده؛ کاربر می‌تواند بردارد' },
  { id: 'off', label: 'غیرفعال', hint: 'از قبل انتخاب نیست؛ کاربر می‌تواند اضافه کند' },
]

export function AdminPage() {
  const [types, setTypes] = useState<ReviewType[]>(() => loadReviewTypes())
  const features = loadFeatures()
  const [activeTypeId, setActiveTypeId] = useState(types[0]?.id ?? '')
  const [toast, setToast] = useState('')
  const [saved, setSaved] = useState(() => JSON.stringify(loadReviewTypes()))
  const [confirmReset, setConfirmReset] = useState(false)
  const dirty = JSON.stringify(types) !== saved

  // هشدار هنگام بستن صفحه با تغییر ذخیره‌نشده
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const active = types.find((t) => t.id === activeTypeId)

  const setMode = (featureId: string, mode: FeatureMode | 'off' | '') => {
    setTypes((prev) =>
      prev.map((t) => {
        if (t.id !== activeTypeId) return t
        const next = { ...t.features }
        if (!mode || mode === 'off') delete next[featureId as keyof typeof next]
        else next[featureId as keyof typeof next] = mode
        return { ...t, features: next }
      }),
    )
  }

  const persist = () => {
    saveReviewTypes(types)
    setSaved(JSON.stringify(types))
    setToast('تنظیمات ذخیره شد')
    window.setTimeout(() => setToast(''), 2000)
  }

  const reset = () => {
    resetCatalog()
    const fresh = loadReviewTypes()
    setTypes(fresh)
    setSaved(JSON.stringify(fresh))
    setConfirmReset(false)
    setActiveTypeId(fresh[0]?.id ?? '')
    setToast('بازگشت به پیش‌فرض')
    window.setTimeout(() => setToast(''), 2000)
  }

  return (
    <>
      <section className="page-intro">
        <h2 style={{ margin: 0, fontSize: 22 }}>تنظیمات انواع بررسی</h2>
        <p>
          این صفحه ویژه مدیر است. برای هر نوع بررسی مشخص کنید کدام بخش‌ها در
          گزارش باشند: «اجباری» (کاربر نمی‌تواند بردارد)، «پیش‌فرض روشن» یا
          «پیش‌فرض خاموش» (کاربر می‌تواند تغییر دهد). بعد از تغییر، «ذخیره
          پیکربندی» را بزنید.
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
                        <div
                          className="segmented"
                          role="radiogroup"
                          aria-label={`حالت ${f.title}`}
                        >
                          {MODES.map((m) => {
                            const on = (current || 'off') === m.id
                            return (
                              <button
                                key={m.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                title={m.hint}
                                className={`seg seg-${m.id}${on ? ' on' : ''}`}
                                onClick={() => setMode(f.id, m.id)}
                              >
                                {m.label}
                              </button>
                            )
                          })}
                        </div>
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

      <div className="save-bar">
        <span className={dirty ? 'save-state dirty' : 'save-state muted'}>
          {dirty ? 'تغییرات ذخیره نشده است' : 'همه تغییرات ذخیره شده است'}
        </span>
        <div className="actions">
          {confirmReset ? (
            <>
              <span>همه تنظیمات به حالت اولیه برگردد؟</span>
              <button type="button" className="btn btn-primary" onClick={reset}>
                بله، بازنشانی
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmReset(false)}
              >
                انصراف
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmReset(true)}
              >
                بازنشانی به پیش‌فرض
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!dirty}
                onClick={persist}
              >
                ذخیره تغییرات
              </button>
            </>
          )}
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}

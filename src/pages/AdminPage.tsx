import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { MetricQualityPanel } from '../components/MetricQualityPanel'
import { TemplateTagEditor } from '../components/TemplateTagEditor'
import { FEATURES, SOURCE_LABEL } from '../data/catalog'
import { DIAG_CATEGORIES, DIAG_ITEMS } from '../data/diagCatalog'
import type {
  FeatureMode,
  MetricKind,
  MetricRule,
  MonitoringConfig,
  ReviewType,
} from '../data/types'
import { isStaff, useAuth } from '../lib/authContext'
import {
  fetchConfig,
  resetServerConfig,
  saveConfig,
} from '../lib/configApi'
import { setCachedConfig } from '../lib/storage'

const MODES: { id: FeatureMode | 'off'; label: string; hint: string }[] = [
  {
    id: 'required',
    label: 'اجباری',
    hint: 'همیشه در گزارش است و کاربر نمی‌تواند بردارد',
  },
  {
    id: 'defaultOn',
    label: 'پیشنهادی',
    hint: 'از قبل انتخاب شده؛ کاربر می‌تواند بردارد',
  },
  {
    id: 'off',
    label: 'غیرفعال',
    hint: 'از قبل انتخاب نیست؛ کاربر می‌تواند اضافه کند',
  },
]

export function AdminPage() {
  const { user, reloadConfig } = useAuth()
  const [config, setConfig] = useState<MonitoringConfig | null>(null)
  const [savedSnap, setSavedSnap] = useState('')
  const [activeTypeId, setActiveTypeId] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [tab, setTab] = useState<'features' | 'diag' | 'metrics' | 'templates'>(
    'features',
  )

  useEffect(() => {
    void (async () => {
      try {
        const c = await fetchConfig()
        setConfig(c)
        setSavedSnap(JSON.stringify(c))
        setActiveTypeId(c.reviewTypes[0]?.id ?? '')
        setCachedConfig(c)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا')
      }
    })()
  }, [])

  const dirty = config ? JSON.stringify(config) !== savedSnap : false
  const types = config?.reviewTypes ?? []
  const active = types.find((t) => t.id === activeTypeId)

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  if (!isStaff(user?.role)) {
    return <Navigate to="/" replace />
  }

  const setMode = (featureId: string, mode: FeatureMode | 'off' | '') => {
    if (!config) return
    setConfig({
      ...config,
      reviewTypes: config.reviewTypes.map((t) => {
        if (t.id !== activeTypeId) return t
        const next = { ...t.features }
        if (!mode || mode === 'off') delete next[featureId as keyof typeof next]
        else next[featureId as keyof typeof next] = mode
        return { ...t, features: next }
      }),
    })
  }

  const toggleDiagDefault = (diagId: number) => {
    if (!config || !active) return
    const cur = new Set(active.diagDefaults ?? [])
    if (cur.has(diagId)) cur.delete(diagId)
    else cur.add(diagId)
    setConfig({
      ...config,
      reviewTypes: config.reviewTypes.map((t) =>
        t.id === activeTypeId
          ? { ...t, diagDefaults: Array.from(cur).sort((a, b) => a - b) }
          : t,
      ),
    })
  }

  const setDiagCategory = (categoryId: string, on: boolean) => {
    if (!config || !active) return
    const ids = DIAG_ITEMS.filter((d) => d.category === categoryId).map(
      (d) => d.id,
    )
    const cur = new Set(active.diagDefaults ?? [])
    for (const id of ids) {
      if (on) cur.add(id)
      else cur.delete(id)
    }
    setConfig({
      ...config,
      reviewTypes: config.reviewTypes.map((t) =>
        t.id === activeTypeId
          ? { ...t, diagDefaults: Array.from(cur).sort((a, b) => a - b) }
          : t,
      ),
    })
  }

  const canEditMetrics = user?.role === 'superadmin'

  const updateRule = (id: string, patch: Partial<MetricRule>) => {
    if (!config || !canEditMetrics) return
    setConfig({
      ...config,
      metricRules: config.metricRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    })
  }

  const setRuleKind = (id: string, kind: MetricKind) => {
    if (!canEditMetrics) return
    if (kind === 'percent') {
      updateRule(id, {
        kind,
        higherIsBetter: true,
        goodMin: 70,
        okMin: 50,
        goodWhen: undefined,
        badMin: undefined,
        warnMin: undefined,
      })
    } else if (kind === 'days') {
      updateRule(id, {
        kind,
        higherIsBetter: false,
        warnMin: 1,
        badMin: 3,
        goodMin: undefined,
        okMin: undefined,
        goodWhen: undefined,
      })
    } else {
      updateRule(id, {
        kind,
        higherIsBetter: true,
        goodWhen: 1,
        alertIfMissing: true,
        goodMin: undefined,
        okMin: undefined,
        badMin: undefined,
        warnMin: undefined,
      })
    }
  }

  const persist = async () => {
    if (!config) return
    setBusy(true)
    setError('')
    try {
      const next = await saveConfig(config)
      setConfig(next)
      setSavedSnap(JSON.stringify(next))
      setCachedConfig(next)
      await reloadConfig()
      flash('تنظیمات روی سرور ذخیره شد')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ذخیره ناموفق')
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    setBusy(true)
    setError('')
    try {
      const next = await resetServerConfig()
      setConfig(next)
      setSavedSnap(JSON.stringify(next))
      setActiveTypeId(next.reviewTypes[0]?.id ?? '')
      setCachedConfig(next)
      await reloadConfig()
      setConfirmReset(false)
      flash('بازگشت به پیش‌فرض سرور')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'بازنشانی ناموفق')
    } finally {
      setBusy(false)
    }
  }

  const diagSelected = useMemo(
    () => new Set(active?.diagDefaults ?? []),
    [active],
  )

  if (!config) {
    return (
      <div className="panel glass-card" aria-busy="true">
        <p className="muted">در حال بارگذاری تنظیمات سرور…</p>
        {error ? <p className="flow-reason">{error}</p> : null}
      </div>
    )
  }

  return (
    <>
      <section className="page-intro">
        <h2 style={{ margin: 0, fontSize: 22 }}>تنظیمات انواع بررسی</h2>
        <p>
          پیش‌فرض بخش‌ها، نکات پیگیری، آستانه‌ها و قالب پیام روی سرور ذخیره
          می‌شود و برای همه کاربران اعمال می‌گردد.
        </p>
      </section>

      {error ? <div className="report-notice">{error}</div> : null}

      <div className="tabs-row" role="tablist" aria-label="بخش تنظیمات">
        {(
          [
            ['features', 'بخش‌های گزارش'],
            ['diag', 'نکات پیگیری'],
            ['metrics', 'کیفی شاخص‌ها'],
            ['templates', 'قالب پیام'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`tab${tab === id ? ' active' : ''}`}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {(tab === 'features' || tab === 'diag') && (
        <div className="admin-grid" style={{ marginTop: 16 }}>
          <div className="panel glass-card">
            <h3 className="panel-title">انواع بررسی</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {types.map((t: ReviewType) => (
                <button
                  key={t.id}
                  type="button"
                  className="iso-card glass-card"
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

          <div className="panel glass-card">
            <h3 className="panel-title">
              {tab === 'features' ? 'اتصال ویژگی‌ها' : 'پیش‌فرض نکات پیگیری'}
              {active ? ` · ${active.title}` : ''}
            </h3>
            {!active ? (
              <p className="muted">یک نوع را انتخاب کنید.</p>
            ) : tab === 'features' ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>ویژگی</th>
                    <th>منبع</th>
                    <th>حالت</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f) => {
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
            ) : (
              <div className="category-stack">
                {DIAG_CATEGORIES.map((cat) => {
                  const items = DIAG_ITEMS.filter((d) => d.category === cat.id)
                  return (
                    <section key={cat.id} className="category-block">
                      <div className="category-head">
                        <div>
                          <h4>{cat.title}</h4>
                          <p className="muted">{cat.description}</p>
                        </div>
                        <div className="actions">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setDiagCategory(cat.id, true)}
                          >
                            انتخاب همه
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setDiagCategory(cat.id, false)}
                          >
                            لغو
                          </button>
                        </div>
                      </div>
                      <div className="feature-list">
                        {items.map((d) => (
                          <label
                            key={d.id}
                            className={`feature-item${diagSelected.has(d.id) ? ' is-on' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={diagSelected.has(d.id)}
                              onChange={() => toggleDiagDefault(d.id)}
                            />
                            <span>
                              <strong>{d.title}</strong>
                              <span className="muted">{d.hint}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'metrics' ? (
        <div style={{ marginTop: 16 }}>
          <MetricQualityPanel
            rules={config.metricRules}
            canEdit={canEditMetrics}
            onUpdate={updateRule}
            onSetKind={setRuleKind}
          />
        </div>
      ) : null}

      {tab === 'templates' ? (
        <div className="template-stack" style={{ marginTop: 16 }}>
          <TemplateTagEditor
            title="قالب ارسال پیام به مشتری"
            value={config.customerMessageTemplate}
            onChange={(customerMessageTemplate) =>
              setConfig({ ...config, customerMessageTemplate })
            }
          />
          <TemplateTagEditor
            title="قالب ثبت فرم دستیار"
            value={config.assistantFormTemplate}
            onChange={(assistantFormTemplate) =>
              setConfig({ ...config, assistantFormTemplate })
            }
          />
        </div>
      ) : null}

      <div className="save-bar">
        <span className={dirty ? 'save-state dirty' : 'save-state muted'}>
          {dirty ? 'تغییرات ذخیره نشده است' : 'همه تغییرات ذخیره شده است'}
        </span>
        <div className="actions">
          {confirmReset ? (
            <>
              <span>همه تنظیمات سرور به حالت اولیه برگردد؟</span>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void reset()}
              >
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
                disabled={!dirty || busy}
                onClick={() => void persist()}
              >
                {busy ? 'در حال ذخیره…' : 'ذخیره روی سرور'}
              </button>
            </>
          )}
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}

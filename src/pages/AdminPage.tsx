import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { DidbanToast } from '../components/DidbanToast'
import { MetricQualityPanel } from '../components/MetricQualityPanel'
import { TemplateTagEditor } from '../components/TemplateTagEditor'
import { Ico } from '../components/make/icons'
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
import { toFaDigits } from '../lib/jalali'
import { setCachedConfig } from '../lib/storage'
import styles from './AdminPage.module.css'

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

const TABS = [
  { value: 'features', label: 'بخش‌های گزارش' },
  { value: 'diag', label: 'نکات پیگیری' },
  { value: 'metrics', label: 'کیفی شاخص‌ها' },
  { value: 'templates', label: 'قالب پیام' },
] as const

type TabId = (typeof TABS)[number]['value']

export function AdminPage() {
  const { user, reloadConfig } = useAuth()
  const [config, setConfig] = useState<MonitoringConfig | null>(null)
  const [savedSnap, setSavedSnap] = useState('')
  const [activeTypeId, setActiveTypeId] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const initialTab = (() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (
      t === 'features' ||
      t === 'diag' ||
      t === 'metrics' ||
      t === 'templates'
    ) {
      return t
    }
    return 'features'
  })()
  const [tab, setTab] = useState<TabId>(initialTab)

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
    window.setTimeout(() => setToast(''), 2400)
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
  const canEditReviewTypes = user?.role === 'superadmin'

  const updateReviewType = (
    id: string,
    patch: Partial<Pick<ReviewType, 'title' | 'description'>>,
  ) => {
    if (!config || !canEditReviewTypes) return
    setConfig({
      ...config,
      reviewTypes: config.reviewTypes.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    })
  }

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

  const changeTab = (next: TabId) => {
    setTab(next)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    window.history.replaceState(null, '', url.pathname + url.search)
  }

  if (!config) {
    return (
      <div className={styles.page}>
        <div className={styles.panel}>
          <p className={styles.muted}>در حال بارگذاری تنظیمات سرور…</p>
          {error ? <div className={styles.error}>{error}</div> : null}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>مدیریت</div>
        <h1>تنظیمات بررسی</h1>
        <p>
          پیش‌فرض بخش‌ها، نکات پیگیری، آستانه‌ها و قالب پیام روی سرور ذخیره می‌شود
          و برای همه کاربران اعمال می‌گردد.
        </p>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.tabs} role="tablist" aria-label="بخش‌های تنظیمات">
        {TABS.map((t, i) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={tab === t.value ? styles.tabOn : styles.tab}
            onClick={() => changeTab(t.value)}
          >
            <span className={styles.tabNum}>{toFaDigits(i + 1)}</span>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'features' || tab === 'diag') && (
        <div className={styles.layout}>
          <aside className={styles.panel}>
            <h2 className={styles.panelTitle}>قالب‌های فعال</h2>
            <div className={styles.typeList}>
              {types.map((t: ReviewType) => {
                const selected = t.id === activeTypeId
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={selected ? styles.typeCardOn : styles.typeCard}
                    onClick={() => setActiveTypeId(t.id)}
                  >
                    <div className={styles.typeTitle}>
                      {t.title || 'بدون عنوان'}
                    </div>
                    <div className={styles.typeDesc}>
                      {t.description || 'بدون توضیح'}
                    </div>
                  </button>
                )
              })}
            </div>
            {!canEditReviewTypes ? (
              <p className={styles.help} style={{ marginTop: 12 }}>
                ویرایش نام و توضیح فقط برای سوپرادمین است.
              </p>
            ) : null}
          </aside>

          <div className={styles.stack}>
            {active && canEditReviewTypes ? (
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>نام و توضیح این قالب</h2>
                <label className={styles.field}>
                  <span>عنوان بررسی</span>
                  <input
                    value={active.title}
                    onChange={(e) =>
                      updateReviewType(active.id, { title: e.target.value })
                    }
                    required
                  />
                  <span className={styles.help}>
                    در صفحهٔ اول و گزارش‌ها نمایش داده می‌شود
                  </span>
                </label>
                <label className={styles.field}>
                  <span>توضیح / زیرعنوان</span>
                  <textarea
                    value={active.description}
                    onChange={(e) =>
                      updateReviewType(active.id, {
                        description: e.target.value,
                      })
                    }
                  />
                  <span className={styles.help}>
                    متن کوتاه زیر عنوان در کارت نوع بررسی
                  </span>
                </label>
              </section>
            ) : null}

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>
                {tab === 'features'
                  ? `اتصال ویژگی‌ها${active ? ` · ${active.title}` : ''}`
                  : `پیش‌فرض نکات پیگیری${active ? ` · ${active.title}` : ''}`}
              </h2>

              {!active ? (
                <p className={styles.muted}>یک نوع را انتخاب کنید.</p>
              ) : tab === 'features' ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: '42%' }}>ویژگی</th>
                        <th style={{ width: '18%' }}>منبع</th>
                        <th style={{ width: '40%' }}>حالت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FEATURES.map((f) => {
                        const current = active.features[f.id] ?? ''
                        return (
                          <tr key={f.id}>
                            <td>
                              <div className={styles.featTitle}>{f.title}</div>
                              <div className={styles.featDesc}>
                                {f.description}
                              </div>
                            </td>
                            <td>{SOURCE_LABEL[f.source]}</td>
                            <td>
                              <div
                                className={styles.modes}
                                role="radiogroup"
                                aria-label={`حالت ${f.title}`}
                              >
                                {MODES.map((m) => {
                                  const on = (current || 'off') === m.id
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      title={m.hint}
                                      className={
                                        on ? styles.modeOn : styles.mode
                                      }
                                      aria-checked={on}
                                      role="radio"
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
                </div>
              ) : (
                <div className={styles.stack}>
                  {DIAG_CATEGORIES.map((cat) => {
                    const items = DIAG_ITEMS.filter(
                      (d) => d.category === cat.id,
                    )
                    return (
                      <div key={cat.id}>
                        <div className={styles.catHead}>
                          <div>
                            <div className={styles.catTitle}>{cat.title}</div>
                            <div className={styles.catDesc}>
                              {cat.description}
                            </div>
                          </div>
                          <div>
                            <button
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => setDiagCategory(cat.id, true)}
                            >
                              انتخاب همه
                            </button>
                            <button
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => setDiagCategory(cat.id, false)}
                            >
                              لغو
                            </button>
                          </div>
                        </div>
                        <div className={styles.diagGrid}>
                          {items.map((d) => {
                            const on = diagSelected.has(d.id)
                            return (
                              <label
                                key={d.id}
                                className={
                                  on ? styles.diagCardOn : styles.diagCard
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggleDiagDefault(d.id)}
                                />
                                <div>
                                  <div className={styles.diagTitle}>
                                    {d.title}
                                  </div>
                                  <div className={styles.diagHint}>{d.hint}</div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === 'metrics' ? (
        <section className={styles.panel}>
          <MetricQualityPanel
            rules={config.metricRules}
            canEdit={canEditMetrics}
            onUpdate={updateRule}
            onSetKind={setRuleKind}
          />
        </section>
      ) : null}

      {tab === 'templates' ? (
        <div className={styles.stack}>
          <section className={styles.panel}>
            <TemplateTagEditor
              title="قالب ارسال پیام به مشتری"
              value={config.customerMessageTemplate}
              onChange={(customerMessageTemplate) =>
                setConfig({ ...config, customerMessageTemplate })
              }
            />
          </section>
          <section className={styles.panel}>
            <TemplateTagEditor
              title="قالب ثبت فرم دستیار"
              value={config.assistantFormTemplate}
              onChange={(assistantFormTemplate) =>
                setConfig({ ...config, assistantFormTemplate })
              }
            />
          </section>
        </div>
      ) : null}

      <footer className={styles.footer}>
        <div className={dirty ? styles.dirty : styles.ok}>
          {dirty ? 'تغییرات ذخیره نشده است' : 'همه تغییرات ذخیره شده است'}
        </div>
        <div className={styles.footerActions}>
          {confirmReset ? (
            <>
              <span className={styles.muted}>
                همه تنظیمات سرور به حالت اولیه برگردد؟
              </span>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={busy}
                onClick={() => void reset()}
              >
                {Ico.check}
                بله، بازنشانی
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setConfirmReset(false)}
              >
                انصراف
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setConfirmReset(true)}
              >
                بازنشانی به پیش‌فرض
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={!dirty || busy}
                onClick={() => void persist()}
              >
                {Ico.check}
                ذخیره روی سرور
              </button>
            </>
          )}
        </div>
      </footer>

      <DidbanToast message={toast} />
    </div>
  )
}

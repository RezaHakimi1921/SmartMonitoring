import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Snackbar,
  Stack,
  TabDesktop,
  TextField,
  Typography,
} from '@smartx/design-system'
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

const TABS = [
  { value: 'features', label: 'بخش‌های گزارش' },
  { value: 'diag', label: 'نکات پیگیری' },
  { value: 'metrics', label: 'کیفی شاخص‌ها' },
  { value: 'templates', label: 'قالب پیام' },
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
  const [tab, setTab] = useState<'features' | 'diag' | 'metrics' | 'templates'>(
    initialTab,
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

  if (!config) {
    return (
      <Card elevation={1} sx={{ p: 2 }} aria-busy>
        <Typography variant="bodyMedium" color="text.secondary">
          در حال بارگذاری تنظیمات سرور…
        </Typography>
        {error ? (
          <Typography variant="bodySmall" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        ) : null}
      </Card>
    )
  }

  return (
    <Stack spacing={3} sx={{ pb: 10 }}>
      <Box>
        <Typography variant="headlineSmall" display="block">
          تنظیمات انواع بررسی
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          پیش‌فرض بخش‌ها، نکات پیگیری، آستانه‌ها و قالب پیام روی سرور ذخیره
          می‌شود و برای همه کاربران اعمال می‌گردد.
        </Typography>
      </Box>

      {error ? (
        <Typography variant="bodyMedium" color="error">
          {error}
        </Typography>
      ) : null}

      <TabDesktop
        items={TABS}
        value={tab}
        onChange={(v) => {
          const next = v as 'features' | 'diag' | 'metrics' | 'templates'
          setTab(next)
          const url = new URL(window.location.href)
          url.searchParams.set('tab', next)
          window.history.replaceState(null, '', url.pathname + url.search)
        }}
      />

      {(tab === 'features' || tab === 'diag') && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 300px) 1fr' },
            alignItems: 'start',
          }}
        >
          <Card elevation={1} title="انواع بررسی" sx={{ p: 1 }}>
            <Stack spacing={1}>
              {types.map((t: ReviewType) => {
                const selected = t.id === activeTypeId
                return (
                  <Box
                    key={t.id}
                    component="button"
                    type="button"
                    onClick={() => setActiveTypeId(t.id)}
                    sx={{
                      textAlign: 'right',
                      cursor: 'pointer',
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected
                        ? 'primary.primaryContainer'
                        : 'background.paper',
                      font: 'inherit',
                      color: 'inherit',
                      display: 'block',
                      width: '100%',
                    }}
                  >
                    <Typography variant="titleSmall" display="block">
                      {t.title || 'بدون عنوان'}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      {t.description || 'بدون توضیح'}
                    </Typography>
                  </Box>
                )
              })}
            </Stack>
            {!canEditReviewTypes ? (
              <Typography
                variant="bodySmall"
                color="text.secondary"
                display="block"
                sx={{ mt: 1.5 }}
              >
                ویرایش نام و توضیح فقط برای سوپرادمین است.
              </Typography>
            ) : null}
          </Card>

          <Stack spacing={2}>
            {active && canEditReviewTypes ? (
              <Card elevation={1} title="نام و توضیح این نوع بررسی" sx={{ p: 1 }}>
                <Stack spacing={2}>
                  <TextField
                    label="عنوان بررسی"
                    value={active.title}
                    onChange={(e) =>
                      updateReviewType(active.id, { title: e.target.value })
                    }
                    fullWidth
                    required
                    helperText="در صفحهٔ اول و گزارش‌ها نمایش داده می‌شود"
                  />
                  <TextField
                    label="توضیح / زیرعنوان"
                    value={active.description}
                    onChange={(e) =>
                      updateReviewType(active.id, {
                        description: e.target.value,
                      })
                    }
                    fullWidth
                    multiline
                    minRows={2}
                    helperText="متن کوتاه زیر عنوان در کارت نوع بررسی"
                  />
                </Stack>
              </Card>
            ) : null}

          <Card
            elevation={1}
            title={
              tab === 'features'
                ? `اتصال ویژگی‌ها${active ? ` · ${active.title}` : ''}`
                : `پیش‌فرض نکات پیگیری${active ? ` · ${active.title}` : ''}`
            }
            sx={{ p: 1 }}
          >
            {!active ? (
              <Typography variant="bodyMedium" color="text.secondary">
                یک نوع را انتخاب کنید.
              </Typography>
            ) : tab === 'features' ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    '& th, & td': {
                      textAlign: 'right',
                      py: 1.5,
                      px: 1.25,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      verticalAlign: 'top',
                    },
                    '& th': {
                      typography: 'labelMedium',
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
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
                            <Typography variant="titleSmall" display="block">
                              {f.title}
                            </Typography>
                            <Typography
                              variant="bodySmall"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {f.description}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant="bodySmall" display="block">
                              {SOURCE_LABEL[f.source]}
                            </Typography>
                          </td>
                          <td>
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              useFlexGap
                              gap={0.75}
                              role="radiogroup"
                              aria-label={`حالت ${f.title}`}
                            >
                              {MODES.map((m) => {
                                const on = (current || 'off') === m.id
                                return (
                                  <Chip
                                    key={m.id}
                                    label={m.label}
                                    size="small"
                                    clickable
                                    title={m.hint}
                                    color={on ? 'primary' : 'default'}
                                    variant={on ? 'filled' : 'outlined'}
                                    onClick={() => setMode(f.id, m.id)}
                                    aria-checked={on}
                                    role="radio"
                                  />
                                )
                              })}
                            </Stack>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Box>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                {DIAG_CATEGORIES.map((cat) => {
                  const items = DIAG_ITEMS.filter((d) => d.category === cat.id)
                  return (
                    <Box key={cat.id}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        flexWrap="wrap"
                        gap={1}
                        sx={{ mb: 1 }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="titleMedium"
                            component="div"
                            sx={{ display: 'block' }}
                          >
                            {cat.title}
                          </Typography>
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            component="div"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {cat.description}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            buttonVariant="text"
                            buttonSize="small"
                            onClick={() => setDiagCategory(cat.id, true)}
                          >
                            انتخاب همه
                          </Button>
                          <Button
                            buttonVariant="text"
                            buttonSize="small"
                            onClick={() => setDiagCategory(cat.id, false)}
                          >
                            لغو
                          </Button>
                        </Stack>
                      </Stack>
                      <Stack spacing={1}>
                        {items.map((d) => {
                          const on = diagSelected.has(d.id)
                          return (
                            <Box
                              key={d.id}
                              component="label"
                              sx={{
                                display: 'flex',
                                gap: 1.25,
                                alignItems: 'flex-start',
                                p: 1.25,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: on ? 'primary.main' : 'divider',
                                bgcolor: on
                                  ? 'primary.primaryContainer'
                                  : 'transparent',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => toggleDiagDefault(d.id)}
                                style={{ marginTop: 4, flexShrink: 0 }}
                              />
                              <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="titleSmall"
                                  component="div"
                                  sx={{ display: 'block' }}
                                >
                                  {d.title}
                                </Typography>
                                <Typography
                                  variant="bodySmall"
                                  color="text.secondary"
                                  component="div"
                                  sx={{ display: 'block' }}
                                >
                                  {d.hint}
                                </Typography>
                              </Stack>
                            </Box>
                          )
                        })}
                      </Stack>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Card>
          </Stack>
        </Box>
      )}

      {tab === 'metrics' ? (
        <MetricQualityPanel
          rules={config.metricRules}
          canEdit={canEditMetrics}
          onUpdate={updateRule}
          onSetKind={setRuleKind}
        />
      ) : null}

      {tab === 'templates' ? (
        <Stack spacing={2}>
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
        </Stack>
      ) : null}

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          mt: 2,
          mx: -1,
          px: 2,
          py: 1.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          variant="bodySmall"
          color={dirty ? 'warning.main' : 'text.secondary'}
        >
          {dirty ? 'تغییرات ذخیره نشده است' : 'همه تغییرات ذخیره شده است'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          {confirmReset ? (
            <>
              <Typography variant="bodySmall">
                همه تنظیمات سرور به حالت اولیه برگردد؟
              </Typography>
              <Button
                buttonVariant="filled"
                disabled={busy}
                loading={busy}
                onClick={() => void reset()}
              >
                بله، بازنشانی
              </Button>
              <Button
                buttonVariant="text"
                onClick={() => setConfirmReset(false)}
              >
                انصراف
              </Button>
            </>
          ) : (
            <>
              <Button
                buttonVariant="text"
                onClick={() => setConfirmReset(true)}
              >
                بازنشانی به پیش‌فرض
              </Button>
              <Button
                buttonVariant="filled"
                disabled={!dirty || busy}
                loading={busy}
                onClick={() => void persist()}
              >
                ذخیره روی سرور
              </Button>
            </>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1400,
        }}
      >
        <Snackbar
          open={!!toast}
          message={toast}
          severity="success"
          onClose={() => setToast('')}
        />
      </Box>
    </Stack>
  )
}

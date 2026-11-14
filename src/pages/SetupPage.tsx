import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Typography,
} from '@smartx/design-system'
import { BrandSearch } from '../components/BrandSearch'
import { JalaliRangePicker } from '../components/JalaliRangePicker'
import { ReportOptions } from '../components/ReportOptions'
import {
  isRangeValid,
  PERIOD_OPTIONS,
  periodLabel,
  type PeriodKey,
} from '../data/periods'
import type { BrandBranch, FeatureId, FeatureMode } from '../data/types'
import { useAuth } from '../lib/authContext'
import { toFaDigits } from '../lib/jalali'
import {
  diagDefaultsForType,
  loadFeatures,
  loadReviewTypes,
  selectionForType,
} from '../lib/storage'

function StepHeader({
  n,
  title,
  description,
}: {
  n: string
  title: string
  description: string
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
      <Chip label={n} size="small" color="primary" />
      <Box>
        <Typography variant="titleMedium">{title}</Typography>
        <Typography variant="bodySmall" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Stack>
  )
}

export function SetupPage() {
  const { typeId = '' } = useParams()
  const navigate = useNavigate()
  const { configReady } = useAuth()
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
  const [diagSelected, setDiagSelected] = useState<number[]>([])

  useEffect(() => {
    const current = loadReviewTypes().find((t) => t.id === typeId)
    const catalog = loadFeatures()
    if (current) {
      setSelected(selectionForType(current, catalog))
      setDiagSelected(diagDefaultsForType(current))
    }
  }, [typeId, configReady])

  const enabledCount = selected.filter((s) => s.checked).length

  if (!type) {
    return (
      <Card elevation={1} title="این نوع بررسی پیدا نشد.">
        <Button component={RouterLink} to="/" buttonVariant="outlined">
          بازگشت به صفحه اول
        </Button>
      </Card>
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
    <Stack spacing={2.5}>
      <Button
        component={RouterLink}
        to="/"
        buttonVariant="text"
        buttonSize="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        → بازگشت
      </Button>

      <Box>
        <Typography variant="labelMedium" color="primary">
          نوع بررسی
        </Typography>
        <Typography variant="headlineSmall">{type.title}</Typography>
        <Typography variant="bodyMedium" color="text.secondary">
          {type.description}
        </Typography>
      </Box>

      <Card elevation={1} sx={{ p: 1, overflow: 'visible' }}>
        <StepHeader
          n="۱"
          title="مجموعه را پیدا کنید"
          description="نام مجموعه یا شماره قفل را بنویسید و از لیست انتخاب کنید."
        />
        <BrandSearch value={brand} onChange={setBrand} />
      </Card>

      <Card elevation={1} sx={{ p: 1, overflow: 'visible' }}>
        <StepHeader
          n="۲"
          title="بازه زمانی گزارش"
          description="گزارش از چه تاریخی تا امروز بررسی شود؟ (تاریخ‌ها شمسی هستند)"
        />
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {PERIOD_OPTIONS.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              clickable
              color={period === p.id ? 'primary' : 'default'}
              variant={period === p.id ? 'filled' : 'outlined'}
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
            />
          ))}
        </Stack>
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
        <Typography variant="bodySmall" color="text.secondary" sx={{ mt: 1.5 }}>
          بازه انتخاب‌شده:{' '}
          <Box component="bdi" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {periodLabel(period, fromDate, toDate)}
          </Box>
        </Typography>
      </Card>

      <Card elevation={1} sx={{ p: 1 }}>
        <StepHeader
          n="۳"
          title="محتوای گزارش"
          description="برای این نوع بررسی، بخش‌های لازم از قبل انتخاب شده‌اند؛ معمولاً نیازی به تغییر نیست."
        />
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
          sx={{ mb: showCustomize ? 2 : 0 }}
        >
          <Typography variant="bodyMedium">
            گزارش شامل{' '}
            <strong>{toFaDigits(enabledCount)} بخش</strong> و{' '}
            <strong>{toFaDigits(diagSelected.length)} نکته پیگیری</strong> است.
          </Typography>
          <Button
            buttonVariant="outlined"
            buttonSize="small"
            aria-expanded={showCustomize}
            onClick={() => setShowCustomize((v) => !v)}
          >
            {showCustomize ? 'بستن' : 'تغییر بخش‌ها (اختیاری)'}
          </Button>
        </Stack>

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
            onReset={() => {
              setSelected(selectionForType(type, loadFeatures()))
              setDiagSelected(diagDefaultsForType(type))
            }}
          />
        ) : null}
      </Card>

      <Stack spacing={1} alignItems="flex-start">
        <Button
          buttonVariant="filled"
          buttonSize="standard"
          disabled={!canStart}
          onClick={start}
        >
          ساخت گزارش
        </Button>
        {blockReason ? (
          <Typography variant="bodySmall" color="error">
            {blockReason}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  )
}

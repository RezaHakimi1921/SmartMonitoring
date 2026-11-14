import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Select,
  Stack,
  Switch,
  Typography,
} from '@smartx/design-system'
import {
  fetchReports,
  type ReportAuthor,
  type ReportStageKey,
  type ServerReport,
} from '../lib/configApi'
import { useAuth } from '../lib/authContext'
import { loadReviewTypes } from '../lib/storage'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'

function faWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const time = toFaDigits(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  )
  return `${formatJalaliLong(gregorianToJalali(d))} · ${time}`
}

const STAGE_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'همه مراحل' },
  { id: 'summary', label: 'خلاصه' },
  { id: 'section', label: 'بررسی بخش‌ها' },
  { id: 'diag', label: 'نکات پیگیری' },
  { id: 'send', label: 'آماده ارسال' },
  { id: 'sent', label: 'ارسال‌شده' },
]

function stageChipColor(
  r: ServerReport,
): 'default' | 'primary' | 'success' | 'warning' | 'info' {
  if (r.status === 'sent' || r.stageKey === 'sent') return 'success'
  if (r.stageKey === 'send') return 'primary'
  if (r.stageKey === 'diag') return 'warning'
  if (r.stageKey === 'section') return 'info'
  return 'default'
}

function stageText(r: ServerReport) {
  if (r.status === 'sent' || r.stageKey === 'sent') return 'ارسال‌شده'
  if (r.stageLabel) return r.stageLabel
  return 'در حال بررسی'
}

function progressText(r: ServerReport) {
  if (!r.stepTotal) return '—'
  return `${toFaDigits(Math.min(r.stepIndex + 1, r.stepTotal))} از ${toFaDigits(r.stepTotal)}`
}

function openHref(r: ServerReport) {
  const base = `/report/${r.typeId}/${r.branchId}`
  return r.query ? `${base}?${r.query}` : base
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Box sx={{ minWidth: 160, flex: '1 1 160px' }}>
      <Typography
        variant="labelMedium"
        color="text.secondary"
        sx={{ mb: 0.75, display: 'block' }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  )
}

export function ReportsDashboardPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ServerReport[]>([])
  const [authors, setAuthors] = useState<ReportAuthor[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('all')
  const [typeId, setTypeId] = useState('all')
  const [stageKey, setStageKey] = useState('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const types = useMemo(() => loadReviewTypes(), [])

  const effectiveUserId =
    mineOnly && user ? user.id : userId === 'all' ? '' : userId

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchReports({
        userId: effectiveUserId || undefined,
        typeId: typeId === 'all' ? undefined : typeId,
        stageKey:
          stageKey === 'all' ? undefined : (stageKey as ReportStageKey),
      })
      setReports(data.reports)
      setAuthors(data.authors)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId, typeId, stageKey])

  const counts = useMemo(() => {
    const all = reports
    return {
      total: all.length,
      sent: all.filter((r) => r.status === 'sent' || r.stageKey === 'sent')
        .length,
      inProgress: all.filter(
        (r) => r.status !== 'sent' && r.stageKey !== 'sent',
      ).length,
    }
  }, [reports])

  const authorOptions = useMemo(
    () => [
      { id: 'all', label: 'همه کاربران' },
      ...authors.map((u) => ({
        id: u.userId,
        label: u.username
          ? `${u.displayName} (${u.username})`
          : u.displayName,
      })),
    ],
    [authors],
  )

  const typeOptions = useMemo(
    () => [
      { id: 'all', label: 'همه' },
      ...types.map((t) => ({ id: t.id, label: t.title })),
    ],
    [types],
  )

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="headlineSmall">صندوق گزارش‌ها</Typography>
        <Typography variant="bodyMedium" color="text.secondary">
          همه گزارش‌های ثبت‌شده تیم را ببینید، بر اساس کاربر و مرحله فیلتر کنید و
          وضعیت هر کدام را پیگیری کنید.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {(
          [
            ['کل در فیلتر', counts.total],
            ['در حال انجام', counts.inProgress],
            ['ارسال‌شده', counts.sent],
          ] as const
        ).map(([label, value]) => (
          <Card key={label} elevation={1} sx={{ p: 2 }}>
            <Typography variant="labelMedium" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="headlineSmall">
              {toFaDigits(value)}
            </Typography>
          </Card>
        ))}
      </Box>

      <Card elevation={1} sx={{ p: 2 }}>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={2}
          alignItems="flex-end"
        >
          <FilterField label="کاربر">
            <Select
              value={mineOnly ? 'all' : userId}
              options={authorOptions}
              open={userOpen}
              onOpenChange={setUserOpen}
              disabled={mineOnly}
              onChange={setUserId}
              placeholder="همه کاربران"
            />
          </FilterField>
          <FilterField label="مرحله">
            <Select
              value={stageKey}
              options={STAGE_FILTERS}
              open={stageOpen}
              onOpenChange={setStageOpen}
              onChange={setStageKey}
              placeholder="همه مراحل"
            />
          </FilterField>
          <FilterField label="نوع بررسی">
            <Select
              value={typeId}
              options={typeOptions}
              open={typeOpen}
              onOpenChange={setTypeOpen}
              onChange={setTypeId}
              placeholder="همه"
            />
          </FilterField>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ pb: 0.5 }}
          >
            <Switch
              checked={mineOnly}
              onChange={(_, checked) => {
                setMineOnly(checked)
                if (checked) setUserId('all')
              }}
              inputProps={{ 'aria-label': 'فقط گزارش‌های من' }}
            />
            <Typography variant="bodyMedium">فقط گزارش‌های من</Typography>
          </Stack>
        </Stack>
      </Card>

      {error ? (
        <Typography variant="bodyMedium" color="error">
          {error}
        </Typography>
      ) : null}

      <Card elevation={1} sx={{ p: 1 }}>
        {loading ? (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            aria-busy
            sx={{ p: 2 }}
          >
            در حال بارگذاری صندوق…
          </Typography>
        ) : reports.length === 0 ? (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={{ p: 2 }}
          >
            گزارشی با این فیلتر پیدا نشد.
          </Typography>
        ) : (
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
                  overflow: 'hidden',
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
                  <th style={{ width: '16%' }}>کاربر</th>
                  <th style={{ width: '28%' }}>نوع / مجموعه</th>
                  <th style={{ width: '16%' }}>مرحله</th>
                  <th style={{ width: '10%' }}>پیشرفت</th>
                  <th style={{ width: '18%' }}>آخرین فعالیت</th>
                  <th style={{ width: '12%' }}></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const editedByOther =
                    !!r.lastActorUserId &&
                    r.lastActorUserId !== r.userId &&
                    !!r.lastActorDisplayName
                  return (
                  <tr key={r.id}>
                    <td>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="titleSmall"
                          component="div"
                          sx={{ display: 'block' }}
                        >
                          {r.displayName}
                        </Typography>
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          component="div"
                          dir="ltr"
                          sx={{ display: 'block', textAlign: 'right' }}
                        >
                          {r.username}
                        </Typography>
                        {editedByOther ? (
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            component="div"
                            sx={{ display: 'block' }}
                          >
                            آخرین ویرایش: {r.lastActorDisplayName}
                          </Typography>
                        ) : null}
                      </Stack>
                    </td>
                    <td>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="titleSmall"
                          component="div"
                          sx={{ display: 'block', wordBreak: 'break-word' }}
                        >
                          {r.typeTitle}
                        </Typography>
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          component="div"
                          sx={{ display: 'block', wordBreak: 'break-word' }}
                        >
                          {r.brandName}
                          {r.branchName && r.branchName !== r.brandName
                            ? ` — ${r.branchName}`
                            : ''}
                        </Typography>
                      </Stack>
                    </td>
                    <td>
                      <Chip
                        label={stageText(r)}
                        size="small"
                        color={stageChipColor(r)}
                      />
                    </td>
                    <td>
                      <Typography
                        variant="bodySmall"
                        component="div"
                        sx={{ display: 'block' }}
                      >
                        {progressText(r)}
                      </Typography>
                    </td>
                    <td>
                      <Typography
                        variant="bodySmall"
                        component="div"
                        sx={{ display: 'block' }}
                      >
                        {faWhen(r.updatedAt)}
                      </Typography>
                    </td>
                    <td>
                      <Button
                        component={RouterLink}
                        to={openHref(r)}
                        buttonVariant="text"
                        buttonSize="small"
                      >
                        باز کردن
                      </Button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </Box>
          </Box>
        )}
      </Card>
    </Stack>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useAuth } from '../lib/authContext'
import {
  fetchFeedback,
  feedbackKey,
  kindLabelFa,
  statusLabelFa,
  type FeedbackItem,
  type FeedbackKind,
  type FeedbackStatus,
} from '../lib/feedbackApi'
import { faWhen, kindColor, statusColor, truncateText } from '../lib/feedbackUi'

export function FeedbackPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterKind, setFilterKind] = useState('all')
  const [filterStatus, setFilterStatus] = useState('open')
  const [mineOnly, setMineOnly] = useState(false)
  const [kindOpen, setKindOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const kindOptions = useMemo(
    () => [
      { id: 'bug', label: 'باگ' },
      { id: 'improvement', label: 'بهبود' },
      { id: 'change', label: 'تغییر' },
    ],
    [],
  )

  const statusOptions = useMemo(
    () => [
      { id: 'all', label: 'همه وضعیت‌ها' },
      { id: 'open', label: 'باز' },
      { id: 'in_progress', label: 'در حال بررسی' },
      { id: 'done', label: 'انجام شد' },
      { id: 'wontfix', label: 'انصراف' },
    ],
    [],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await fetchFeedback({
        kind: filterKind === 'all' ? undefined : (filterKind as FeedbackKind),
        status:
          filterStatus === 'all'
            ? undefined
            : (filterStatus as FeedbackStatus),
        mine: mineOnly,
      })
      setItems(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }, [filterKind, filterStatus, mineOnly])

  useEffect(() => {
    void reload()
  }, [reload])

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="headlineSmall" display="block">
            صندوق پیشنهادات
          </Typography>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            همه موارد تیم — روی هر مورد بزنید تا جزئیات، عکس و کامنت را ببینید.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/feedback/new"
          buttonVariant="filled"
        >
          ثبت مورد جدید
        </Button>
      </Stack>

      <Card elevation={1} sx={{ p: 2 }}>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={2}
          alignItems="flex-end"
          sx={{ mb: 2 }}
        >
          <Box sx={{ minWidth: 140, flex: '1 1 140px' }}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
              display="block"
              sx={{ mb: 0.75 }}
            >
              نوع
            </Typography>
            <Select
              value={filterKind}
              options={[{ id: 'all', label: 'همه انواع' }, ...kindOptions]}
              open={kindOpen}
              onOpenChange={setKindOpen}
              onChange={setFilterKind}
            />
          </Box>
          <Box sx={{ minWidth: 140, flex: '1 1 140px' }}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
              display="block"
              sx={{ mb: 0.75 }}
            >
              وضعیت
            </Typography>
            <Select
              value={filterStatus}
              options={statusOptions}
              open={statusOpen}
              onOpenChange={setStatusOpen}
              onChange={setFilterStatus}
            />
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ pb: 0.5 }}>
            <Switch
              checked={mineOnly}
              onChange={(_, c) => setMineOnly(c)}
              inputProps={{ 'aria-label': 'فقط موارد من' }}
            />
            <Typography variant="bodyMedium">
              فقط موارد من{user?.displayName ? ` (${user.displayName})` : ''}
            </Typography>
          </Stack>
        </Stack>

        {error ? (
          <Typography variant="bodySmall" color="error" display="block" sx={{ mb: 1 }}>
            {error}
          </Typography>
        ) : null}

        {loading ? (
          <Typography variant="bodyMedium" color="text.secondary" aria-busy>
            در حال بارگذاری…
          </Typography>
        ) : items.length === 0 ? (
          <Typography variant="bodyMedium" color="text.secondary">
            موردی با این فیلتر نیست.
          </Typography>
        ) : (
          <Stack spacing={0}>
            {items.map((it) => (
              <Box
                key={it.id}
                component={RouterLink}
                to={`/feedback/${it.id}`}
                sx={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit',
                  px: 1.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  gap={1}
                  flexWrap="wrap"
                >
                  <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center">
                      <Typography
                        variant="labelMedium"
                        color="primary"
                        display="inline"
                      >
                        {feedbackKey(it.id)}
                      </Typography>
                      <Chip
                        size="small"
                        label={kindLabelFa(it.kind)}
                        color={kindColor(it.kind)}
                      />
                      <Chip
                        size="small"
                        label={statusLabelFa(it.status)}
                        color={statusColor(it.status)}
                      />
                    </Stack>
                    <Typography variant="titleMedium" display="block">
                      {it.title}
                    </Typography>
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                      display="block"
                    >
                      {truncateText(it.body, 160)}
                    </Typography>
                    <Typography variant="bodySmall" color="text.secondary" display="block">
                      {it.displayName}
                      {it.comments?.length
                        ? ` · ${it.comments.length} کامنت`
                        : ''}
                      {it.images?.length
                        ? ` · ${it.images.length} عکس`
                        : ''}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="bodySmall"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {faWhen(it.updatedAt)}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  )
}

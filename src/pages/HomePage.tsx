import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Typography,
} from '@smartx/design-system'
import type { ReviewType } from '../data/types'
import { useAuth } from '../lib/authContext'
import { loadHistory } from '../lib/history'
import { loadReviewTypes } from '../lib/storage'

const STEPS = [
  { n: '۱', title: 'نوع بررسی', text: 'یکی از کارت‌های زیر را بزنید' },
  { n: '۲', title: 'مجموعه و بازه', text: 'مجموعه را جستجو و بازه را انتخاب کنید' },
  { n: '۳', title: 'گزارش آماده', text: 'PDF را دانلود و برای مشتری بفرستید' },
]

export function HomePage() {
  const { configReady } = useAuth()
  const [types, setTypes] = useState<ReviewType[]>(() => loadReviewTypes())
  useEffect(() => {
    setTypes(loadReviewTypes())
  }, [configReady])
  const history = loadHistory()
  const last = history[0]
  const isNewUser = history.length === 0

  const steps = (
    <Stack
      component="ol"
      spacing={1.5}
      sx={{ listStyle: 'none', m: 0, p: 0, mb: 3 }}
      aria-label="مراحل کار"
    >
      {STEPS.map((s) => (
        <Box
          key={s.n}
          component="li"
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'grey.50',
          }}
        >
          <Chip label={s.n} size="small" color="primary" />
          <Box>
            <Typography variant="titleSmall">{s.title}</Typography>
            <Typography variant="bodySmall" color="text.secondary">
              {s.text}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  )

  return (
    <Box>
      {last ? (
        <Card
          elevation={1}
          sx={{
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="labelMedium" color="primary">
              ادامه آخرین گزارش
            </Typography>
            <Typography variant="titleMedium">
              {last.branchName && last.branchName !== last.brandName
                ? `${last.brandName} — ${last.branchName}`
                : last.brandName}
            </Typography>
            <Typography variant="bodySmall" color="text.secondary">
              {last.typeTitle}
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to={`/report/${last.typeId}/${last.branchId}?${last.query}`}
            buttonVariant="filled"
          >
            ادامه
          </Button>
        </Card>
      ) : null}

      <Box sx={{ mb: 3 }}>
        <Typography variant="labelLarge" color="primary" gutterBottom>
          فضای کاری دیدبان
        </Typography>
        <Typography variant="headlineSmall" component="h2" gutterBottom>
          کدام بررسی را انجام می‌دهید؟
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary">
          یک نوع بررسی انتخاب کنید. بقیه مراحل را قدم‌به‌قدم راهنمایی می‌کنیم.
        </Typography>
      </Box>

      {isNewUser ? (
        steps
      ) : (
        <Box component="details" sx={{ mb: 3 }}>
          <Typography component="summary" variant="titleSmall" sx={{ cursor: 'pointer' }}>
            مراحل کار چیست؟
          </Typography>
          <Box sx={{ mt: 1.5 }}>{steps}</Box>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {types.map((type) => {
          const count = Object.values(type.features).filter(
            (m) => m === 'required' || m === 'defaultOn',
          ).length
          return (
            <Box
              key={type.id}
              component={RouterLink}
              to={`/setup/${type.id}`}
              sx={{ textDecoration: 'none', color: 'inherit', height: '100%' }}
            >
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                }}
                title={type.title}
                subtitle={type.description}
                actions={
                  <Box
                    sx={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 1,
                    }}
                  >
                    <Typography variant="bodySmall" color="text.secondary">
                      {count.toLocaleString('fa-IR')} بخش گزارش
                    </Typography>
                    <Chip label="شروع ←" size="small" color="primary" />
                  </Box>
                }
              />
            </Box>
          )
        })}
      </Box>

      <Typography variant="bodySmall" color="text.secondary" sx={{ mt: 3 }}>
        برای اولین بار است؟{' '}
        <Button component={RouterLink} to="/help" buttonVariant="text" buttonSize="small">
          راهنمای کوتاه
        </Button>
      </Typography>
    </Box>
  )
}

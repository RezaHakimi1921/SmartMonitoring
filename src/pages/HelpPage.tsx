import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Typography,
} from '@smartx/design-system'

const STEPS = [
  {
    title: 'نوع بررسی را انتخاب کنید',
    text: 'در صفحه اول، کارت بررسی مورد نظر را بزنید؛ مثلاً «بررسی سریع» یا «بررسی پس از تحویل».',
  },
  {
    title: 'مجموعه و بازه را مشخص کنید',
    text: 'نام مجموعه یا شماره قفل را بنویسید و از لیست انتخاب کنید. بعد بازه زمانی را بزنید یا با تقویم شمسی تاریخ شروع و پایان را انتخاب کنید.',
  },
  {
    title: 'گزارش را مرحله‌به‌مرحله مرور کنید',
    text: 'اول «خلاصه» را ببینید، بعد با دکمه «بعدی» بخش‌ها را یکی‌یکی مرور کنید. هر بخش یک نکته آماده برای گفتن به مشتری دارد.',
  },
  {
    title: 'برای مشتری بفرستید',
    text: 'در آخرین مرحله، فایل PDF را دانلود و متن پیام را کپی کنید، بعد هر دو را برای مشتری بفرستید.',
  },
]

const FAQ = [
  {
    q: 'بازه دلخواه را چطور انتخاب کنم؟',
    a: 'روی «بازه دلخواه» بزنید، بعد روی «از تاریخ» کلیک کنید تا تقویم باز شود. اول روز شروع و بعد روز پایان را انتخاب کنید. همه تاریخ‌ها شمسی هستند.',
  },
  {
    q: 'می‌خواهم بخشی را از گزارش حذف یا اضافه کنم.',
    a: 'در صفحه تنظیم بررسی روی «تغییر بخش‌ها» بزنید. در صفحه گزارش هم دکمه «تغییر مجموعه، بازه یا بخش‌ها» همین کار را انجام می‌دهد و گزارش همان لحظه به‌روز می‌شود.',
  },
  {
    q: 'مجموعه را اشتباه انتخاب کردم.',
    a: 'در صفحه گزارش روی «تغییر مجموعه، بازه یا بخش‌ها» بزنید و روی «تغییر» کنار نام مجموعه کلیک کنید. نیازی به شروع دوباره نیست.',
  },
  {
    q: 'گزارش قبلی را کجا پیدا کنم؟',
    a: 'از منوی «گزارش‌ها» (صندوق گزارش‌ها). هر گزارش تیم را می‌بینید و با دکمه باز کردن همان مسیر را ادامه می‌دهید.',
  },
  {
    q: 'چرا اعداد گزارش نمونه است؟',
    a: 'اتصال پنل به سیستم‌های اصلی (اینسایت، کلاب‌پلاس، ارزیابی) در مرحله بعد انجام می‌شود. تا آن موقع فقط ظاهر و مسیر کار قابل استفاده است.',
  },
]

const STEP_NUMS = ['۱', '۲', '۳', '۴']

export function HelpPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="headlineSmall">راهنمای استفاده</Typography>
        <Typography variant="bodyMedium" color="text.secondary">
          ساخت گزارش برای مشتری فقط چهار قدم است.
        </Typography>
      </Box>

      <Stack
        component="ol"
        spacing={2}
        sx={{ listStyle: 'none', m: 0, p: 0 }}
      >
        {STEPS.map((s, i) => (
          <Card key={s.title} elevation={1} component="li" sx={{ p: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Chip label={STEP_NUMS[i]} size="small" color="primary" />
              <Box>
                <Typography variant="titleMedium">{s.title}</Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  {s.text}
                </Typography>
              </Box>
            </Stack>
          </Card>
        ))}
      </Stack>

      <Card elevation={1} sx={{ p: 1 }} title="سؤال‌های پرتکرار">
        <Stack spacing={1}>
          {FAQ.map((f) => (
            <Box
              key={f.q}
              component="details"
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                px: 1.5,
                py: 1,
                '&[open]': { bgcolor: 'grey.50' },
              }}
            >
              <Box
                component="summary"
                sx={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  listStyle: 'none',
                  '&::-webkit-details-marker': { display: 'none' },
                }}
              >
                <Typography variant="titleSmall" component="span">
                  {f.q}
                </Typography>
              </Box>
              <Typography
                variant="bodySmall"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                {f.a}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Card>

      <Button
        component={RouterLink}
        to="/"
        buttonVariant="filled"
        sx={{ alignSelf: 'flex-start' }}
      >
        شروع بررسی
      </Button>
    </Stack>
  )
}

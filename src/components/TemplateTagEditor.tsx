import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Switch,
  Typography,
} from '@smartx/design-system'

export type TemplateTag = {
  /** مقدار درج‌شونده در قالب، مثل {{brand}} */
  token: string
  /** نمایش شبیه BrandName@ */
  tag: string
  label: string
}

export const MESSAGE_TAGS: TemplateTag[] = [
  { token: '{{brand}}', tag: 'BrandName@', label: 'نام برند' },
  { token: '{{branch}}', tag: 'BranchName@', label: 'نام شعبه' },
  { token: '{{type}}', tag: 'ReviewType@', label: 'نوع بررسی' },
  { token: '{{period}}', tag: 'Period@', label: 'بازه زمانی' },
  { token: '{{summaryLines}}', tag: 'SummaryLines@', label: 'خلاصه وضعیت‌ها' },
  { token: '{{note}}', tag: 'ExpertNote@', label: 'یادداشت کارشناس' },
  { token: '{{reportDate}}', tag: 'ReportDate@', label: 'تاریخ گزارش' },
  { token: '{{place}}', tag: 'Place@', label: 'محل / مجموعه' },
  { token: '{{branchId}}', tag: 'BranchId@', label: 'شناسه شعبه' },
]

/** نگاشت Name@ → کلید fillTemplate */
export const MESSAGE_TAG_VAR: Record<string, string> = Object.fromEntries(
  MESSAGE_TAGS.map((t) => [t.tag, t.token.replace(/^\{\{|\}\}$/g, '')]),
)

type Props = {
  title: string
  value: string
  onChange: (next: string) => void
  tags?: TemplateTag[]
}

export function TemplateTagEditor({
  title,
  value,
  onChange,
  tags = MESSAGE_TAGS,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? tags : tags.slice(0, 8)

  const insert = (tag: string) => {
    const el = ref.current
    if (!el) {
      onChange(`${value}${tag}`)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + tag + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + tag.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <Card elevation={1} title={title} sx={{ p: 1 }}>
      <Typography variant="bodySmall" color="text.secondary" sx={{ mb: 2 }}>
        روی <strong>+</strong> بزنید تا تگ در محل مکان‌نما درج شود.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          mb: 2,
        }}
        dir="rtl"
      >
        {visible.map((t) => (
          <Stack
            key={t.token}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="labelMedium" sx={{ flex: 1 }}>
              {t.label}
            </Typography>
            <Button
              buttonVariant="tonal"
              buttonSize="small"
              title={`درج ${t.tag}`}
              aria-label={`درج ${t.label}`}
              onClick={() => insert(t.tag)}
              sx={{ minWidth: 36, px: 1 }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </Button>
            <Chip label={t.tag} size="small" variant="outlined" />
          </Stack>
        ))}
      </Box>

      {tags.length > 8 ? (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Switch
            checked={showAll}
            onChange={(_, checked) => setShowAll(checked)}
            inputProps={{ 'aria-label': 'مشاهده سایر پارامترها' }}
          />
          <Typography variant="bodyMedium">مشاهده سایر پارامترها</Typography>
        </Stack>
      ) : null}

      <Box
        component="textarea"
        ref={ref}
        rows={10}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          p: 1.5,
          font: 'inherit',
          resize: 'vertical',
          bgcolor: 'background.paper',
          '&:focus': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 1,
          },
        }}
      />
    </Card>
  )
}

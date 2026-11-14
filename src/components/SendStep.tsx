import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
} from '@smartx/design-system'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'

type Props = {
  customerMessage: string
  assistantForm: string
  note: string
  onNote: (value: string) => void
  sentAt?: string
  onToggleSent: () => void
  busy: boolean
  pdfDisabled: boolean
  onDownload: () => void
  onFlash: (text: string, ms?: number) => void
}

function sentText(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = toFaDigits(
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  )
  return `${formatJalaliLong(gregorianToJalali(d))} · ${time}`
}

async function copyText(text: string, onFlash: Props['onFlash'], ok: string) {
  try {
    await navigator.clipboard.writeText(text)
    onFlash(ok)
  } catch {
    onFlash('کپی انجام نشد؛ متن را دستی انتخاب کنید.', 3200)
  }
}

function MessageArea({
  value,
  onChange,
  rows = 10,
  id,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  id?: string
  placeholder?: string
}) {
  return (
    <Box
      component="textarea"
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
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
        mt: 1.5,
        '&:focus': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 1,
        },
      }}
    />
  )
}

/** مرحله آخر: PDF + پیام مشتری + فرم دستیار */
export function SendStep({
  customerMessage,
  assistantForm,
  note,
  onNote,
  sentAt,
  onToggleSent,
  busy,
  pdfDisabled,
  onDownload,
  onFlash,
}: Props) {
  const [editedMsg, setEditedMsg] = useState<string | null>(null)
  const [editedAssist, setEditedAssist] = useState<string | null>(null)

  useEffect(() => {
    setEditedMsg(null)
  }, [customerMessage])

  useEffect(() => {
    setEditedAssist(null)
  }, [assistantForm])

  const msg = editedMsg ?? customerMessage
  const assist = editedAssist ?? assistantForm

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="titleLarge">آماده ارسال و ثبت</Typography>
        <Typography variant="bodyMedium" color="text.secondary">
          PDF را دانلود کنید، متن پیام مشتری را بفرستید، و در صورت نیاز فرم دستیار
          را کپی کنید.
        </Typography>
      </Box>

      <Button
        buttonVariant="filled"
        buttonSize="standard"
        disabled={busy || pdfDisabled}
        loading={busy}
        onClick={onDownload}
        sx={{ alignSelf: 'flex-start' }}
      >
        دانلود PDF گزارش
      </Button>

      <Box>
        <Typography
          variant="labelMedium"
          component="label"
          htmlFor="op-note"
          sx={{ display: 'block', mb: 0.75 }}
        >
          یادداشت کارشناس (اختیاری؛ در هر دو قالب می‌آید)
        </Typography>
        <MessageArea
          id="op-note"
          rows={2}
          placeholder="مثلاً: هفته بعد درباره قطع اتصال پیگیری می‌کنیم"
          value={note}
          onChange={onNote}
        />
      </Box>

      <Card elevation={1} sx={{ p: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="titleMedium">
            ۱) فرمت ارسال پیام به مشتری
          </Typography>
          <Stack direction="row" spacing={0.5}>
            {editedMsg !== null ? (
              <Button
                buttonVariant="text"
                buttonSize="small"
                onClick={() => setEditedMsg(null)}
              >
                بازگرداندن خودکار
              </Button>
            ) : null}
            <Button
              buttonVariant="outlined"
              buttonSize="small"
              onClick={() => void copyText(msg, onFlash, 'متن پیام مشتری کپی شد')}
            >
              کپی پیام مشتری
            </Button>
          </Stack>
        </Stack>
        <MessageArea value={msg} onChange={setEditedMsg} />
      </Card>

      <Card elevation={1} sx={{ p: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="titleMedium">
            ۲) فرمت اطلاعات برای ثبت فرم دستیار
          </Typography>
          <Stack direction="row" spacing={0.5}>
            {editedAssist !== null ? (
              <Button
                buttonVariant="text"
                buttonSize="small"
                onClick={() => setEditedAssist(null)}
              >
                بازگرداندن خودکار
              </Button>
            ) : null}
            <Button
              buttonVariant="outlined"
              buttonSize="small"
              onClick={() =>
                void copyText(assist, onFlash, 'متن فرم دستیار کپی شد')
              }
            >
              کپی فرم دستیار
            </Button>
          </Stack>
        </Stack>
        <MessageArea value={assist} onChange={setEditedAssist} />
      </Card>

      <Card elevation={1} sx={{ p: 2 }}>
        {sentAt ? (
          <Typography variant="bodyMedium" sx={{ mb: 1.5 }}>
            ارسال‌شده برای مشتری · {sentText(sentAt)}
          </Typography>
        ) : (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={{ mb: 1.5 }}
          >
            هنوز به‌عنوان ارسال‌شده ثبت نشده است.
          </Typography>
        )}
        <Button
          buttonVariant={sentAt ? 'text' : 'filled'}
          onClick={onToggleSent}
        >
          {sentAt ? 'لغو ثبت ارسال' : 'ثبت به‌عنوان ارسال‌شده'}
        </Button>
      </Card>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button component={RouterLink} to="/" buttonVariant="text">
          شروع بررسی جدید
        </Button>
        <Button component={RouterLink} to="/reports" buttonVariant="text">
          صندوق گزارش‌ها
        </Button>
      </Stack>
    </Stack>
  )
}

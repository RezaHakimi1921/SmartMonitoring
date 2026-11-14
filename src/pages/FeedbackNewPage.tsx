import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ClipboardEvent,
  type FormEvent,
} from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@smartx/design-system'
import { BrandSearch } from '../components/BrandSearch'
import type { BrandBranch } from '../data/types'
import {
  compressImageFile,
  createFeedbackItem,
  fetchFeedbackMeta,
  metricOptionLabel,
  type FeedbackKind,
  type FeedbackMetric,
} from '../lib/feedbackApi'
import { toFaDigits } from '../lib/jalali'

const MAX_IMAGES = 8

export function FeedbackNewPage() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<FeedbackMetric[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [formKindOpen, setFormKindOpen] = useState(false)
  const [formMetricOpen, setFormMetricOpen] = useState(false)

  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [metricId, setMetricId] = useState('general')
  const [section, setSection] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [brand, setBrand] = useState<BrandBranch | null>(null)
  const [needBrand, setNeedBrand] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const kindOptions = useMemo(
    () => [
      { id: 'bug', label: 'باگ' },
      { id: 'improvement', label: 'بهبود' },
      { id: 'change', label: 'تغییر' },
    ],
    [],
  )

  const formMetricOptions = useMemo(
    () => metrics.map((m) => ({ id: m.id, label: metricOptionLabel(m) })),
    [metrics],
  )

  useEffect(() => {
    void (async () => {
      try {
        const meta = await fetchFeedbackMeta()
        setMetrics(meta.metrics)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا')
      }
    })()
  }, [])

  const addImageFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'))
      if (!imageFiles.length) return false
      setImageBusy(true)
      setError('')
      try {
        const next = [...images]
        for (const file of imageFiles) {
          if (next.length >= MAX_IMAGES) break
          next.push(await compressImageFile(file))
        }
        setImages(next.slice(0, MAX_IMAGES))
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'آپلود عکس ناموفق')
        return false
      } finally {
        setImageBusy(false)
      }
    },
    [images],
  )

  const onPasteImages = useCallback(
    async (e: ClipboardEvent) => {
      if (images.length >= MAX_IMAGES) return
      const items = e.clipboardData?.items
      if (!items?.length) return
      const files: File[] = []
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue
        const file = item.getAsFile()
        if (file) files.push(file)
      }
      if (!files.length) return
      e.preventDefault()
      await addImageFiles(files)
    },
    [addImageFiles, images.length],
  )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const selected = metrics.find((m) => m.id === metricId)
      const item = await createFeedbackItem({
        kind,
        metricId,
        metricLabel: selected ? metricOptionLabel(selected) : undefined,
        section: section.trim() || undefined,
        title: title.trim(),
        body: body.trim(),
        images: images.length ? images : undefined,
        brand:
          needBrand && brand
            ? {
                branchId: Number(brand.branchId),
                brandName: brand.brandName,
                branchName: brand.branchName,
                lockNumber: brand.lockNumber,
              }
            : undefined,
      })
      navigate(`/feedback/${item.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت ناموفق')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Button
        component={RouterLink}
        to="/feedback"
        buttonVariant="text"
        buttonSize="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        → بازگشت به لیست
      </Button>

      <Box>
        <Typography variant="headlineSmall" display="block">
          ثبت مورد جدید
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          باگ، بهبود یا تغییر — با شاخص، عکس و در صورت نیاز مجموعه
        </Typography>
      </Box>

      <Card elevation={1} sx={{ p: 1, overflow: 'visible' }}>
        <Box component="form" onSubmit={onSubmit} onPaste={onPasteImages}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              }}
            >
              <Box>
                <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
                  نوع مورد
                </Typography>
                <Select
                  value={kind}
                  options={kindOptions}
                  open={formKindOpen}
                  onOpenChange={setFormKindOpen}
                  onChange={(id) => setKind(id as FeedbackKind)}
                />
              </Box>
              <Box>
                <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
                  شاخص (کیفی شاخص‌ها)
                </Typography>
                <Select
                  value={metricId}
                  options={formMetricOptions}
                  open={formMetricOpen}
                  onOpenChange={setFormMetricOpen}
                  onChange={setMetricId}
                  searchable
                />
              </Box>
            </Box>

            <TextField
              label="توضیح بخش / جزئیات بیشتر (اختیاری)"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              fullWidth
            />
            <TextField
              label="عنوان کوتاه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 3 }}
            />
            <TextField
              label="شرح کامل"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              fullWidth
              multiline
              minRows={5}
              inputProps={{ minLength: 5 }}
            />

            <Box
              tabIndex={0}
              onPaste={onPasteImages}
              sx={{
                outline: 'none',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
                p: 1.5,
              }}
            >
              <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
                عکس پیوست (حداکثر {MAX_IMAGES})
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                <Button
                  type="button"
                  buttonVariant="outlined"
                  buttonSize="small"
                  disabled={imageBusy || images.length >= MAX_IMAGES}
                  loading={imageBusy}
                  component="label"
                >
                  انتخاب عکس
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    hidden
                    onChange={(e) => {
                      void addImageFiles(Array.from(e.target.files || []))
                      e.target.value = ''
                    }}
                  />
                </Button>
                <Typography variant="bodySmall" color="text.secondary">
                  {images.length
                    ? `${toFaDigits(String(images.length))} عکس`
                    : 'اسکرین‌شات را با Ctrl+V پیست کنید'}
                </Typography>
              </Stack>
              {images.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                  {images.map((src, idx) => (
                    <Box
                      key={`${idx}-${src.slice(0, 24)}`}
                      sx={{
                        position: 'relative',
                        width: 96,
                        height: 96,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        component="img"
                        src={src}
                        alt={`پیوست ${idx + 1}`}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <Button
                        type="button"
                        buttonVariant="filled"
                        buttonSize="small"
                        onClick={() =>
                          setImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                        sx={{ position: 'absolute', top: 4, left: 4, minWidth: 0, px: 1 }}
                      >
                        حذف
                      </Button>
                    </Box>
                  ))}
                </Stack>
              ) : null}
            </Box>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={needBrand}
                onChange={(_, c) => {
                  setNeedBrand(c)
                  if (!c) setBrand(null)
                }}
                inputProps={{ 'aria-label': 'مربوط به یک مجموعه' }}
              />
              <Typography variant="bodyMedium">
                مربوط به یک مجموعه خاص است
              </Typography>
            </Stack>
            {needBrand ? <BrandSearch value={brand} onChange={setBrand} /> : null}

            {error ? (
              <Typography variant="bodySmall" color="error" display="block">
                {error}
              </Typography>
            ) : null}

            <Button
              type="submit"
              buttonVariant="filled"
              disabled={busy || (needBrand && !brand)}
              loading={busy}
              sx={{ alignSelf: 'flex-start' }}
            >
              ثبت و باز کردن مورد
            </Button>
          </Stack>
        </Box>
      </Card>
    </Stack>
  )
}

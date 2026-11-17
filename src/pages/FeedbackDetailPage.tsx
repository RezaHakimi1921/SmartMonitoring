import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ClipboardEvent,
  type FormEvent,
} from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Select,
  Stack,
  TextField,
  Typography,
} from '@smartx/design-system'
import { BrandSearch } from '../components/BrandSearch'
import { DidbanToast } from '../components/DidbanToast'
import { FeedbackImageModal } from '../components/FeedbackImageModal'
import type { BrandBranch } from '../data/types'
import {
  compressImageFile,
  feedbackImageUrl,
  feedbackKey,
  fetchFeedbackItem,
  fetchFeedbackMeta,
  kindLabelFa,
  metricOptionLabel,
  patchFeedbackStatus,
  postFeedbackComment,
  statusLabelFa,
  updateFeedbackItem,
  type FeedbackItem,
  type FeedbackKind,
  type FeedbackMetric,
  type FeedbackStatus,
} from '../lib/feedbackApi'
import { isStaff, useAuth } from '../lib/authContext'
import { faWhen, kindColor, statusColor } from '../lib/feedbackUi'
import { toFaDigits } from '../lib/jalali'

const MAX_IMAGES = 8

export function FeedbackDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState<FeedbackItem | null>(null)
  const [metrics, setMetrics] = useState<FeedbackMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [comment, setComment] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [adminOnlyComment, setAdminOnlyComment] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const staff = isStaff(user?.role)

  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [metricId, setMetricId] = useState('general')
  const [section, setSection] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<FeedbackStatus>('open')
  const [brand, setBrand] = useState<BrandBranch | null>(null)
  const [needBrand, setNeedBrand] = useState(false)
  const [newImages, setNewImages] = useState<string[]>([])
  const [imageBusy, setImageBusy] = useState(false)

  const [kindOpen, setKindOpen] = useState(false)
  const [metricOpen, setMetricOpen] = useState(false)
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
      { id: 'open', label: 'باز' },
      { id: 'in_progress', label: 'در حال بررسی' },
      { id: 'done', label: 'انجام شد' },
      { id: 'wontfix', label: 'انصراف' },
    ],
    [],
  )
  const metricOptions = useMemo(
    () => metrics.map((m) => ({ id: m.id, label: metricOptionLabel(m) })),
    [metrics],
  )

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  const applyItem = (next: FeedbackItem) => {
    setItem(next)
    setKind(next.kind)
    setMetricId(next.metricId)
    setSection(next.section || '')
    setTitle(next.title)
    setBody(next.body)
    setStatus(next.status)
    if (next.brand?.branchId) {
      setNeedBrand(true)
      setBrand({
        brandId: 0,
        brandName: next.brand.brandName,
        branchId: next.brand.branchId,
        branchName: next.brand.branchName,
        smartwifiBranchId: '',
        lockNumber: next.brand.lockNumber || '',
        brandNumber: '',
      })
    } else {
      setNeedBrand(false)
      setBrand(null)
    }
    setNewImages([])
  }

  const reload = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [it, meta] = await Promise.all([
        fetchFeedbackItem(id),
        fetchFeedbackMeta(),
      ])
      setMetrics(meta.metrics)
      applyItem(it)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  const addImageFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'))
      if (!imageFiles.length) return
      const existing = (item?.images.length || 0) + newImages.length
      setImageBusy(true)
      try {
        const next = [...newImages]
        for (const file of imageFiles) {
          if (existing + next.length >= MAX_IMAGES) break
          next.push(await compressImageFile(file))
        }
        setNewImages(next)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'آپلود عکس ناموفق')
      } finally {
        setImageBusy(false)
      }
    },
    [item?.images.length, newImages],
  )

  const onPasteImages = useCallback(
    async (e: ClipboardEvent) => {
      if (!editing) return
      const items = e.clipboardData?.items
      if (!items?.length) return
      const files: File[] = []
      for (const it of Array.from(items)) {
        if (!it.type.startsWith('image/')) continue
        const f = it.getAsFile()
        if (f) files.push(f)
      }
      if (!files.length) return
      e.preventDefault()
      await addImageFiles(files)
    },
    [addImageFiles, editing],
  )

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    setBusy(true)
    setError('')
    try {
      const selected = metrics.find((m) => m.id === metricId)
      const next = await updateFeedbackItem(id, {
        kind,
        metricId,
        metricLabel: selected ? metricOptionLabel(selected) : undefined,
        section: section.trim(),
        title: title.trim(),
        body: body.trim(),
        status,
        images: newImages.length ? newImages : undefined,
        brand:
          needBrand && brand
            ? {
                branchId: Number(brand.branchId),
                brandName: brand.brandName,
                branchName: brand.branchName,
                lockNumber: brand.lockNumber,
              }
            : null,
      })
      applyItem(next)
      setEditing(false)
      flash('ذخیره شد')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره ناموفق')
    } finally {
      setBusy(false)
    }
  }

  const onStatus = async (s: FeedbackStatus) => {
    if (!id || !item || item.status === s) return
    try {
      const next = await patchFeedbackStatus(id, s)
      applyItem(next)
      flash('وضعیت به‌روز شد')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  const onComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!id || !comment.trim()) return
    setCommentBusy(true)
    setError('')
    try {
      const next = await postFeedbackComment(
        id,
        comment.trim(),
        staff && adminOnlyComment ? 'admin' : 'public',
      )
      applyItem(next)
      setComment('')
      setAdminOnlyComment(false)
      flash(adminOnlyComment ? 'کامنت ادمین ثبت شد' : 'کامنت ثبت شد')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setCommentBusy(false)
    }
  }

  if (loading) {
    return (
      <Typography variant="bodyMedium" color="text.secondary" aria-busy>
        در حال بارگذاری…
      </Typography>
    )
  }

  if (!item) {
    return (
      <Stack spacing={2}>
        <Typography color="error">{error || 'مورد پیدا نشد'}</Typography>
        <Button
          component={RouterLink}
          to={id ? `/feedback/${id}` : '/feedback'}
          buttonVariant="outlined"
        >
          بازگشت به صندوق
        </Button>
      </Stack>
    )
  }

  const canEdit =
    !!user && (user.role === 'superadmin' || user.id === item.userId)

  return (
    <Stack spacing={2.5} onPaste={onPasteImages}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Button
          component={RouterLink}
          to={id ? `/feedback/${id}` : '/feedback'}
          buttonVariant="text"
          buttonSize="small"
        >
          → بازگشت به صندوق
        </Button>
        {canEdit && !editing ? (
          <Button buttonVariant="outlined" buttonSize="small" onClick={() => setEditing(true)}>
            ویرایش
          </Button>
        ) : null}
        {canEdit && editing ? (
          <Button
            buttonVariant="text"
            buttonSize="small"
            onClick={() => {
              applyItem(item)
              setEditing(false)
              setError('')
            }}
          >
            انصراف از ویرایش
          </Button>
        ) : null}
      </Stack>

      <Box>
        <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="labelLarge" color="primary" display="inline">
            {feedbackKey(item.id)}
          </Typography>
          <Chip size="small" label={kindLabelFa(item.kind)} color={kindColor(item.kind)} />
          <Chip
            size="small"
            label={statusLabelFa(item.status)}
            color={statusColor(item.status)}
          />
          <Chip size="small" variant="outlined" label={item.metricLabel} />
        </Stack>
        <Typography variant="headlineSmall" display="block">
          {editing ? 'ویرایش مورد' : item.title}
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          ثبت‌کننده: {item.displayName}
          {item.username ? ` (${item.username})` : ''} · به‌روز: {faWhen(item.updatedAt)}
        </Typography>
      </Box>

      {editing ? (
        <Card elevation={1} sx={{ p: 2, overflow: 'visible' }}>
          <Box component="form" onSubmit={onSave}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                }}
              >
                <Box>
                  <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
                    نوع
                  </Typography>
                  <Select
                    value={kind}
                    options={kindOptions}
                    open={kindOpen}
                    onOpenChange={setKindOpen}
                    onChange={(v) => setKind(v as FeedbackKind)}
                  />
                </Box>
                <Box>
                  <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
                    وضعیت
                  </Typography>
                  <Select
                    value={status}
                    options={statusOptions}
                    open={statusOpen}
                    onOpenChange={setStatusOpen}
                    onChange={(v) => setStatus(v as FeedbackStatus)}
                  />
                </Box>
                <Box>
                  <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
                    شاخص
                  </Typography>
                  <Select
                    value={metricId}
                    options={metricOptions}
                    open={metricOpen}
                    onOpenChange={setMetricOpen}
                    onChange={setMetricId}
                    searchable
                  />
                </Box>
              </Box>
              <TextField
                label="عنوان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="جزئیات بخش"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                fullWidth
              />
              <TextField
                label="شرح"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                fullWidth
                multiline
                minRows={5}
              />
              <Stack direction="row" alignItems="center" spacing={1} component="label">
                <input
                  type="checkbox"
                  checked={needBrand}
                  onChange={(e) => {
                    const c = e.target.checked
                    setNeedBrand(c)
                    if (!c) setBrand(null)
                  }}
                />
                <Typography variant="bodyMedium">مربوط به مجموعه</Typography>
              </Stack>
              {needBrand ? <BrandSearch value={brand} onChange={setBrand} /> : null}

              <Box>
                <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
                  افزودن عکس
                </Typography>
                <Button
                  type="button"
                  buttonVariant="outlined"
                  buttonSize="small"
                  component="label"
                  disabled={imageBusy}
                  loading={imageBusy}
                >
                  انتخاب / پیست Ctrl+V
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      void addImageFiles(Array.from(e.target.files || []))
                      e.target.value = ''
                    }}
                  />
                </Button>
                {newImages.length ? (
                  <Typography variant="bodySmall" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {toFaDigits(String(newImages.length))} عکس جدید برای ذخیره
                  </Typography>
                ) : null}
              </Box>

              {error ? (
                <Typography variant="bodySmall" color="error" display="block">
                  {error}
                </Typography>
              ) : null}
              <Button type="submit" buttonVariant="filled" loading={busy} disabled={busy}>
                ذخیره تغییرات
              </Button>
            </Stack>
          </Box>
        </Card>
      ) : (
        <>
          <Card elevation={1} sx={{ p: 2 }}>
            {item.section ? (
              <Typography variant="bodySmall" color="text.secondary" display="block" sx={{ mb: 1 }}>
                بخش: {item.section}
              </Typography>
            ) : null}
            <Typography
              variant="bodyLarge"
              display="block"
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {item.body}
            </Typography>
            {item.brand ? (
              <Typography variant="bodySmall" color="text.secondary" display="block" sx={{ mt: 2 }}>
                مجموعه:{' '}
                {item.brand.branchName && item.brand.branchName !== item.brand.brandName
                  ? `${item.brand.brandName} — ${item.brand.branchName}`
                  : item.brand.brandName}
                {item.brand.lockNumber ? ` · قفل ${item.brand.lockNumber}` : ''}
              </Typography>
            ) : null}

            {item.images.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                {item.images.map((img) => (
                  <Box
                    key={img.id}
                    component="button"
                    type="button"
                    onClick={() => setPreviewId(img.id)}
                    sx={{
                      width: 112,
                      height: 112,
                      p: 0,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      bgcolor: 'transparent',
                    }}
                  >
                    <Box
                      component="img"
                      src={feedbackImageUrl(img.id)}
                      alt="پیوست"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Card>

          {canEdit ? (
            <Card elevation={1} sx={{ p: 2 }}>
              <Typography variant="titleMedium" display="block" sx={{ mb: 1.5 }}>
                وضعیت
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {(
                  ['open', 'in_progress', 'done', 'wontfix'] as FeedbackStatus[]
                ).map((s) => (
                  <Button
                    key={s}
                    buttonVariant={item.status === s ? 'filled' : 'outlined'}
                    buttonSize="small"
                    disabled={item.status === s}
                    onClick={() => void onStatus(s)}
                  >
                    {statusLabelFa(s)}
                  </Button>
                ))}
              </Stack>
            </Card>
          ) : (
            <Typography variant="bodySmall" color="text.secondary" display="block">
              ویرایش و تغییر وضعیت فقط برای ثبت‌کننده یا سوپرادمین است. همه می‌توانند کامنت بگذارند.
            </Typography>
          )}
        </>
      )}

      <Card elevation={1} sx={{ p: 2 }}>
        <Typography variant="titleMedium" display="block" sx={{ mb: 1.5 }}>
          گفتگو ({toFaDigits(String(item.comments.length))})
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {item.comments.length === 0 ? (
            <Typography variant="bodyMedium" color="text.secondary">
              هنوز کامنتی نیست.
            </Typography>
          ) : (
            item.comments.map((c) => {
              const isAdminNote = c.visibility === 'admin'
              return (
              <Box
                key={c.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: isAdminNote ? 'warning.main' : 'divider',
                  bgcolor: isAdminNote ? 'rgba(255, 167, 38, 0.08)' : 'transparent',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  gap={1}
                  flexWrap="wrap"
                  sx={{ mb: 0.75 }}
                >
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="labelMedium">{c.displayName}</Typography>
                    {isAdminNote ? (
                      <Chip size="small" color="warning" label="ادمین" />
                    ) : null}
                  </Stack>
                  <Typography variant="bodySmall" color="text.secondary">
                    {faWhen(c.at)}
                  </Typography>
                </Stack>
                <Typography variant="bodyMedium" display="block" sx={{ whiteSpace: 'pre-wrap' }}>
                  {c.body}
                </Typography>
              </Box>
              )
            })
          )}
        </Stack>

        <Box component="form" onSubmit={onComment}>
          <TextField
            label="کامنت جدید"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder={
              staff && adminOnlyComment
                ? 'یادداشت داخلی برای ادمین…'
                : 'نظر یا توضیح تکمیلی…'
            }
          />
          {staff ? (
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ mt: 1 }}
              component="label"
            >
              <input
                type="checkbox"
                checked={adminOnlyComment}
                onChange={(e) => setAdminOnlyComment(e.target.checked)}
                aria-label="کامنت فقط ادمین"
              />
              <Typography variant="bodySmall" color="text.secondary">
                فقط ادمین ببیند (تگ ادمین)
              </Typography>
            </Stack>
          ) : null}
          {error && !editing ? (
            <Typography variant="bodySmall" color="error" display="block" sx={{ mt: 1 }}>
              {error}
            </Typography>
          ) : null}
          <Button
            type="submit"
            buttonVariant="filled"
            disabled={commentBusy || !comment.trim()}
            loading={commentBusy}
            sx={{ mt: 1.5 }}
          >
            {staff && adminOnlyComment ? 'ارسال کامنت ادمین' : 'ارسال کامنت'}
          </Button>
        </Box>
      </Card>

      <FeedbackImageModal
        open={!!previewId}
        imageId={previewId}
        onClose={() => setPreviewId(null)}
        title={`پیوست ${feedbackKey(item.id)}`}
      />

      <DidbanToast message={toast} />
    </Stack>
  )
}

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ClipboardEvent,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandSearch } from '../components/BrandSearch'
import { DidbanIcon } from '../components/didbanIcons'
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
import styles from './FeedbackNew.module.css'

const MAX_IMAGES = 8

const KIND_UI: { id: FeedbackKind; label: string }[] = [
  { id: 'bug', label: 'باگ' },
  { id: 'improvement', label: 'بهبود' },
  { id: 'change', label: 'تغییر' },
]

export function FeedbackNewPage() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<FeedbackMetric[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const [kind, setKind] = useState<FeedbackKind>('improvement')
  const [metricId, setMetricId] = useState('general')
  const [section, setSection] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [brand, setBrand] = useState<BrandBranch | null>(null)
  const [needBrand, setNeedBrand] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const metricOptions = useMemo(
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
    if (title.trim().length < 3 || body.trim().length < 5) {
      setError('عنوان و توضیحات را کامل‌تر بنویسید')
      return
    }
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
    <div className={styles.page} onPaste={onPasteImages}>
      <form className={styles.card} onSubmit={(e) => void onSubmit(e)}>
        <div className={styles.head}>
          <div>
            <h1>ثبت پیشنهاد جدید</h1>
            <p>مشکل یا ایده خود را برای تیم محصول بنویسید.</p>
          </div>
          <Link
            to="/feedback"
            className={styles.closeBtn}
            aria-label="بستن"
          >
            <DidbanIcon name="close" size={18} />
          </Link>
        </div>

        <label className={styles.field}>
          <span>عنوان</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان کوتاه و واضح"
            required
            minLength={3}
          />
        </label>

        <div className={styles.field}>
          <span>نوع درخواست</span>
          <div className={styles.kindRow}>
            {KIND_UI.map((k) => (
              <button
                key={k.id}
                type="button"
                className={`${styles.kindBtn}${kind === k.id ? ` ${styles.kindOn}` : ''}`}
                onClick={() => setKind(k.id)}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.field}>
          <span>توضیحات</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="جزئیات، مراحل تکرار یا نتیجه مورد انتظار..."
            required
            minLength={5}
          />
        </label>

        <div className={styles.attachRow}>
          <label className={styles.attachBtn}>
            <DidbanIcon name="attachment" size={18} />
            پیوست فایل
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              disabled={imageBusy || images.length >= MAX_IMAGES}
              onChange={(e) => {
                void addImageFiles(Array.from(e.target.files || []))
                e.target.value = ''
              }}
            />
          </label>
          <span className={styles.attachHint}>
            {images.length
              ? `${toFaDigits(String(images.length))} پیوست`
              : 'یا اسکرین‌شات را با Ctrl+V پیست کنید'}
          </span>
        </div>

        {images.length ? (
          <div className={styles.thumbs}>
            {images.map((src, idx) => (
              <div key={`${idx}-${src.slice(0, 20)}`} className={styles.thumb}>
                <img src={src} alt={`پیوست ${idx + 1}`} />
                <button
                  type="button"
                  className={styles.thumbRemove}
                  aria-label="حذف"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <DidbanIcon name="close" size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className={styles.moreToggle}
          onClick={() => setShowMore((v) => !v)}
        >
          <DidbanIcon name="chevron" size={16} />
          {showMore ? 'بستن جزئیات بیشتر' : 'جزئیات بیشتر (شاخص / مجموعه)'}
        </button>

        {showMore ? (
          <div className={styles.moreBox}>
            <label className={styles.field}>
              <span>شاخص مرتبط</span>
              <select
                value={metricId}
                onChange={(e) => setMetricId(e.target.value)}
              >
                {metricOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>بخش / یادداشت آزاد</span>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="مثلاً تقویم بازه یا صفحه گزارش"
              />
            </label>
            <label className={styles.brandToggle}>
              <input
                type="checkbox"
                checked={needBrand}
                onChange={(e) => {
                  setNeedBrand(e.target.checked)
                  if (!e.target.checked) setBrand(null)
                }}
              />
              مربوط به یک مجموعه خاص است
            </label>
            {needBrand ? <BrandSearch value={brand} onChange={setBrand} /> : null}
          </div>
        ) : null}

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.actions}>
          <Link to="/feedback" className={styles.btnSoft}>
            انصراف
          </Link>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={busy || (needBrand && !brand)}
          >
            <DidbanIcon name="plus" size={16} />
            {busy ? 'در حال ثبت…' : 'ثبت پیشنهاد'}
          </button>
        </div>
      </form>
    </div>
  )
}

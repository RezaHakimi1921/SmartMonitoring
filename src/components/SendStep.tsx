import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'

type Props = {
  /** متن خودکار پیام (شامل یادداشت کارشناس) */
  generated: string
  note: string
  onNote: (value: string) => void
  /** زمان ثبت ارسال؛ خالی یعنی هنوز ارسال نشده */
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

/** مرحله آخر گزارش: دانلود PDF، متن قابل ویرایش، یادداشت و ثبت ارسال. */
export function SendStep({
  generated,
  note,
  onNote,
  sentAt,
  onToggleSent,
  busy,
  pdfDisabled,
  onDownload,
  onFlash,
}: Props) {
  const [edited, setEdited] = useState<string | null>(null)

  // اگر متن خودکار عوض شد (مثلاً مجموعه یا یادداشت تغییر کرد) ویرایش دستی کنار می‌رود
  useEffect(() => {
    setEdited(null)
  }, [generated])

  const text = edited ?? generated

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      onFlash('متن پیام کپی شد')
    } catch {
      onFlash('کپی انجام نشد؛ متن را دستی انتخاب کنید.', 3200)
    }
  }

  return (
    <>
      <h3 style={{ margin: '0 0 4px' }}>آماده ارسال برای مشتری</h3>
      <p className="muted" style={{ margin: '0 0 14px' }}>
        ۱) فایل PDF را دانلود کنید. ۲) متن پیام را بخوانید و در صورت نیاز ویرایش
        و کپی کنید. ۳) هر دو را برای مشتری بفرستید و «ارسال شد» را ثبت کنید.
      </p>

      <div className="send-actions">
        <button
          type="button"
          className="btn btn-primary btn-large"
          disabled={busy || pdfDisabled}
          onClick={onDownload}
        >
          {busy ? 'در حال ساخت…' : 'دانلود PDF گزارش'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-large"
          onClick={() => void copy()}
        >
          کپی متن پیام
        </button>
      </div>

      <label className="field-label" htmlFor="op-note" style={{ marginTop: 16 }}>
        یادداشت کارشناس (اختیاری؛ در انتهای پیام می‌آید)
      </label>
      <textarea
        id="op-note"
        className="textarea"
        rows={2}
        placeholder="مثلاً: هفته بعد درباره قطع اتصال پیگیری می‌کنیم"
        value={note}
        onChange={(e) => onNote(e.target.value)}
      />

      <div className="summary-row" style={{ marginTop: 16 }}>
        <label className="field-label" htmlFor="msg-text" style={{ margin: 0 }}>
          متن پیام (قابل ویرایش)
        </label>
        {edited !== null ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setEdited(null)}
          >
            بازگرداندن متن خودکار
          </button>
        ) : null}
      </div>
      <textarea
        id="msg-text"
        className="textarea message-edit"
        rows={12}
        value={text}
        onChange={(e) => setEdited(e.target.value)}
      />

      <div className="sent-box">
        {sentAt ? (
          <p>
            ✅ ارسال‌شده برای مشتری · {sentText(sentAt)}
          </p>
        ) : (
          <p className="muted">هنوز به‌عنوان ارسال‌شده ثبت نشده است.</p>
        )}
        <button
          type="button"
          className={sentAt ? 'btn btn-ghost' : 'btn btn-primary'}
          onClick={onToggleSent}
        >
          {sentAt ? 'لغو ثبت ارسال' : 'ثبت به‌عنوان ارسال‌شده'}
        </button>
      </div>

      <div className="actions" style={{ marginTop: 12 }}>
        <Link to="/" className="btn btn-ghost">
          شروع بررسی جدید
        </Link>
        <Link to="/history" className="btn btn-ghost">
          همه گزارش‌ها
        </Link>
      </div>
    </>
  )
}

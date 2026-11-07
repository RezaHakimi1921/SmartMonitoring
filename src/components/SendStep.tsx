import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
    <>
      <h3 style={{ margin: '0 0 4px' }}>آماده ارسال و ثبت</h3>
      <p className="muted" style={{ margin: '0 0 14px' }}>
        PDF را دانلود کنید، متن پیام مشتری را بفرستید، و در صورت نیاز فرم دستیار
        را کپی کنید.
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
      </div>

      <label className="field-label" htmlFor="op-note" style={{ marginTop: 16 }}>
        یادداشت کارشناس (اختیاری؛ در هر دو قالب می‌آید)
      </label>
      <textarea
        id="op-note"
        className="textarea"
        rows={2}
        placeholder="مثلاً: هفته بعد درباره قطع اتصال پیگیری می‌کنیم"
        value={note}
        onChange={(e) => onNote(e.target.value)}
      />

      <section className="panel glass-card" style={{ marginTop: 20 }}>
        <div className="summary-row">
          <h3 className="panel-title" style={{ margin: 0 }}>
            ۱) فرمت ارسال پیام به مشتری
          </h3>
          <div className="actions">
            {editedMsg !== null ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditedMsg(null)}
              >
                بازگرداندن خودکار
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void copyText(msg, onFlash, 'متن پیام مشتری کپی شد')}
            >
              کپی پیام مشتری
            </button>
          </div>
        </div>
        <textarea
          className="textarea message-edit"
          rows={10}
          value={msg}
          onChange={(e) => setEditedMsg(e.target.value)}
        />
      </section>

      <section className="panel glass-card" style={{ marginTop: 16 }}>
        <div className="summary-row">
          <h3 className="panel-title" style={{ margin: 0 }}>
            ۲) فرمت اطلاعات برای ثبت فرم دستیار
          </h3>
          <div className="actions">
            {editedAssist !== null ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditedAssist(null)}
              >
                بازگرداندن خودکار
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                void copyText(assist, onFlash, 'متن فرم دستیار کپی شد')
              }
            >
              کپی فرم دستیار
            </button>
          </div>
        </div>
        <textarea
          className="textarea message-edit"
          rows={10}
          value={assist}
          onChange={(e) => setEditedAssist(e.target.value)}
        />
      </section>

      <div className="sent-box">
        {sentAt ? (
          <p>ارسال‌شده برای مشتری · {sentText(sentAt)}</p>
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
        <Link to="/reports" className="btn btn-ghost">
          صندوق گزارش‌ها
        </Link>
      </div>
    </>
  )
}

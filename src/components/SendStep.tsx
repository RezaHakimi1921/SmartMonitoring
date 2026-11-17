import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'
import styles from '../pages/ReportPage.module.css'
import { Ico } from './make/icons'

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

/** مرحله ارسال — پیام مشتری و فرم دستیار جدا و خوانا */
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
    <div>
      <div className={styles.panelHead}>
        <div className={styles.panelIcon}>{Ico.send}</div>
        <div>
          <h2>ارسال گزارش</h2>
          <div className={styles.panelSub}>
            اول پیام مشتری را بفرستید؛ فرم دستیار برای ثبت داخلی است
          </div>
        </div>
      </div>

      {sentAt ? (
        <div className={styles.sentBanner}>
          ارسال ثبت شد · {sentText(sentAt)}
        </div>
      ) : null}

      <div className={styles.sendStack}>
        <div className={styles.sendBoxPrimary}>
          <div className={styles.sendLabel}>
            <div>
              <h3 className={styles.sendBoxTitle}>۱) پیام مشتری</h3>
              <p className={styles.sendBoxHint}>
                همین متن را برای مشتری واتساپ/پیامک می‌فرستید. قبل از ارسال ویرایش
                کنید.
              </p>
            </div>
            <span>
              {editedMsg !== null ? (
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setEditedMsg(null)}
                >
                  بازگرداندن
                </button>
              ) : null}
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() =>
                  void copyText(msg, onFlash, 'متن پیام مشتری کپی شد')
                }
              >
                کپی پیام مشتری
              </button>
            </span>
          </div>
          <textarea
            rows={14}
            value={msg}
            onChange={(e) => setEditedMsg(e.target.value)}
            aria-label="پیام مشتری"
          />
        </div>

        <div className={styles.sendBox}>
          <div className={styles.sendLabel}>
            <div>
              <h3 className={styles.sendBoxTitle}>۲) فرم دستیار</h3>
              <p className={styles.sendBoxHint}>
                خلاصهٔ ساختاری برای ثبت در فرم داخلی تیم؛ برای مشتری ارسال نشود.
              </p>
            </div>
            <span>
              {editedAssist !== null ? (
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setEditedAssist(null)}
                >
                  بازگرداندن
                </button>
              ) : null}
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() =>
                  void copyText(assist, onFlash, 'متن فرم دستیار کپی شد')
                }
              >
                کپی فرم دستیار
              </button>
            </span>
          </div>
          <textarea
            rows={12}
            value={assist}
            onChange={(e) => setEditedAssist(e.target.value)}
            aria-label="فرم دستیار"
          />
        </div>

        <div className={`${styles.sendBox} ${styles.sendNoteBox}`}>
          <h3 className={styles.sendBoxTitle}>یادداشت داخلی (اختیاری)</h3>
          <p className={styles.sendBoxHint}>
            فقط برای تیم دیده می‌شود و در صورت نیاز داخل قالب‌ها می‌آید.
          </p>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="مثلاً: هفته بعد درباره قطع اتصال پیگیری می‌کنیم"
            aria-label="یادداشت داخلی"
          />
        </div>
      </div>

      <div className={styles.sendActions}>
        <button
          type="button"
          className={styles.btnGhost}
          disabled={busy || pdfDisabled}
          onClick={onDownload}
        >
          {busy ? 'در حال ساخت…' : 'دانلود PDF گزارش'}
        </button>
        <button
          type="button"
          className={sentAt ? styles.btnGhost : styles.btnPrimary}
          onClick={onToggleSent}
        >
          {sentAt ? 'لغو ثبت ارسال' : 'ثبت به‌عنوان ارسال‌شده'}
        </button>
        <RouterLink className={styles.linkBtn} to="/">
          شروع بررسی جدید
        </RouterLink>
        <RouterLink className={styles.linkBtn} to="/reports">
          صندوق گزارش‌ها
        </RouterLink>
      </div>
    </div>
  )
}

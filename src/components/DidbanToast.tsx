import { Ico } from './make/icons'
import styles from './DidbanToast.module.css'

type Tone = 'ok' | 'warn' | 'error'

export function DidbanToast({
  message,
  tone = 'ok',
}: {
  message: string
  tone?: Tone
}) {
  if (!message) return null
  const root =
    tone === 'error'
      ? styles.toastError
      : tone === 'warn'
        ? styles.toastWarn
        : styles.toast
  const ico =
    tone === 'error'
      ? styles.icoError
      : tone === 'warn'
        ? styles.icoWarn
        : styles.ico
  return (
    <div className={root} role="status" aria-live="polite">
      <span className={ico} aria-hidden>
        {tone === 'ok' ? Ico.check : '!' }
      </span>
      <span>{message}</span>
    </div>
  )
}

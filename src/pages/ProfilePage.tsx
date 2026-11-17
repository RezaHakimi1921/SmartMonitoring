import { useState, type FormEvent } from 'react'
import { DidbanToast } from '../components/DidbanToast'
import { roleLabel, useAuth } from '../lib/authContext'
import { updateMyProfile } from '../lib/authApi'
import styles from './DidbanPage.module.css'

export function ProfilePage() {
  const { user, refresh } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  if (!user) return null

  const onSaveName = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await updateMyProfile({ displayName: displayName.trim() })
      await refresh()
      setToast('نام ذخیره شد')
      window.setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  const onSavePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== password2) {
      setError('تکرار رمز با رمز جدید یکی نیست')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await updateMyProfile({
        currentPassword,
        password,
      })
      setCurrentPassword('')
      setPassword('')
      setPassword2('')
      if (res.passwordChanged) {
        setToast('رمز عوض شد — دوباره وارد شوید')
        const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
        window.setTimeout(() => {
          window.location.href = `${base}/login`
        }, 1200)
        return
      }
      setToast('رمز به‌روز شد')
      window.setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>حساب من</div>
        <h1>{user.displayName || user.username}</h1>
        <p>
          {roleLabel(user.role)} · ویرایش نام و رمز عبور
        </p>
      </div>

      <div className={styles.panelNarrow}>
        <p className={styles.muted} style={{ marginTop: 0 }}>
          نام کاربری: {user.username}
        </p>

        <form onSubmit={onSaveName}>
          <label className={styles.field}>
            <span>نام نمایشی</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={busy || displayName.trim() === user.displayName}
          >
            ذخیره نام
          </button>
        </form>

        <form onSubmit={onSavePassword} style={{ marginTop: 24 }}>
          <label className={styles.field}>
            <span>رمز فعلی</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label className={styles.field}>
            <span>رمز عبور جدید</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>
          <label className={styles.field}>
            <span>تکرار رمز جدید</span>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={busy || !currentPassword || password.length < 6}
          >
            ذخیره رمز
          </button>
        </form>

        {error ? <div className={styles.error}>{error}</div> : null}
      </div>
      <DidbanToast message={toast} />
    </div>
  )
}

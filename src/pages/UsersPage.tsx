import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { DidbanToast } from '../components/DidbanToast'
import { Ico } from '../components/make/icons'
import {
  createUser,
  listUsers,
  resetUserPassword,
  setUserActive,
  setUserRole,
  type AuthUser,
  type Role,
} from '../lib/authApi'
import { isStaff, roleLabel, useAuth } from '../lib/authContext'
import styles from './UsersPage.module.css'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0]!.slice(0, 2)
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`
}

export function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await listUsers())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createUser({ username, displayName, role, password })
      setUsername('')
      setDisplayName('')
      setPassword('')
      setRole('user')
      flash('کاربر اضافه شد')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ایجاد ناموفق')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (u: AuthUser) => {
    setError('')
    try {
      await setUserActive(u.id, !u.active)
      flash(u.active ? 'کاربر غیرفعال شد' : 'کاربر فعال شد')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  const changePassword = async (u: AuthUser) => {
    const next = window.prompt(`رمز جدید برای ${u.username} (حداقل ۶ کاراکتر):`)
    if (!next) return
    setError('')
    try {
      await resetUserPassword(u.id, next)
      flash('رمز به‌روز شد')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  const changeRole = async (u: AuthUser, next: 'admin' | 'user') => {
    setError('')
    try {
      await setUserRole(u.id, next)
      flash('نقش به‌روز شد')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  if (!isStaff(me?.role)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>مدیریت</div>
        <h1>کاربران</h1>
        <p>
          نقش‌ها: کاربر (گزارش می‌گیرد)، ادمین (تنظیمات و داشبورد)، سوپرادمین
          (همه‌چیز؛ ساخت ادمین فقط با سوپرادمین).
        </p>
      </div>

      <div className={styles.layout}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>کاربر جدید</h2>
          <form onSubmit={onCreate}>
            <label className={styles.field}>
              <span>نام کاربری</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="off"
              />
            </label>
            <label className={styles.field}>
              <span>نام نمایشی</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="اختیاری"
              />
            </label>
            <label className={styles.field}>
              <span>نقش</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="user">کاربر</option>
                {me?.role === 'superadmin' ? (
                  <option value="admin">ادمین</option>
                ) : null}
              </select>
            </label>
            <label className={styles.field}>
              <span>رمز عبور</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            {error ? <div className={styles.error}>{error}</div> : null}
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={busy}
            >
              {Ico.check}
              {busy ? 'در حال افزودن…' : 'افزودن کاربر'}
            </button>
          </form>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>فهرست کاربران</h2>
          {loading ? (
            <p className={styles.muted} aria-busy>
              در حال بارگذاری…
            </p>
          ) : users.length === 0 ? (
            <p className={styles.muted}>کاربری ثبت نشده است.</p>
          ) : (
            <div className={styles.list}>
              {users.map((u) => (
                <div key={u.id} className={styles.row}>
                  <div className={styles.userMain}>
                    <div className={styles.avatar}>
                      {initials(u.displayName || u.username)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.name}>
                        {u.displayName || u.username}
                      </div>
                      <div className={styles.uname}>{u.username}</div>
                    </div>
                  </div>

                  <div>
                    <span
                      className={
                        u.role === 'superadmin' || u.role === 'admin'
                          ? styles.chipOk
                          : styles.chip
                      }
                    >
                      {roleLabel(u.role)}
                    </span>
                    {me?.role === 'superadmin' && u.role !== 'superadmin' ? (
                      <div style={{ marginTop: 8 }}>
                        <select
                          className={styles.roleSelect}
                          aria-label={`نقش ${u.username}`}
                          value={u.role}
                          onChange={(e) =>
                            void changeRole(
                              u,
                              e.target.value === 'admin' ? 'admin' : 'user',
                            )
                          }
                        >
                          <option value="user">کاربر</option>
                          <option value="admin">ادمین</option>
                        </select>
                      </div>
                    ) : null}
                  </div>

                  <span className={u.active ? styles.chipOk : styles.chipMute}>
                    {u.active ? 'فعال' : 'غیرفعال'}
                  </span>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => void changePassword(u)}
                    >
                      رمز
                    </button>
                    <button
                      type="button"
                      className={styles.btnText}
                      disabled={u.id === me?.id || u.role === 'superadmin'}
                      onClick={() => void toggleActive(u)}
                    >
                      {u.active ? 'غیرفعال' : 'فعال'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <DidbanToast message={toast} />
    </div>
  )
}

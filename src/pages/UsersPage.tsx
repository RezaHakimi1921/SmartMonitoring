import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
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
    <>
      <section className="page-intro">
        <h2 style={{ margin: 0, fontSize: 22 }}>مدیریت کاربران</h2>
        <p>
          نقش‌ها: کاربر (گزارش می‌گیرد)، ادمین (تنظیمات و داشبورد)، سوپرادمین
          (همه‌چیز؛ ساخت ادمین فقط با سوپرادمین).
        </p>
      </section>

      <div className="admin-grid">
        <form className="panel glass-card" onSubmit={onCreate}>
          <h3 className="panel-title">کاربر جدید</h3>
          <label className="field">
            <span>نام کاربری</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>نام نمایشی</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="اختیاری"
            />
          </label>
          <label className="field">
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
          <label className="field">
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
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'در حال ذخیره…' : 'افزودن کاربر'}
          </button>
        </form>

        <div className="panel glass-card">
          <h3 className="panel-title">فهرست کاربران</h3>
          {loading ? (
            <p className="muted" aria-busy="true">
              در حال بارگذاری…
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>نقش</th>
                  <th>وضعیت</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.displayName}</strong>
                      <div className="muted">{u.username}</div>
                    </td>
                    <td>
                      {roleLabel(u.role)}
                      {me?.role === 'superadmin' &&
                      u.role !== 'superadmin' ? (
                        <select
                          className="select"
                          style={{ marginTop: 6, height: 36 }}
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
                      ) : null}
                    </td>
                    <td>{u.active ? 'فعال' : 'غیرفعال'}</td>
                    <td>
                      <div className="actions" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => void changePassword(u)}
                        >
                          رمز
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={u.id === me?.id || u.role === 'superadmin'}
                          onClick={() => void toggleActive(u)}
                        >
                          {u.active ? 'غیرفعال' : 'فعال'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}

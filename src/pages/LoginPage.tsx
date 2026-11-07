import { useEffect, useState, type FormEvent } from 'react'
import { TrendingUp } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.body.classList.add('rd-theme')
    return () => document.body.classList.remove('rd-theme')
  }, [])

  const from =
    (location.state as { from?: string } | null)?.from || '/'

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page app-shell">
      <form className="login-card overview-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <div className="brand-mark">
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1>ورود به دیدبان</h1>
            <p className="muted">صدای مشتری · کنترل کیفیت اسمارت</p>
          </div>
        </div>

        <label className="field">
          <span>نام کاربری</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
        </label>

        <label className="field">
          <span>رمز عبور</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="export-button"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={busy || loading}
        >
          {busy ? 'در حال ورود…' : 'ورود'}
        </button>
      </form>
    </div>
  )
}

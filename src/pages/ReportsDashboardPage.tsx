import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { listUsers, type AuthUser } from '../lib/authApi'
import { isStaff, useAuth } from '../lib/authContext'
import { fetchReports, type ServerReport } from '../lib/configApi'
import { loadReviewTypes } from '../lib/storage'
import { formatJalaliLong, gregorianToJalali, toFaDigits } from '../lib/jalali'

function faWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return formatJalaliLong(gregorianToJalali(d))
}

export function ReportsDashboardPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ServerReport[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [typeId, setTypeId] = useState('')
  const types = useMemo(() => loadReviewTypes(), [])

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const [r, u] = await Promise.all([
        fetchReports({
          userId: userId || undefined,
          typeId: typeId || undefined,
        }),
        listUsers(),
      ])
      setReports(r)
      setUsers(u)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, typeId])

  if (!isStaff(user?.role)) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <section className="page-intro">
        <h2 style={{ margin: 0, fontSize: 22 }}>داشبورد گزارش‌های کاربران</h2>
        <p>ببینید هر کاربر چه گزارش‌هایی گرفته و آیا ارسال کرده است.</p>
      </section>

      <div className="panel glass-card history-filters" style={{ marginBottom: 16 }}>
        <div className="field-row">
          <label htmlFor="flt-user">کاربر</label>
          <select
            id="flt-user"
            className="select"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">همه</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} ({u.username})
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="flt-type">نوع بررسی</label>
          <select
            id="flt-type"
            className="select"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">همه</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="report-notice">{error}</div> : null}

      <div className="panel glass-card">
        {loading ? (
          <p className="muted" aria-busy="true">
            در حال بارگذاری…
          </p>
        ) : reports.length === 0 ? (
          <p className="muted">گزارشی ثبت نشده است.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>نوع</th>
                <th>مجموعه</th>
                <th>وضعیت</th>
                <th>آخرین به‌روزرسانی</th>
                <th>بخش‌ها</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.displayName}</strong>
                    <div className="muted">{r.username}</div>
                  </td>
                  <td>{r.typeTitle}</td>
                  <td>
                    {r.brandName}
                    {r.branchName && r.branchName !== r.brandName
                      ? ` — ${r.branchName}`
                      : ''}
                  </td>
                  <td>
                    <span
                      className={`status-badge${r.status === 'sent' ? ' sent' : ''}`}
                    >
                      {r.status === 'sent' ? 'ارسال‌شده' : 'پیش‌نویس'}
                    </span>
                  </td>
                  <td>{faWhen(r.updatedAt)}</td>
                  <td>{toFaDigits(r.features.length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

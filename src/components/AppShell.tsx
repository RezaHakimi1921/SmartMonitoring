import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'شروع بررسی', end: true },
  { to: '/admin', label: 'تعریف انواع و ویژگی‌ها', end: false },
]

export function AppShell() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const title =
    location.pathname.startsWith('/admin')
      ? 'پیکربندی'
      : location.pathname.startsWith('/setup')
        ? 'آماده‌سازی بررسی'
        : location.pathname.startsWith('/report')
          ? 'گزارش بررسی'
          : 'مانیتورینگ باشگاه'

  return (
    <div className="app-shell">
      {open ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="بستن منو"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside className={`nav${open ? ' open' : ''}`}>
        <div className="nav-brand">
          <div className="nav-mark">SX</div>
          <div>
            <p className="nav-title">Monitoring</p>
            <p className="nav-tag">باشگاه مشتریان</p>
          </div>
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
        <div className="nav-spacer" />
        <p className="nav-footnote">
          الهام بصری از Isometric depth و فضای ThreeUI · توکن‌های SmartX
        </p>
      </aside>

      <div className="main">
        <header className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="menu-btn"
              aria-label="باز کردن منو"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
            <h1>{title}</h1>
          </div>
          <span className="appbar-meta">پروتوتایپ UI · داده mock</span>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-tabbar" aria-label="ناوبری موبایل">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

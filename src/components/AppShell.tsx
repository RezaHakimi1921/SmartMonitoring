import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { formatJalaliLong, todayJalali } from '../lib/jalali'

const NAV = [
  { to: '/', label: 'شروع بررسی', end: true },
  { to: '/history', label: 'گزارش‌های اخیر', end: false },
  { to: '/help', label: 'راهنما', end: false },
]

export function AppShell() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const title =
    location.pathname.startsWith('/admin')
      ? 'تنظیمات انواع بررسی'
      : location.pathname.startsWith('/history')
        ? 'گزارش‌های اخیر'
        : location.pathname.startsWith('/help')
          ? 'راهنمای استفاده'
          : location.pathname.startsWith('/setup')
        ? 'تنظیم بررسی'
        : location.pathname.startsWith('/report')
          ? 'گزارش بررسی'
          : 'شروع بررسی'

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
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            isActive ? 'nav-link nav-link-quiet active' : 'nav-link nav-link-quiet'
          }
        >
          تنظیمات (ویژه مدیر)
        </NavLink>
        <p className="nav-footnote">پنل کنترل کیفیت اسمارت</p>
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
          <span className="appbar-meta">{formatJalaliLong(todayJalali())}</span>
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

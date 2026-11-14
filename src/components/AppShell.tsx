import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isStaff, roleLabel, useAuth } from '../lib/authContext'
import { Ico } from './make/icons'

function crumbFor(pathname: string) {
  if (pathname.startsWith('/users')) return 'کاربران'
  if (pathname.startsWith('/reports')) return 'صندوق گزارش‌ها'
  if (pathname.startsWith('/admin')) return 'تنظیمات بررسی'
  if (pathname.startsWith('/history')) return 'گزارش‌های این مرورگر'
  if (pathname.startsWith('/help')) return 'راهنما'
  if (pathname.startsWith('/setup')) return 'تنظیم بررسی'
  if (pathname.startsWith('/report')) return 'گزارش زنده'
  return 'بررسی جدید'
}

const MAIN_NAV = [
  { to: '/', label: 'بررسی جدید', end: true, icon: Ico.home },
  { to: '/reports', label: 'گزارش‌ها', end: false, icon: Ico.doc },
  { to: '/help', label: 'راهنما', end: false, icon: Ico.help },
] as const

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    document.body.classList.add('make-theme')
    return () => document.body.classList.remove('make-theme')
  }, [])

  useEffect(() => {
    setMobileMenu(false)
  }, [location.pathname])

  const crumb = useMemo(() => crumbFor(location.pathname), [location.pathname])
  const initials = (user?.displayName || user?.username || '؟')
    .trim()
    .slice(0, 2)

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div dir="ltr" className={`shell${mobileMenu ? ' shell-nav-open' : ''}`}>
      <main className="main" dir="rtl">
        <header className="topbar">
          <div>
            <button
              type="button"
              className="menu-button make-menu-btn"
              onClick={() => setMobileMenu(true)}
              aria-label="باز کردن منو"
            >
              ☰
            </button>
            <span style={{ color: '#1a1c16', fontWeight: 600 }}>دیدبان</span>
            <span style={{ margin: '0 8px', opacity: 0.35 }}>‹</span>
            <span>{crumb}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#4e6300',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: '#668100',
                }}
              />
              سامانه فعال
            </span>
            <button
              type="button"
              className="linkish"
              onClick={() => navigate('/help')}
            >
              {Ico.help}
              راهنمای این صفحه
            </button>
          </div>
        </header>
        <div className="page-content make-page">
          <Outlet />
        </div>
      </main>

      {mobileMenu ? (
        <button
          type="button"
          className="overlay"
          onClick={() => setMobileMenu(false)}
          aria-label="بستن منو"
        />
      ) : null}

      <aside className={`sidebar${mobileMenu ? ' sidebar-open' : ''}`} dir="rtl">
        <div
          style={{
            padding: 18,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div className="brand-mark">{Ico.chart}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1 }}>
              دیدبان
            </div>
            <div style={{ fontSize: 11, color: '#5c5f52', marginTop: 6 }}>
              صدای مشتری اسمارت
            </div>
          </div>
          <button
            type="button"
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="بستن منو"
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '0 14px',
            fontSize: 11,
            color: '#8a8d7f',
            marginBottom: 6,
          }}
        >
          منوی اصلی
        </div>
        <nav style={{ padding: '0 10px', display: 'grid', gap: 2 }}>
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="left">
                {item.icon}
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {isStaff(user?.role) ? (
          <>
            <div
              style={{
                padding: '18px 14px 6px',
                fontSize: 11,
                color: '#8a8d7f',
              }}
            >
              مدیریت
            </div>
            <nav style={{ padding: '0 10px', display: 'grid', gap: 2 }}>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
              >
                <span className="left">
                  {Ico.gear}
                  تنظیمات بررسی
                </span>
              </NavLink>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
              >
                <span className="left">
                  {Ico.users}
                  کاربران
                </span>
              </NavLink>
            </nav>
          </>
        ) : null}

        <div
          style={{
            marginTop: 'auto',
            padding: 16,
            borderTop: '1px solid #e8ebdd',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div
            className="avatar"
            style={{
              background: '#c6f264',
              color: '#4e6300',
              width: 40,
              height: 40,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>
              {user?.displayName || user?.username}
            </div>
            <div style={{ fontSize: 11, color: '#5c5f52' }}>
              {roleLabel(user?.role)}
            </div>
          </div>
          <button
            type="button"
            className="linkish"
            onClick={() => void onLogout()}
            aria-label="خروج"
            title="خروج"
          >
            خروج
          </button>
        </div>
      </aside>
    </div>
  )
}

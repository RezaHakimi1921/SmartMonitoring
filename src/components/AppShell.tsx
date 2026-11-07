import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isStaff, roleLabel, useAuth } from '../lib/authContext'
import { formatJalaliLong, todayJalali } from '../lib/jalali'

const NAV = [
  { to: '/', label: 'بررسی جدید', end: true, icon: LayoutDashboard },
  { to: '/history', label: 'گزارش‌های من', end: false, icon: BarChart3 },
  { to: '/help', label: 'راهنما', end: false, icon: CircleHelp },
] as const

function titleFor(pathname: string) {
  if (pathname.startsWith('/users')) return 'مدیریت کاربران'
  if (pathname.startsWith('/reports-admin')) return 'داشبورد گزارش‌ها'
  if (pathname.startsWith('/admin')) return 'تنظیمات انواع بررسی'
  if (pathname.startsWith('/history')) return 'گزارش‌های اخیر'
  if (pathname.startsWith('/help')) return 'راهنمای استفاده'
  if (pathname.startsWith('/setup')) return 'تنظیم بررسی'
  if (pathname.startsWith('/report')) return 'گزارش تجربه مشتری'
  return 'نمای کلی بررسی'
}

function subtitleFor(pathname: string) {
  if (pathname.startsWith('/report')) {
    return 'نمایی سریع از وضعیت عملکرد و بازخورد مشتریان'
  }
  if (pathname.startsWith('/admin')) {
    return 'ویژگی‌ها، آستانه‌ها و قالب پیام روی سرور'
  }
  if (pathname.startsWith('/reports-admin')) {
    return 'چه کسی چه گزارشی گرفته است'
  }
  if (pathname.startsWith('/history')) {
    return 'گزارش‌های ذخیره‌شده روی این مرورگر'
  }
  return 'پنل کنترل کیفیت اسمارت · دیدبان'
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    document.body.classList.add('rd-theme')
    return () => document.body.classList.remove('rd-theme')
  }, [])

  useEffect(() => {
    setMobileMenu(false)
  }, [location.pathname])

  const title = useMemo(
    () => titleFor(location.pathname),
    [location.pathname],
  )
  const subtitle = useMemo(
    () => subtitleFor(location.pathname),
    [location.pathname],
  )

  const initials = (user?.displayName || user?.username || '؟')
    .trim()
    .slice(0, 2)

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div dir="rtl" className="app-shell">
      <aside className={`sidebar${mobileMenu ? ' sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <div>
            <strong>دیدبان</strong>
            <span>صدای مشتری</span>
          </div>
          <button
            type="button"
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="side-nav" aria-label="منوی اصلی">
          <p>فضای کاری</p>
          {NAV.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
          {isStaff(user?.role) ? (
            <>
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                <Settings size={19} />
                <span>تنظیمات بررسی</span>
              </NavLink>
              <NavLink
                to="/reports-admin"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                <FileText size={19} />
                <span>داشبورد گزارش‌ها</span>
              </NavLink>
              <NavLink
                to="/users"
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                <Users size={19} />
                <span>کاربران</span>
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="sidebar-help">
          <CircleHelp size={21} />
          <strong>به راهنمایی نیاز دارید؟</strong>
          <span>مرکز راهنمای دیدبان برای بررسی‌های QC در دسترس است.</span>
          <button type="button" onClick={() => navigate('/help')}>
            مشاهده راهنما
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{user?.displayName || user?.username}</strong>
            <span>{roleLabel(user?.role)}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            style={{
              width: 32,
              height: 32,
              background: 'transparent',
              border: '0',
              color: '#74968f',
            }}
            aria-label="خروج"
            title="خروج"
            onClick={() => void onLogout()}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {mobileMenu ? (
        <button
          type="button"
          className="overlay"
          onClick={() => setMobileMenu(false)}
          aria-label="بستن منو"
        />
      ) : null}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <button
              type="button"
              className="menu-button"
              onClick={() => setMobileMenu(true)}
              aria-label="باز کردن منو"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="updated-at">{formatJalaliLong(todayJalali())}</span>
            {location.pathname.startsWith('/report') ? (
              <span className="export-button" style={{ pointerEvents: 'none' }}>
                <FileText size={18} />
                گزارش زنده
              </span>
            ) : null}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isStaff, roleLabel, useAuth } from '../lib/authContext'
import { Ico } from './make/icons'
import styles from './AppShell.module.css'

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
    <div dir="ltr" className={styles.shell}>
      <main className={styles.main} dir="rtl">
        <header className={styles.topbar}>
          <div>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMobileMenu(true)}
              aria-label="باز کردن منو"
            >
              ☰
            </button>
            <span className={styles.crumbStrong}>دیدبان</span>
            <span className={styles.crumbSep}>‹</span>
            <span>{crumb}</span>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.status}>
              <span className={styles.statusDot} />
              سامانه فعال
            </span>
            <button
              type="button"
              className={styles.linkish}
              onClick={() => navigate('/help')}
            >
              {Ico.help}
              راهنمای این صفحه
            </button>
          </div>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      {mobileMenu ? (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setMobileMenu(false)}
          aria-label="بستن منو"
        />
      ) : null}

      <aside
        className={mobileMenu ? styles.sidebarOpen : styles.sidebar}
        dir="rtl"
      >
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>{Ico.chart}</div>
          <div style={{ flex: 1 }}>
            <div className={styles.brandTitle}>دیدبان</div>
            <div className={styles.brandSub}>صدای مشتری اسمارت</div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setMobileMenu(false)}
            aria-label="بستن منو"
          >
            ×
          </button>
        </div>

        <div className={styles.sectionLabel}>منوی اصلی</div>
        <nav className={styles.nav} aria-label="منوی اصلی">
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? styles.navItemActive : styles.navItem
              }
            >
              <span className={styles.navLeft}>
                {item.icon}
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {isStaff(user?.role) ? (
          <>
            <div className={styles.sectionLabelSpaced}>مدیریت</div>
            <nav className={styles.nav} aria-label="مدیریت">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? styles.navItemActive : styles.navItem
                }
              >
                <span className={styles.navLeft}>
                  {Ico.gear}
                  تنظیمات بررسی
                </span>
              </NavLink>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  isActive ? styles.navItemActive : styles.navItem
                }
              >
                <span className={styles.navLeft}>
                  {Ico.users}
                  کاربران
                </span>
              </NavLink>
            </nav>
          </>
        ) : null}

        <div className={styles.userRow}>
          <div className={styles.avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{user?.displayName || user?.username}</strong>
            <div className={styles.userRole}>{roleLabel(user?.role)}</div>
          </div>
          <button
            type="button"
            className={styles.linkish}
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

import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DidbanIcon, type DidbanIconName } from './didbanIcons'
import { isStaff, roleLabel, useAuth } from '../lib/authContext'
import { fetchFeedback } from '../lib/feedbackApi'
import { toFaDigits } from '../lib/jalali'
import styles from './AppShell.module.css'

function crumbFor(pathname: string) {
  if (pathname.startsWith('/users')) return 'کاربران'
  if (pathname.startsWith('/reports')) return 'گزارش‌ها'
  if (pathname.startsWith('/feedback/new')) return 'پیشنهاد جدید'
  if (pathname.match(/^\/feedback\/[^/]+$/)) return 'پیشنهادات'
  if (pathname.startsWith('/feedback')) return 'پیشنهادات'
  if (pathname.startsWith('/profile')) return 'حساب من'
  if (pathname.startsWith('/admin')) return 'تنظیمات بررسی'
  if (pathname.startsWith('/help')) return 'راهنما'
  if (pathname.startsWith('/setup')) return 'تنظیم بررسی'
  if (pathname.startsWith('/report')) return 'گزارش'
  return 'بررسی جدید'
}

function activeId(pathname: string) {
  if (pathname.startsWith('/reports')) return 'reports'
  if (pathname.startsWith('/feedback')) return 'feedback'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname.startsWith('/help')) return 'help'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/users')) return 'users'
  return 'home'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0]!.slice(0, 2)
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`
}

type NavItem = {
  id: string
  label: string
  href: string
  icon: DidbanIconName
  badge?: string
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const [feedbackOpenCount, setFeedbackOpenCount] = useState(0)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    void fetchFeedback({ status: 'open' })
      .then((list) => {
        if (!cancelled) setFeedbackOpenCount(list.length)
      })
      .catch(() => {
        if (!cancelled) setFeedbackOpenCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const crumb = useMemo(() => crumbFor(location.pathname), [location.pathname])
  const current = activeId(location.pathname)

  const mainNav: NavItem[] = useMemo(() => {
    return [
      { id: 'home', label: 'بررسی جدید', href: '/', icon: 'home' },
      { id: 'reports', label: 'گزارش‌ها', href: '/reports', icon: 'report' },
      {
        id: 'feedback',
        label: 'پیشنهادات',
        href: '/feedback',
        icon: 'message',
        badge:
          feedbackOpenCount > 0
            ? toFaDigits(String(Math.min(feedbackOpenCount, 99)))
            : undefined,
      },
      { id: 'help', label: 'راهنما', href: '/help', icon: 'help' },
      { id: 'profile', label: 'حساب من', href: '/profile', icon: 'user' },
    ]
  }, [feedbackOpenCount])

  const adminNav: NavItem[] = useMemo(() => {
    if (!isStaff(user?.role)) return []
    return [
      { id: 'admin', label: 'تنظیمات بررسی', href: '/admin', icon: 'settings' },
      { id: 'users', label: 'کاربران', href: '/users', icon: 'users' },
    ]
  }, [user?.role])

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = current === item.id
      return (
        <Link
          key={item.id}
          to={item.href}
          className={`${styles.navItem}${active ? ` ${styles.navItemActive}` : ''}`}
          onClick={() => setNavOpen(false)}
        >
          <span className={styles.navLeft}>
            <DidbanIcon name={item.icon} size={20} />
            {item.label}
          </span>
          {item.badge ? (
            <span className={styles.navBadge}>{item.badge}</span>
          ) : null}
        </Link>
      )
    })

  return (
    <div className={styles.shell}>
      {navOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="بستن منو"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.crumbBrand}>دیدبان</span>
            <span className={styles.crumbSep}>‹</span>
            <span>{crumb}</span>
          </div>
          <div className={styles.topRight}>
            <span className={styles.statusLive}>
              <span className={styles.statusDot} />
              سامانه فعال
            </span>
            <button
              type="button"
              className={styles.linkish}
              onClick={() => navigate('/help')}
            >
              <DidbanIcon name="help" size={18} />
              راهنمای این صفحه
            </button>
            <button
              type="button"
              className={styles.linkish}
              onClick={() => void onLogout()}
            >
              خروج
            </button>
          </div>
        </header>

        <div className={styles.stage}>
          <Outlet />
        </div>
      </main>

      <aside
        className={`${styles.sidebar}${navOpen ? ` ${styles.sidebarOpen}` : ''}`}
      >
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>
            <DidbanIcon name="chart" size={22} />
          </div>
          <div>
            <div className={styles.brandTitle}>دیدبان</div>
            <div className={styles.brandSub}>صدای مشتری اسمارت</div>
          </div>
        </div>

        <div className={styles.navSectionLabel}>منوی اصلی</div>
        <nav className={styles.navList}>{renderNav(mainNav)}</nav>

        {adminNav.length > 0 ? (
          <>
            <div className={styles.navSectionLabelSpaced}>مدیریت</div>
            <nav className={styles.navList}>{renderNav(adminNav)}</nav>
          </>
        ) : null}

        <div className={styles.userFoot}>
          <div className={styles.avatar}>
            {initials(user?.displayName || user?.username || '؟')}
          </div>
          <div>
            <div className={styles.userName}>
              {user?.displayName || user?.username || 'کاربر'}
            </div>
            <div className={styles.userRole}>{roleLabel(user?.role)}</div>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className={styles.mobileMenuBtn}
        onClick={() => setNavOpen(true)}
      >
        منو
      </button>
    </div>
  )
}

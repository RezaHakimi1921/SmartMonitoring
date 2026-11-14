import type { ReactNode } from 'react'
import { Ico } from './icons'

export type NavId =
  | 'wizard'
  | 'reports'
  | 'feedback'
  | 'help'
  | 'profile'
  | 'settings'
  | 'users'
  | 'report'

const MAIN_NAV: { id: NavId; label: string; icon: ReactNode; badge?: string }[] =
  [
    { id: 'wizard', label: 'بررسی جدید', icon: Ico.home },
    { id: 'reports', label: 'گزارش‌ها', icon: Ico.doc, badge: '۱۲' },
    { id: 'feedback', label: 'پیشنهادات', icon: Ico.chat, badge: '۲' },
    { id: 'help', label: 'راهنما', icon: Ico.help },
    { id: 'profile', label: 'حساب من', icon: Ico.user },
  ]

const ADMIN_NAV: { id: NavId; label: string; icon: ReactNode }[] = [
  { id: 'settings', label: 'تنظیمات بررسی', icon: Ico.gear },
  { id: 'users', label: 'کاربران', icon: Ico.users },
]

export function Shell({
  active,
  onNav,
  crumb,
  children,
}: {
  active: NavId
  onNav: (id: NavId) => void
  crumb: string
  children: ReactNode
}) {
  const navActive = active === 'report' ? 'wizard' : active

  return (
    <div className="shell" dir="ltr">
      <main className="main" dir="rtl">
        <header className="topbar">
          <div>
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
              onClick={() => onNav('help')}
            >
              {Ico.help}
              راهنمای این صفحه
            </button>
          </div>
        </header>
        {children}
      </main>

      <aside className="sidebar" dir="rtl">
        <div
          style={{
            padding: 18,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div className="brand-mark">{Ico.chart}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1 }}>
              دیدبان
            </div>
            <div style={{ fontSize: 11, color: '#5c5f52', marginTop: 6 }}>
              صدای مشتری اسمارت
            </div>
          </div>
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
            <button
              key={item.id}
              type="button"
              className={`nav-item ${navActive === item.id ? 'active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              <span className="left">
                {item.icon}
                {item.label}
              </span>
              {item.badge ? (
                <span className="nav-badge">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

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
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${navActive === item.id ? 'active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              <span className="left">
                {item.icon}
                {item.label}
              </span>
            </button>
          ))}
        </nav>

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
            رح
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>رضا حکیمی</div>
            <div style={{ fontSize: 11, color: '#5c5f52' }}>مدیر سیستم</div>
          </div>
        </div>
      </aside>
    </div>
  )
}

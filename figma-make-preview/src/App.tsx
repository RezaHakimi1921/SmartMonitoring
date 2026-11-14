import { useMemo, useState } from 'react'
import { BRANDS, PERIODS, TEMPLATES } from './data/demo'
import { Shell, type NavId } from './Shell'
import {
  FeedbackPage,
  HelpPage,
  ProfilePage,
  ReportsInbox,
  SettingsPage,
  UsersPage,
} from './pages/InboxPages'
import { ReportPage } from './pages/ReportPage'
import { WizardPage } from './pages/WizardPage'

const CRUMB: Record<NavId, string> = {
  wizard: 'بررسی جدید',
  report: 'گزارش زنده',
  reports: 'صندوق گزارش‌ها',
  feedback: 'پیشنهادات',
  help: 'راهنما',
  profile: 'حساب من',
  settings: 'تنظیمات بررسی',
  users: 'کاربران',
}

export default function App() {
  const [page, setPage] = useState<NavId>('wizard')
  const [brandId, setBrandId] = useState('azadi')
  const [templateId, setTemplateId] = useState('quick')
  const [periodId, setPeriodId] = useState('7d')

  const brand = useMemo(
    () => BRANDS.find((b) => b.id === brandId) ?? BRANDS[0]!,
    [brandId],
  )
  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]!,
    [templateId],
  )
  const periodLabel =
    PERIODS.find((p) => p.id === periodId)?.label ?? '۷ روز گذشته'

  return (
    <Shell active={page} onNav={setPage} crumb={CRUMB[page]}>
      {page === 'wizard' ? (
        <WizardPage
          brandId={brandId}
          templateId={templateId}
          periodId={periodId}
          onBrand={setBrandId}
          onTemplate={setTemplateId}
          onPeriod={setPeriodId}
          onStart={() => setPage('report')}
        />
      ) : null}

      {page === 'report' ? (
        <ReportPage
          brand={brand}
          template={template}
          periodLabel={periodLabel}
          onBack={() => setPage('wizard')}
          onGotoInbox={() => setPage('reports')}
        />
      ) : null}

      {page === 'reports' ? (
        <ReportsInbox onOpenDemo={() => setPage('wizard')} />
      ) : null}

      {page === 'feedback' ? <FeedbackPage /> : null}
      {page === 'help' ? <HelpPage /> : null}
      {page === 'profile' ? <ProfilePage /> : null}
      {page === 'settings' ? <SettingsPage /> : null}
      {page === 'users' ? <UsersPage /> : null}
    </Shell>
  )
}

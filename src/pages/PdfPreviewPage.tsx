import { useRef, useState } from 'react'
import { ExportSheet } from '../components/ExportSheet'
import { buildMockSections } from '../data/mockReport'
import type { FeatureId } from '../data/types'
import { exportReportAsPdf } from '../lib/exportReport'
import { summarize } from '../lib/reportSummary'
import { toFaDigits } from '../lib/jalali'

const FEATURES: FeatureId[] = [
  'overall',
  'subscription',
  'survey',
  'groups',
  'brandSettings',
  'event',
  'balance',
  'panelCharge',
  'connection',
  'complaints',
  'credit',
  'creditGeneration',
]

/** فقط برای اعتبارسنجی بصری PDF در حالت توسعه. */
export function PdfPreviewPage() {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const sections = buildMockSections(FEATURES)
  const summary = summarize(sections)

  const download = async () => {
    if (!ref.current || busy) return
    setBusy(true)
    try {
      await exportReportAsPdf(
        ref.current,
        'didban-pdf-preview',
        (p, total) =>
          `برگرلند · هایپراستار · پیش‌نمایش · صفحه ${toFaDigits(p)} از ${toFaDigits(total)}`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: 24, background: '#e8ebdd', minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>پیش‌نمایش PDF</h1>
        <button type="button" onClick={() => void download()} disabled={busy}>
          {busy ? 'در حال ساخت…' : 'دانلود PDF'}
        </button>
      </div>
      <div
        ref={ref}
        style={{
          background: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          width: 794,
          margin: '0 auto',
        }}
      >
        <ExportSheet
          typeTitle="بررسی پس از تحویل"
          brandName="برگرلند"
          branchName="برگرلند شعبه هایپراستار"
          place="برگرلند — برگرلند شعبه هایپراستار"
          periodLabel="۶ ماه اخیر"
          reportDate="۱۸ آبان ۱۴۰۵"
          sections={sections}
          diagTitles={[
            'وضعیت لوگو',
            'آستانه نظرسنجی',
            'روز بدون شارژ',
            'رضایت زیر آستانه',
          ]}
          summary={summary}
        />
      </div>
    </div>
  )
}

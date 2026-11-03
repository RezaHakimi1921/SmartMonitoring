import { describe, expect, it } from 'vitest'
import type { ReportSection } from '../data/types'
import {
  buildCustomerMessage,
  sectionTone,
  summarize,
} from '../lib/reportSummary'

const sections: ReportSection[] = [
  {
    featureId: 'overall',
    title: 'عملکرد کلی',
    metrics: [
      { label: 'نرخ مشارکت', value: '۴٫۳۱', tone: 'warn' },
      { label: 'رضایت', value: '۹۰٪', tone: 'ok' },
    ],
    hints: [{ text: 'رضایتمندی پایین است', tone: 'bad' }],
  },
  {
    featureId: 'survey',
    title: 'نظرسنجی',
    metrics: [
      { label: 'نرخ مشارکت', value: '۴٫۳۱', tone: 'warn' },
      { label: 'تعداد', value: '—', tone: 'nodata' },
    ],
  },
]

describe('خلاصه گزارش', () => {
  it('نکته تکراری فقط یک بار می‌آید', () => {
    const s = summarize(sections)
    expect(s.warn).toHaveLength(1)
    expect(s.bad).toHaveLength(1)
  })

  it('نبود داده هرگز «خوب» حساب نمی‌شود', () => {
    const s = summarize(sections)
    expect(s.nodata).toHaveLength(1)
    expect(s.ok.some((i) => i.text.includes('تعداد'))).toBe(false)
  })

  it('بدترین وضعیت بخش مشخص می‌شود', () => {
    expect(sectionTone(sections[0])).toBe('bad')
    expect(sectionTone(sections[1])).toBe('warn')
    expect(
      sectionTone({
        featureId: 'event',
        title: 'x',
        metrics: [{ label: 'a', value: '1', tone: 'nodata' }],
      }),
    ).toBe('nodata')
  })

  it('یادداشت کارشناس در متن پیام می‌آید', () => {
    const text = buildCustomerMessage({
      typeTitle: 'بررسی سریع',
      place: 'مجموعه آزمایشی',
      rangeText: 'بازه',
      reportDate: 'امروز',
      summary: summarize(sections),
      note: 'هفته بعد پیگیری می‌کنیم',
    })
    expect(text).toContain('هفته بعد پیگیری می‌کنیم')
    expect(text).toContain('نیاز به اقدام')
  })
})

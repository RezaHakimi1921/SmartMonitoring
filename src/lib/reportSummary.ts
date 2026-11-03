import type { ReportSection } from '../data/types'

export type Tone = 'ok' | 'warn' | 'bad' | 'info'

export interface SummaryItem {
  section: string
  text: string
}

export interface ReportSummary {
  bad: SummaryItem[]
  warn: SummaryItem[]
  ok: SummaryItem[]
}

const RANK: Record<Tone, number> = { info: 0, ok: 1, warn: 2, bad: 3 }

/** بدترین وضعیت یک بخش؛ برای رنگ مرحله‌ها. */
export function sectionTone(section: ReportSection): Tone {
  let worst: Tone = 'info'
  const tones: (Tone | undefined)[] = [
    ...section.metrics.map((m) => m.tone),
    ...(section.hints ?? []).map((h) => h.tone),
  ]
  for (const t of tones) {
    if (t && RANK[t] > RANK[worst]) worst = t
  }
  return worst
}

export const TONE_TEXT: Record<Tone, string> = {
  bad: 'نیاز به اقدام',
  warn: 'قابل بهبود',
  ok: 'وضعیت خوب',
  info: 'اطلاعات',
}

/** نکته‌های مهم یک بخش، به‌صورت جمله‌های آماده برای گفتن به مشتری. */
export function sectionTalkingPoints(section: ReportSection): SummaryItem[] {
  const items: SummaryItem[] = []
  for (const h of section.hints ?? []) {
    if (h.tone) items.push({ section: section.title, text: h.text })
  }
  for (const m of section.metrics) {
    if (m.tone === 'bad' || m.tone === 'warn') {
      items.push({ section: section.title, text: `${m.label}: ${m.value}` })
    }
  }
  return items
}

export function summarize(sections: ReportSection[]): ReportSummary {
  const out: ReportSummary = { bad: [], warn: [], ok: [] }
  // یک نکته که در چند بخش تکرار شده فقط یک بار در خلاصه می‌آید
  const seen = new Set<string>()
  const add = (tone: 'bad' | 'warn' | 'ok', section: string, text: string) => {
    if (seen.has(text)) return
    seen.add(text)
    out[tone].push({ section, text })
  }
  for (const s of sections) {
    for (const h of s.hints ?? []) {
      if (h.tone) add(h.tone, s.title, h.text)
    }
    for (const m of s.metrics) {
      if (m.tone === 'bad' || m.tone === 'warn' || m.tone === 'ok') {
        add(m.tone, s.title, `${m.label}: ${m.value}`)
      }
    }
  }
  return out
}

/** متن آماده برای ارسال در چت به مشتری. */
export function buildCustomerMessage(opts: {
  typeTitle: string
  place: string
  rangeText: string
  reportDate: string
  summary: ReportSummary
}): string {
  const { typeTitle, place, rangeText, reportDate, summary } = opts
  const lines: string[] = [
    'سلام و وقت بخیر 🌸',
    `نتیجه «${typeTitle}» برای ${place}`,
    `بازه بررسی: ${rangeText}`,
    `تاریخ گزارش: ${reportDate}`,
    '',
  ]
  const block = (title: string, items: SummaryItem[], limit: number) => {
    if (items.length === 0) return
    lines.push(title)
    items.slice(0, limit).forEach((i) => lines.push(`• ${i.text}`))
    lines.push('')
  }
  block('✅ نقاط قوت', summary.ok, 5)
  block('⚠️ قابل بهبود', summary.warn, 8)
  block('❌ نیاز به اقدام', summary.bad, 8)
  lines.push('گزارش کامل (PDF) پیوست است.')
  return lines.join('\n')
}

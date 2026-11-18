import type { FeatureId, ReportSection } from '../data/types'
import type { ReportSummary, SummaryItem, Tone } from './reportSummary'
import { TONE_TEXT } from './reportSummary'

export type PdfKpi = {
  label: string
  value: string
  tone: Tone
  note?: string
}

export type PdfRecommendation = {
  issue: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

function sectionOf(
  sections: ReportSection[],
  featureId: FeatureId,
): ReportSection | undefined {
  return sections.find((s) => s.featureId === featureId)
}

export function metricByLabel(
  sections: ReportSection[],
  featureId: FeatureId,
  labelPart: string,
): PdfKpi | null {
  const sec = sectionOf(sections, featureId)
  if (!sec) return null
  const m = sec.metrics.find((x) => x.label.includes(labelPart))
  if (!m) return null
  return {
    label: m.label,
    value: m.value,
    tone: (m.tone as Tone) || 'info',
    note: m.note,
  }
}

export function allMetrics(section?: ReportSection): PdfKpi[] {
  if (!section) return []
  return section.metrics.map((m) => ({
    label: m.label,
    value: m.value,
    tone: (m.tone as Tone) || 'info',
    note: m.note,
  }))
}

/** KPIهای سطح اول برای صفحهٔ اول — فقط از دادهٔ موجود. */
export function primaryKpis(sections: ReportSection[]): PdfKpi[] {
  const pick = (
    featureId: FeatureId,
    labelPart: string,
    fallbackLabel?: string,
  ): PdfKpi | null => {
    const m = metricByLabel(sections, featureId, labelPart)
    if (!m) return null
    return fallbackLabel ? { ...m, label: fallbackLabel } : m
  }

  const list = [
    pick('overall', 'سفارش', 'تعداد سفارش') ||
      pick('overall', 'تعداد', 'تعداد سفارش'),
    pick('overall', 'میانگین') || pick('overall', 'متوسط'),
    pick('overall', 'رضایت', 'رضایت مشتریان') ||
      pick('survey', 'رضایت', 'رضایت مشتریان'),
    pick('survey', 'مشارکت') || pick('overall', 'مشارکت'),
    pick('subscription', 'اشتراک', 'اشتراک‌گیری'),
    pick('balance', 'نرخ ازدست', 'نرخ ازدست‌رفته') ||
      pick('balance', 'از دست'),
    pick('balance', 'مشتریان یک سال', 'مشتریان یک سال اخیر') ||
      pick('balance', 'مشتری'),
    pick('balance', 'جدید', 'مشتری جدید'),
    pick('balance', 'فعال ماه', 'فعال ماه اخیر'),
    pick('panelCharge', 'بدون شارژ') || pick('panelCharge', 'شارژ'),
    pick('connection', 'قطع') || pick('connection', 'اتصال'),
  ].filter(Boolean) as PdfKpi[]

  // حداکثر ۸ تا برای صفحهٔ اول؛ تکراری با همان مقدار حذف شود
  const seen = new Set<string>()
  const out: PdfKpi[] = []
  for (const k of list) {
    const key = `${k.label}|${k.value}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(k)
    if (out.length >= 8) break
  }
  return out
}

export function executiveNarrative(
  sections: ReportSection[],
  summary: ReportSummary,
): string {
  const parts: string[] = []
  const sat =
    metricByLabel(sections, 'overall', 'رضایت') ||
    metricByLabel(sections, 'survey', 'رضایت')
  const orders =
    metricByLabel(sections, 'overall', 'سفارش') ||
    metricByLabel(sections, 'overall', 'تعداد')
  const engage =
    metricByLabel(sections, 'survey', 'مشارکت') ||
    metricByLabel(sections, 'overall', 'مشارکت')
  const sub = metricByLabel(sections, 'subscription', 'اشتراک')

  if (orders) parts.push(`در این بازه ${orders.value} سفارش ثبت شده است.`)
  if (sat) {
    parts.push(
      sat.tone === 'bad' || sat.tone === 'warn'
        ? `رضایت مشتریان ${sat.value} است و نیازمند توجه است.`
        : `رضایت مشتریان ${sat.value} گزارش شده است.`,
    )
  }
  if (engage) {
    parts.push(
      engage.tone === 'bad' || engage.tone === 'warn'
        ? `مشارکت در نظرسنجی (${engage.value}) پایین‌تر از سطح مطلوب است.`
        : `مشارکت نظرسنجی ${engage.value} است.`,
    )
  }
  if (sub) parts.push(`وضعیت اشتراک‌گیری: ${sub.value}.`)

  if (summary.bad[0]) {
    parts.push(`مهم‌ترین موضوع قابل اقدام: ${summary.bad[0].text}.`)
  } else if (summary.warn[0]) {
    parts.push(`مهم‌ترین فرصت بهبود: ${summary.warn[0].text}.`)
  } else if (summary.ok[0]) {
    parts.push(`نقطهٔ قوت برجسته: ${summary.ok[0].text}.`)
  }

  if (parts.length === 0) {
    return 'برای این بازه دادهٔ کافی جهت خلاصهٔ اجرایی در دسترس نیست.'
  }
  return parts.join(' ')
}

export function statusColumns(summary: ReportSummary): {
  strengths: SummaryItem[]
  actions: SummaryItem[]
  opportunities: SummaryItem[]
} {
  return {
    strengths: summary.ok.slice(0, 4),
    actions: summary.bad.slice(0, 4),
    opportunities: summary.warn.slice(0, 4),
  }
}

function actionFor(item: SummaryItem): string {
  const t = `${item.section} ${item.text}`
  if (/نظرسنجی|مشارکت|پاسخ/.test(t)) {
    return 'فرآیند دعوت و یادآوری نظرسنجی را بازبینی کنید.'
  }
  if (/رضایت|شکایت/.test(t)) {
    return 'موارد نارضایتی را اولویت‌بندی و پیگیری کنید.'
  }
  if (/اشتراک/.test(t)) {
    return 'مسیر عضویت در نقطهٔ فروش و پیام‌های دعوت را تقویت کنید.'
  }
  if (/ازدست|وفادار|فعال/.test(t)) {
    return 'کمپین بازگردانی برای مشتریان کم‌فعال طراحی کنید.'
  }
  if (/شارژ|پیامک|SMS|اس‌ام‌اس/i.test(t)) {
    return 'موجودی شارژ پیامک و پایداری ارسال را بررسی کنید.'
  }
  if (/قطع|اتصال/.test(t)) {
    return 'وضعیت اتصال شعبه و روزهای قطع را با پشتیبانی فنی چک کنید.'
  }
  if (/اعتبار|باشگاه|گروه/.test(t)) {
    return 'تنظیمات باشگاه و گروه‌های مشتریان را بازبینی کنید.'
  }
  if (/برند|لوگو|ارزیابی/.test(t)) {
    return 'تنظیمات برند و وضعیت ارزیابی را تکمیل کنید.'
  }
  return 'موضوع را در جلسهٔ بعدی با مسئول شعبه بررسی و اقدام مشخص تعریف کنید.'
}

/** پیشنهاد اقدام فقط از یافته‌های واقعی خلاصه. */
export function recommendationsFromSummary(
  summary: ReportSummary,
): PdfRecommendation[] {
  const items: { item: SummaryItem; priority: 'high' | 'medium' | 'low' }[] =
    [
      ...summary.bad.slice(0, 4).map((item) => ({
        item,
        priority: 'high' as const,
      })),
      ...summary.warn.slice(0, 3).map((item) => ({
        item,
        priority: 'medium' as const,
      })),
      ...summary.nodata.slice(0, 2).map((item) => ({
        item,
        priority: 'low' as const,
      })),
    ]
  const seen = new Set<string>()
  const out: PdfRecommendation[] = []
  for (const { item, priority } of items) {
    if (seen.has(item.text)) continue
    seen.add(item.text)
    out.push({
      issue: item.text,
      action: actionFor(item),
      priority,
    })
    if (out.length >= 6) break
  }
  return out
}

export function toneLabel(tone: Tone): string {
  return TONE_TEXT[tone] ?? ''
}

export function sectionBundle(
  sections: ReportSection[],
  ids: FeatureId[],
): ReportSection[] {
  return ids
    .map((id) => sectionOf(sections, id))
    .filter((s): s is ReportSection => Boolean(s))
}

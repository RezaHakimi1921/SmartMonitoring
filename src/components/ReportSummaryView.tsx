import { Ico } from './make/icons'
import type { FeatureId, ReportSection } from '../data/types'
import type { ReportSummary, Tone } from '../lib/reportSummary'
import { TONE_TEXT } from '../lib/reportSummary'
import { toFaDigits } from '../lib/jalali'
import styles from '../pages/ReportPage.module.css'

type Kpi = {
  id: string
  label: string
  value: string
  detail: string
  tone: Tone
}

function metricFrom(
  sections: ReportSection[],
  featureId: FeatureId,
  labelPart?: string,
): { value: string; tone: Tone } | null {
  const sec = sections.find((s) => s.featureId === featureId)
  if (!sec) return null
  const m = labelPart
    ? sec.metrics.find((x) => x.label.includes(labelPart))
    : sec.metrics[0]
  if (!m) return null
  return { value: m.value, tone: (m.tone as Tone) || 'info' }
}

function parsePct(value: string): number | null {
  const n = Number(
    String(value)
      .replace(/[^\d.,]/g, '')
      .replace(',', '.')
      .replace(/[^\d.]/g, ''),
  )
  return Number.isFinite(n) ? n : null
}

function overallScore(sections: ReportSection[], summary: ReportSummary): number {
  const pcts: number[] = []
  for (const s of sections) {
    for (const m of s.metrics) {
      const p = parsePct(m.value)
      if (p != null && String(m.value).includes('%')) pcts.push(p)
    }
  }
  if (pcts.length > 0) {
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
  }
  const weight = { ok: 88, warn: 68, bad: 42, nodata: 50, info: 70 } as const
  const tones: Tone[] = []
  for (const s of sections) {
    for (const m of s.metrics) if (m.tone) tones.push(m.tone as Tone)
  }
  if (tones.length === 0) {
    if (summary.bad.length) return 48
    if (summary.warn.length) return 68
    if (summary.ok.length) return 86
    return 0
  }
  return Math.round(
    tones.reduce((a, t) => a + (weight[t] ?? 70), 0) / tones.length,
  )
}

export function buildLiveKpis(sections: ReportSection[]): Kpi[] {
  const sat = metricFrom(sections, 'overall', 'رضایت') ||
    metricFrom(sections, 'survey', 'رضایت')
  const sub = metricFrom(sections, 'subscription', 'اشتراک')
  const conn = metricFrom(sections, 'connection')
  const charge =
    metricFrom(sections, 'panelCharge') || metricFrom(sections, 'credit')

  const detailFor = (tone: Tone, fallback: string) => {
    if (tone === 'ok') return fallback || TONE_TEXT.ok
    if (tone === 'warn') return TONE_TEXT.warn
    if (tone === 'bad') return TONE_TEXT.bad
    if (tone === 'nodata') return TONE_TEXT.nodata
    return fallback
  }

  return [
    {
      id: 'satisfaction',
      label: 'رضایت مشتریان',
      value: sat?.value ?? '—',
      detail: detailFor(sat?.tone ?? 'info', '۴٪ رشد'),
      tone: sat?.tone ?? 'info',
    },
    {
      id: 'subscription',
      label: 'وضعیت اشتراک',
      value: sub?.value ?? '—',
      detail: detailFor(sub?.tone ?? 'info', 'عالی'),
      tone: sub?.tone ?? 'info',
    },
    {
      id: 'connection',
      label: 'کیفیت اتصال',
      value: conn?.value ?? '—',
      detail: detailFor(conn?.tone ?? 'info', TONE_TEXT.warn),
      tone: conn?.tone ?? 'info',
    },
    {
      id: 'charge',
      label: 'شارژ و اعتبار',
      value: charge?.value ?? '—',
      detail: detailFor(charge?.tone ?? 'info', TONE_TEXT.bad),
      tone: charge?.tone ?? 'info',
    },
  ]
}

export function ReportSummaryView({
  sections,
  summary,
  loadingCount,
  onFollowUps,
}: {
  sections: ReportSection[]
  summary: ReportSummary
  loadingCount: number
  onFollowUps: () => void
}) {
  const score = overallScore(sections, summary)
  const kpis = buildLiveKpis(sections)

  const badge =
    summary.bad.length > 2
      ? 'نیازمند پیگیری'
      : summary.warn.length > 0 || summary.bad.length > 0
        ? 'وضعیت قابل بهبود'
        : score > 0
          ? 'وضعیت خوب'
          : 'در حال بارگذاری'

  const title =
    summary.bad.length > 0
      ? 'چند موضوع مهم برای پیگیری دارید'
      : summary.warn.length > 0
        ? 'عملکرد مجموعه پایدار است، با چند نقطهٔ قابل بهبود'
        : 'عملکرد مجموعه پایدار است'

  const bodyParts = [
    ...summary.bad.slice(0, 2).map((x) => x.text),
    ...summary.warn.slice(0, 1).map((x) => x.text),
  ]
  const body =
    bodyParts.length > 0
      ? bodyParts.join(' · ')
      : summary.ok[0]?.text ||
        (loadingCount > 0
          ? `هنوز ${toFaDigits(loadingCount)} بخش در حال بارگذاری است.`
          : 'شاخص‌های اصلی در محدودهٔ مطلوب هستند.')

  const aiBody =
    [
      summary.bad[0]?.text,
      summary.bad[1]?.text,
      summary.warn[0]?.text,
    ]
      .filter(Boolean)
      .join(' ') ||
    'رضایت کلی در بازهٔ انتخابی قابل قبول است. پیشنهاد می‌شود بخش‌ها را مرور و موارد پیگیری را ثبت کنید.'

  const circumference = 2 * Math.PI * 40
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference

  return (
    <div className={styles.summary}>
      <div className={styles.mainCard}>
        <div className={styles.scoreCard}>
          <div className={styles.scoreBig}>
            <svg viewBox="0 0 96 96" className={styles.scoreRing}>
              <circle cx="48" cy="48" r="40" className={styles.scoreTrack} />
              <circle
                cx="48"
                cy="48"
                r="40"
                className={styles.scoreValue}
                style={{
                  strokeDasharray: `${dash} ${circumference}`,
                }}
              />
            </svg>
            <div className={styles.scoreNumWrap}>
              <div className={styles.scoreNum}>
                {score > 0 ? toFaDigits(score) : '…'}
              </div>
              <div className={styles.scoreOf}>از ۱۰۰</div>
            </div>
          </div>
          <div className={styles.scoreCopy}>
            <span className={styles.badge}>{badge}</span>
            <h2>{title}</h2>
            <p>{body}</p>
            <div className={styles.scoreMeta}>
              <span>
                {toFaDigits(summary.ok.length)} مورد خوب ·{' '}
                {toFaDigits(summary.warn.length)} قابل بهبود ·{' '}
                {toFaDigits(summary.bad.length)} نیازمند اقدام
              </span>
            </div>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          {kpis.map((k) => {
            const icoClass =
              k.tone === 'bad'
                ? styles.kpiIcoBad
                : k.tone === 'warn'
                  ? styles.kpiIcoWarn
                  : styles.kpiIco
            const detailClass =
              k.tone === 'bad'
                ? styles.kpiDetailBad
                : k.tone === 'warn'
                  ? styles.kpiDetailWarn
                  : styles.kpiDetailOk
            return (
              <div key={k.id} className={styles.kpi}>
                <div className={styles.kpiTop}>
                  <span className={icoClass}>
                    {k.tone === 'ok' ? Ico.check : '↗'}
                  </span>
                  <span className={styles.kpiLabel}>{k.label}</span>
                </div>
                <div className={styles.kpiValue}>{k.value}</div>
                <div className={detailClass}>{k.detail}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.ai}>
        <div className={styles.aiIco}>{Ico.spark}</div>
        <div className={styles.aiBody}>
          <div className={styles.aiTitle}>جمع‌بندی دیدبان</div>
          <p>{aiBody}</p>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onFollowUps}>
          دیدن پیگیری‌ها
          <span aria-hidden>‹</span>
        </button>
      </div>
    </div>
  )
}

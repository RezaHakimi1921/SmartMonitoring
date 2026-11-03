import type { ReportSection } from '../data/types'
import type { ReportSummary, SummaryItem } from '../lib/reportSummary'

type Props = {
  typeTitle: string
  place: string
  periodLabel: string
  reportDate: string
  sections: ReportSection[]
  diagTitles: string[]
  summary: ReportSummary
}

function SummaryList({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'ok' | 'warn' | 'bad' | 'nodata'
  items: SummaryItem[]
}) {
  if (items.length === 0) return null
  return (
    <div className={`pdf-sum pdf-sum-${tone}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((i, idx) => (
          <li key={`${i.section}-${idx}`}>
            <span>{i.section}</span>
            {i.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * ورق خارج از صفحه برای ساخت PDF. هر `.pdf-block` جدا گرفته و در صفحه‌بندی
 * کامل در یک صفحه چیده می‌شود.
 */
export function ExportSheet({
  typeTitle,
  place,
  periodLabel,
  reportDate,
  sections,
  diagTitles,
  summary,
}: Props) {
  const hasSummary =
    summary.bad.length +
      summary.warn.length +
      summary.ok.length +
      summary.nodata.length >
    0
  return (
    <div className="export-sheet" dir="rtl">
      <header className="pdf-block export-head">
        <div>
          <div className="export-kicker">{typeTitle}</div>
          <h1>{place}</h1>
          <p>بازه بررسی: {periodLabel}</p>
        </div>
        <p className="export-date">تاریخ گزارش: {reportDate}</p>
      </header>

      {hasSummary ? (
        <section className="pdf-block export-block">
          <h2>خلاصه وضعیت</h2>
          <SummaryList title="❌ نیاز به اقدام" tone="bad" items={summary.bad} />
          <SummaryList title="⚠️ قابل بهبود" tone="warn" items={summary.warn} />
          <SummaryList title="✅ نقاط قوت" tone="ok" items={summary.ok} />
          <SummaryList
            title="ℹ️ داده در دسترس نیست"
            tone="nodata"
            items={summary.nodata}
          />
        </section>
      ) : null}

      {sections.map((section) => (
        <section key={section.featureId} className="pdf-block export-block">
          <h2>{section.title}</h2>
          <ul className="pdf-metrics">
            {section.metrics.map((m) => (
              <li key={m.label}>
                <span>{m.label}</span>
                <strong className={`pdf-tone-${m.tone ?? 'info'}`}>
                  {m.value}
                </strong>
              </li>
            ))}
          </ul>
          {section.rows ? (
            <ul className="pdf-metrics pdf-rows">
              {section.rows.map((r) => (
                <li key={r.label}>
                  <span>{r.label}</span>
                  <strong>{r.value}</strong>
                </li>
              ))}
            </ul>
          ) : null}
          {section.hints?.map((h) => (
            <p key={h.text} className={`export-note ${h.tone ?? ''}`}>
              {h.text}
            </p>
          ))}
        </section>
      ))}

      {diagTitles.length > 0 ? (
        <section className="pdf-block export-block">
          <h2>نکات قابل پیگیری</h2>
          <ul className="export-diag-list">
            {diagTitles.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

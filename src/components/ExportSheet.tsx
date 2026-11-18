import type { ReactNode } from 'react'
import type { FeatureId, ReportSection } from '../data/types'
import type { ReportSummary, SummaryItem, Tone } from '../lib/reportSummary'
import {
  allMetrics,
  executiveNarrative,
  primaryKpis,
  recommendationsFromSummary,
  sectionBundle,
  statusColumns,
  toneLabel,
  type PdfKpi,
} from '../lib/pdfReportModel'
import styles from './ExportSheet.module.css'

type Props = {
  typeTitle: string
  brandName: string
  branchName: string
  place: string
  periodLabel: string
  reportDate: string
  sections: ReportSection[]
  diagTitles: string[]
  summary: ReportSummary
}

function kpiClass(tone: Tone): string {
  if (tone === 'ok') return styles.kpiOk
  if (tone === 'warn') return styles.kpiWarn
  if (tone === 'bad') return styles.kpiBad
  if (tone === 'nodata') return styles.kpiNodata
  return styles.kpiInfo
}

function valueClass(tone: Tone): string {
  if (tone === 'ok') return styles.toneOk
  if (tone === 'warn') return styles.toneWarn
  if (tone === 'bad') return styles.toneBad
  if (tone === 'nodata') return styles.toneNodata
  return styles.toneInfo
}

function badgeClass(tone: Tone): string {
  if (tone === 'ok') return styles.badgeOk
  if (tone === 'warn') return styles.badgeWarn
  if (tone === 'bad') return styles.badgeBad
  return styles.badge
}

function MetricList({ items }: { items: PdfKpi[] }) {
  if (items.length === 0) return <p className={styles.empty}>داده‌ای نیست</p>
  return (
    <div className={styles.metricRows}>
      {items.map((m) => (
        <div key={`${m.label}-${m.value}`} className={styles.metricRow}>
          <div className={styles.metricRowLabel}>{m.label}</div>
          <div className={`${styles.metricRowValue} ${valueClass(m.tone)}`}>
            {m.value}
          </div>
          <span className={badgeClass(m.tone)}>{toneLabel(m.tone)}</span>
        </div>
      ))}
    </div>
  )
}

function StatusCol({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'ok' | 'warn' | 'bad'
  items: SummaryItem[]
}) {
  const cls =
    tone === 'ok'
      ? styles.statusOk
      : tone === 'bad'
        ? styles.statusBad
        : styles.statusWarn
  return (
    <div className={cls}>
      <h3 className={styles.statusHead}>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.statusEmpty}>موردی ثبت نشده</p>
      ) : (
        <ul className={styles.statusList}>
          {items.map((i, idx) => (
            <li key={`${i.section}-${idx}`}>
              <span>{i.section}</span>
              {i.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SectionBlock({
  title,
  section,
  extra,
}: {
  title: string
  section?: ReportSection
  extra?: ReactNode
}) {
  if (!section && !extra) return null
  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {section ? <MetricList items={allMetrics(section)} /> : null}
      {section?.rows && section.rows.length > 0 ? (
        <table className={styles.rowsTable} style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>عنوان</th>
              <th>مقدار</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {section?.hints?.slice(0, 3).map((h) => (
        <p
          key={h.text}
          className={
            h.tone === 'bad'
              ? styles.hintBad
              : h.tone === 'warn'
                ? styles.hintWarn
                : styles.hint
          }
        >
          {h.text}
        </p>
      ))}
      {extra}
    </div>
  )
}

/**
 * ورق خارج از صفحه برای ساخت PDF.
 * سه بلاک صفحه‌مانند (خلاصه اجرایی · عملکرد · عملیات و اقدام) با هویت دیدبان.
 */
export function ExportSheet({
  typeTitle,
  brandName,
  branchName,
  place,
  periodLabel,
  reportDate,
  sections,
  diagTitles,
  summary,
}: Props) {
  const kpis = primaryKpis(sections)
  const narrative = executiveNarrative(sections, summary)
  const cols = statusColumns(summary)
  const recs = recommendationsFromSummary(summary)

  const performanceIds: FeatureId[] = ['overall', 'subscription']
  const surveyIds: FeatureId[] = ['survey', 'complaints']
  const customerIds: FeatureId[] = ['balance', 'credit', 'creditGeneration']
  const clubIds: FeatureId[] = ['groups', 'brandSettings', 'event', 'smartBlock']
  const opsIds: FeatureId[] = ['panelCharge', 'connection']

  const performance = sectionBundle(sections, performanceIds)
  const survey = sectionBundle(sections, surveyIds)
  const customer = sectionBundle(sections, customerIds)
  const club = sectionBundle(sections, clubIds)
  const ops = sectionBundle(sections, opsIds)

  // هر بخش استفاده‌نشده در صفحات ۱–۳ را در انتهای صفحه ۳ اضافه کن تا داده از دست نرود
  const covered = new Set<FeatureId>([
    ...performanceIds,
    ...surveyIds,
    ...customerIds,
    ...clubIds,
    ...opsIds,
  ])
  const leftovers = sections.filter((s) => !covered.has(s.featureId))

  const branchLine =
    branchName && branchName !== brandName ? branchName : place

  return (
    <div className={styles.sheet} dir="rtl">
      {/* PAGE 1 — Executive overview */}
      <section className={`pdf-block ${styles.page}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>{typeTitle}</p>
            <h1 className={styles.brand}>{brandName}</h1>
            {branchLine ? <p className={styles.branch}>{branchLine}</p> : null}
            <p className={styles.meta}>بازه بررسی: {periodLabel}</p>
          </div>
          <div className={styles.dateBox}>
            تاریخ گزارش
            <strong>{reportDate}</strong>
          </div>
        </header>

        <div>
          <h2 className={styles.sectionTitle}>خلاصه اجرایی</h2>
          <div className={styles.executive}>
            <p>{narrative}</p>
          </div>
        </div>

        {kpis.length > 0 ? (
          <div>
            <h2 className={styles.sectionTitle}>شاخص‌های کلیدی</h2>
            <div className={styles.kpiGrid}>
              {kpis.map((k) => (
                <div key={`${k.label}-${k.value}`} className={kpiClass(k.tone)}>
                  <div className={styles.kpiLabel}>{k.label}</div>
                  <div className={styles.kpiValue}>{k.value}</div>
                  {k.note ? <div className={styles.kpiNote}>{k.note}</div> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className={styles.sectionTitle}>وضعیت کلی</h2>
          <div className={styles.statusGrid}>
            <StatusCol title="نقاط قوت" tone="ok" items={cols.strengths} />
            <StatusCol title="نیاز به اقدام" tone="bad" items={cols.actions} />
            <StatusCol
              title="فرصت بهبود"
              tone="warn"
              items={cols.opportunities}
            />
          </div>
        </div>

        <p className={styles.footerNote}>
          صفحه ۱ · مرور اجرایی · {brandName}
        </p>
      </section>

      {/* PAGE 2 — Performance & engagement */}
      <section className={`pdf-block ${styles.page}`}>
        <h2 className={styles.sectionTitle}>عملکرد فروش و عملیات</h2>
        <div className={styles.twoCol}>
          {performance.map((s) => (
            <SectionBlock key={s.featureId} title={s.title} section={s} />
          ))}
          {performance.length === 0 ? (
            <p className={styles.empty}>بخش عملکرد در این گزارش انتخاب نشده است.</p>
          ) : null}
        </div>

        <h2 className={styles.sectionTitle}>مشتریان و وفاداری</h2>
        <div className={styles.twoCol}>
          {customer.map((s) => (
            <SectionBlock key={s.featureId} title={s.title} section={s} />
          ))}
          {customer.length === 0 ? (
            <p className={styles.empty}>بخش مشتریان در این گزارش انتخاب نشده است.</p>
          ) : null}
        </div>

        <h2 className={styles.sectionTitle}>نظرسنجی و بازخورد</h2>
        <div className={styles.twoCol}>
          {survey.map((s) => (
            <SectionBlock key={s.featureId} title={s.title} section={s} />
          ))}
          {survey.length === 0 ? (
            <p className={styles.empty}>بخش نظرسنجی در این گزارش انتخاب نشده است.</p>
          ) : null}
        </div>

        <p className={styles.footerNote}>
          صفحه ۲ · عملکرد و تعامل · {branchLine || brandName}
        </p>
      </section>

      {/* PAGE 3 — Ops, club, recommendations */}
      <section className={`pdf-block ${styles.page}`}>
        <div className={styles.twoCol}>
          <div>
            <h2 className={styles.sectionTitle}>باشگاه و ارزیابی برند</h2>
            {club.length === 0 ? (
              <p className={styles.empty}>داده‌ای انتخاب نشده است.</p>
            ) : (
              club.map((s) => (
                <div key={s.featureId} style={{ marginBottom: 10 }}>
                  <SectionBlock title={s.title} section={s} />
                </div>
              ))
            )}
          </div>
          <div>
            <h2 className={styles.sectionTitle}>ارتباط و عملیات</h2>
            {ops.length === 0 ? (
              <p className={styles.empty}>داده‌ای انتخاب نشده است.</p>
            ) : (
              ops.map((s) => (
                <div key={s.featureId} style={{ marginBottom: 10 }}>
                  <SectionBlock title={s.title} section={s} />
                </div>
              ))
            )}
          </div>
        </div>

        {leftovers.length > 0 ? (
          <div>
            <h2 className={styles.sectionTitle}>سایر بخش‌ها</h2>
            <div className={styles.twoCol}>
              {leftovers.map((s) => (
                <SectionBlock key={s.featureId} title={s.title} section={s} />
              ))}
            </div>
          </div>
        ) : null}

        {recs.length > 0 ? (
          <div>
            <h2 className={styles.sectionTitle}>پیشنهادهای اقدام</h2>
            <div className={styles.recList}>
              {recs.map((r, i) => (
                <div key={`${r.issue}-${i}`} className={styles.recItem}>
                  <span
                    className={
                      r.priority === 'high'
                        ? styles.recHigh
                        : r.priority === 'medium'
                          ? styles.recMed
                          : styles.recLow
                    }
                  >
                    {r.priority === 'high'
                      ? 'اولویت بالا'
                      : r.priority === 'medium'
                        ? 'اولویت متوسط'
                        : 'پیگیری'}
                  </span>
                  <div>
                    <p className={styles.recIssue}>{r.issue}</p>
                    <p className={styles.recAction}>{r.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {diagTitles.length > 0 ? (
          <div>
            <h2 className={styles.sectionTitle}>نکات قابل پیگیری</h2>
            <ul className={styles.diagList}>
              {diagTitles.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className={styles.footerNote}>
          صفحه ۳ · عملیات و اقدام · بازه: {periodLabel}
        </p>
      </section>
    </div>
  )
}

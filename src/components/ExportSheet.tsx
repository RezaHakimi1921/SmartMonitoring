import type { ReportSection } from '../data/types'

type Props = {
  typeTitle: string
  brandName: string
  branchName: string
  periodLabel: string
  sections: ReportSection[]
  diagTitles: string[]
}

/** Compact solid A4 sheet for PNG/PDF — no glass/blur (breaks capture). */
export function ExportSheet({
  typeTitle,
  brandName,
  branchName,
  periodLabel,
  sections,
  diagTitles,
}: Props) {
  return (
    <div className="export-sheet" dir="rtl">
      <header className="export-head">
        <div>
          <div className="export-kicker">{typeTitle}</div>
          <h1>
            {brandName}
            {branchName && branchName !== brandName ? ` — ${branchName}` : ''}
          </h1>
          <p>بازه بررسی: {periodLabel}</p>
        </div>
        <div className="export-flags">
          <span>بعد از تمدید ✅</span>
          <span>تیک اتمام حجت ندارد ❌</span>
        </div>
      </header>

      <div className="export-grid">
        {sections.map((section) => (
          <section key={section.featureId} className="export-block">
            <h2>{section.title}</h2>
            <ul>
              {section.metrics.map((m) => (
                <li key={m.label}>
                  <span>{m.label}</span>
                  <strong>{m.value}</strong>
                </li>
              ))}
            </ul>
            {section.hints?.slice(0, 2).map((h) => (
              <p key={h.text} className={`export-note ${h.tone ?? ''}`}>
                {h.text}
              </p>
            ))}
          </section>
        ))}
      </div>

      {diagTitles.length > 0 ? (
        <section className="export-block export-diag">
          <h2>نکات قابل پیگیری</h2>
          <ul className="export-diag-list">
            {diagTitles.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="export-foot">گزارش مانیتورینگ باشگاه مشتریان</footer>
    </div>
  )
}

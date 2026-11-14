import { useMemo, useState } from 'react'
import {
  DIAG_ITEMS,
  REPORT_KPIS,
  REPORT_SUMMARY,
  sectionsForTemplate,
  toFa,
  type Brand,
  type DiagItem,
  type Section,
  type Template,
} from '../data/demo'
import { Ico } from '../icons'

type ReportStage = 'summary' | 'section' | 'diag' | 'send'

const STAGES: { id: ReportStage; label: string; n: number }[] = [
  { id: 'summary', label: 'خلاصه گزارش', n: 1 },
  { id: 'section', label: 'بررسی بخش‌ها', n: 2 },
  { id: 'diag', label: 'نکات پیگیری', n: 3 },
  { id: 'send', label: 'ارسال گزارش', n: 4 },
]

export function ReportPage({
  brand,
  template,
  periodLabel,
  onBack,
  onGotoInbox,
}: {
  brand: Brand
  template: Template
  periodLabel: string
  onBack: () => void
  onGotoInbox: () => void
}) {
  const sections = useMemo(
    () => sectionsForTemplate(template.id),
    [template.id],
  )
  const [stage, setStage] = useState<ReportStage>('summary')
  const [sectionIdx, setSectionIdx] = useState(0)
  const [diag, setDiag] = useState<DiagItem[]>(() =>
    DIAG_ITEMS.map((d) => ({ ...d })),
  )
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const section = sections[sectionIdx] ?? sections[0]!
  const score = REPORT_SUMMARY.score

  const goNext = () => {
    if (stage === 'summary') {
      setStage('section')
      setSectionIdx(0)
      return
    }
    if (stage === 'section') {
      if (sectionIdx < sections.length - 1) setSectionIdx((i) => i + 1)
      else setStage('diag')
      return
    }
    if (stage === 'diag') {
      setStage('send')
      return
    }
    setSent(true)
  }

  const goPrev = () => {
    if (stage === 'send') {
      setStage('diag')
      return
    }
    if (stage === 'diag') {
      setStage('section')
      setSectionIdx(sections.length - 1)
      return
    }
    if (stage === 'section') {
      if (sectionIdx > 0) setSectionIdx((i) => i - 1)
      else setStage('summary')
      return
    }
    onBack()
  }

  const primary =
    stage === 'summary'
      ? 'ادامه بررسی'
      : stage === 'section'
        ? sectionIdx < sections.length - 1
          ? 'بخش بعدی'
          : 'نکات پیگیری'
        : stage === 'diag'
          ? 'رفتن به ارسال'
          : sent
            ? 'رفتن به صندوق گزارش'
            : 'ثبت ارسال'

  return (
    <section className="stage report-stage">
      <div className="rp-head">
        <div>
          <h1>{brand.name}</h1>
          <p>
            {template.title} · {periodLabel} · آخرین بروزرسانی همین حالا
          </p>
        </div>
        <div className="rp-actions">
          <button type="button" className="btn btn-ghost">
            بروزرسانی
          </button>
          <button type="button" className="btn btn-ghost">
            خروجی PDF
          </button>
        </div>
      </div>

      <div className="rp-steps">
        {STAGES.map((s) => {
          const active = stage === s.id
          const idx = STAGES.findIndex((x) => x.id === stage)
          const done = STAGES.findIndex((x) => x.id === s.id) < idx
          return (
            <button
              key={s.id}
              type="button"
              className={`rp-step ${active ? 'on' : ''} ${done ? 'done' : ''}`}
              onClick={() => setStage(s.id)}
            >
              <span className="rp-num">
                {done && !active ? Ico.check : toFa(s.n)}
              </span>
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="panel-wrap">
        {stage === 'summary' ? <SummaryFigma onFollow={() => setStage('diag')} /> : null}

        {stage === 'section' ? (
          <SectionView
            section={section}
            index={sectionIdx}
            total={sections.length}
          />
        ) : null}

        {stage === 'diag' ? (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-icon">{Ico.list}</div>
              <div>
                <h2>نکات پیگیری</h2>
                <div className="sub">
                  {toFa(diag.filter((d) => d.done).length)} از{' '}
                  {toFa(diag.length)} انجام شده
                </div>
              </div>
            </div>
            <div className="diag-list">
              {diag.map((d) => (
                <label key={d.id} className={`diag-row ${d.done ? 'done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={d.done}
                    onChange={() =>
                      setDiag((prev) =>
                        prev.map((x) =>
                          x.id === d.id ? { ...x, done: !x.done } : x,
                        ),
                      )
                    }
                  />
                  <div>
                    <div className="diag-title">{d.title}</div>
                    {d.note ? <div className="diag-note">{d.note}</div> : null}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {stage === 'send' ? (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-icon">{Ico.send}</div>
              <div>
                <h2>ارسال گزارش</h2>
                <div className="sub">پیام مشتری و آماده‌سازی PDF</div>
              </div>
            </div>
            {sent ? (
              <div className="sent-banner">
                ارسال ثبت شد · گزارش در صندوق قرار گرفت
              </div>
            ) : null}
            <div className="send-grid">
              <div className="send-box">
                <div className="send-label">پیام مشتری</div>
                <textarea
                  rows={8}
                  readOnly
                  value={[
                    `سلام، گزارش «${template.title}» برای ${brand.name} آماده شد.`,
                    `امتیاز کلی: ${toFa(score)}`,
                    REPORT_SUMMARY.aiBody,
                    'در صورت نیاز هماهنگ می‌کنیم.',
                  ].join('\n\n')}
                />
              </div>
              <div className="send-box">
                <div className="send-label">یادداشت داخلی</div>
                <textarea
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="یادداشت فقط برای تیم…"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="footer">
        <div className="hint">
          <span style={{ color: '#668100' }}>{Ico.check}</span>
          تغییرات به‌صورت خودکار ذخیره می‌شود
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={goPrev}>
            {stage === 'summary' ? 'بازگشت به ویزارد' : 'مرحله قبل'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (sent) onGotoInbox()
              else goNext()
            }}
          >
            {Ico.arrow}
            {primary}
          </button>
        </div>
      </footer>
    </section>
  )
}

function SummaryFigma({ onFollow }: { onFollow: () => void }) {
  const s = REPORT_SUMMARY
  return (
    <div className="rp-summary">
      <div className="rp-main-card">
        {/* In RTL grid, first child sits on the right — matches Figma score+gauge */}
        <div className="rp-score-card">
          <div className="score-big lg">
            <svg viewBox="0 0 96 96" className="score-ring">
              <circle cx="48" cy="48" r="40" className="score-track" />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="score-value"
                style={{
                  strokeDasharray: `${(s.score / 100) * 251} 251`,
                }}
              />
            </svg>
            <div className="score-num-wrap">
              <div className="score-num">{toFa(s.score)}</div>
              <div className="score-of">از ۱۰۰</div>
            </div>
          </div>
          <div className="rp-score-copy">
            <span className="rp-badge">{s.badge}</span>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
            <div className="rp-score-meta">
              <span>↗ {s.growth}</span>
              <span>
                {Ico.users} {s.customers}
              </span>
            </div>
          </div>
        </div>

        <div className="rp-kpi-grid">
          {REPORT_KPIS.map((k) => (
            <div key={k.id} className={`rp-kpi tone-${k.tone}`}>
              <div className="rp-kpi-top">
                <span className={`rp-kpi-ico tone-${k.tone}`}>
                  {k.icon === 'check' ? Ico.check : '↗'}
                </span>
                <span className="rp-kpi-label">{k.label}</span>
              </div>
              <div className="rp-kpi-value">{k.value}</div>
              <div className={`rp-kpi-detail tone-${k.tone}`}>{k.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rp-ai">
        <div className="rp-ai-ico">{Ico.spark}</div>
        <div className="rp-ai-body">
          <div className="rp-ai-title">{s.aiTitle}</div>
          <p>{s.aiBody}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onFollow}>
          دیدن پیگیری‌ها
          <span aria-hidden>‹</span>
        </button>
      </div>
    </div>
  )
}

function SectionView({
  section,
  index,
  total,
}: {
  section: Section
  index: number
  total: number
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-icon">{Ico.chart}</div>
        <div>
          <h2>{section.title}</h2>
          <div className="sub">
            بخش {toFa(index + 1)} از {toFa(total)} · امتیاز {toFa(section.score)}
          </div>
        </div>
      </div>
      <div className="metric-grid">
        {section.metrics.map((m) => (
          <div key={m.label} className={`metric-card tone-${m.tone}`}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>
      {section.hints.length ? (
        <ul className="hint-list">
          {section.hints.map((h, i) => (
            <li key={i} className={`hint-item tone-${h.tone}`}>
              {h.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

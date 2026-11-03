import { useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ExportSheet } from '../components/ExportSheet'
import { DIAG_ITEMS } from '../data/diagCatalog'
import { buildMockSections } from '../data/mockReport'
import { periodLabel, type PeriodKey } from '../data/periods'
import type { FeatureId } from '../data/types'
import { exportElementAsPdf, exportElementAsPng } from '../lib/exportReport'
import { formatJalaliLong, toFaDigits, todayJalali } from '../lib/jalali'
import { loadReviewTypes } from '../lib/storage'

export function ReportPage() {
  const { typeId = '' } = useParams()
  const [params] = useSearchParams()
  const exportRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null)
  const [toast, setToast] = useState('')

  const type = loadReviewTypes().find((t) => t.id === typeId)
  const brandName = params.get('brandName') ?? 'مجموعه'
  const branchName = params.get('branchName') ?? ''
  const period = (params.get('period') as PeriodKey) || '1m'
  const fromDate = params.get('from') ?? undefined
  const toDate = params.get('to') ?? undefined
  const rangeText = periodLabel(period, fromDate, toDate)
  const reportDate = formatJalaliLong(todayJalali())

  const featureIds = useMemo(() => {
    const raw = params.get('features')
    if (raw) return raw.split(',').filter(Boolean) as FeatureId[]
    if (!type) return [] as FeatureId[]
    return Object.entries(type.features)
      .filter(([, mode]) => mode === 'required' || mode === 'defaultOn')
      .map(([id]) => id as FeatureId)
  }, [params, type])

  const diagTitles = useMemo(() => {
    const raw = params.get('diag')
    if (!raw) return [] as string[]
    const ids = new Set(
      raw
        .split(',')
        .map((x) => Number(x))
        .filter((n) => !Number.isNaN(n)),
    )
    return DIAG_ITEMS.filter((d) => ids.has(d.id)).map((d) => d.title)
  }, [params])

  const sections = buildMockSections(featureIds)
  const fileBase = `${type?.title ?? 'report'}-${brandName}`
    .replace(/[\\/:*?"<>|]/g, '-')

  const runExport = async (kind: 'png' | 'pdf') => {
    if (!exportRef.current) return
    setBusy(kind)
    try {
      if (kind === 'png') await exportElementAsPng(exportRef.current, fileBase)
      else await exportElementAsPdf(exportRef.current, fileBase)
      setToast(kind === 'png' ? 'عکس گزارش دانلود شد' : 'فایل PDF گزارش دانلود شد')
      window.setTimeout(() => setToast(''), 2200)
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'ساخت فایل ناموفق بود. دوباره تلاش کنید.')
      window.setTimeout(() => setToast(''), 2800)
    } finally {
      setBusy(null)
    }
  }

  if (!type) {
    return (
      <div className="panel">
        <p>این گزارش پیدا نشد. لطفاً از ابتدا شروع کنید.</p>
        <Link className="btn btn-secondary" to="/">
          بازگشت به صفحه اول
        </Link>
      </div>
    )
  }

  const place =
    branchName && branchName !== brandName
      ? `${brandName} — ${branchName}`
      : brandName

  return (
    <>
      <div className="report-notice no-export">
        داده‌های این گزارش فعلاً <strong>نمونه</strong> است و هنوز به سیستم‌های
        اصلی وصل نشده.
      </div>

      <div className="report-actions no-export">
        <div className="report-actions-main">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!!busy}
            onClick={() => void runExport('pdf')}
          >
            {busy === 'pdf' ? 'در حال ساخت…' : 'دانلود PDF'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!!busy}
            onClick={() => void runExport('png')}
          >
            {busy === 'png' ? 'در حال ساخت…' : 'دانلود عکس'}
          </button>
        </div>
        <div className="actions">
          <Link to={`/setup/${type.id}`} className="btn btn-ghost">
            تغییر مجموعه یا بازه
          </Link>
          <Link to="/" className="btn btn-ghost">
            بررسی جدید
          </Link>
        </div>
      </div>

      <div className="report-sections">
        <section className="hero" style={{ padding: '22px 24px' }}>
          <div>
            <div className="card-kicker" style={{ color: '#99f6e4' }}>
              {type.title}
            </div>
            <h2 style={{ marginTop: 8 }}>{place}</h2>
            <p>بازه بررسی: {rangeText}</p>
            <p>تاریخ گزارش: {reportDate}</p>
          </div>
          <div className="actions" style={{ justifyContent: 'flex-end' }}>
            <span
              className="chip"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#ecfeff' }}
            >
              {toFaDigits(sections.length)} بخش · {toFaDigits(diagTitles.length)} نکته
            </span>
          </div>
        </section>

        {sections.map((section) => (
          <section key={section.featureId} className="section-block">
            <div className="section-head">
              <h3 style={{ margin: 0 }}>{section.title}</h3>
            </div>
            <div className="kpi-grid">
              {section.metrics.map((m) => (
                <div key={m.label} className="kpi">
                  <div className={`kpi-bar ${m.tone ?? 'info'}`} />
                  <div className="kpi-body">
                    <div className="kpi-label">{m.label}</div>
                    <div className="kpi-value">{m.value}</div>
                    {m.note ? <div className="kpi-note">{m.note}</div> : null}
                  </div>
                </div>
              ))}
            </div>
            {section.hints?.map((h) => (
              <div
                key={h.text}
                className={`hint ${h.tone ?? ''}`}
                style={{ marginTop: 12 }}
              >
                {h.text}
              </div>
            ))}
            {section.rows ? (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>مورد</th>
                    <th>مقدار</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>
        ))}

        {diagTitles.length > 0 ? (
          <section className="section-block">
            <div className="section-head">
              <h3 style={{ margin: 0 }}>نکات قابل پیگیری</h3>
            </div>
            <ul className="diag-screen-list">
              {diagTitles.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Off-screen solid sheet — only this is captured for PNG/PDF */}
      <div className="export-host" aria-hidden="true">
        <div ref={exportRef}>
          <ExportSheet
            typeTitle={type.title}
            brandName={brandName}
            branchName={branchName}
            periodLabel={rangeText}
            reportDate={reportDate}
            sections={sections}
            diagTitles={diagTitles}
          />
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}

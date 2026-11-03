import { useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { buildMockSections } from '../data/mockReport'
import type { FeatureId } from '../data/types'
import { exportElementAsPdf, exportElementAsPng } from '../lib/exportReport'
import { loadReviewTypes } from '../lib/storage'

export function ReportPage() {
  const { typeId = '', branchId = '' } = useParams()
  const [params] = useSearchParams()
  const reportRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null)
  const [toast, setToast] = useState('')

  const type = loadReviewTypes().find((t) => t.id === typeId)
  const brandName = params.get('brandName') ?? 'مجموعه'
  const branchName = params.get('branchName') ?? branchId
  const lockNumber = params.get('lockNumber') ?? '—'

  const featureIds = useMemo(() => {
    const raw = params.get('features')
    if (raw) return raw.split(',').filter(Boolean) as FeatureId[]
    if (!type) return [] as FeatureId[]
    return Object.entries(type.features)
      .filter(([, mode]) => mode === 'required' || mode === 'defaultOn')
      .map(([id]) => id as FeatureId)
  }, [params, type])

  const sections = buildMockSections(featureIds)
  const fileBase = `${type?.title ?? 'report'}-${brandName}-${branchName}`
    .replace(/[\\/:*?"<>|]/g, '-')

  const runExport = async (kind: 'png' | 'pdf') => {
    if (!reportRef.current) return
    setBusy(kind)
    try {
      if (kind === 'png') await exportElementAsPng(reportRef.current, fileBase)
      else await exportElementAsPdf(reportRef.current, fileBase)
      setToast(kind === 'png' ? 'عکس ذخیره شد' : 'PDF ذخیره شد')
      window.setTimeout(() => setToast(''), 2200)
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'خروجی ناموفق بود')
      window.setTimeout(() => setToast(''), 2800)
    } finally {
      setBusy(null)
    }
  }

  if (!type) {
    return (
      <div className="panel">
        <p>گزارش نامعتبر است.</p>
        <Link className="btn btn-secondary" to="/">
          بازگشت
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="actions no-export" style={{ justifyContent: 'space-between' }}>
        <div className="actions">
          <span className="chip ok">بعد از تمدید ✅ (نمونه)</span>
          <span className="chip bad">تیک اتمام حجت ندارد ❌</span>
          <span className="chip">صحبت با: —</span>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!!busy}
            onClick={() => void runExport('png')}
          >
            {busy === 'png' ? 'در حال ساخت…' : 'خروجی عکس'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!!busy}
            onClick={() => void runExport('pdf')}
          >
            {busy === 'pdf' ? 'در حال ساخت…' : 'خروجی PDF'}
          </button>
          <Link to={`/setup/${type.id}`} className="btn btn-ghost">
            ویرایش ویژگی‌ها
          </Link>
        </div>
      </div>

      <div ref={reportRef} className="report-sections report-export-root">
        <section className="hero" style={{ padding: '22px 24px' }}>
          <div>
            <div className="card-kicker" style={{ color: '#99f6e4' }}>
              {type.title}
            </div>
            <h2 style={{ marginTop: 8 }}>
              {brandName} — {branchName}
            </h2>
            <p>
              لاک‌نامبر: {lockNumber} · BranchId: {branchId}
              <br />
              اعداد فعلاً mock هستند؛ اتصال SP و BI در فاز بعد.
            </p>
          </div>
          <div className="actions" style={{ justifyContent: 'flex-end' }}>
            <span
              className="chip"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#ecfeff' }}
            >
              {sections.length} بخش فعال
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
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}

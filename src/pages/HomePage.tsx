import { Link } from 'react-router-dom'
import { IsoCubeIcon } from '../components/IsoDecor'
import { loadHistory } from '../lib/history'
import { loadReviewTypes } from '../lib/storage'

const TONES = ['teal', 'sky', 'amber', 'rose'] as const

const STEPS = [
  { n: '۱', title: 'نوع بررسی', text: 'یکی از کارت‌های زیر را بزنید' },
  { n: '۲', title: 'مجموعه و بازه', text: 'مجموعه را جستجو و بازه را انتخاب کنید' },
  { n: '۳', title: 'گزارش آماده', text: 'PDF را دانلود و برای مشتری بفرستید' },
]

export function HomePage() {
  const types = loadReviewTypes()
  const history = loadHistory()
  const last = history[0]
  const isNewUser = history.length === 0

  const steps = (
    <ol className="home-steps" aria-label="مراحل کار">
      {STEPS.map((s) => (
        <li key={s.n}>
          <span className="step-num">{s.n}</span>
          <div>
            <strong>{s.title}</strong>
            <span className="muted">{s.text}</span>
          </div>
        </li>
      ))}
    </ol>
  )

  return (
    <div className="flow">
      {last ? (
        <section className="continue-card" aria-label="ادامه آخرین گزارش">
          <div>
            <div className="card-kicker">ادامه آخرین گزارش</div>
            <strong>
              {last.branchName && last.branchName !== last.brandName
                ? `${last.brandName} — ${last.branchName}`
                : last.brandName}
            </strong>
            <span className="muted"> · {last.typeTitle}</span>
          </div>
          <Link
            className="btn btn-primary"
            to={`/report/${last.typeId}/${last.branchId}?${last.query}`}
          >
            ادامه
          </Link>
        </section>
      ) : null}

      <header className="flow-head">
        <h2>کدام بررسی را انجام می‌دهید؟</h2>
        <p className="muted">
          یک نوع بررسی انتخاب کنید. بقیه مراحل را قدم‌به‌قدم راهنمایی می‌کنیم.
        </p>
      </header>

      {isNewUser ? (
        steps
      ) : (
        <details className="steps-toggle">
          <summary>مراحل کار چیست؟</summary>
          {steps}
        </details>
      )}

      <div className="grid-types">
        {types.map((type, index) => {
          const count = Object.values(type.features).filter(
            (m) => m === 'required' || m === 'defaultOn',
          ).length
          return (
            <Link key={type.id} to={`/setup/${type.id}`} className="iso-card">
              <div className="iso-card-top">
                <h2>{type.title}</h2>
                <IsoCubeIcon tone={TONES[index % TONES.length]} />
              </div>
              <p className="muted">{type.description}</p>
              <div className="card-footer">
                <span className="muted">{count.toLocaleString('fa-IR')} بخش گزارش</span>
                <span className="chip">شروع ←</span>
              </div>
            </Link>
          )
        })}
      </div>

      <p className="muted home-help">
        برای اولین بار است؟ <Link to="/help">راهنمای کوتاه</Link> را بخوانید.
      </p>
    </div>
  )
}

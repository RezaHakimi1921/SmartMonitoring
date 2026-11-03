import { Link } from 'react-router-dom'
import { IsoCubeIcon } from '../components/IsoDecor'
import { loadReviewTypes } from '../lib/storage'
import { formatJalaliLong, todayJalali } from '../lib/jalali'

const TONES = ['teal', 'sky', 'amber', 'rose'] as const

const STEPS = [
  { n: '۱', title: 'نوع بررسی', text: 'یکی از کارت‌های زیر را بزنید' },
  { n: '۲', title: 'مجموعه و بازه', text: 'مجموعه را جستجو و بازه را انتخاب کنید' },
  { n: '۳', title: 'گزارش آماده', text: 'عکس یا PDF بگیرید و برای مشتری بفرستید' },
]

export function HomePage() {
  const types = loadReviewTypes()

  return (
    <div className="flow">
      <header className="flow-head">
        <p className="muted">امروز: {formatJalaliLong(todayJalali())}</p>
        <h2>کدام بررسی را انجام می‌دهید؟</h2>
        <p className="muted">
          یک نوع بررسی انتخاب کنید. بقیه مراحل را قدم‌به‌قدم راهنمایی می‌کنیم.
        </p>
      </header>

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

      <div className="grid-types">
        {types.map((type, index) => (
          <Link key={type.id} to={`/setup/${type.id}`} className="iso-card">
            <div className="iso-card-top">
              <h2>{type.title}</h2>
              <IsoCubeIcon tone={TONES[index % TONES.length]} />
            </div>
            <p className="muted">{type.description}</p>
            <div className="card-footer">
              <span className="chip">انتخاب و ادامه ←</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

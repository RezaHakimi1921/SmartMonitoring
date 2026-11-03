import { Link } from 'react-router-dom'
import { IsoCubeIcon, IsoStackFigure } from '../components/IsoDecor'
import { loadReviewTypes } from '../lib/storage'

const TONES = ['teal', 'sky', 'amber', 'rose'] as const

export function HomePage() {
  const types = loadReviewTypes()

  return (
    <>
      <section className="hero">
        <div>
          <h2>گزارش‌های پراکنده، یک نگاه واحد</h2>
          <p>
            نوع بررسی را انتخاب کن، شعبه را مشخص کن، ویژگی‌ها را کم و زیاد کن.
            خروجی یک‌صفحه‌ای با PDF و عکس برای مشتری آماده می‌شود — بدون پرش بین
            اینسایت، کلاب و ارزیابی.
          </p>
        </div>
        <IsoStackFigure className="hero-art" />
      </section>

      <section className="page-intro">
        <h2>انتخاب نوع بررسی</h2>
        <p>
          هر کارت یک سناریوی کنترل است. عمق و فشار دکمه‌ها از زبان بصری Isometric
          گرفته شده؛ بعداً به Design System واقعی SmartX وصل می‌شود.
        </p>
      </section>

      <div className="grid-types">
        {types.map((type, index) => (
          <Link
            key={type.id}
            to={`/setup/${type.id}`}
            className="iso-card"
          >
            <div className="iso-card-top">
              <div className="card-kicker">سناریوی کنترل</div>
              <IsoCubeIcon tone={TONES[index % TONES.length]} />
            </div>
            <h2>{type.title}</h2>
            <p className="muted">{type.description}</p>
            <div className="card-footer">
              <span className="chip">
                {Object.keys(type.features).length} ویژگی متصل
              </span>
              <span className="chip">شروع ←</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

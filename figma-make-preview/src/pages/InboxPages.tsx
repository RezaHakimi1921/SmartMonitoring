import { useState } from 'react'
import { FEEDBACK, INBOX, toFa } from '../data/demo'
import { Ico } from '../icons'

export function ReportsInbox({ onOpenDemo }: { onOpenDemo: () => void }) {
  return (
    <section className="stage page-stage">
      <div className="rp-head">
        <div>
          <div className="eyebrow">صندوق گزارش‌ها</div>
          <h1>گزارش‌های تیم</h1>
          <p>ادامه کار و مشاهدهٔ وضعیت ارسال</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onOpenDemo}>
          {Ico.arrow}
          بررسی جدید
        </button>
      </div>
      <div className="panel-wrap">
        <div className="panel">
          <div className="inbox-tools">
            <div className="search" style={{ marginBottom: 0, flex: 1 }}>
              <span className="mag">{Ico.search}</span>
              <input placeholder="جست‌وجوی مجموعه یا مالک…" />
            </div>
          </div>
          <div className="inbox-list">
            {INBOX.map((r) => (
              <button
                key={r.id}
                type="button"
                className="inbox-row"
                onClick={onOpenDemo}
              >
                <div className="score-mini">{toFa(r.score)}</div>
                <div className="inbox-main">
                  <div className="inbox-title">{r.brand}</div>
                  <div className="inbox-sub">
                    {r.template} · {r.period} · {r.owner}
                  </div>
                </div>
                <div className="inbox-meta">
                  <span className="chip">{r.stage}</span>
                  <span className="muted">{r.updated}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeedbackPage() {
  const [activeId, setActiveId] = useState(FEEDBACK[0]!.id)
  const active = FEEDBACK.find((f) => f.id === activeId) ?? FEEDBACK[0]!
  const [filter, setFilter] = useState<'all' | 'bug' | 'idea'>('all')
  const list = FEEDBACK.filter((f) => filter === 'all' || f.type === filter)

  return (
    <section className="stage page-stage">
      <div className="rp-head">
        <div>
          <div className="eyebrow">پیشنهادات</div>
          <h1>صندوق پیشنهاد و باگ</h1>
          <p>پیگیری موارد گزارش‌شده از تیم و مشتریان</p>
        </div>
        <button type="button" className="btn btn-primary">
          {Ico.arrow}
          پیشنهاد جدید
        </button>
      </div>

      <div className="panel-wrap">
        <div className="fb-layout">
          <div className="panel fb-list">
            <div className="fb-filters">
              {(
                [
                  ['all', 'همه'],
                  ['bug', 'باگ'],
                  ['idea', 'پیشنهاد'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`rp-step ${filter === id ? 'on' : ''}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="inbox-list">
              {list.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`inbox-row ${f.id === active.id ? 'selected' : ''}`}
                  onClick={() => setActiveId(f.id)}
                >
                  <div className={`type-dot ${f.type === 'bug' ? 'bug' : 'idea'}`} />
                  <div className="inbox-main">
                    <div className="inbox-title">{f.title}</div>
                    <div className="inbox-sub">
                      {f.id} · {f.brand} · {f.when}
                    </div>
                  </div>
                  <span className="chip">{f.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel fb-detail">
            <div className="fb-detail-head">
              <div>
                <div className="eyebrow">
                  {active.type === 'bug' ? 'باگ' : 'پیشنهاد'} · {active.id}
                </div>
                <h2>{active.title}</h2>
                <div className="sub">
                  {active.brand} · {active.when}
                </div>
              </div>
              <span className="chip">{active.status}</span>
            </div>
            <p className="fb-body">{active.body}</p>
            <div className="fb-thread">
              <div className="fb-msg">
                <div className="fb-msg-meta">گزارش‌دهنده · {active.when}</div>
                <div>{active.body}</div>
              </div>
              <div className="fb-msg admin">
                <div className="fb-msg-meta">تیم دیدبان · پاسخ داخلی</div>
                <div>در صف بررسی قرار گرفت و نتیجه اعلام می‌شود.</div>
              </div>
            </div>
            <div className="fb-compose">
              <input placeholder="پاسخ یا توضیح تکمیلی…" />
              <button type="button" className="btn btn-primary">
                ارسال
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HelpPage() {
  const faqs = [
    {
      q: 'چطور بررسی جدید بسازم؟',
      a: 'از منوی «بررسی جدید» مجموعه، قالب و بازه را انتخاب کنید و شروع بررسی را بزنید.',
    },
    {
      q: 'امتیاز کل از کجا می‌آید؟',
      a: 'امتیاز خلاصه گزارش از وضعیت کلی مجموعه در بازهٔ انتخابی ساخته می‌شود.',
    },
    {
      q: 'پیام مشتری کجا ویرایش می‌شود؟',
      a: 'در مرحلهٔ ارسال گزارش می‌توانید پیام را ببینید و یادداشت داخلی بگذارید.',
    },
  ]
  return (
    <section className="stage page-stage">
      <div className="rp-head">
        <div>
          <div className="eyebrow">راهنما</div>
          <h1>چطور با دیدبان کار کنیم؟</h1>
          <p>مسیر بررسی از انتخاب مجموعه تا ارسال PDF</p>
        </div>
      </div>
      <div className="panel-wrap">
        <div className="panel">
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.q} className="faq-item" open>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProfilePage() {
  return (
    <section className="stage page-stage">
      <div className="rp-head">
        <div>
          <div className="eyebrow">حساب من</div>
          <h1>رضا حکیمی</h1>
          <p>مدیر سیستم · ویرایش نام و رمز عبور</p>
        </div>
      </div>
      <div className="panel-wrap">
        <div className="panel" style={{ maxWidth: 520 }}>
          <label className="field">
            <span>نام نمایشی</span>
            <input defaultValue="رضا حکیمی" />
          </label>
          <label className="field">
            <span>رمز عبور جدید</span>
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="button" className="btn btn-primary" style={{ marginTop: 8 }}>
            ذخیره تغییرات
          </button>
        </div>
      </div>
    </section>
  )
}

export function SettingsPage() {
  return (
    <section className="stage page-stage">
      <div className="rp-head">
        <div>
          <div className="eyebrow">مدیریت</div>
          <h1>تنظیمات بررسی</h1>
          <p>قالب‌های فعال دیدبان</p>
        </div>
      </div>
      <div className="panel-wrap">
        <div className="tpl-grid">
          {['بررسی سریع', 'پس از تحویل', 'تماس بعد از تمدید'].map((t) => (
            <div key={t} className="tpl-card">
              <div className="tpl-top">
                <span className="tpl-ico">{Ico.spark}</span>
              </div>
              <div className="tpl-title">{t}</div>
              <div className="tpl-desc">ویرایش بخش‌های پیش‌فرض قالب</div>
              <div className="tpl-meta">فعال</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function UsersPage() {
  const users = [
    { name: 'رضا حکیمی', role: 'مدیر سیستم' },
    { name: 'سارا محمدی', role: 'اپراتور' },
    { name: 'علی رضایی', role: 'اپراتور' },
  ]
  return (
    <section className="stage page-stage">
      <div className="rp-head">
        <div>
          <div className="eyebrow">مدیریت</div>
          <h1>کاربران</h1>
          <p>اعضای تیم مانیتورینگ</p>
        </div>
      </div>
      <div className="panel-wrap">
        <div className="panel">
          <div className="inbox-list">
            {users.map((u) => (
              <div key={u.name} className="inbox-row static">
                <div
                  className="avatar"
                  style={{ background: '#e8f2c4', color: '#4e6300' }}
                >
                  {u.name.slice(0, 1)}
                </div>
                <div className="inbox-main">
                  <div className="inbox-title">{u.name}</div>
                  <div className="inbox-sub">{u.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

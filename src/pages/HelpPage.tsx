import { Link as RouterLink } from 'react-router-dom'
import { toFaDigits } from '../lib/jalali'
import styles from './DidbanPage.module.css'

const STEPS = [
  {
    title: 'مجموعه را انتخاب کنید',
    text: 'در «بررسی جدید» نام مجموعه یا شعبه را جست‌وجو کنید و یکی را برگزینید.',
  },
  {
    title: 'قالب بررسی را بزنید',
    text: 'یکی از چهار قالب (سریع، پس از تحویل، تماس بعد تمدید، چهارم) را انتخاب کنید.',
  },
  {
    title: 'بازهٔ شمسی را تنظیم کنید',
    text: 'میانبر بازه را بزنید یا با تقویم شمسی تاریخ دلخواه بگذارید؛ بعد شاخص‌ها را تأیید کنید.',
  },
  {
    title: 'گزارش را تا ارسال مرور کنید',
    text: 'خلاصه → بخش‌ها → نکات پیگیری → ارسال. PDF و پیام مشتری را از مرحلهٔ آخر بگیرید.',
  },
]

const FAQ = [
  {
    q: 'چطور بررسی جدید بسازم؟',
    a: 'از منوی «بررسی جدید» مجموعه، قالب و بازه را انتخاب کنید و شروع بررسی را بزنید.',
  },
  {
    q: 'بازه دلخواه را چطور انتخاب کنم؟',
    a: 'روی «بازه دلخواه (تقویم شمسی)» بزنید، بعد «از تاریخ» و «تا تاریخ» را در تقویم شمسی انتخاب کنید.',
  },
  {
    q: 'امتیاز کل از کجا می‌آید؟',
    a: 'امتیاز خلاصه گزارش از وضعیت شاخص‌های بارگذاری‌شده در بازهٔ انتخابی ساخته می‌شود.',
  },
  {
    q: 'پیام مشتری کجا ویرایش می‌شود؟',
    a: 'در مرحلهٔ «ارسال گزارش» می‌توانید پیام مشتری را ویرایش/کپی کنید و یادداشت داخلی بگذارید.',
  },
  {
    q: 'گزارش قبلی را کجا پیدا کنم؟',
    a: 'از منوی «گزارش‌ها» (صندوق گزارش‌ها). هر گزارش تیم را می‌بینید و با باز کردن همان مسیر را ادامه می‌دهید.',
  },
]

export function HelpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>راهنما</div>
        <h1>چطور با دیدبان کار کنیم؟</h1>
        <p>مسیر بررسی از انتخاب مجموعه تا ارسال PDF</p>
      </div>

      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div key={s.title} className={styles.step}>
            <div className={styles.stepNum}>{toFaDigits(i + 1)}</div>
            <div>
              <div className={styles.stepTitle}>{s.title}</div>
              <div className={styles.stepText}>{s.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        <div className={styles.faqList}>
          {FAQ.map((f) => (
            <details key={f.q} className={styles.faqItem} open>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <RouterLink className={styles.btnPrimary} to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          شروع بررسی
        </RouterLink>
      </div>
    </div>
  )
}

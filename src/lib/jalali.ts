/** تبدیل تاریخ میلادی ↔ شمسی (الگوریتم jalaali) و ابزارهای نمایش فارسی. */

const div = (a: number, b: number) => Math.trunc(a / b)
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
]

function jalCal(jy: number) {
  const bl = BREAKS.length
  const gy = jy + 621
  let leapJ = -14
  let jp = BREAKS[0]
  let jump = 0
  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = jy - jp
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn: number) {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

export interface JDate {
  y: number
  m: number
  d: number
}

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export function isJalaliLeap(y: number) {
  return jalCal(y).leap === 0
}

export function jalaliMonthLength(y: number, m: number) {
  if (m <= 6) return 31
  if (m <= 11) return 30
  return isJalaliLeap(y) ? 30 : 29
}

export function gregorianToJalali(date: Date): JDate {
  const { jy, jm, jd } = d2j(
    g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()),
  )
  return { y: jy, m: jm, d: jd }
}

export function jalaliToGregorian({ y, m, d }: JDate): Date {
  const g = d2g(j2d(y, m, d))
  return new Date(g.gy, g.gm - 1, g.gd)
}

export function todayJalali(): JDate {
  return gregorianToJalali(new Date())
}

/** کم کردن چند ماه شمسی (روز در صورت نیاز به آخر ماه می‌چسبد). */
export function subtractJalaliMonths(date: JDate, months: number): JDate {
  const total = date.y * 12 + (date.m - 1) - months
  const y = Math.floor(total / 12)
  const m = (total % 12 + 12) % 12 + 1
  return { y, m, d: Math.min(date.d, jalaliMonthLength(y, m)) }
}

export function compareJalali(a: JDate, b: JDate) {
  return a.y - b.y || a.m - b.m || a.d - b.d
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function toFaDigits(value: string | number) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

/** ارقام فارسی/عربی → لاتین؛ برای پارس عدد از رشته‌های UI */
export function fromFaDigits(value: string) {
  return String(value)
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/**
 * عدد را از مقدار نمایشی فارسی استخراج می‌کند (مثلاً «۷۴.۰٪» → 74).
 * جداکنندهٔ هزار و اعشار فارسی/لاتین را هم پوشش می‌دهد.
 */
export function parseFaNumber(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN
  if (raw == null) return NaN
  let s = fromFaDigits(String(raw)).trim()
  s = s.replace(/[٪%]/g, '')
  s = s.replace(/[^\d.,٫٬-]/g, '')
  // هزارگان فارسی/عربی را حذف کن؛ اعشار را نقطه کن
  if (s.includes('٫')) {
    s = s.replace(/٬/g, '').replace('٫', '.')
  } else if (s.includes(',') && s.includes('.')) {
    s = s.replace(/,/g, '')
  } else if (s.includes(',')) {
    // اگر بعد از ویرگول ۱–۲ رقم باشد احتمالاً اعشار است
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  } else {
    s = s.replace(/٬/g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

const pad = (n: number) => String(n).padStart(2, '0')

/** نمایش فارسی: ۱۴۰۵/۰۸/۱۲ */
export function formatJalali(date: JDate) {
  return toFaDigits(`${date.y}/${pad(date.m)}/${pad(date.d)}`)
}

/** نمایش بلند: ۱۲ آبان ۱۴۰۵ */
export function formatJalaliLong(date: JDate) {
  return toFaDigits(`${date.d} ${JALALI_MONTHS[date.m - 1]} ${date.y}`)
}

/** ذخیره در آدرس صفحه با ارقام انگلیسی: 1405/08/12 */
export function serializeJalali(date: JDate) {
  return `${date.y}/${pad(date.m)}/${pad(date.d)}`
}

export function parseJalali(text: string | null | undefined): JDate | null {
  if (!text) return null
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > jalaliMonthLength(y, m)) return null
  return { y, m, d }
}

import { describe, expect, it } from 'vitest'
import {
  gregorianToJalali,
  jalaliMonthLength,
  jalaliToGregorian,
  parseJalali,
  serializeJalali,
  subtractJalaliMonths,
} from '../lib/jalali'

describe('تاریخ شمسی', () => {
  it('تبدیل تاریخ‌های شناخته‌شده', () => {
    const f = (y: number, m: number, d: number) =>
      serializeJalali(gregorianToJalali(new Date(y, m - 1, d)))
    expect(f(2026, 11, 3)).toBe('1405/08/12')
    expect(f(2025, 3, 21)).toBe('1404/01/01')
    expect(f(2025, 3, 20)).toBe('1403/12/30')
  })

  it('تبدیل رفت‌وبرگشتی برای ۵۰ سال', () => {
    let bad = 0
    for (
      let t = new Date(2000, 0, 1);
      t < new Date(2050, 0, 1);
      t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)
    ) {
      const back = jalaliToGregorian(gregorianToJalali(t))
      if (back.getTime() !== t.getTime()) bad += 1
    }
    expect(bad).toBe(0)
  })

  it('طول ماه‌ها و سال کبیسه', () => {
    expect(jalaliMonthLength(1405, 1)).toBe(31)
    expect(jalaliMonthLength(1405, 7)).toBe(30)
    expect(jalaliMonthLength(1403, 12)).toBe(30)
    expect(jalaliMonthLength(1404, 12)).toBe(29)
  })

  it('کم کردن ماه، روز را به آخر ماه می‌چسباند', () => {
    expect(subtractJalaliMonths({ y: 1405, m: 8, d: 30 }, 3)).toEqual({
      y: 1405,
      m: 5,
      d: 30,
    })
    expect(subtractJalaliMonths({ y: 1405, m: 1, d: 31 }, 1)).toEqual({
      y: 1404,
      m: 12,
      d: 29,
    })
  })

  it('تاریخ نامعتبر پذیرفته نمی‌شود', () => {
    expect(parseJalali('1405/13/01')).toBeNull()
    expect(parseJalali('1405/07/31')).toBeNull()
    expect(parseJalali('1405/07/30')).toEqual({ y: 1405, m: 7, d: 30 })
    expect(parseJalali('')).toBeNull()
  })
})

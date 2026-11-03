import { describe, expect, it } from 'vitest'
import { isRangeValid, periodLabel, periodRange } from '../data/periods'

describe('بازه زمانی', () => {
  it('بازه دلخواه فقط با دو تاریخ کامل ساخته می‌شود', () => {
    expect(periodRange('custom', '1405/08/01', '')).toBeNull()
    expect(periodRange('custom', '1405/08/01', '1405/08/10')).not.toBeNull()
  })

  it('شروع باید قبل از پایان باشد', () => {
    expect(isRangeValid('1405/08/10', '1405/08/01')).toBe(false)
    expect(isRangeValid('1405/08/01', '1405/08/01')).toBe(true)
  })

  it('برچسب بازه، تاریخ شمسی با ارقام فارسی دارد', () => {
    expect(periodLabel('custom', '1405/08/01', '1405/08/10')).toBe(
      'از ۱۴۰۵/۰۸/۰۱ تا ۱۴۰۵/۰۸/۱۰',
    )
  })

  it('بازه‌های آماده تا امروز هستند', () => {
    const r = periodRange('3m')
    expect(r).not.toBeNull()
    expect(r!.from.m).not.toBe(r!.to.m)
  })
})

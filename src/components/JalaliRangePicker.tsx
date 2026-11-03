import { useEffect, useRef, useState } from 'react'
import {
  compareJalali,
  formatJalali,
  JALALI_MONTHS,
  jalaliMonthLength,
  jalaliToGregorian,
  parseJalali,
  serializeJalali,
  toFaDigits,
  todayJalali,
  type JDate,
} from '../lib/jalali'

type Props = {
  /** مقدار به‌صورت 1405/08/12 یا خالی */
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

/** تقویم شمسی بازشونده برای انتخاب «از تاریخ» و «تا تاریخ». */
export function JalaliRangePicker({ from, to, onChange }: Props) {
  const today = todayJalali()
  const fromD = parseJalali(from)
  const toD = parseJalali(to)

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<'from' | 'to'>('from')
  const [view, setView] = useState<{ y: number; m: number }>({
    y: (fromD ?? today).y,
    m: (fromD ?? today).m,
  })
  const [hover, setHover] = useState<JDate | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openFor = (which: 'from' | 'to') => {
    setActive(which)
    const d = which === 'from' ? fromD : toD
    const base = d ?? fromD ?? today
    setView({ y: base.y, m: base.m })
    setOpen(true)
  }

  const shiftMonth = (delta: number) => {
    const total = view.y * 12 + (view.m - 1) + delta
    setView({ y: Math.floor(total / 12), m: (((total % 12) + 12) % 12) + 1 })
  }

  const pick = (day: JDate) => {
    const text = serializeJalali(day)
    if (active === 'from') {
      // اگر پایان قبل از شروع جدید باشد پاک می‌شود
      const keepTo = toD && compareJalali(day, toD) <= 0 ? to : ''
      onChange(text, keepTo)
      setActive('to')
      return
    }
    if (fromD && compareJalali(day, fromD) < 0) {
      onChange(text, '')
      setActive('to')
      return
    }
    onChange(from, text)
    setOpen(false)
  }

  const len = jalaliMonthLength(view.y, view.m)
  const offset = (jalaliToGregorian({ ...view, d: 1 }).getDay() + 1) % 7
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: len }, (_, i) => i + 1),
  ]
  const years = Array.from({ length: 8 }, (_, i) => today.y - 6 + i)
  const rangeEnd = active === 'to' && !toD && hover ? hover : toD

  const hint =
    active === 'from'
      ? 'تاریخ شروع را از تقویم انتخاب کنید'
      : 'حالا تاریخ پایان را انتخاب کنید'

  return (
    <div className="range-picker" ref={rootRef}>
      <div className="range-fields">
        <button
          type="button"
          className={`range-field${open && active === 'from' ? ' active' : ''}`}
          onClick={() => openFor('from')}
        >
          <span className="range-field-label">از تاریخ</span>
          <span className={fromD ? 'range-field-value' : 'range-field-empty'}>
            {fromD ? formatJalali(fromD) : 'انتخاب کنید'}
          </span>
        </button>
        <button
          type="button"
          className={`range-field${open && active === 'to' ? ' active' : ''}`}
          onClick={() => openFor('to')}
        >
          <span className="range-field-label">تا تاریخ</span>
          <span className={toD ? 'range-field-value' : 'range-field-empty'}>
            {toD ? formatJalali(toD) : 'انتخاب کنید'}
          </span>
        </button>
      </div>

      {open ? (
        <div className="cal-pop" role="dialog" aria-label="تقویم شمسی">
          <div className="cal-head">
            <button
              type="button"
              className="cal-nav"
              aria-label="ماه بعد"
              onClick={() => shiftMonth(1)}
            >
              ‹
            </button>
            <div className="cal-title">
              <strong>{JALALI_MONTHS[view.m - 1]}</strong>
              <select
                className="cal-year"
                aria-label="سال"
                value={view.y}
                onChange={(e) => setView({ ...view, y: Number(e.target.value) })}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {toFaDigits(y)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="cal-nav"
              aria-label="ماه قبل"
              onClick={() => shiftMonth(-1)}
            >
              ›
            </button>
          </div>

          <div className="cal-grid cal-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="cal-grid" onMouseLeave={() => setHover(null)}>
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />
              const day: JDate = { y: view.y, m: view.m, d }
              const future = compareJalali(day, today) > 0
              const isStart = !!fromD && compareJalali(day, fromD) === 0
              const isEnd = !!toD && compareJalali(day, toD) === 0
              const inRange =
                !!fromD &&
                !!rangeEnd &&
                compareJalali(day, fromD) > 0 &&
                compareJalali(day, rangeEnd) < 0
              const cls = [
                'cal-day',
                isStart ? 'is-start' : '',
                isEnd ? 'is-end' : '',
                inRange ? 'in-range' : '',
                compareJalali(day, today) === 0 ? 'is-today' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={d}
                  type="button"
                  className={cls}
                  disabled={future}
                  onMouseEnter={() => setHover(day)}
                  onClick={() => pick(day)}
                >
                  {toFaDigits(d)}
                </button>
              )
            })}
          </div>

          <div className="cal-foot">
            <span className="muted">{hint}</span>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ height: 32 }}
              onClick={() => setView({ y: today.y, m: today.m })}
            >
              امروز
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

import {
  JALALI_MONTHS,
  jalaliMonthLength,
  parseJalali,
  serializeJalali,
  toFaDigits,
  todayJalali,
} from '../lib/jalali'

type Props = {
  label: string
  /** مقدار به‌صورت 1405/08/12 یا خالی */
  value: string
  onChange: (value: string) => void
}

/** انتخاب تاریخ شمسی با سه لیست ساده: روز، ماه، سال. */
export function JalaliDatePicker({ label, value, onChange }: Props) {
  const today = todayJalali()
  const current = parseJalali(value)
  const y = current?.y ?? 0
  const m = current?.m ?? 0
  const d = current?.d ?? 0

  const years = Array.from({ length: 6 }, (_, i) => today.y - 4 + i)
  const maxDay = y && m ? jalaliMonthLength(y, m) : 31

  const update = (next: { y: number; m: number; d: number }) => {
    if (!next.y || !next.m || !next.d) {
      // هنوز کامل نیست؛ فقط وقتی هر سه انتخاب شد مقدار را ثبت می‌کنیم.
      onChange(
        next.y || next.m || next.d
          ? `part:${next.y}/${next.m}/${next.d}`
          : '',
      )
      return
    }
    const day = Math.min(next.d, jalaliMonthLength(next.y, next.m))
    onChange(serializeJalali({ y: next.y, m: next.m, d: day }))
  }

  // مقدار ناقص را برای نمایش نگه می‌داریم
  const partial = /^part:(\d+)\/(\d+)\/(\d+)$/.exec(value)
  const py = partial ? Number(partial[1]) : y
  const pm = partial ? Number(partial[2]) : m
  const pd = partial ? Number(partial[3]) : d

  return (
    <fieldset className="jdate">
      <legend className="field-label">{label}</legend>
      <div className="jdate-row">
        <select
          className="input"
          aria-label={`${label} — روز`}
          value={pd || ''}
          onChange={(e) => update({ y: py, m: pm, d: Number(e.target.value) })}
        >
          <option value="">روز</option>
          {Array.from({ length: partial ? 31 : maxDay }, (_, i) => i + 1).map(
            (day) => (
              <option key={day} value={day}>
                {toFaDigits(day)}
              </option>
            ),
          )}
        </select>
        <select
          className="input"
          aria-label={`${label} — ماه`}
          value={pm || ''}
          onChange={(e) => update({ y: py, m: Number(e.target.value), d: pd })}
        >
          <option value="">ماه</option>
          {JALALI_MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label={`${label} — سال`}
          value={py || ''}
          onChange={(e) => update({ y: Number(e.target.value), m: pm, d: pd })}
        >
          <option value="">سال</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {toFaDigits(year)}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}

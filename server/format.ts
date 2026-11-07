const FA = '۰۱۲۳۴۵۶۷۸۹'

export function toFa(value: string | number) {
  return String(value).replace(/\d/g, (d) => FA[Number(d)])
}

export function faInt(n: number | null | undefined) {
  const v = Math.round(Number(n) || 0)
  return toFa(v.toLocaleString('en-US'))
}

export function faPercent(n: number | null | undefined, digits = 1) {
  const v = Number(n) || 0
  return toFa(v.toFixed(digits)) + '٪'
}

export function faMoneyRial(n: number | null | undefined) {
  const v = Math.round(Number(n) || 0)
  return `${toFa(v.toLocaleString('en-US'))} ریال`
}

export function faMoneyToman(n: number | null | undefined) {
  const v = Math.round((Number(n) || 0) / 10)
  return `${toFa(v.toLocaleString('en-US'))} تومان`
}

export function dateKeyToFa(key: number | null | undefined) {
  if (!key) return '—'
  const s = String(key).padStart(8, '0')
  return toFa(`${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`)
}

export function toDateKey(y: number, m: number, d: number) {
  return y * 10000 + m * 100 + d
}

/** Shamsi y/m/d → JS Date at local midnight (jalaali algorithm). */
export function jalaliToDate(y: number, m: number, d: number): Date {
  const div = (a: number, b: number) => Math.trunc(a / b)
  const mod = (a: number, b: number) => a - Math.trunc(a / b) * b
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ]
  const gy = y + 621
  let leapJ = -14
  let jp = breaks[0]
  let jump = 0
  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i]
    jump = jm - jp
    if (y < jm) break
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = y - jp
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  const jdn =
    g2d(gy, 3, march) + (m - 1) * 31 - div(m, 7) * (m - 7) + d - 1
  function g2d(gy2: number, gm: number, gd: number) {
    let dd =
      div((gy2 + div(gm - 8, 6) + 100100) * 1461, 4) +
      div(153 * mod(gm + 9, 12) + 2, 5) +
      gd -
      34840408
    dd = dd - div(div(gy2 + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
    return dd
  }
  let j = 4 * jdn + 139361631
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gyy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return new Date(gyy, gm - 1, gd)
}

export function dateKeyToDate(key: number): Date {
  const s = String(key).padStart(8, '0')
  return jalaliToDate(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)),
    Number(s.slice(6, 8)),
  )
}

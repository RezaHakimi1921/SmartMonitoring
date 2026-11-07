import { getMetricRule, loadConfig, type MetricRule } from './configStore'

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'nodata'

/** سازگاری با loaders قدیمی: ok = goodMin، warn = okMin */
export function bandsFromRule(rule: MetricRule | undefined, fallback: {
  ok: number
  warn: number
}) {
  if (!rule) return fallback
  if (rule.higherIsBetter) {
    return {
      ok: rule.goodMin ?? fallback.ok,
      warn: rule.okMin ?? fallback.warn,
    }
  }
  return fallback
}

export function daysBandsFromRule(rule: MetricRule | undefined, fallback: {
  bad: number
  warn: number
}) {
  if (!rule) return fallback
  return {
    bad: rule.badMin ?? fallback.bad,
    warn: rule.warnMin ?? fallback.warn,
  }
}

/** آستانه‌های زنده از monitoring-config.json */
export function getThresholds() {
  const cfg = loadConfig()
  const byId = (id: string) => cfg.metricRules.find((r) => r.id === id)
  const sub = byId('subscription')
  const sat = byId('satisfaction')
  const eng = byId('surveyEngageVsOrders')
  const resp = byId('surveyResponse')
  const credit = byId('creditUse')
  const lost = byId('lostRate')
  const neg = byId('negChargeDays')
  const disc = byId('disconnectDays')
  return {
    subscription: bandsFromRule(sub, { ok: 70, warn: 50 }),
    satisfaction: bandsFromRule(sat, { ok: 60, warn: 45 }),
    surveyEngageVsOrders: bandsFromRule(eng, { ok: 8, warn: 3 }),
    surveyResponse: bandsFromRule(resp, { ok: 20, warn: 8 }),
    creditUse: bandsFromRule(credit, { ok: 15, warn: 5 }),
    negChargeDays: daysBandsFromRule(neg, { bad: 3, warn: 1 }),
    disconnectDays: daysBandsFromRule(disc, { bad: 3, warn: 1 }),
    lostRate: {
      bad: lost?.badMin ?? 8,
      warn: lost?.warnMin ?? 3,
    },
  }
}

/** @deprecated استفاده از getThresholds() — برای importهای قدیمی */
export const THRESHOLDS = new Proxy({} as ReturnType<typeof getThresholds>, {
  get(_t, prop: string) {
    return getThresholds()[prop as keyof ReturnType<typeof getThresholds>]
  },
})

export function toneByHigherBetter(
  value: number,
  bands: { ok: number; warn: number },
): Tone {
  if (!(value > 0) && value !== 0) return 'info'
  if (Number.isNaN(value)) return 'info'
  if (value >= bands.ok) return 'ok'
  if (value >= bands.warn) return 'warn'
  return 'bad'
}

export function toneByLowerBetterDays(
  days: number,
  bands: { bad: number; warn: number },
): Tone {
  if (days <= 0) return 'ok'
  if (days >= bands.bad) return 'bad'
  if (days >= bands.warn) return 'warn'
  return 'ok'
}

export function toneByLowerBetterPercent(
  value: number,
  bands: { bad: number; warn: number },
): Tone {
  if (value <= 0) return 'ok'
  if (value >= bands.bad) return 'bad'
  if (value >= bands.warn) return 'warn'
  return 'ok'
}

export function toneBoolean(value: 0 | 1 | boolean, ruleId: string): Tone {
  const rule = getMetricRule(ruleId)
  const good = rule?.goodWhen ?? 1
  const n = value === true || value === 1 ? 1 : 0
  return n === good ? 'ok' : 'bad'
}

/** ارزیابی کیفی یک مقدار نسبت به قاعدهٔ config */
export function evaluateRule(
  rule: import('./configStore').MetricRule,
  value: number | boolean | null | undefined,
): { tone: Tone; label: string } {
  if (rule.enabled === false) {
    return { tone: 'info', label: 'غیرفعال' }
  }
  if (value === null || value === undefined) {
    if (rule.alertIfMissing) {
      return {
        tone: rule.importance === 'high' ? 'bad' : 'warn',
        label: rule.labelBad || 'داده نیست',
      }
    }
    return { tone: 'nodata', label: 'بدون داده' }
  }

  if (rule.kind === 'boolean') {
    const n = value === true || value === 1 ? 1 : 0
    const good = rule.goodWhen ?? 1
    if (n === good) {
      return { tone: 'ok', label: rule.labelGood || 'مثبت' }
    }
    return {
      tone: rule.importance === 'low' ? 'warn' : 'bad',
      label: rule.labelBad || 'ضعیف',
    }
  }

  const num = Number(value)
  if (Number.isNaN(num)) return { tone: 'nodata', label: 'بدون داده' }

  if (rule.kind === 'days' || !rule.higherIsBetter) {
    const warn = rule.warnMin ?? 0
    const bad = rule.badMin ?? warn
    if (num >= bad) return { tone: 'bad', label: rule.labelBad || 'ضعیف' }
    if (num >= warn) return { tone: 'warn', label: rule.labelOk || 'قابل قبول' }
    return { tone: 'ok', label: rule.labelGood || 'مثبت' }
  }

  const good = rule.goodMin ?? 70
  const ok = rule.okMin ?? 50
  if (num >= good) return { tone: 'ok', label: rule.labelGood || 'مثبت' }
  if (num >= ok) return { tone: 'warn', label: rule.labelOk || 'قابل قبول' }
  return { tone: 'bad', label: rule.labelBad || 'ضعیف' }
}

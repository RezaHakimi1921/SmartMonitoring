import fs from 'node:fs'
import path from 'node:path'

export type FeatureMode = 'required' | 'defaultOn' | 'defaultOff'
export type FeatureId =
  | 'overall'
  | 'subscription'
  | 'survey'
  | 'groups'
  | 'brandSettings'
  | 'credit'
  | 'balance'
  | 'panelCharge'
  | 'connection'
  | 'complaints'
  | 'creditGeneration'
  | 'smartBlock'
  | 'event'

export type Importance = 'high' | 'medium' | 'low'
export type MetricKind = 'percent' | 'boolean' | 'days'

export type MetricRule = {
  id: string
  featureId: FeatureId
  label: string
  kind: MetricKind
  enabled: boolean
  goodMin?: number
  okMin?: number
  badMin?: number
  warnMin?: number
  goodWhen?: 0 | 1
  alertIfMissing?: boolean
  importance: Importance
  higherIsBetter: boolean
  labelGood?: string
  labelOk?: string
  labelBad?: string
}

/** نگاشت id قدیمی → featureId برای مهاجرت فایل config */
const LEGACY_FEATURE: Record<string, FeatureId> = {
  subscription: 'subscription',
  satisfaction: 'overall',
  surveyEngageVsOrders: 'survey',
  surveyResponse: 'survey',
  creditUse: 'credit',
  lostRate: 'balance',
  negChargeDays: 'panelCharge',
  disconnectDays: 'connection',
  activeSurvey: 'survey',
  clubActive: 'brandSettings',
}

export function normalizeMetricRule(
  raw: Partial<MetricRule> & { id: string; label: string },
): MetricRule {
  const featureId =
    raw.featureId ||
    LEGACY_FEATURE[raw.id] ||
    ('overall' as FeatureId)
  return {
    id: raw.id,
    featureId,
    label: raw.label,
    kind: raw.kind || 'percent',
    enabled: raw.enabled !== false,
    goodMin: raw.goodMin,
    okMin: raw.okMin,
    badMin: raw.badMin,
    warnMin: raw.warnMin,
    goodWhen: raw.goodWhen,
    alertIfMissing: raw.alertIfMissing,
    importance: raw.importance || 'medium',
    higherIsBetter: raw.higherIsBetter !== false,
    labelGood: raw.labelGood || 'مثبت',
    labelOk: raw.labelOk || 'قابل قبول',
    labelBad: raw.labelBad || 'ضعیف',
  }
}

export type ReviewTypeConfig = {
  id: string
  title: string
  description: string
  features: Partial<Record<FeatureId, FeatureMode>>
  diagDefaults: number[]
}

export type MonitoringConfig = {
  version: number
  reviewTypes: ReviewTypeConfig[]
  metricRules: MetricRule[]
  customerMessageTemplate: string
  assistantFormTemplate: string
}

const DATA_DIR = path.resolve(process.cwd(), 'data')
const CONFIG_PATH = path.join(DATA_DIR, 'monitoring-config.json')

const DEFAULT_DIAG = [1, 2, 3, 4, 5, 6, 7, 8]

export function defaultMetricRules(): MetricRule[] {
  return [
    normalizeMetricRule({
      id: 'overall_satisfaction',
      featureId: 'overall',
      label: 'رضایتمندی کلی',
      kind: 'percent',
      goodMin: 60,
      okMin: 45,
      importance: 'high',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'subscription',
      featureId: 'subscription',
      label: 'درصد اشتراک‌گیری',
      kind: 'percent',
      goodMin: 70,
      okMin: 50,
      importance: 'high',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'surveyResponse',
      featureId: 'survey',
      label: 'نرخ پاسخ نظرسنجی',
      kind: 'percent',
      goodMin: 20,
      okMin: 8,
      importance: 'medium',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'surveyEngageVsOrders',
      featureId: 'survey',
      label: 'مشارکت نسبت به سفارش',
      kind: 'percent',
      goodMin: 8,
      okMin: 3,
      importance: 'medium',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'activeSurvey',
      featureId: 'survey',
      label: 'فعال بودن نظرسنجی',
      kind: 'boolean',
      goodWhen: 1,
      alertIfMissing: true,
      importance: 'high',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'complaints_open',
      featureId: 'complaints',
      label: 'شکایت باز',
      kind: 'boolean',
      goodWhen: 0,
      importance: 'high',
      higherIsBetter: true,
      labelGood: 'بدون شکایت باز',
      labelBad: 'شکایت باز دارد',
    }),
    normalizeMetricRule({
      id: 'groups_overlap',
      featureId: 'groups',
      label: 'هم‌پوشانی گروه',
      kind: 'boolean',
      goodWhen: 0,
      importance: 'medium',
      higherIsBetter: true,
      labelGood: 'بدون تداخل',
      labelBad: 'تداخل دارد',
    }),
    normalizeMetricRule({
      id: 'clubActive',
      featureId: 'brandSettings',
      label: 'وضعیت باشگاه',
      kind: 'boolean',
      goodWhen: 1,
      alertIfMissing: true,
      importance: 'medium',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'event_recent',
      featureId: 'event',
      label: 'روز از آخرین ایونت',
      kind: 'days',
      warnMin: 45,
      badMin: 60,
      alertIfMissing: true,
      importance: 'medium',
      higherIsBetter: false,
    }),
    normalizeMetricRule({
      id: 'smartBlock_count',
      featureId: 'smartBlock',
      label: 'لیست بلاک فعال',
      kind: 'boolean',
      goodWhen: 1,
      importance: 'low',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'creditUse',
      featureId: 'credit',
      label: 'مصرف اعتبار',
      kind: 'percent',
      goodMin: 15,
      okMin: 5,
      importance: 'medium',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'credit_generation',
      featureId: 'creditGeneration',
      label: 'تولید اعتبار در ۷ روز',
      kind: 'boolean',
      goodWhen: 1,
      alertIfMissing: true,
      importance: 'high',
      higherIsBetter: true,
    }),
    normalizeMetricRule({
      id: 'lostRate',
      featureId: 'balance',
      label: 'نرخ ازدست‌رفته',
      kind: 'percent',
      badMin: 8,
      warnMin: 3,
      importance: 'high',
      higherIsBetter: false,
    }),
    normalizeMetricRule({
      id: 'negChargeDays',
      featureId: 'panelCharge',
      label: 'روز بدون شارژ',
      kind: 'days',
      badMin: 3,
      warnMin: 1,
      importance: 'high',
      higherIsBetter: false,
    }),
    normalizeMetricRule({
      id: 'disconnectDays',
      featureId: 'connection',
      label: 'روز قطع ارتباط',
      kind: 'days',
      badMin: 3,
      warnMin: 1,
      importance: 'high',
      higherIsBetter: false,
    }),
  ]
}

export function defaultConfig(): MonitoringConfig {
  return {
    version: 1,
    reviewTypes: [
      {
        id: 'quick',
        title: 'بررسی سریع',
        description: 'نگاه کوتاه به شاخص‌های حیاتی',
        features: {
          overall: 'defaultOn',
          subscription: 'defaultOn',
          survey: 'defaultOn',
          balance: 'defaultOn',
          panelCharge: 'defaultOn',
          complaints: 'defaultOn',
          brandSettings: 'defaultOn',
          groups: 'defaultOn',
          connection: 'defaultOn',
          credit: 'defaultOn',
          event: 'defaultOn',
          smartBlock: 'defaultOff',
          creditGeneration: 'defaultOff',
        },
        diagDefaults: [...DEFAULT_DIAG],
      },
      {
        id: 'first',
        title: 'بررسی اول',
        description: 'راه‌اندازی و صحت تنظیمات اولیه',
        features: {
          overall: 'defaultOn',
          subscription: 'defaultOn',
          survey: 'defaultOn',
          groups: 'defaultOn',
          brandSettings: 'defaultOn',
          balance: 'defaultOn',
          connection: 'defaultOn',
          event: 'defaultOn',
          creditGeneration: 'defaultOff',
        },
        diagDefaults: [...DEFAULT_DIAG, 9, 10, 11, 20],
      },
      {
        id: 'after-renewal',
        title: 'تماس بعد تمدید',
        description: 'گزارش کامل پس از تمدید برای مشتری',
        features: {
          overall: 'defaultOn',
          subscription: 'defaultOn',
          survey: 'defaultOn',
          groups: 'defaultOn',
          brandSettings: 'defaultOn',
          credit: 'defaultOn',
          creditGeneration: 'defaultOn',
          event: 'defaultOn',
          smartBlock: 'defaultOn',
          balance: 'defaultOn',
          panelCharge: 'defaultOn',
          connection: 'defaultOn',
          complaints: 'defaultOn',
        },
        diagDefaults: [...DEFAULT_DIAG, 9, 10, 19, 20, 30, 33],
      },
      {
        id: 'fourth',
        title: 'بررسی چهارم',
        description: 'بازبینی دوره‌ای عمیق‌تر',
        features: {
          overall: 'defaultOn',
          subscription: 'defaultOn',
          survey: 'defaultOn',
          credit: 'defaultOn',
          creditGeneration: 'defaultOn',
          balance: 'defaultOn',
          panelCharge: 'defaultOn',
          complaints: 'defaultOn',
          event: 'defaultOn',
          smartBlock: 'defaultOff',
        },
        diagDefaults: [...DEFAULT_DIAG, 9, 30],
      },
    ],
    metricRules: defaultMetricRules(),
    customerMessageTemplate: `سلام {{brand}}
گزارش {{type}} برای شعبه {{branch}} آماده است.

{{summaryLines}}

{{note}}

با احترام
تیم دیدبان اسمارت‌ایکس`,
    assistantFormTemplate: `برند: {{brand}}
شعبه: {{branch}}
نوع بررسی: {{type}}
بازه: {{period}}
وضعیت کلی:
{{summaryLines}}
یادداشت کارشناس: {{note}}
لینک/شناسه: {{branchId}}`,
  }
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function loadConfig(): MonitoringConfig {
  ensureDir()
  if (!fs.existsSync(CONFIG_PATH)) {
    const seed = defaultConfig()
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(seed, null, 2), 'utf8')
    return seed
  }
  try {
    const raw = JSON.parse(
      fs.readFileSync(CONFIG_PATH, 'utf8'),
    ) as MonitoringConfig
    const base = defaultConfig()
    return {
      ...base,
      ...raw,
      reviewTypes:
        Array.isArray(raw.reviewTypes) && raw.reviewTypes.length
          ? raw.reviewTypes
          : base.reviewTypes,
      metricRules: mergeMetricRules(raw.metricRules, base.metricRules),
      customerMessageTemplate:
        raw.customerMessageTemplate || base.customerMessageTemplate,
      assistantFormTemplate:
        raw.assistantFormTemplate || base.assistantFormTemplate,
    }
  } catch {
    return defaultConfig()
  }
}

export function saveConfig(config: MonitoringConfig): MonitoringConfig {
  ensureDir()
  const next: MonitoringConfig = {
    version: 1,
    reviewTypes: config.reviewTypes || [],
    metricRules: config.metricRules || [],
    customerMessageTemplate: config.customerMessageTemplate || '',
    assistantFormTemplate: config.assistantFormTemplate || '',
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8')
  return next
}

export function resetConfig(): MonitoringConfig {
  const seed = defaultConfig()
  return saveConfig(seed)
}

export function getMetricRule(id: string): MetricRule | undefined {
  return loadConfig().metricRules.find((r) => r.id === id)
}

export function getRulesForFeature(featureId: FeatureId): MetricRule[] {
  return loadConfig().metricRules.filter(
    (r) => r.featureId === featureId && r.enabled !== false,
  )
}

function mergeMetricRules(
  raw: MetricRule[] | undefined,
  defaults: MetricRule[],
): MetricRule[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaults
  const normalized = raw.map((r) =>
    normalizeMetricRule(
      r as Partial<MetricRule> & { id: string; label: string },
    ),
  )
  const byId = new Map(normalized.map((r) => [r.id, r]))
  for (const d of defaults) {
    if (!byId.has(d.id)) byId.set(d.id, d)
  }
  return Array.from(byId.values())
}

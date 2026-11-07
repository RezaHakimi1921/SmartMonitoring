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

export type FeatureCategoryId =
  | 'performance'
  | 'surveyEval'
  | 'clubSettings'
  | 'credit'
  | 'ops'

export interface Feature {
  id: FeatureId
  title: string
  description: string
  source: 'insight' | 'club' | 'evaluation' | 'bi'
  category: FeatureCategoryId
}

export interface ReviewType {
  id: string
  title: string
  description: string
  /** featureId -> mode */
  features: Partial<Record<FeatureId, FeatureMode>>
  /** پیش‌فرض نکات پیگیری (DiagType) */
  diagDefaults?: number[]
}

export type Importance = 'high' | 'medium' | 'low'
/** percent: طیف درصدی · boolean: بود/نبود · days: تعداد روز */
export type MetricKind = 'percent' | 'boolean' | 'days'

/**
 * قاعدهٔ ارزیابی کیفی یک شاخص داخل کاتالوگ ویژگی‌ها.
 * - percent: خوب ≥ goodMin · قابل‌قبول ≥ okMin · کمتر = ضعیف (اگر higherIsBetter)
 * - days (کمتر بهتر): هشدار از warnMin · خطا از badMin
 * - boolean: اگر مقدار ≠ goodWhen → اخطار/خطا بر اساس importance
 */
export type MetricRule = {
  id: string
  /** به کدام بخش کاتالوگ وصل است */
  featureId: FeatureId
  label: string
  kind: MetricKind
  /** اگر false باشد در ارزیابی نادیده گرفته می‌شود */
  enabled: boolean
  goodMin?: number
  okMin?: number
  badMin?: number
  warnMin?: number
  /** برای boolean: مقدار مطلوب (۱=وجود/فعال، ۰=عدم) */
  goodWhen?: 0 | 1
  /** اگر true باشد نبودن شاخص = اخطار (مثلاً ایونت نداشته باشد) */
  alertIfMissing?: boolean
  importance: Importance
  higherIsBetter: boolean
  /** برچسب‌های کیفی اختیاری */
  labelGood?: string
  labelOk?: string
  labelBad?: string
}

export type MonitoringConfig = {
  version: number
  reviewTypes: ReviewType[]
  metricRules: MetricRule[]
  customerMessageTemplate: string
  assistantFormTemplate: string
}

export interface BrandBranch {
  brandId: number
  brandName: string
  branchId: number
  branchName: string
  smartwifiBranchId: string
  lockNumber: string
  brandNumber: string
}

export interface ReportMetric {
  label: string
  value: string
  note?: string
  tone?: 'ok' | 'warn' | 'bad' | 'info' | 'nodata'
}

export interface ReportSection {
  featureId: FeatureId
  title: string
  metrics: ReportMetric[]
  hints?: { text: string; tone?: 'ok' | 'warn' | 'bad' }[]
  rows?: { label: string; value: string }[]
}

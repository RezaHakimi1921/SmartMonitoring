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
  tone?: 'ok' | 'warn' | 'bad' | 'info'
}

export interface ReportSection {
  featureId: FeatureId
  title: string
  metrics: ReportMetric[]
  hints?: { text: string; tone?: 'ok' | 'warn' | 'bad' }[]
  rows?: { label: string; value: string }[]
}

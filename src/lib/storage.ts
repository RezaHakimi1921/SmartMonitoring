import { DEFAULT_REVIEW_TYPES, FEATURES } from '../data/catalog'
import { DEFAULT_DIAG_IDS } from '../data/diagCatalog'
import type {
  Feature,
  FeatureId,
  FeatureMode,
  MonitoringConfig,
  ReviewType,
} from '../data/types'

let cachedConfig: MonitoringConfig | null = null

export function setCachedConfig(config: MonitoringConfig | null) {
  cachedConfig = config
}

export function getCachedConfig(): MonitoringConfig | null {
  return cachedConfig
}

export function loadReviewTypes(): ReviewType[] {
  if (cachedConfig?.reviewTypes?.length) {
    return structuredClone(cachedConfig.reviewTypes)
  }
  return structuredClone(DEFAULT_REVIEW_TYPES)
}

export function loadFeatures(): Feature[] {
  return structuredClone(FEATURES)
}

/** All catalog features; type modes set default checked state. */
export function selectionForType(
  type: ReviewType,
  catalog: Feature[] = FEATURES,
): { id: FeatureId; mode: FeatureMode | null; checked: boolean }[] {
  return catalog.map((f) => {
    const mode = type.features[f.id] ?? null
    const checked = mode === 'required' || mode === 'defaultOn'
    return { id: f.id, mode, checked }
  })
}

export function diagDefaultsForType(type: ReviewType | undefined): number[] {
  if (type?.diagDefaults?.length) return [...type.diagDefaults]
  return [...DEFAULT_DIAG_IDS]
}

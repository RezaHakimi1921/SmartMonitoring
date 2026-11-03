import { DEFAULT_REVIEW_TYPES, FEATURES } from '../data/catalog'
import type { Feature, FeatureId, FeatureMode, ReviewType } from '../data/types'

const TYPES_KEY = 'sx-monitoring-review-types'
const FEATURES_KEY = 'sx-monitoring-features'

export function loadReviewTypes(): ReviewType[] {
  try {
    const raw = localStorage.getItem(TYPES_KEY)
    if (!raw) return structuredClone(DEFAULT_REVIEW_TYPES)
    return JSON.parse(raw) as ReviewType[]
  } catch {
    return structuredClone(DEFAULT_REVIEW_TYPES)
  }
}

export function saveReviewTypes(types: ReviewType[]) {
  localStorage.setItem(TYPES_KEY, JSON.stringify(types))
}

export function loadFeatures(): Feature[] {
  try {
    const raw = localStorage.getItem(FEATURES_KEY)
    if (!raw) return structuredClone(FEATURES)
    return JSON.parse(raw) as Feature[]
  } catch {
    return structuredClone(FEATURES)
  }
}

export function saveFeatures(features: Feature[]) {
  localStorage.setItem(FEATURES_KEY, JSON.stringify(features))
}

export function resetCatalog() {
  localStorage.removeItem(TYPES_KEY)
  localStorage.removeItem(FEATURES_KEY)
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

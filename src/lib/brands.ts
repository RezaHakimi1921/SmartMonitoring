import type { BrandBranch } from '../data/types'

type BrandsFile = {
  count: number
  items: BrandBranch[]
}

let cache: BrandBranch[] | null = null

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/\u200c/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim()
}

export async function loadBrands(): Promise<BrandBranch[]> {
  if (cache) return cache
  const res = await fetch('/data/brands.json')
  if (!res.ok) throw new Error('بارگذاری مجموعه‌ها ناموفق بود')
  const data = (await res.json()) as BrandsFile
  cache = data.items
  return cache
}

export function searchBrands(items: BrandBranch[], query: string, limit = 20) {
  const q = normalize(query)
  if (!q) return items.slice(0, limit)

  const scored = items
    .map((item) => {
      const brand = normalize(item.brandName)
      const branch = normalize(item.branchName)
      const lock = normalize(item.lockNumber)
      const brandNo = normalize(item.brandNumber)
      const sw = normalize(item.smartwifiBranchId)
      let score = 0
      if (lock === q || brandNo === q || sw === q) score += 100
      else if (lock.includes(q) || brandNo.includes(q) || sw.includes(q)) score += 60
      if (brand.includes(q)) score += 40
      if (branch.includes(q)) score += 30
      return { item, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((x) => x.item)
}

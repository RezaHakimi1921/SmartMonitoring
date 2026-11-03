import { describe, expect, it } from 'vitest'
import type { BrandBranch } from '../data/types'
import { searchBrands } from '../lib/brands'

const make = (id: number, brand: string, lock: string): BrandBranch => ({
  brandId: id,
  brandName: brand,
  branchId: id,
  branchName: brand,
  smartwifiBranchId: String(id * 7),
  lockNumber: lock,
  brandNumber: String(id),
})

const items = [
  make(1, 'کبابخانه محفل', '12345'),
  make(2, 'کافه محفل', '99999'),
  make(3, 'رستوران ستاره', '54321'),
]

describe('جستجوی مجموعه', () => {
  it('شماره قفل دقیق در اولویت است', () => {
    expect(searchBrands(items, '99999')[0].branchId).toBe(2)
  })
  it('جستجوی نام، حروف عربی و فارسی را یکی می‌گیرد', () => {
    expect(searchBrands(items, 'كافه').map((i) => i.branchId)).toEqual([2])
  })
  it('نتیجه نامرتبط برنمی‌گردد', () => {
    expect(searchBrands(items, 'ناموجود')).toHaveLength(0)
  })
})

import { useEffect, useMemo, useState } from 'react'
import type { BrandBranch } from '../data/types'
import { loadBrands, searchBrands } from '../lib/brands'

type Props = {
  value: BrandBranch | null
  onChange: (item: BrandBranch | null) => void
}

export function BrandSearch({ value, onChange }: Props) {
  const [items, setItems] = useState<BrandBranch[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    loadBrands()
      .then((list) => {
        if (!alive) return
        setItems(list)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'خطا در بارگذاری')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const results = useMemo(
    () => searchBrands(items, query, 25),
    [items, query],
  )

  return (
    <div className="brand-search">
      <label htmlFor="brand-q" className="field-label">
        جستجوی مجموعه (نام یا لاک‌نامبر)
      </label>
      <input
        id="brand-q"
        className="input"
        placeholder="مثال: کافه … یا ۹۰۹۶۸۹"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      <p className="muted" style={{ margin: '8px 0 0' }}>
        منبع: همان فیلدهای AdminDashboard (نام برند/شعبه، LockNumber =
        SepandBranchCloudConsumerId، BrandNumber)
        {loading ? ' · در حال بارگذاری…' : ` · ${items.length.toLocaleString('fa-IR')} شعبه`}
      </p>
      {error ? <div className="hint bad">{error}</div> : null}

      {value ? (
        <div className="selected-brand">
          <div>
            <strong>
              {value.brandName} — {value.branchName}
            </strong>
            <div className="muted">
              لاک: {value.lockNumber || '—'} · BrandNo: {value.brandNumber} · BranchId:{' '}
              {value.branchId}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onChange(null)}
          >
            پاک کردن
          </button>
        </div>
      ) : null}

      {open && query.trim() ? (
        <div className="brand-results" role="listbox">
          {results.length === 0 ? (
            <div className="muted" style={{ padding: 12 }}>
              نتیجه‌ای پیدا نشد
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.branchId}
                type="button"
                className="brand-result"
                onClick={() => {
                  onChange(item)
                  setQuery(`${item.brandName} — ${item.branchName}`)
                  setOpen(false)
                }}
              >
                <strong>
                  {item.brandName} — {item.branchName}
                </strong>
                <span className="muted">
                  لاک {item.lockNumber || '—'} · شماره برند {item.brandNumber}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

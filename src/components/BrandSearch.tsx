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
      .catch(() => {
        if (!alive) return
        setError('لیست مجموعه‌ها بارگذاری نشد')
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
      {value ? (
        <>
          <div className="field-label">مجموعه انتخاب‌شده</div>
          <div className="brand-selected">
            <span className="brand-selected-check" aria-hidden="true">
              ✓
            </span>
            <strong>
              {value.brandName}
              {value.branchName !== value.brandName
                ? ` — ${value.branchName}`
                : ''}
            </strong>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onChange(null)
                setQuery('')
                setOpen(false)
              }}
            >
              تغییر
            </button>
          </div>
        </>
      ) : (
        <>
          <label htmlFor="brand-q" className="field-label">
            نام مجموعه یا شماره قفل
          </label>
          <input
            id="brand-q"
            className="input"
            placeholder={loading ? 'در حال آماده‌سازی…' : 'جستجو کنید…'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {error ? <div className="hint bad">{error}</div> : null}
        </>
      )}

      {!value && open && query.trim() ? (
        <div className="brand-results" role="listbox">
          {results.length === 0 ? (
            <div className="muted" style={{ padding: 12 }}>
              موردی پیدا نشد
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.branchId}
                type="button"
                className="brand-result"
                onClick={() => {
                  onChange(item)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <strong>
                  {item.brandName}
                  {item.branchName !== item.brandName
                    ? ` — ${item.branchName}`
                    : ''}
                </strong>
                {item.lockNumber && item.lockNumber !== '0' ? (
                  <span className="muted">شماره قفل {item.lockNumber}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

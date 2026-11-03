import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import type { BrandBranch } from '../data/types'
import { loadBrands, searchBrands } from '../lib/brands'
import { loadHistory } from '../lib/history'

type Props = {
  value: BrandBranch | null
  onChange: (item: BrandBranch | null) => void
}

function fullName(item: { brandName: string; branchName: string }) {
  return item.branchName && item.branchName !== item.brandName
    ? `${item.brandName} — ${item.branchName}`
    : item.brandName
}

function hasLock(item: BrandBranch) {
  return !!item.lockNumber && item.lockNumber !== '0'
}

/** بخشی از متن که با جستجو یکی است پررنگ می‌شود. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export function BrandSearch({ value, onChange }: Props) {
  const [items, setItems] = useState<BrandBranch[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)

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
        setError('لیست مجموعه‌ها بارگذاری نشد. صفحه را دوباره باز کنید.')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const results = useMemo(
    () => (query.trim() ? searchBrands(items, query, 25) : []),
    [items, query],
  )

  // مجموعه‌هایی که اخیراً بررسی شده‌اند (وقتی کادر جستجو خالی است)
  const recent = useMemo(() => {
    if (items.length === 0) return []
    const seen = new Set<string>()
    const out: BrandBranch[] = []
    for (const h of loadHistory()) {
      if (seen.has(h.branchId)) continue
      seen.add(h.branchId)
      const found = items.find((b) => String(b.branchId) === h.branchId)
      if (found) out.push(found)
      if (out.length >= 5) break
    }
    return out
  }, [items])

  const showRecent = !query.trim()
  const list = showRecent ? recent : results

  useEffect(() => {
    setActive(0)
  }, [query])

  const pick = (item: BrandBranch) => {
    onChange(item)
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, Math.max(list.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && list[active]) {
        e.preventDefault()
        pick(list[active])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const listOpen = !value && open && (list.length > 0 || !showRecent)

  return (
    <div className="brand-search">
      {value ? (
        <>
          <div className="field-label">مجموعه انتخاب‌شده</div>
          <div className="brand-selected">
            <span className="brand-selected-check" aria-hidden="true">
              ✓
            </span>
            <div className="brand-selected-text">
              <strong>{fullName(value)}</strong>
              {hasLock(value) ? (
                <span className="muted">شماره قفل {value.lockNumber}</span>
              ) : null}
            </div>
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
            role="combobox"
            aria-expanded={listOpen}
            aria-controls="brand-listbox"
            aria-activedescendant={listOpen && list[active] ? `brand-opt-${active}` : undefined}
            placeholder={loading ? 'در حال آماده‌سازی…' : 'مثلاً: نام مجموعه یا ۱۲۳۴۵'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          {error ? <div className="hint bad">{error}</div> : null}
        </>
      )}

      {listOpen ? (
        <div className="brand-results" role="listbox" id="brand-listbox">
          {showRecent ? (
            <div className="brand-results-title muted">اخیراً بررسی شده</div>
          ) : null}
          {!showRecent && results.length === 0 ? (
            <div className="muted" style={{ padding: 12 }}>
              مجموعه‌ای پیدا نشد؛ نام یا شماره قفل را بررسی کنید.
            </div>
          ) : (
            list.map((item, i) => (
              <button
                key={item.branchId}
                id={`brand-opt-${i}`}
                role="option"
                aria-selected={i === active}
                type="button"
                tabIndex={-1}
                className={`brand-result${i === active ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(item)}
              >
                <strong>
                  <Highlight text={fullName(item)} query={query} />
                </strong>
                {hasLock(item) ? (
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

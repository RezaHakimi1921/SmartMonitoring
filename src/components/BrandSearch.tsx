import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@smartx/design-system'
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

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <Box
        component="mark"
        sx={{ bgcolor: 'primary.primaryContainer', px: 0.25, borderRadius: 0.5 }}
      >
        {text.slice(i, i + q.length)}
      </Box>
      {text.slice(i + q.length)}
    </>
  )
}

export function BrandSearch({ value, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
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
  const listOpen = !value && open && (list.length > 0 || !showRecent)

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!listOpen) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [listOpen])

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

  return (
    <Box ref={rootRef}>
      {value ? (
        <Stack spacing={1}>
          <Typography variant="labelMedium" color="text.secondary" display="block">
            مجموعه انتخاب‌شده
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.main',
              bgcolor: 'primary.primaryContainer',
            }}
          >
            <Typography variant="titleSmall" color="primary" aria-hidden>
              ✓
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="titleSmall" display="block">
                {fullName(value)}
              </Typography>
              {hasLock(value) ? (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                  display="block"
                >
                  شماره قفل {value.lockNumber}
                </Typography>
              ) : null}
            </Box>
            <Button
              buttonVariant="text"
              buttonSize="small"
              onClick={() => {
                onChange(null)
                setQuery('')
                setOpen(false)
              }}
            >
              تغییر
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1}>
          <TextField
            id="brand-q"
            label="نام مجموعه یا شماره قفل"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls="brand-listbox"
            aria-activedescendant={
              listOpen && list[active] ? `brand-opt-${active}` : undefined
            }
            placeholder={
              loading ? 'در حال آماده‌سازی…' : 'مثلاً: نام مجموعه یا ۱۲۳۴۵'
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            fullWidth
            autoComplete="off"
          />
          {error ? (
            <Typography variant="bodySmall" color="error" display="block">
              {error}
            </Typography>
          ) : null}

          {listOpen ? (
            <Box
              role="listbox"
              id="brand-listbox"
              sx={{
                maxHeight: 280,
                overflowY: 'auto',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: 2,
              }}
            >
              {showRecent ? (
                <Typography
                  variant="labelMedium"
                  color="text.secondary"
                  sx={{ px: 1.5, py: 1, display: 'block' }}
                >
                  اخیراً بررسی شده
                </Typography>
              ) : null}
              {!showRecent && results.length === 0 ? (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                  sx={{ p: 1.5, display: 'block' }}
                >
                  مجموعه‌ای پیدا نشد؛ نام یا شماره قفل را بررسی کنید.
                </Typography>
              ) : (
                list.map((item, i) => (
                  <Box
                    key={item.branchId}
                    id={`brand-opt-${i}`}
                    component="button"
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(item)}
                    sx={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'right',
                      border: 0,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: i === active ? 'action.hover' : 'transparent',
                      px: 1.5,
                      py: 1.25,
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'inherit',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <Typography
                      variant="titleSmall"
                      component="div"
                      display="block"
                    >
                      <Highlight text={fullName(item)} query={query} />
                    </Typography>
                    {hasLock(item) ? (
                      <Typography
                        variant="bodySmall"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 0.25 }}
                      >
                        شماره قفل {item.lockNumber}
                      </Typography>
                    ) : null}
                  </Box>
                ))
              )}
            </Box>
          ) : null}
        </Stack>
      )}
    </Box>
  )
}

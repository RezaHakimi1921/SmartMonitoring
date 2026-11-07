import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'

export type TemplateTag = {
  /** مقدار درج‌شونده در قالب، مثل {{brand}} */
  token: string
  /** نمایش شبیه BrandName@ */
  tag: string
  label: string
}

export const MESSAGE_TAGS: TemplateTag[] = [
  { token: '{{brand}}', tag: 'BrandName@', label: 'نام برند' },
  { token: '{{branch}}', tag: 'BranchName@', label: 'نام شعبه' },
  { token: '{{type}}', tag: 'ReviewType@', label: 'نوع بررسی' },
  { token: '{{period}}', tag: 'Period@', label: 'بازه زمانی' },
  { token: '{{summaryLines}}', tag: 'SummaryLines@', label: 'خلاصه وضعیت‌ها' },
  { token: '{{note}}', tag: 'ExpertNote@', label: 'یادداشت کارشناس' },
  { token: '{{reportDate}}', tag: 'ReportDate@', label: 'تاریخ گزارش' },
  { token: '{{place}}', tag: 'Place@', label: 'محل / مجموعه' },
  { token: '{{branchId}}', tag: 'BranchId@', label: 'شناسه شعبه' },
]

/** نگاشت Name@ → کلید fillTemplate */
export const MESSAGE_TAG_VAR: Record<string, string> = Object.fromEntries(
  MESSAGE_TAGS.map((t) => [t.tag, t.token.replace(/^\{\{|\}\}$/g, '')]),
)

type Props = {
  title: string
  value: string
  onChange: (next: string) => void
  tags?: TemplateTag[]
}

export function TemplateTagEditor({
  title,
  value,
  onChange,
  tags = MESSAGE_TAGS,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? tags : tags.slice(0, 8)

  const insert = (tag: string) => {
    const el = ref.current
    if (!el) {
      onChange(`${value}${tag}`)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + tag + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + tag.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <section className="template-editor glass-card">
      <h3 className="panel-title">{title}</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        روی <strong>+</strong> بزنید تا تگ در محل مکان‌نما درج شود.
      </p>

      <div className="param-tag-grid" dir="rtl">
        {visible.map((t) => (
          <div key={t.token} className="param-tag-cell">
            <span className="param-tag-label">{t.label}</span>
            <button
              type="button"
              className="param-tag-add"
              title={`درج ${t.tag}`}
              aria-label={`درج ${t.label}`}
              onClick={() => insert(t.tag)}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
            <code className="param-tag-token">{t.tag}</code>
          </div>
        ))}
      </div>

      {tags.length > 8 ? (
        <label className="toggle-field param-more">
          <button
            type="button"
            role="switch"
            aria-checked={showAll}
            className={`toggle${showAll ? ' on' : ''}`}
            onClick={() => setShowAll((v) => !v)}
          >
            <span className="toggle-knob" />
          </button>
          <span>مشاهده سایر پارامترها</span>
        </label>
      ) : null}

      <textarea
        ref={ref}
        className="textarea message-edit"
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  )
}

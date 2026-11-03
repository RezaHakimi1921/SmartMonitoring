import { FEATURE_CATEGORIES } from '../data/catalog'
import { DIAG_ITEMS } from '../data/diagCatalog'
import type { Feature, FeatureId } from '../data/types'
import { toFaDigits } from '../lib/jalali'

type Props = {
  features: Feature[]
  checked: Set<FeatureId>
  /** بخش‌های الزامی که نمی‌شود برداشت */
  required?: Set<FeatureId>
  diag: number[]
  onToggleFeature: (id: FeatureId) => void
  onSetCategory: (categoryId: string, checked: boolean) => void
  onToggleDiag: (id: number) => void
  onSetDiag: (ids: number[]) => void
}

/** فهرست انتخاب بخش‌ها و نکات پیگیری — هم در تنظیم بررسی و هم در صفحه گزارش. */
export function ReportOptions({
  features,
  checked,
  required = new Set(),
  diag,
  onToggleFeature,
  onSetCategory,
  onToggleDiag,
  onSetDiag,
}: Props) {
  return (
    <div className="category-stack">
      {FEATURE_CATEGORIES.map((cat) => {
        const items = features.filter((f) => f.category === cat.id)
        if (items.length === 0) return null
        const onCount = items.filter((i) => checked.has(i.id)).length
        return (
          <section key={cat.id} className="category-block">
            <div className="category-head">
              <div>
                <h4>{cat.title}</h4>
                <p className="muted">{cat.description}</p>
              </div>
              <div className="actions">
                <span className="chip">
                  {toFaDigits(onCount)} از {toFaDigits(items.length)}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ height: 36 }}
                  onClick={() => onSetCategory(cat.id, true)}
                >
                  انتخاب همه
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ height: 36 }}
                  onClick={() => onSetCategory(cat.id, false)}
                >
                  برداشتن همه
                </button>
              </div>
            </div>
            <div className="feature-list">
              {items.map((item) => {
                const isRequired = required.has(item.id)
                const isOn = checked.has(item.id)
                return (
                  <label
                    key={item.id}
                    className={`feature-item${isRequired ? ' required' : ''}${isOn ? ' is-on' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      disabled={isRequired}
                      onChange={() => onToggleFeature(item.id)}
                    />
                    <span>
                      <strong>
                        {item.title}
                        {isRequired ? ' (الزامی)' : ''}
                      </strong>
                      <span className="muted">{item.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="category-block">
        <div className="category-head">
          <div>
            <h4>نکات قابل پیگیری</h4>
            <p className="muted">
              مواردی که در پایان گزارش برای پیگیری فهرست می‌شوند
            </p>
          </div>
          <div className="actions">
            <span className="chip">
              {toFaDigits(diag.length)} از {toFaDigits(DIAG_ITEMS.length)}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ height: 36 }}
              onClick={() => onSetDiag(DIAG_ITEMS.map((d) => d.id))}
            >
              انتخاب همه
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ height: 36 }}
              onClick={() => onSetDiag([])}
            >
              برداشتن همه
            </button>
          </div>
        </div>
        <div className="feature-list">
          {DIAG_ITEMS.map((d) => (
            <label
              key={d.id}
              className={`feature-item${diag.includes(d.id) ? ' is-on' : ''}`}
            >
              <input
                type="checkbox"
                checked={diag.includes(d.id)}
                onChange={() => onToggleDiag(d.id)}
              />
              <span>
                <strong>{d.title}</strong>
                <span className="muted">{d.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}

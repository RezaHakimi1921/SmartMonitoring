import { FEATURE_CATEGORIES } from '../data/catalog'
import { DIAG_CATEGORIES, DIAG_ITEMS } from '../data/diagCatalog'
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
  onSetDiagCategory?: (categoryId: string, checked: boolean) => void
  /** بازگشت به انتخاب‌های پیشنهادی همین نوع بررسی */
  onReset?: () => void
}

/** فهرست انتخاب بخش‌ها و نکات پیگیری — دسته‌بندی + انتخاب همه. */
export function ReportOptions({
  features,
  checked,
  required = new Set(),
  diag,
  onToggleFeature,
  onSetCategory,
  onToggleDiag,
  onSetDiag,
  onSetDiagCategory,
  onReset,
}: Props) {
  const setDiagCat = (categoryId: string, on: boolean) => {
    if (onSetDiagCategory) {
      onSetDiagCategory(categoryId, on)
      return
    }
    const ids = DIAG_ITEMS.filter((d) => d.category === categoryId).map(
      (d) => d.id,
    )
    if (on) {
      onSetDiag(Array.from(new Set([...diag, ...ids])))
    } else {
      const drop = new Set(ids)
      onSetDiag(diag.filter((id) => !drop.has(id)))
    }
  }

  return (
    <div className="category-stack">
      {onReset ? (
        <div className="options-reset">
          <span className="muted">
            انتخاب‌های اولیه برای این نوع بررسی پیشنهاد شده‌اند.
          </span>
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            بازگشت به پیشنهاد پیش‌فرض
          </button>
        </div>
      ) : null}

      <h3 className="panel-title" style={{ marginTop: 0 }}>
        بخش‌های گزارش
      </h3>
      {FEATURE_CATEGORIES.map((cat) => {
        const items = features.filter((f) => f.category === cat.id)
        if (items.length === 0) return null
        const onCount = items.filter((i) => checked.has(i.id)).length
        return (
          <section key={cat.id} className="category-block glass-card">
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
                  لغو اختیاری‌ها
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

      <h3 className="panel-title">نکات قابل پیگیری</h3>
      {DIAG_CATEGORIES.map((cat) => {
        const items = DIAG_ITEMS.filter((d) => d.category === cat.id)
        if (items.length === 0) return null
        const onCount = items.filter((d) => diag.includes(d.id)).length
        return (
          <section key={cat.id} className="category-block glass-card">
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
                  onClick={() => setDiagCat(cat.id, true)}
                >
                  انتخاب همه
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ height: 36 }}
                  onClick={() => setDiagCat(cat.id, false)}
                >
                  لغو انتخاب
                </button>
              </div>
            </div>
            <div className="feature-list">
              {items.map((d) => (
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
        )
      })}
    </div>
  )
}

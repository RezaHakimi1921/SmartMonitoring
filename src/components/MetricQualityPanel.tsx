import { FEATURE_CATEGORIES, FEATURES } from '../data/catalog'
import type {
  Importance,
  MetricKind,
  MetricRule,
} from '../data/types'

const IMPORTANCE: { id: Importance; label: string }[] = [
  { id: 'high', label: 'بالا' },
  { id: 'medium', label: 'متوسط' },
  { id: 'low', label: 'پایین' },
]

type Props = {
  rules: MetricRule[]
  canEdit: boolean
  onUpdate: (id: string, patch: Partial<MetricRule>) => void
  onSetKind: (id: string, kind: MetricKind) => void
}

export function MetricQualityPanel({
  rules,
  canEdit,
  onUpdate,
  onSetKind,
}: Props) {
  return (
    <div className="metric-admin">
      <header className="metric-admin-intro glass-card">
        <h3>کیفی شاخص‌ها</h3>
        <p className="muted">
          همه شاخص‌های کاتالوگ در دو ستون. فقط سوپرادمین می‌تواند مقادیر را
          تغییر دهد؛ افزودن شاخص از این صفحه غیرفعال است.
        </p>
        {!canEdit ? (
          <p className="metric-readonly-note">حالت مشاهده — ویرایش فقط برای سوپرادمین</p>
        ) : null}
      </header>

      {FEATURE_CATEGORIES.map((cat) => {
        const features = FEATURES.filter((f) => f.category === cat.id)
        const catRules = rules.filter((r) =>
          features.some((f) => f.id === r.featureId),
        )
        if (!features.length) return null
        return (
          <section key={cat.id} className="metric-feature-group">
            <div className="metric-feature-group-head">
              <h4>{cat.title}</h4>
              <span className="muted">
                {cat.description}
                {catRules.length ? ` · ${catRules.length} شاخص` : ''}
              </span>
            </div>

            <div className="metric-feature-grid">
              {features.map((feature) => {
                const featureRules = rules.filter(
                  (r) => r.featureId === feature.id,
                )
                return (
                  <div key={feature.id} className="metric-feature-block">
                    <div className="metric-feature-title">
                      <strong>{feature.title}</strong>
                      <span className="chip">
                        {featureRules.length
                          ? `${featureRules.length} شاخص`
                          : 'بدون شاخص'}
                      </span>
                    </div>

                    {featureRules.length === 0 ? (
                      <p className="muted metric-empty">
                        هنوز شاخصی برای این بخش ثبت نشده است.
                      </p>
                    ) : (
                      <div className="metric-card-stack">
                        {featureRules.map((r) => (
                          <MetricCard
                            key={r.id}
                            rule={r}
                            canEdit={canEdit}
                            onUpdate={onUpdate}
                            onSetKind={onSetKind}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MetricCard({
  rule: r,
  canEdit,
  onUpdate,
  onSetKind,
}: {
  rule: MetricRule
  canEdit: boolean
  onUpdate: Props['onUpdate']
  onSetKind: Props['onSetKind']
}) {
  const disabled = !canEdit
  return (
    <article
      className={`metric-card glass-card${r.enabled === false ? ' is-off' : ''}${disabled ? ' is-readonly' : ''}`}
    >
      <div className="metric-card-top">
        <label className="field metric-name-field">
          <span>نام شاخص</span>
          <input
            className="input"
            value={r.label}
            disabled={disabled}
            onChange={(e) => onUpdate(r.id, { label: e.target.value })}
          />
        </label>
        <label className="toggle-field">
          <span>فعال</span>
          <button
            type="button"
            role="switch"
            aria-checked={r.enabled !== false}
            disabled={disabled}
            className={`toggle${r.enabled !== false ? ' on' : ''}`}
            onClick={() => {
              if (disabled) return
              onUpdate(r.id, { enabled: !(r.enabled !== false) })
            }}
          >
            <span className="toggle-knob" />
          </button>
        </label>
      </div>

      <div className="metric-card-row">
        <label className="field">
          <span>نوع ارزیابی</span>
          <select
            className="select"
            value={r.kind}
            disabled={disabled}
            onChange={(e) => onSetKind(r.id, e.target.value as MetricKind)}
          >
            <option value="percent">طیف درصد</option>
            <option value="boolean">بود / نبود</option>
            <option value="days">تعداد روز</option>
          </select>
        </label>
        {r.kind === 'percent' ? (
          <label className="field">
            <span>جهت</span>
            <select
              className="select"
              value={r.higherIsBetter ? 'up' : 'down'}
              disabled={disabled}
              onChange={(e) =>
                onUpdate(r.id, { higherIsBetter: e.target.value === 'up' })
              }
            >
              <option value="up">بالاتر بهتر</option>
              <option value="down">پایین‌تر بهتر</option>
            </select>
          </label>
        ) : (
          <label className="field">
            <span>اهمیت</span>
            <select
              className="select"
              value={r.importance}
              disabled={disabled}
              onChange={(e) =>
                onUpdate(r.id, {
                  importance: e.target.value as Importance,
                })
              }
            >
              {IMPORTANCE.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {r.kind === 'percent' && r.higherIsBetter ? (
        <div className="metric-bands">
          <label className="field band good">
            <span>مثبت ≥</span>
            <input
              className="input"
              type="number"
              disabled={disabled}
              value={r.goodMin ?? ''}
              onChange={(e) =>
                onUpdate(r.id, { goodMin: Number(e.target.value) })
              }
            />
          </label>
          <label className="field band ok">
            <span>قابل قبول ≥</span>
            <input
              className="input"
              type="number"
              disabled={disabled}
              value={r.okMin ?? ''}
              onChange={(e) =>
                onUpdate(r.id, { okMin: Number(e.target.value) })
              }
            />
          </label>
          <label className="field band bad">
            <span>ضعیف &lt;</span>
            <input
              className="input"
              type="number"
              readOnly
              tabIndex={-1}
              value={r.okMin ?? ''}
              title="ضعیف یعنی کمتر از آستانه قابل‌قبول"
            />
          </label>
        </div>
      ) : null}

      {r.kind === 'percent' && !r.higherIsBetter ? (
        <div className="metric-bands">
          <label className="field band good">
            <span>مثبت &lt;</span>
            <input
              className="input"
              type="number"
              readOnly
              tabIndex={-1}
              value={r.warnMin ?? ''}
              title="مثبت یعنی کمتر از آستانه قابل‌قبول"
            />
          </label>
          <label className="field band ok">
            <span>قابل قبول از</span>
            <input
              className="input"
              type="number"
              disabled={disabled}
              value={r.warnMin ?? ''}
              onChange={(e) =>
                onUpdate(r.id, { warnMin: Number(e.target.value) })
              }
            />
          </label>
          <label className="field band bad">
            <span>ضعیف از</span>
            <input
              className="input"
              type="number"
              disabled={disabled}
              value={r.badMin ?? ''}
              onChange={(e) =>
                onUpdate(r.id, { badMin: Number(e.target.value) })
              }
            />
          </label>
        </div>
      ) : null}

      {r.kind === 'days' ? (
        <div className="metric-bands">
          <label className="field band good">
            <span>مثبت تا</span>
            <input
              className="input"
              type="number"
              readOnly
              tabIndex={-1}
              value={r.warnMin ?? ''}
              title="مثبت یعنی کمتر از آستانه هشدار"
            />
          </label>
          <label className="field band ok">
            <span>هشدار از</span>
            <input
              className="input"
              type="number"
              disabled={disabled}
              value={r.warnMin ?? ''}
              onChange={(e) =>
                onUpdate(r.id, { warnMin: Number(e.target.value) })
              }
            />
          </label>
          <label className="field band bad">
            <span>خطا از</span>
            <input
              className="input"
              type="number"
              disabled={disabled}
              value={r.badMin ?? ''}
              onChange={(e) =>
                onUpdate(r.id, { badMin: Number(e.target.value) })
              }
            />
          </label>
        </div>
      ) : null}

      {r.kind === 'boolean' ? (
        <div className="metric-card-row">
          <label className="field">
            <span>وضعیت مطلوب</span>
            <select
              className="select"
              value={r.goodWhen ?? 1}
              disabled={disabled}
              onChange={(e) =>
                onUpdate(r.id, {
                  goodWhen: Number(e.target.value) as 0 | 1,
                })
              }
            >
              <option value={1}>باشد / فعال = خوب</option>
              <option value={0}>نباشد = خوب</option>
            </select>
          </label>
          <label className="field">
            <span>اگر داده نبود</span>
            <select
              className="select"
              value={r.alertIfMissing ? 'yes' : 'no'}
              disabled={disabled}
              onChange={(e) =>
                onUpdate(r.id, {
                  alertIfMissing: e.target.value === 'yes',
                })
              }
            >
              <option value="yes">اخطار بده</option>
              <option value="no">نادیده</option>
            </select>
          </label>
        </div>
      ) : null}

      {r.kind === 'percent' || r.kind === 'days' ? (
        <label className="field">
          <span>اهمیت</span>
          <select
            className="select"
            value={r.importance}
            disabled={disabled}
            onChange={(e) =>
              onUpdate(r.id, {
                importance: e.target.value as Importance,
              })
            }
          >
            {IMPORTANCE.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </article>
  )
}

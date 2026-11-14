import { useMemo, useState } from 'react'
import { Box, Card, Chip, Typography } from '@smartx/design-system'
import { FEATURE_CATEGORIES, FEATURES } from '../data/catalog'
import { metricQueryById } from '../data/metricQueries'
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
      <Card elevation={1} sx={{ p: 1, mb: 2 }}>
        <Typography variant="titleLarge">کیفی شاخص‌ها</Typography>
        <Typography variant="bodySmall" color="text.secondary">
          همه شاخص‌های کاتالوگ در دو ستون. فقط سوپرادمین می‌تواند مقادیر را
          تغییر دهد. در هر کارت، «وضعیت پیشرفته» منبع و کوئری واقعی را نشان
          می‌دهد (ترجیح: SmartPowerBI مثل Insight).
        </Typography>
        {!canEdit ? (
          <Typography variant="bodySmall" color="warning.main" sx={{ mt: 1 }}>
            حالت مشاهده — ویرایش فقط برای سوپرادمین
          </Typography>
        ) : null}
      </Card>

      {FEATURE_CATEGORIES.map((cat) => {
        const features = FEATURES.filter((f) => f.category === cat.id)
        const catRules = rules.filter((r) =>
          features.some((f) => f.id === r.featureId),
        )
        if (!features.length) return null
        return (
          <section key={cat.id} className="metric-feature-group">
            <Box className="metric-feature-group-head" sx={{ mb: 1.5 }}>
              <Typography variant="titleMedium">{cat.title}</Typography>
              <Typography variant="bodySmall" color="text.secondary">
                {cat.description}
                {catRules.length ? ` · ${catRules.length} شاخص` : ''}
              </Typography>
            </Box>

            <div className="metric-feature-grid">
              {features.map((feature) => {
                const featureRules = rules.filter(
                  (r) => r.featureId === feature.id,
                )
                return (
                  <div key={feature.id} className="metric-feature-block">
                    <Box
                      className="metric-feature-title"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="titleSmall">
                        {feature.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          featureRules.length
                            ? `${featureRules.length} شاخص`
                            : 'بدون شاخص'
                        }
                      />
                    </Box>

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

      <MetricAdvancedStatus metricId={r.id} />
    </article>
  )
}

function MetricAdvancedStatus({ metricId }: { metricId: string }) {
  const [open, setOpen] = useState(false)
  const [fromKey, setFromKey] = useState('14050717')
  const [toKey, setToKey] = useState('14050817')
  const [sw, setSw] = useState('11202')
  const [branchId, setBranchId] = useState('7220')
  const doc = metricQueryById(metricId)

  const filledSql = useMemo(() => {
    if (!doc) return ''
    const fromYm = fromKey.slice(0, 6)
    const toYm = toKey.slice(0, 6)
    return doc.sql
      .replaceAll('@sw', sw || '@sw')
      .replaceAll('@branchId', branchId || '@branchId')
      .replaceAll('@brandId', '@brandId')
      .replaceAll('@fromKey', fromKey || '@fromKey')
      .replaceAll('@toKey', toKey || '@toKey')
      .replaceAll('@fromYm', fromYm || '@fromYm')
      .replaceAll('@toYm', toYm || '@toYm')
  }, [doc, sw, branchId, fromKey, toKey])

  if (!doc) {
    return (
      <Box sx={{ mt: 1.5 }}>
        <Typography variant="bodySmall" color="text.secondary">
          وضعیت پیشرفته: کوئری برای این شاخص تعریف نشده است.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        mt: 1.5,
        pt: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          font: 'inherit',
          color: 'inherit',
          textAlign: 'right',
        }}
      >
        <Typography variant="labelMedium" display="block">
          وضعیت پیشرفته
        </Typography>
        <Chip
          size="small"
          color={doc.shouldUsePowerBI ? 'success' : 'warning'}
          label={doc.shouldUsePowerBI ? 'SmartPowerBI' : 'غیر BI'}
        />
      </button>

      {open ? (
        <Box sx={{ mt: 1.25 }}>
          <Typography variant="bodySmall" color="text.secondary" display="block">
            منبع: {doc.source}
          </Typography>
          <Typography variant="bodySmall" display="block" sx={{ mt: 0.75 }}>
            {doc.note}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: '1fr 1fr',
              mt: 1.25,
            }}
          >
            <label className="field">
              <span>fromKey</span>
              <input
                className="input"
                value={fromKey}
                onChange={(e) => setFromKey(e.target.value)}
                dir="ltr"
              />
            </label>
            <label className="field">
              <span>toKey</span>
              <input
                className="input"
                value={toKey}
                onChange={(e) => setToKey(e.target.value)}
                dir="ltr"
              />
            </label>
            <label className="field">
              <span>@sw</span>
              <input
                className="input"
                value={sw}
                onChange={(e) => setSw(e.target.value)}
                dir="ltr"
              />
            </label>
            <label className="field">
              <span>@branchId</span>
              <input
                className="input"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                dir="ltr"
              />
            </label>
          </Box>
          <Box
            component="pre"
            dir="ltr"
            sx={{
              mt: 1.25,
              p: 1.25,
              borderRadius: 2,
              bgcolor: 'grey.900',
              color: 'grey.100',
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              maxHeight: 220,
            }}
          >
            {filledSql}
          </Box>
        </Box>
      ) : (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          برای دیدن کوئری و پارامتر تاریخ کلیک کنید
          {doc.shouldUsePowerBI ? ' · باید از PowerBI خوانده شود' : ''}
        </Typography>
      )}
    </Box>
  )
}

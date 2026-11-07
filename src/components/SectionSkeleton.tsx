/** UUPM: stable per-section skeleton (aria-busy), not a full-page spinner. */
export function SectionSkeleton({
  title,
  cards = 4,
}: {
  title?: string
  cards?: number
}) {
  return (
    <div
      className="section-skeleton glass-card"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      {title ? (
        <div className="section-head">
          <div className="skel skel-title" />
          <div className="skel skel-chip" />
        </div>
      ) : (
        <span className="sr-only">در حال بارگذاری بخش گزارش</span>
      )}
      <p className="muted skel-caption">در حال آماده‌سازی این بخش…</p>
      <div className="kpi-grid">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="kpi skel-kpi" aria-hidden="true">
            <div className="kpi-bar info" />
            <div className="kpi-body">
              <div className="skel skel-line short" />
              <div className="skel skel-line value" />
              <div className="skel skel-line note" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SummarySkeleton() {
  return (
    <div className="section-skeleton" aria-busy="true">
      <p className="muted skel-caption">در حال جمع‌بندی بخش‌ها…</p>
      <div className="sum-counts">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sum-count skel-sum">
            <div className="skel skel-line value" />
            <div className="skel skel-line short" />
          </div>
        ))}
      </div>
      <div className="skel-stack">
        <div className="skel skel-block" />
        <div className="skel skel-block" />
      </div>
    </div>
  )
}

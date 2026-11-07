type Props = {
  progress: number
  displayValue: string
  label: string
}

export function ScoreRing({ progress, displayValue, label }: Props) {
  const pct = Math.max(0, Math.min(100, progress))
  return (
    <div className="score-ring-wrap">
      <div
        className="score-ring"
        style={{
          background: `conic-gradient(#17877d ${pct * 3.6}deg, #e5eeed 0deg)`,
        }}
      >
        <div className="score-ring-center">
          <strong>{displayValue}</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}

import { Box, Typography } from '@smartx/design-system'
import { useTheme } from '@mui/material/styles'

type Props = {
  progress: number
  displayValue: string
  label: string
  color?: string
}

const SIZE = 88
const STROKE = 9
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

export function ScoreRing({
  progress,
  displayValue,
  label,
  color,
}: Props) {
  const theme = useTheme()
  const pct = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0))
  const dash = (pct / 100) * C
  const stroke = color || theme.palette.primary.main

  return (
    <Box
      className="score-ring-wrap"
      title={`${label}: ${displayValue}`}
      sx={{
        flex: '1 1 0',
        display: 'flex',
        justifyContent: 'center',
        minWidth: 0,
      }}
    >
      <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            px: 0.5,
          }}
        >
          <Box>
            <Typography
              variant="titleSmall"
              component="strong"
              dir="ltr"
              sx={{ unicodeBidi: 'plaintext', display: 'block' }}
            >
              {displayValue}
            </Typography>
            <Typography variant="labelSmall" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

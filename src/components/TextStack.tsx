import type { ReactNode } from 'react'
import { Stack, Typography } from '@smartx/design-system'

/** Title + secondary line that never inline-merge. */
export function TextStack({
  primary,
  secondary,
  spacing = 0.5,
}: {
  primary: ReactNode
  secondary?: ReactNode | null
  spacing?: number
}) {
  return (
    <Stack spacing={spacing} sx={{ minWidth: 0 }}>
      <Typography
        variant="titleSmall"
        component="div"
        sx={{ display: 'block', wordBreak: 'break-word' }}
      >
        {primary}
      </Typography>
      {secondary != null && secondary !== '' ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          component="div"
          sx={{ display: 'block', wordBreak: 'break-word' }}
        >
          {secondary}
        </Typography>
      ) : null}
    </Stack>
  )
}

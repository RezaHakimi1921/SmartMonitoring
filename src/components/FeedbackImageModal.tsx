import { Box, Dialog } from '@smartx/design-system'
import { feedbackImageUrl } from '../lib/feedbackApi'

type Props = {
  open: boolean
  imageId: string | null
  onClose: () => void
  title?: string
}

export function FeedbackImageModal({ open, imageId, onClose, title }: Props) {
  return (
    <Dialog
      open={open && !!imageId}
      onClose={onClose}
      title={title || 'پیش‌نمایش عکس'}
      maxWidth="lg"
      width="min(920px, 96vw)"
    >
      {imageId ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'grey.900',
            borderRadius: 2,
            p: 1,
            maxHeight: '78vh',
            overflow: 'auto',
          }}
        >
          <Box
            component="img"
            src={feedbackImageUrl(imageId)}
            alt={title || 'پیوست'}
            sx={{
              maxWidth: '100%',
              maxHeight: '74vh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>
      ) : null}
    </Dialog>
  )
}

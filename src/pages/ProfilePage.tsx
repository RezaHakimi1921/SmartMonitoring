import { useState, type FormEvent } from 'react'
import {
  Box,
  Button,
  Card,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@smartx/design-system'
import { roleLabel, useAuth } from '../lib/authContext'
import { updateMyProfile } from '../lib/authApi'

export function ProfilePage() {
  const { user, refresh } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  if (!user) return null

  const onSaveName = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await updateMyProfile({ displayName: displayName.trim() })
      await refresh()
      setToast('نام ذخیره شد')
      window.setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  const onSavePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== password2) {
      setError('تکرار رمز با رمز جدید یکی نیست')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await updateMyProfile({
        currentPassword,
        password,
      })
      setCurrentPassword('')
      setPassword('')
      setPassword2('')
      if (res.passwordChanged) {
        setToast('رمز عوض شد — دوباره وارد شوید')
        const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
        window.setTimeout(() => {
          window.location.href = `${base}/login`
        }, 1200)
        return
      }
      setToast('رمز به‌روز شد')
      window.setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="headlineSmall" display="block">
          حساب من
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          فقط نام نمایشی و رمز خودتان را می‌توانید عوض کنید.
        </Typography>
      </Box>

      <Card elevation={1} sx={{ p: 2 }}>
        <Typography variant="titleMedium" display="block" sx={{ mb: 1 }}>
          مشخصات
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary" display="block">
          نام کاربری: {user.username}
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary" display="block">
          نقش: {roleLabel(user.role)}
        </Typography>
      </Card>

      <Card elevation={1} sx={{ p: 2 }}>
        <Box component="form" onSubmit={onSaveName}>
          <Stack spacing={2}>
            <Typography variant="titleMedium" display="block">
              نام نمایشی
            </Typography>
            <TextField
              label="نام"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 2 }}
            />
            <Button
              type="submit"
              buttonVariant="filled"
              loading={busy}
              disabled={busy || displayName.trim() === user.displayName}
              sx={{ alignSelf: 'flex-start' }}
            >
              ذخیره نام
            </Button>
          </Stack>
        </Box>
      </Card>

      <Card elevation={1} sx={{ p: 2 }}>
        <Box component="form" onSubmit={onSavePassword}>
          <Stack spacing={2}>
            <Typography variant="titleMedium" display="block">
              تغییر رمز عبور
            </Typography>
            <TextField
              label="رمز فعلی"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
            />
            <TextField
              label="رمز جدید"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
              autoComplete="new-password"
            />
            <TextField
              label="تکرار رمز جدید"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />
            <Button
              type="submit"
              buttonVariant="filled"
              loading={busy}
              disabled={busy || !currentPassword || password.length < 6}
              sx={{ alignSelf: 'flex-start' }}
            >
              ذخیره رمز
            </Button>
          </Stack>
        </Box>
      </Card>

      {error ? (
        <Typography variant="bodySmall" color="error" display="block">
          {error}
        </Typography>
      ) : null}

      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1400,
        }}
      >
        <Snackbar
          open={!!toast}
          message={toast}
          severity="success"
          onClose={() => setToast('')}
        />
      </Box>
    </Stack>
  )
}

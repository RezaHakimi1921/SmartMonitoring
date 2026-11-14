import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
} from '@smartx/design-system'
import { useAuth } from '../lib/authContext'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.body.dir = 'rtl'
  }, [])

  const from = (location.state as { from?: string } | null)?.from || '/'

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'grey.100',
        p: 2,
      }}
    >
      <Card
        elevation={3}
        sx={{ width: '100%', maxWidth: 420, p: 1 }}
        title="ورود به دیدبان"
        subtitle="صدای مشتری · کنترل کیفیت اسمارت"
      >
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="نام کاربری"
              variant="outlined"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 3 }}
            />
            <TextField
              label="رمز عبور"
              type="password"
              variant="outlined"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
            />
            {error ? (
              <Typography variant="bodySmall" color="error">
                {error}
              </Typography>
            ) : null}
            <Button
              type="submit"
              buttonVariant="filled"
              buttonSize="standard"
              fullWidth
              loading={busy || loading}
              disabled={busy || loading}
            >
              {busy ? 'در حال ورود…' : 'ورود'}
            </Button>
          </Stack>
        </Box>
      </Card>
    </Box>
  )
}

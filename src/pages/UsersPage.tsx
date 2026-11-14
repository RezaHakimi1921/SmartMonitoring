import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@smartx/design-system'
import {
  createUser,
  listUsers,
  resetUserPassword,
  setUserActive,
  setUserRole,
  type AuthUser,
  type Role,
} from '../lib/authApi'
import { isStaff, roleLabel, useAuth } from '../lib/authContext'

const tableSx = {
  width: '100%',
  tableLayout: 'fixed' as const,
  borderCollapse: 'collapse' as const,
  '& th, & td': {
    textAlign: 'right',
    py: 1.5,
    px: 1.25,
    borderBottom: '1px solid',
    borderColor: 'divider',
    verticalAlign: 'middle',
    overflow: 'hidden',
  },
  '& th': {
    typography: 'labelMedium',
    color: 'text.secondary',
    whiteSpace: 'nowrap',
  },
}

export function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await listUsers())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createUser({ username, displayName, role, password })
      setUsername('')
      setDisplayName('')
      setPassword('')
      setRole('user')
      flash('کاربر اضافه شد')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ایجاد ناموفق')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (u: AuthUser) => {
    setError('')
    try {
      await setUserActive(u.id, !u.active)
      flash(u.active ? 'کاربر غیرفعال شد' : 'کاربر فعال شد')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  const changePassword = async (u: AuthUser) => {
    const next = window.prompt(`رمز جدید برای ${u.username} (حداقل ۶ کاراکتر):`)
    if (!next) return
    setError('')
    try {
      await resetUserPassword(u.id, next)
      flash('رمز به‌روز شد')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  const changeRole = async (u: AuthUser, next: 'admin' | 'user') => {
    setError('')
    try {
      await setUserRole(u.id, next)
      flash('نقش به‌روز شد')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    }
  }

  if (!isStaff(me?.role)) {
    return <Navigate to="/" replace />
  }

  const roleOptions =
    me?.role === 'superadmin'
      ? [
          { id: 'user', label: 'کاربر' },
          { id: 'admin', label: 'ادمین' },
        ]
      : [{ id: 'user', label: 'کاربر' }]

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="headlineSmall" display="block">
          مدیریت کاربران
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          نقش‌ها: کاربر (گزارش می‌گیرد)، ادمین (تنظیمات و داشبورد)، سوپرادمین
          (همه‌چیز؛ ساخت ادمین فقط با سوپرادمین).
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 340px) 1fr' },
          alignItems: 'start',
        }}
      >
        <Card elevation={1} title="کاربر جدید" sx={{ p: 1 }}>
          <Box component="form" onSubmit={onCreate}>
            <Stack spacing={2}>
              <TextField
                label="نام کاربری"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                inputProps={{ minLength: 3, autoComplete: 'off' }}
              />
              <TextField
                label="نام نمایشی"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="اختیاری"
                fullWidth
              />
              <Box>
                <Typography
                  variant="labelMedium"
                  display="block"
                  sx={{ mb: 0.75 }}
                >
                  نقش
                </Typography>
                <Select
                  value={role}
                  options={roleOptions}
                  open={roleOpen}
                  onOpenChange={setRoleOpen}
                  onChange={(id) => setRole(id as Role)}
                  placeholder="نقش"
                />
              </Box>
              <TextField
                label="رمز عبور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                inputProps={{ minLength: 6, autoComplete: 'new-password' }}
              />
              {error ? (
                <Typography variant="bodySmall" color="error" display="block">
                  {error}
                </Typography>
              ) : null}
              <Button
                type="submit"
                buttonVariant="filled"
                disabled={busy}
                loading={busy}
              >
                افزودن کاربر
              </Button>
            </Stack>
          </Box>
        </Card>

        <Card elevation={1} title="فهرست کاربران" sx={{ p: 1 }}>
          {loading ? (
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              display="block"
              aria-busy
            >
              در حال بارگذاری…
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={tableSx}>
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>کاربر</th>
                    <th style={{ width: '22%' }}>نقش</th>
                    <th style={{ width: '14%' }}>وضعیت</th>
                    <th style={{ width: '32%' }}>اقدام</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Stack spacing={0.25}>
                          <Typography variant="titleSmall" display="block">
                            {u.displayName || u.username}
                          </Typography>
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            display="block"
                            dir="ltr"
                            sx={{ textAlign: 'right' }}
                          >
                            {u.username}
                          </Typography>
                        </Stack>
                      </td>
                      <td>
                        <Stack spacing={1}>
                          <Chip
                            size="small"
                            label={roleLabel(u.role)}
                            color={
                              u.role === 'superadmin'
                                ? 'primary'
                                : u.role === 'admin'
                                  ? 'success'
                                  : 'default'
                            }
                            sx={{ alignSelf: 'flex-start' }}
                          />
                          {me?.role === 'superadmin' &&
                          u.role !== 'superadmin' ? (
                            <Box
                              component="select"
                              aria-label={`نقش ${u.username}`}
                              value={u.role}
                              onChange={(e) =>
                                void changeRole(
                                  u,
                                  e.target.value === 'admin' ? 'admin' : 'user',
                                )
                              }
                              sx={{
                                width: '100%',
                                maxWidth: 140,
                                height: 36,
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                px: 1.25,
                                bgcolor: 'background.paper',
                                font: 'inherit',
                                color: 'text.primary',
                                display: 'block',
                              }}
                            >
                              <option value="user">کاربر</option>
                              <option value="admin">ادمین</option>
                            </Box>
                          ) : null}
                        </Stack>
                      </td>
                      <td>
                        <Chip
                          size="small"
                          label={u.active ? 'فعال' : 'غیرفعال'}
                          color={u.active ? 'success' : 'default'}
                          variant={u.active ? 'filled' : 'outlined'}
                        />
                      </td>
                      <td>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Button
                            buttonVariant="outlined"
                            buttonSize="small"
                            onClick={() => void changePassword(u)}
                          >
                            رمز
                          </Button>
                          <Button
                            buttonVariant="text"
                            buttonSize="small"
                            disabled={
                              u.id === me?.id || u.role === 'superadmin'
                            }
                            onClick={() => void toggleActive(u)}
                          >
                            {u.active ? 'غیرفعال' : 'فعال'}
                          </Button>
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
        </Card>
      </Box>

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

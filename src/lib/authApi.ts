export type Role = 'superadmin' | 'admin' | 'user'

export type AuthUser = {
  id: string
  username: string
  displayName: string
  role: Role
  active: boolean
  createdAt: string
}

/** API under same Vite base (e.g. /monitoring/api/...) so it never hits TaskOS /api. */
function apiUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base : `${base}/`
  const rel = path.replace(/^\//, '')
  return `${root}${rel}`
}

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
  const raw = await res.text()
  try {
    return JSON.parse(raw) as T & { error?: string }
  } catch {
    throw new Error(
      res.ok ? 'پاسخ سرور JSON نیست' : `خطای سرور (${res.status})`,
    )
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(apiUrl('api/auth/me'), { credentials: 'include' })
  const data = await parseJson<{ user: AuthUser | null }>(res)
  if (!res.ok) throw new Error(data.error || 'خطا در بررسی نشست')
  return data.user
}

export async function login(
  username: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(apiUrl('api/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await parseJson<{ user: AuthUser }>(res)
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'ورود ناموفق بود')
  }
  return data.user
}

export async function logout(): Promise<void> {
  await fetch(apiUrl('api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  })
}

export async function listUsers(): Promise<AuthUser[]> {
  const res = await fetch(apiUrl('api/users'), { credentials: 'include' })
  const data = await parseJson<{ users: AuthUser[] }>(res)
  if (!res.ok) throw new Error(data.error || 'بارگذاری کاربران ناموفق')
  return data.users ?? []
}

export async function createUser(input: {
  username: string
  displayName: string
  role: Role
  password: string
}): Promise<AuthUser> {
  const res = await fetch(apiUrl('api/users'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await parseJson<{ user: AuthUser }>(res)
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'ایجاد کاربر ناموفق')
  }
  return data.user
}

export async function setUserActive(
  id: string,
  active: boolean,
): Promise<AuthUser> {
  const res = await fetch(apiUrl(`api/users/${id}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  })
  const data = await parseJson<{ user: AuthUser }>(res)
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'به‌روزرسانی کاربر ناموفق')
  }
  return data.user
}

export async function setUserRole(
  id: string,
  role: 'admin' | 'user',
): Promise<AuthUser> {
  const res = await fetch(apiUrl(`api/users/${id}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  const data = await parseJson<{ user: AuthUser }>(res)
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'تغییر نقش ناموفق')
  }
  return data.user
}

export async function resetUserPassword(
  id: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(apiUrl(`api/users/${id}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await parseJson<{ user: AuthUser }>(res)
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'تغییر رمز ناموفق')
  }
  return data.user
}

/** ویرایش نام/رمز فقط برای کاربر جاری */
export async function updateMyProfile(input: {
  displayName?: string
  password?: string
  currentPassword?: string
}): Promise<{ user: AuthUser | null; passwordChanged?: boolean }> {
  const res = await fetch(apiUrl('api/auth/me'), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await parseJson<{
    user: AuthUser | null
    passwordChanged?: boolean
  }>(res)
  if (!res.ok) {
    throw new Error(data.error || 'به‌روزرسانی پروفایل ناموفق')
  }
  return {
    user: data.user ?? null,
    passwordChanged: !!data.passwordChanged,
  }
}

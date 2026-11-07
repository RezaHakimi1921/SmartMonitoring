import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export type Role = 'superadmin' | 'admin' | 'user'

export type PublicUser = {
  id: string
  username: string
  displayName: string
  role: Role
  active: boolean
  createdAt: string
}

type StoredUser = PublicUser & {
  passwordHash: string
  salt: string
}

type Session = {
  token: string
  userId: string
  expiresAt: number
}

type StoreFile = {
  users: StoredUser[]
  sessions: Session[]
}

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'users.json')
const SESSION_DAYS = 14

function normalizeRole(role: string | undefined): Role {
  if (role === 'superadmin') return 'superadmin'
  if (role === 'admin') return 'admin'
  if (role === 'operator') return 'user'
  return 'user'
}

function migrateRoles(store: StoreFile): boolean {
  let changed = false
  for (const u of store.users) {
    const next = normalizeRole(u.role as string)
    if (u.role !== next) {
      u.role = next
      changed = true
    }
  }
  const hasSuper = store.users.some((u) => u.role === 'superadmin')
  if (!hasSuper) {
    const firstAdmin = store.users.find((u) => u.role === 'admin')
    if (firstAdmin) {
      firstAdmin.role = 'superadmin'
      changed = true
    }
  }
  return changed
}

function ensureStore(): StoreFile {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(STORE_PATH)) {
    const adminUser = process.env.MONITORING_ADMIN_USER || 'admin'
    const adminPass = process.env.MONITORING_ADMIN_PASSWORD || 'ChangeMe!234'
    const admin = createUserRecord({
      username: adminUser,
      displayName: 'سوپر ادمین',
      role: 'superadmin',
      password: adminPass,
    })
    const initial: StoreFile = { users: [admin], sessions: [] }
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreFile
  raw.users = raw.users || []
  raw.sessions = (raw.sessions || []).filter((s) => s.expiresAt > Date.now())
  if (migrateRoles(raw)) saveStore(raw)
  return raw
}

function saveStore(store: StoreFile) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString('hex')
}

function createUserRecord(input: {
  username: string
  displayName: string
  role: Role
  password: string
}): StoredUser {
  const salt = crypto.randomBytes(16).toString('hex')
  return {
    id: crypto.randomUUID(),
    username: input.username.trim().toLowerCase(),
    displayName: input.displayName.trim() || input.username,
    role: input.role,
    active: true,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash: hashPassword(input.password, salt),
  }
}

function toPublic(u: StoredUser): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
  }
}

export function isAdminRole(role: Role) {
  return role === 'admin' || role === 'superadmin'
}

export function listUsers(): PublicUser[] {
  return ensureStore().users.map(toPublic)
}

export function findUserByUsername(username: string) {
  return ensureStore().users.find(
    (u) => u.username === username.trim().toLowerCase(),
  )
}

export function login(
  username: string,
  password: string,
): { user: PublicUser; token: string } | null {
  const store = ensureStore()
  const user = store.users.find(
    (u) => u.username === username.trim().toLowerCase() && u.active,
  )
  if (!user) return null
  const hash = hashPassword(password, user.salt)
  if (hash !== user.passwordHash) return null
  const token = crypto.randomBytes(32).toString('hex')
  store.sessions = store.sessions.filter((s) => s.expiresAt > Date.now())
  store.sessions.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  })
  saveStore(store)
  return { user: toPublic(user), token }
}

export function logout(token: string | null) {
  if (!token) return
  const store = ensureStore()
  store.sessions = store.sessions.filter((s) => s.token !== token)
  saveStore(store)
}

export function userFromToken(token: string | null): PublicUser | null {
  if (!token) return null
  const store = ensureStore()
  const session = store.sessions.find(
    (s) => s.token === token && s.expiresAt > Date.now(),
  )
  if (!session) return null
  const user = store.users.find((u) => u.id === session.userId && u.active)
  return user ? toPublic(user) : null
}

export function createUser(
  input: {
    username: string
    displayName: string
    role: Role
    password: string
  },
  actor?: PublicUser,
): PublicUser {
  const store = ensureStore()
  const username = input.username.trim().toLowerCase()
  if (!username || username.length < 3) {
    throw Object.assign(new Error('نام کاربری حداقل ۳ کاراکتر باشد'), {
      status: 400,
    })
  }
  if (!input.password || input.password.length < 6) {
    throw Object.assign(new Error('رمز حداقل ۶ کاراکتر باشد'), { status: 400 })
  }
  if (store.users.some((u) => u.username === username)) {
    throw Object.assign(new Error('این نام کاربری قبلاً ثبت شده'), {
      status: 400,
    })
  }

  let role: Role = normalizeRole(input.role)
  if (role === 'superadmin') {
    throw Object.assign(new Error('نمی‌توان سوپرادمین جدید ساخت'), {
      status: 403,
    })
  }
  if (role === 'admin') {
    if (!actor || actor.role !== 'superadmin') {
      throw Object.assign(new Error('فقط سوپرادمین می‌تواند ادمین بسازد'), {
        status: 403,
      })
    }
  } else {
    role = 'user'
  }

  const user = createUserRecord({
    username,
    displayName: input.displayName,
    role,
    password: input.password,
  })
  store.users.push(user)
  saveStore(store)
  return toPublic(user)
}

export function setUserActive(id: string, active: boolean): PublicUser {
  const store = ensureStore()
  const user = store.users.find((u) => u.id === id)
  if (!user) throw Object.assign(new Error('کاربر پیدا نشد'), { status: 404 })
  const privileged = store.users.filter(
    (u) => isAdminRole(u.role) && u.active,
  )
  if (
    isAdminRole(user.role) &&
    user.active &&
    !active &&
    privileged.length <= 1
  ) {
    throw Object.assign(
      new Error('نمی‌توان آخرین ادمین/سوپرادمین فعال را غیرفعال کرد'),
      { status: 400 },
    )
  }
  if (user.role === 'superadmin' && user.active && !active) {
    throw Object.assign(new Error('نمی‌توان سوپرادمین را غیرفعال کرد'), {
      status: 400,
    })
  }
  user.active = active
  if (!active) {
    store.sessions = store.sessions.filter((s) => s.userId !== id)
  }
  saveStore(store)
  return toPublic(user)
}

export function setUserRole(
  id: string,
  role: Role,
  actor: PublicUser,
): PublicUser {
  if (actor.role !== 'superadmin') {
    throw Object.assign(new Error('فقط سوپرادمین می‌تواند نقش را عوض کند'), {
      status: 403,
    })
  }
  if (role === 'superadmin') {
    throw Object.assign(new Error('نقش سوپرادمین قابل تخصیص نیست'), {
      status: 400,
    })
  }
  const store = ensureStore()
  const user = store.users.find((u) => u.id === id)
  if (!user) throw Object.assign(new Error('کاربر پیدا نشد'), { status: 404 })
  if (user.role === 'superadmin') {
    throw Object.assign(new Error('نقش سوپرادمین قابل تغییر نیست'), {
      status: 400,
    })
  }
  user.role = role === 'admin' ? 'admin' : 'user'
  saveStore(store)
  return toPublic(user)
}

export function resetPassword(id: string, password: string): PublicUser {
  const store = ensureStore()
  const user = store.users.find((u) => u.id === id)
  if (!user) throw Object.assign(new Error('کاربر پیدا نشد'), { status: 404 })
  if (!password || password.length < 6) {
    throw Object.assign(new Error('رمز حداقل ۶ کاراکتر باشد'), { status: 400 })
  }
  user.salt = crypto.randomBytes(16).toString('hex')
  user.passwordHash = hashPassword(password, user.salt)
  store.sessions = store.sessions.filter((s) => s.userId !== id)
  saveStore(store)
  return toPublic(user)
}

export function parseCookies(header: string | undefined) {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    out[k] = decodeURIComponent(v)
  }
  return out
}

export const SESSION_COOKIE = 'sx_monitoring_session'

export function sessionCookiePath() {
  const base = (process.env.MONITORING_BASE || '/monitoring').replace(
    /\/+$/,
    '',
  )
  return base || '/'
}

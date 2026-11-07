import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  SESSION_COOKIE,
  createUser,
  isAdminRole,
  listUsers,
  login,
  logout,
  parseCookies,
  resetPassword,
  sessionCookiePath,
  setUserActive,
  setUserRole,
  userFromToken,
  type PublicUser,
  type Role,
} from './auth'
import {
  defaultConfig,
  loadConfig,
  resetConfig,
  saveConfig,
  type MonitoringConfig,
} from './configStore'
import {
  loadDiag,
  loadSection,
  parseDateKeyFromJalali,
  resolveBranch,
  type FeatureId,
} from './loaders'
import {
  listReportAuthors,
  listReports,
  upsertReport,
  type ReportStageKey,
  type ReportLogStatus,
} from './reportsStore'

function readUrl(req: IncomingMessage) {
  return new URL(req.url || '/', 'http://localhost')
}

export async function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v)
  }
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const raw = await readBody(req)
  if (!raw) return {} as T
  return JSON.parse(raw) as T
}

function sessionToken(req: IncomingMessage) {
  const cookies = parseCookies(req.headers.cookie)
  return cookies[SESSION_COOKIE] || null
}

function currentUser(req: IncomingMessage) {
  return userFromToken(sessionToken(req))
}

function requireUser(req: IncomingMessage): PublicUser {
  const user = currentUser(req)
  if (!user) {
    const err = new Error('وارد حساب نشده‌اید') as Error & { status?: number }
    err.status = 401
    throw err
  }
  return user
}

function requireAdmin(req: IncomingMessage): PublicUser {
  const user = requireUser(req)
  if (!isAdminRole(user.role)) {
    const err = new Error('فقط ادمین دسترسی دارد') as Error & {
      status?: number
    }
    err.status = 403
    throw err
  }
  return user
}

function requireSuperAdmin(req: IncomingMessage): PublicUser {
  const user = requireUser(req)
  if (user.role !== 'superadmin') {
    const err = new Error('فقط سوپرادمین دسترسی دارد') as Error & {
      status?: number
    }
    err.status = 403
    throw err
  }
  return user
}

function cookieHeader(token: string | null) {
  const path = sessionCookiePath()
  if (!token) {
    return `${SESSION_COOKIE}=; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=0`
  }
  const maxAge = 14 * 24 * 60 * 60
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

/** Handles /api/* ; returns true if handled. */
export async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = readUrl(req)
  const pathOnly = url.pathname.replace(/\/+$/, '') || '/'
  if (!pathOnly.startsWith('/api')) return false

  try {
    if (req.method === 'GET' && pathOnly === '/api/health') {
      await sendJson(res, 200, { ok: true })
      return true
    }

    if (req.method === 'GET' && pathOnly === '/api/auth/me') {
      const user = currentUser(req)
      await sendJson(res, 200, { user })
      return true
    }

    if (req.method === 'POST' && pathOnly === '/api/auth/login') {
      const body = await readJson<{ username?: string; password?: string }>(req)
      const result = login(body.username || '', body.password || '')
      if (!result) {
        await sendJson(res, 401, { error: 'نام کاربری یا رمز اشتباه است' })
        return true
      }
      await sendJson(res, 200, { user: result.user }, {
        'Set-Cookie': cookieHeader(result.token),
      })
      return true
    }

    if (req.method === 'POST' && pathOnly === '/api/auth/logout') {
      logout(sessionToken(req))
      await sendJson(res, 200, { ok: true }, {
        'Set-Cookie': cookieHeader(null),
      })
      return true
    }

    if (req.method === 'GET' && pathOnly === '/api/config') {
      requireUser(req)
      await sendJson(res, 200, { config: loadConfig() })
      return true
    }

    if (req.method === 'PUT' && pathOnly === '/api/config') {
      const actor = requireAdmin(req)
      const body = await readJson<{ config?: MonitoringConfig; reset?: boolean }>(
        req,
      )
      if (body.reset) {
        if (actor.role !== 'superadmin') {
          await sendJson(res, 403, {
            error: 'بازنشانی تنظیمات فقط برای سوپرادمین است',
          })
          return true
        }
        await sendJson(res, 200, { config: resetConfig() })
        return true
      }
      if (!body.config) {
        await sendJson(res, 400, { error: 'config لازم است' })
        return true
      }
      const next: MonitoringConfig = { ...body.config }
      // فقط سوپرادمین می‌تواند شاخص‌های کیفی را عوض کند
      if (actor.role !== 'superadmin') {
        next.metricRules = loadConfig().metricRules
      }
      await sendJson(res, 200, { config: saveConfig(next) })
      return true
    }

    if (req.method === 'GET' && pathOnly === '/api/config/defaults') {
      requireAdmin(req)
      await sendJson(res, 200, { config: defaultConfig() })
      return true
    }

    if (req.method === 'GET' && pathOnly === '/api/users') {
      requireAdmin(req)
      await sendJson(res, 200, { users: listUsers() })
      return true
    }

    if (req.method === 'POST' && pathOnly === '/api/users') {
      const actor = requireAdmin(req)
      const body = await readJson<{
        username?: string
        displayName?: string
        role?: Role
        password?: string
      }>(req)
      const requested = body.role === 'admin' ? 'admin' : 'user'
      const user = createUser(
        {
          username: body.username || '',
          displayName: body.displayName || body.username || '',
          role: requested,
          password: body.password || '',
        },
        actor,
      )
      await sendJson(res, 201, { user })
      return true
    }

    if (req.method === 'PATCH' && pathOnly.startsWith('/api/users/')) {
      const actor = requireAdmin(req)
      const id = pathOnly.slice('/api/users/'.length)
      const body = await readJson<{
        active?: boolean
        password?: string
        role?: Role
      }>(req)
      let user: PublicUser
      if (typeof body.role === 'string') {
        requireSuperAdmin(req)
        user = setUserRole(id, body.role === 'admin' ? 'admin' : 'user', actor)
      } else if (typeof body.password === 'string' && body.password.length > 0) {
        user = resetPassword(id, body.password)
      } else if (typeof body.active === 'boolean') {
        user = setUserActive(id, body.active)
      } else {
        await sendJson(res, 400, { error: 'درخواست نامعتبر است' })
        return true
      }
      await sendJson(res, 200, { user })
      return true
    }

    if (req.method === 'GET' && pathOnly === '/api/reports') {
      requireUser(req)
      const statusParam = url.searchParams.get('status')
      const stageParam = url.searchParams.get('stageKey')
      const status =
        statusParam === 'draft' || statusParam === 'sent'
          ? (statusParam as ReportLogStatus)
          : undefined
      const stageKey = (
        [
          'summary',
          'section',
          'diag',
          'send',
          'sent',
        ] as ReportStageKey[]
      ).includes(stageParam as ReportStageKey)
        ? (stageParam as ReportStageKey)
        : undefined
      const reports = listReports({
        userId: url.searchParams.get('userId') || undefined,
        typeId: url.searchParams.get('typeId') || undefined,
        status,
        stageKey,
        fromIso: url.searchParams.get('from') || undefined,
        toIso: url.searchParams.get('to') || undefined,
      })
      await sendJson(res, 200, {
        reports,
        authors: listReportAuthors(),
      })
      return true
    }

    if (req.method === 'POST' && pathOnly === '/api/reports') {
      const user = requireUser(req)
      const body = await readJson<{
        typeId?: string
        typeTitle?: string
        branchId?: number
        brandName?: string
        branchName?: string
        features?: string[]
        status?: 'draft' | 'sent'
        stageKey?: ReportStageKey
        stageLabel?: string
        stepIndex?: number
        stepTotal?: number
        query?: string
        note?: string
        markSent?: boolean
      }>(req)
      if (!body.typeId || !body.branchId) {
        await sendJson(res, 400, { error: 'typeId و branchId لازم است' })
        return true
      }
      const entry = upsertReport({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        typeId: body.typeId,
        typeTitle: body.typeTitle || body.typeId,
        branchId: Number(body.branchId),
        brandName: body.brandName || '',
        branchName: body.branchName || '',
        features: body.features || [],
        status: body.status,
        stageKey: body.stageKey,
        stageLabel: body.stageLabel,
        stepIndex: body.stepIndex,
        stepTotal: body.stepTotal,
        query: body.query,
        note: body.note,
        markSent: body.markSent,
      })
      await sendJson(res, 200, { report: entry })
      return true
    }

    if (
      pathOnly === '/api/report/section' ||
      pathOnly === '/api/report/diag'
    ) {
      requireUser(req)
    }

    if (req.method === 'GET' && pathOnly === '/api/report/section') {
      const branchId = Number(url.searchParams.get('branchId'))
      const feature = url.searchParams.get('feature') as FeatureId
      const from = url.searchParams.get('from') || ''
      const to = url.searchParams.get('to') || ''
      const fromKey = parseDateKeyFromJalali(from)
      const toKey = parseDateKeyFromJalali(to)
      if (!branchId || !feature || !fromKey || !toKey) {
        await sendJson(res, 400, { error: 'پارامتر ناقص است' })
        return true
      }
      const ctx = await resolveBranch(branchId)
      const section = await loadSection(feature, ctx, fromKey, toKey)
      await sendJson(res, 200, { section, ctx })
      return true
    }

    if (req.method === 'GET' && pathOnly === '/api/report/diag') {
      const branchId = Number(url.searchParams.get('branchId'))
      const types = (url.searchParams.get('types') || '')
        .split(',')
        .map((x) => Number(x))
        .filter((n) => n > 0)
      if (!branchId) {
        await sendJson(res, 400, { error: 'شعبه مشخص نیست' })
        return true
      }
      const ctx = await resolveBranch(branchId)
      const items = await loadDiag(ctx, types)
      await sendJson(res, 200, { items, ctx })
      return true
    }

    if (pathOnly.startsWith('/api/')) {
      await sendJson(res, 404, { error: 'مسیر API پیدا نشد' })
      return true
    }
  } catch (e) {
    const status =
      typeof e === 'object' && e && 'status' in e
        ? Number((e as { status?: number }).status) || 500
        : 500
    const message = e instanceof Error ? e.message : 'خطای ناشناخته'
    await sendJson(res, status, { error: message })
    return true
  }

  return false
}

import { createReadStream } from 'node:fs'
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
  updateOwnProfile,
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
  getReport,
  listReportAuthors,
  listReports,
  upsertReport,
  type ReportStageKey,
  type ReportLogStatus,
} from './reportsStore'
import {
  FEEDBACK_METRIC_GENERAL,
  addFeedbackComment,
  createFeedback,
  getFeedback,
  listFeedback,
  redactFeedbackForViewer,
  resolveFeedbackImagePath,
  updateFeedback,
  updateFeedbackStatus,
  type FeedbackCommentVisibility,
  type FeedbackKind,
  type FeedbackStatus,
} from './feedbackStore'

const FEATURE_TITLE: Record<string, string> = {
  overall: 'عملکرد کلی',
  subscription: 'اشتراک‌گیری',
  survey: 'نظرسنجی',
  complaints: 'شکایات مشتریان',
  groups: 'گروه‌بندی مشتریان',
  brandSettings: 'تنظیمات برند',
  event: 'ایونت',
  smartBlock: 'لیست بلاک مشتریان',
  credit: 'اعتبار مشتریان',
  creditGeneration: 'تولید اعتبار',
  balance: 'تراز مشتریان',
  panelCharge: 'شارژ پنل',
  connection: 'وضعیت اتصال',
}

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

    if (req.method === 'PATCH' && pathOnly === '/api/auth/me') {
      const me = requireUser(req)
      const body = await readJson<{
        displayName?: string
        password?: string
        currentPassword?: string
      }>(req)
      const user = updateOwnProfile(me.id, {
        displayName: body.displayName,
        password: body.password,
        currentPassword: body.currentPassword,
      })
      // اگر رمز عوض شد نشست باطل است؛ کوکی را پاک کن تا دوباره وارد شود
      if (body.password) {
        await sendJson(res, 200, { user: null, passwordChanged: true }, {
          'Set-Cookie': cookieHeader(null),
        })
        return true
      }
      await sendJson(res, 200, { user })
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
      const current = loadConfig()
      const next: MonitoringConfig = { ...body.config }
      // فقط سوپرادمین: شاخص‌های کیفی + عنوان/توضیح انواع بررسی
      if (actor.role !== 'superadmin') {
        next.metricRules = current.metricRules
        const byId = new Map(current.reviewTypes.map((t) => [t.id, t]))
        next.reviewTypes = (next.reviewTypes || []).map((t) => {
          const prev = byId.get(t.id)
          if (!prev) return t
          return {
            ...t,
            title: prev.title,
            description: prev.description,
          }
        })
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
        action?:
          | 'created'
          | 'opened'
          | 'stage'
          | 'note'
          | 'sent'
          | 'unsent'
          | 'updated'
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
        action: body.action,
      })
      await sendJson(res, 200, { report: entry })
      return true
    }

    if (req.method === 'GET' && pathOnly.startsWith('/api/reports/')) {
      requireUser(req)
      const id = decodeURIComponent(pathOnly.slice('/api/reports/'.length))
      if (!id || id.includes('/')) {
        await sendJson(res, 400, { error: 'شناسه گزارش نامعتبر است' })
        return true
      }
      const report = getReport(id)
      if (!report) {
        await sendJson(res, 404, { error: 'گزارش پیدا نشد' })
        return true
      }
      await sendJson(res, 200, { report })
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

    if (req.method === 'GET' && pathOnly === '/api/feedback/meta') {
      requireUser(req)
      const metrics = [
        {
          id: FEEDBACK_METRIC_GENERAL,
          label: 'عمومی / بدون شاخص خاص',
          featureId: '',
          featureTitle: '',
          enabled: true,
        },
        ...loadConfig().metricRules.map((r) => ({
          id: r.id,
          label: r.label,
          featureId: r.featureId,
          featureTitle: FEATURE_TITLE[r.featureId] || r.featureId,
          enabled: r.enabled !== false,
        })),
      ]
      await sendJson(res, 200, {
        metrics,
        /** سازگاری قدیمی */
        modules: metrics.map((m) => ({
          id: m.id,
          label: m.featureTitle ? `${m.featureTitle} · ${m.label}` : m.label,
        })),
        kinds: [
          { id: 'bug', label: 'باگ' },
          { id: 'improvement', label: 'بهبود' },
          { id: 'change', label: 'تغییر' },
        ],
        statuses: [
          { id: 'open', label: 'باز' },
          { id: 'in_progress', label: 'در حال بررسی' },
          { id: 'done', label: 'انجام شد' },
          { id: 'wontfix', label: 'انصراف' },
        ],
      })
      return true
    }

    if (
      req.method === 'GET' &&
      pathOnly.startsWith('/api/feedback/files/')
    ) {
      requireUser(req)
      const imageId = decodeURIComponent(
        pathOnly.slice('/api/feedback/files/'.length),
      )
      const resolved = resolveFeedbackImagePath(imageId)
      if (!resolved) {
        await sendJson(res, 404, { error: 'عکس پیدا نشد' })
        return true
      }
      res.statusCode = 200
      res.setHeader('Content-Type', resolved.mime)
      res.setHeader('Cache-Control', 'private, max-age=86400')
      createReadStream(resolved.absolutePath).pipe(res)
      return true
    }

    if (req.method === 'GET' && pathOnly === '/api/feedback') {
      const user = requireUser(req)
      const kind = url.searchParams.get('kind') as FeedbackKind | null
      const status = url.searchParams.get('status') as FeedbackStatus | null
      const metricId =
        url.searchParams.get('metricId') ||
        url.searchParams.get('moduleId') ||
        undefined
      const mine = url.searchParams.get('mine') === '1'
      const userIdFilter = url.searchParams.get('userId') || undefined
      // همه کاربران همه موارد را می‌بینند؛ mine فقط فیلتر اختیاری است
      const staff = isAdminRole(user.role)
      const items = listFeedback({
        kind: kind || undefined,
        status: status || undefined,
        metricId,
        mineOnlyUserId: mine ? user.id : undefined,
        userId: !mine ? userIdFilter : undefined,
      }).map((it) => redactFeedbackForViewer(it, staff))
      await sendJson(res, 200, { items })
      return true
    }

    if (
      req.method === 'GET' &&
      pathOnly.startsWith('/api/feedback/') &&
      !pathOnly.startsWith('/api/feedback/files/') &&
      !pathOnly.endsWith('/status') &&
      !pathOnly.endsWith('/comments')
    ) {
      const user = requireUser(req)
      const id = decodeURIComponent(pathOnly.slice('/api/feedback/'.length))
      const item = getFeedback(id)
      if (!item) {
        await sendJson(res, 404, { error: 'مورد پیدا نشد' })
        return true
      }
      await sendJson(res, 200, {
        item: redactFeedbackForViewer(item, isAdminRole(user.role)),
      })
      return true
    }

    if (req.method === 'POST' && pathOnly === '/api/feedback') {
      const user = requireUser(req)
      const body = await readJson<{
        kind?: FeedbackKind
        metricId?: string
        moduleId?: string
        metricLabel?: string
        section?: string
        title?: string
        body?: string
        images?: string[]
        brand?: {
          branchId?: number
          brandName?: string
          branchName?: string
          lockNumber?: string
        }
      }>(req)
      const metricId = body.metricId || body.moduleId
      if (!body.kind || !metricId || !body.title || !body.body) {
        await sendJson(res, 400, {
          error: 'نوع، شاخص، عنوان و شرح لازم است',
        })
        return true
      }
      const cfgMetric = loadConfig().metricRules.find((r) => r.id === metricId)
      const metricLabel =
        body.metricLabel?.trim() ||
        (metricId === FEEDBACK_METRIC_GENERAL
          ? 'عمومی / بدون شاخص خاص'
          : cfgMetric
            ? `${FEATURE_TITLE[cfgMetric.featureId] || cfgMetric.featureId} · ${cfgMetric.label}`
            : metricId)
      if (
        metricId !== FEEDBACK_METRIC_GENERAL &&
        !cfgMetric
      ) {
        await sendJson(res, 400, { error: 'شاخص انتخاب‌شده معتبر نیست' })
        return true
      }
      const item = createFeedback({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        kind: body.kind,
        metricId,
        metricLabel,
        section: body.section,
        title: body.title,
        body: body.body,
        imageDataUrls: body.images,
        brand: body.brand?.branchId
          ? {
              branchId: Number(body.brand.branchId),
              brandName: body.brand.brandName || '',
              branchName: body.brand.branchName || '',
              lockNumber: body.brand.lockNumber,
            }
          : undefined,
      })
      await sendJson(res, 200, { item })
      return true
    }

    if (
      req.method === 'POST' &&
      pathOnly.startsWith('/api/feedback/') &&
      pathOnly.endsWith('/comments')
    ) {
      const actor = requireUser(req)
      const id = decodeURIComponent(
        pathOnly.slice('/api/feedback/'.length, -'/comments'.length),
      )
      if (!id || !getFeedback(id)) {
        await sendJson(res, 404, { error: 'مورد پیدا نشد' })
        return true
      }
      const body = await readJson<{
        body?: string
        visibility?: FeedbackCommentVisibility
      }>(req)
      const staff = isAdminRole(actor.role)
      const item = addFeedbackComment({
        id,
        actorUserId: actor.id,
        actorUsername: actor.username,
        actorDisplayName: actor.displayName,
        body: body.body || '',
        visibility: body.visibility,
        actorIsStaff: staff,
      })
      await sendJson(res, 200, {
        item: redactFeedbackForViewer(item, staff),
      })
      return true
    }

    if (
      req.method === 'PATCH' &&
      pathOnly.startsWith('/api/feedback/') &&
      pathOnly.endsWith('/status')
    ) {
      const actor = requireUser(req)
      const id = decodeURIComponent(
        pathOnly.slice('/api/feedback/'.length, -'/status'.length),
      )
      const existing = getFeedback(id)
      if (!id || !existing) {
        await sendJson(res, 404, { error: 'مورد پیدا نشد' })
        return true
      }
      // فقط سازنده یا سوپرادمین وضعیت را عوض می‌کند
      if (actor.role !== 'superadmin' && actor.id !== existing.userId) {
        await sendJson(res, 403, {
          error: 'فقط ثبت‌کننده یا سوپرادمین می‌تواند وضعیت را عوض کند',
        })
        return true
      }
      const body = await readJson<{
        status?: FeedbackStatus
        comment?: string
      }>(req)
      if (!body.status) {
        await sendJson(res, 400, { error: 'status لازم است' })
        return true
      }
      const item = updateFeedbackStatus({
        id,
        status: body.status,
        actorUserId: actor.id,
        actorUsername: actor.username,
        actorDisplayName: actor.displayName,
        comment: body.comment,
      })
      await sendJson(res, 200, { item })
      return true
    }

    if (
      req.method === 'PATCH' &&
      pathOnly.startsWith('/api/feedback/') &&
      !pathOnly.startsWith('/api/feedback/files/') &&
      !pathOnly.endsWith('/status') &&
      !pathOnly.endsWith('/comments')
    ) {
      const actor = requireUser(req)
      const id = decodeURIComponent(pathOnly.slice('/api/feedback/'.length))
      const existing = getFeedback(id)
      if (!id || !existing) {
        await sendJson(res, 404, { error: 'مورد پیدا نشد' })
        return true
      }
      // فقط سازنده یا سوپرادمین محتوای تسک را ویرایش می‌کند
      if (actor.role !== 'superadmin' && actor.id !== existing.userId) {
        await sendJson(res, 403, {
          error: 'فقط ثبت‌کننده یا سوپرادمین می‌تواند این مورد را ویرایش کند',
        })
        return true
      }
      const body = await readJson<{
        kind?: FeedbackKind
        metricId?: string
        metricLabel?: string
        section?: string
        title?: string
        body?: string
        status?: FeedbackStatus
        images?: string[]
        brand?: {
          branchId?: number
          brandName?: string
          branchName?: string
          lockNumber?: string
        } | null
      }>(req)
      let metricLabel = body.metricLabel
      if (body.metricId && !metricLabel) {
        if (body.metricId === FEEDBACK_METRIC_GENERAL) {
          metricLabel = 'عمومی / بدون شاخص خاص'
        } else {
          const cfgMetric = loadConfig().metricRules.find(
            (r) => r.id === body.metricId,
          )
          if (!cfgMetric) {
            await sendJson(res, 400, { error: 'شاخص انتخاب‌شده معتبر نیست' })
            return true
          }
          metricLabel = `${FEATURE_TITLE[cfgMetric.featureId] || cfgMetric.featureId} · ${cfgMetric.label}`
        }
      }
      const item = updateFeedback({
        id,
        actorUserId: actor.id,
        actorUsername: actor.username,
        actorDisplayName: actor.displayName,
        kind: body.kind,
        metricId: body.metricId,
        metricLabel,
        section: body.section,
        title: body.title,
        body: body.body,
        status: body.status,
        imageDataUrls: body.images,
        brand:
          body.brand === null
            ? null
            : body.brand?.branchId
              ? {
                  branchId: Number(body.brand.branchId),
                  brandName: body.brand.brandName || '',
                  branchName: body.brand.branchName || '',
                  lockNumber: body.brand.lockNumber,
                }
              : undefined,
      })
      await sendJson(res, 200, { item })
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

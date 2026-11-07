import './polyfill'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi, sendJson } from './httpApi'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 5188)
const BASE = (process.env.MONITORING_BASE || '/monitoring').replace(/\/+$/, '') || ''

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

function stripBase(pathname: string) {
  if (!BASE) return pathname
  if (pathname === BASE) return '/'
  if (pathname.startsWith(BASE + '/')) return pathname.slice(BASE.length) || '/'
  return null
}

function safeJoin(root: string, rel: string) {
  const cleaned = path.normalize(rel).replace(/^(\.\.[/\\])+/, '')
  const full = path.join(root, cleaned)
  if (!full.startsWith(root)) return null
  return full
}

async function serveStatic(
  reqPath: string,
  res: http.ServerResponse,
): Promise<boolean> {
  if (!fs.existsSync(DIST)) {
    await sendJson(res, 503, { error: 'پوشه dist پیدا نشد؛ ابتدا build کنید' })
    return true
  }

  let rel = reqPath === '/' ? '/index.html' : reqPath
  let file = safeJoin(DIST, rel)
  if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html')
  }
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    // SPA fallback
    file = path.join(DIST, 'index.html')
    if (!fs.existsSync(file)) {
      await sendJson(res, 404, { error: 'index.html پیدا نشد' })
      return true
    }
  }

  const ext = path.extname(file).toLowerCase()
  res.statusCode = 200
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache')
  } else if (ext === '.js' || ext === '.css') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  }
  fs.createReadStream(file).pipe(res)
  return true
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
    const stripped = stripBase(url.pathname)

    // Allow API both at /api and /monitoring/api (nginx may strip or not)
    const apiPath =
      url.pathname.startsWith('/api')
        ? url.pathname
        : stripped && stripped.startsWith('/api')
          ? stripped
          : null

    if (apiPath) {
      // Rewrite req.url so handleApi sees /api/...
      const q = url.search || ''
      ;(req as http.IncomingMessage & { url?: string }).url = apiPath + q
      const handled = await handleApi(req, res)
      if (handled) return
    }

    if (stripped === null) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Not found')
      return
    }

    await serveStatic(stripped, res)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'خطای سرور'
    if (!res.headersSent) await sendJson(res, 500, { error: message })
    else res.end()
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[monitoring] listening on http://0.0.0.0:${PORT}${BASE || '/'} (cwd=${process.cwd()})`,
  )
})

import './polyfill'
import type { Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'
import { handleApi, sendJson } from './httpApi'

const BASE = (process.env.MONITORING_BASE || '/monitoring').replace(/\/+$/, '')

function rewriteToApiRoot(req: IncomingMessage) {
  const raw = req.url || '/'
  const qIndex = raw.indexOf('?')
  const pathOnly = qIndex >= 0 ? raw.slice(0, qIndex) : raw
  const query = qIndex >= 0 ? raw.slice(qIndex) : ''

  if (pathOnly.startsWith('/api')) return true

  if (BASE && pathOnly.startsWith(`${BASE}/api`)) {
    req.url = pathOnly.slice(BASE.length) + query
    return true
  }
  return false
}

export function reportApiPlugin(): Plugin {
  return {
    name: 'monitoring-report-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!rewriteToApiRoot(req)) {
          next()
          return
        }
        void handleApi(req, res)
          .then((handled) => {
            if (!handled) next()
          })
          .catch((err) => {
            const message =
              err instanceof Error ? err.message : 'خطای ناشناخته API'
            void sendJson(res, 500, { error: message })
          })
      })
    },
  }
}

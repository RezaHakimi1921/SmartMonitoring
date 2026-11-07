import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import sql from 'mssql'

function loadEnvFile() {
  const file = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i < 0) continue
    const key = trimmed.slice(0, i).trim()
    let val = trimmed.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

/** Local-dev fallback: reuse Cursor sqlserver MCP env without copying secrets into the repo. */
function loadMcpSqlEnv() {
  if (process.env.SQLSERVER_HOST && process.env.SQLSERVER_USER) return
  const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json')
  if (!fs.existsSync(mcpPath)) return
  try {
    const raw = JSON.parse(fs.readFileSync(mcpPath, 'utf8')) as {
      mcpServers?: {
        sqlserver?: { env?: Record<string, string> }
      }
    }
    const env = raw.mcpServers?.sqlserver?.env
    if (!env) return
    for (const [k, v] of Object.entries(env)) {
      if (!(k in process.env)) process.env[k] = v
    }
  } catch {
    // ignore
  }
}

loadEnvFile()
loadMcpSqlEnv()

let poolPromise: Promise<sql.ConnectionPool> | null = null

export function getPool() {
  if (!poolPromise) {
    const host = process.env.SQLSERVER_HOST
    const user = process.env.SQLSERVER_USER
    const password = process.env.SQLSERVER_PASSWORD
    if (!host || !user || !password) {
      throw new Error(
        'اتصال دیتابیس تنظیم نشده. فایل .env را از .env.example بسازید.',
      )
    }
    poolPromise = new sql.ConnectionPool({
      server: host,
      user,
      password,
      database: process.env.SQLSERVER_DATABASE || 'master',
      options: {
        encrypt: process.env.SQLSERVER_ENCRYPT !== 'false',
        trustServerCertificate: process.env.SQLSERVER_TRUST_CERT !== 'false',
        enableArithAbort: true,
      },
      pool: { max: 8, min: 0, idleTimeoutMillis: 30000 },
      requestTimeout: 28000,
    }).connect()
  }
  return poolPromise
}

export { sql }

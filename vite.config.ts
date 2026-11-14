import './server/polyfill'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { reportApiPlugin } from './server/plugin'

const base = process.env.MONITORING_BASE || '/monitoring/'
const fontsRoot = path.resolve(__dirname, 'public/fonts')

/** DS fonts.css points at absolute /fonts/... — serve that path in Vite too */
function fontsAtRootPlugin(): Plugin {
  return {
    name: 'fonts-at-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/fonts/')) return next()
        const rel = decodeURIComponent(url.slice('/fonts/'.length).split('?')[0])
        const file = path.normalize(path.join(fontsRoot, rel))
        if (!file.startsWith(fontsRoot) || !fs.existsSync(file)) return next()
        const ext = path.extname(file).toLowerCase()
        const mime =
          ext === '.woff2'
            ? 'font/woff2'
            : ext === '.woff'
              ? 'font/woff'
              : 'application/octet-stream'
        res.setHeader('Content-Type', mime)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), reportApiPlugin(), fontsAtRootPlugin()],
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
    ],
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      '@smartx/design-system',
    ],
  },
  server: {
    port: 5180,
    strictPort: true,
  },
})

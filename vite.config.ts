import './server/polyfill'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reportApiPlugin } from './server/plugin'

const base = process.env.MONITORING_BASE || '/monitoring/'

export default defineConfig({
  base,
  plugins: [react(), reportApiPlugin()],
  server: {
    port: 5180,
    strictPort: true,
  },
})
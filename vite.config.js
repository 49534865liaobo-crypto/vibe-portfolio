import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const escapeHtmlAttribute = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const googleVerificationPlugin = (mode) => ({
  name: 'google-search-console-verification',
  transformIndexHtml(html) {
    const env = loadEnv(mode, process.cwd(), '')
    const token = env.VITE_GSC_VERIFICATION_TOKEN?.trim()

    if (!token || html.includes('name="google-site-verification"')) {
      return html
    }

    return html.replace(
      '<meta name="theme-color" content="#020617" />',
      `<meta name="theme-color" content="#020617" />\n    <meta name="google-site-verification" content="${escapeHtmlAttribute(token)}" />`
    )
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), googleVerificationPlugin(mode)],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        zh: resolve(process.cwd(), 'zh/index.html'),
      },
    },
  },
}))

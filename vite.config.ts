import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

function copyDir(source: string, target: string) {
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name)
    const to = path.join(target, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

function tesseractAssets() {
  const root = process.cwd()
  const coreDir = path.join(root, 'node_modules/tesseract.js-core')
  const workerFile = path.join(root, 'node_modules/tesseract.js/dist/worker.min.js')
  const langFile = path.join(root, 'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz')
  const contentType = (file: string) => {
    if (file.endsWith('.js')) return 'application/javascript'
    if (file.endsWith('.wasm')) return 'application/wasm'
    if (file.endsWith('.gz')) return 'application/gzip'
    if (file.endsWith('.json')) return 'application/json'
    return 'application/octet-stream'
  }
  return {
    name: 'local-tesseract-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = decodeURIComponent((request.url ?? '').split('?')[0])
        let resolved: string | undefined
        if (url === '/vendor/tesseract/worker.min.js') resolved = workerFile
        if (url === '/vendor/tesseract/lang/eng.traineddata.gz') resolved = langFile
        if (url.startsWith('/vendor/tesseract/core/')) {
          resolved = path.join(coreDir, path.normalize(url.replace('/vendor/tesseract/core/', '')))
          if (!resolved.startsWith(coreDir)) resolved = undefined
        }
        if (!resolved || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) return next()
        response.writeHead(200, { 'Content-Type': contentType(resolved) })
        response.end(fs.readFileSync(resolved))
      })
    },
    closeBundle() {
      const out = path.join(root, 'dist/vendor/tesseract')
      fs.mkdirSync(path.join(out, 'lang'), { recursive: true })
      fs.copyFileSync(workerFile, path.join(out, 'worker.min.js'))
      fs.copyFileSync(langFile, path.join(out, 'lang/eng.traineddata.gz'))
      copyDir(coreDir, path.join(out, 'core'))
    }
  }
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/local-pdf/' : '/',
  plugins: [
    react(),
    tesseractAssets(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Local PDF',
        short_name: 'Local PDF',
        description: 'Private PDF tools that run entirely in your browser.',
        theme_color: '#f7f7f4',
        background_color: '#f7f7f4',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['pdfjs-dist'] }
})

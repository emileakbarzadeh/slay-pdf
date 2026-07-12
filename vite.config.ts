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
  base: '/',
  plugins: [
    react(),
    tesseractAssets(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Slay PDF',
        short_name: 'Slay PDF',
        description: 'Free local PDF editor and Adobe Acrobat alternative for splitting, merging, signing, posterising, resizing and editing PDFs entirely in your browser.',
        categories: ['business', 'productivity', 'utilities'],
        theme_color: '#f7f7f4',
        background_color: '#f7f7f4',
        display: 'standalone',
        scope: '.',
        start_url: '.',
        shortcuts: [
          {
            name: 'Merge PDF files',
            short_name: 'Merge PDFs',
            description: 'Combine PDF files and images locally in the browser.',
            url: '/merge-pdf.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Split PDF files',
            short_name: 'Split PDFs',
            description: 'Export selected pages or separate PDFs with split markers.',
            url: '/split-pdf.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Sign a PDF',
            short_name: 'Sign PDF',
            description: 'Add a visual signature or quick annotation without uploading the PDF.',
            url: '/sign-pdf.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Organize PDF pages',
            short_name: 'Organize',
            description: 'Reorder, delete, rotate and export PDF pages locally.',
            url: '/organize-pdf-pages.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Compress a PDF',
            short_name: 'Compress',
            description: 'Use local export presets for smaller PDF files.',
            url: '/compress-pdf.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Redact a PDF',
            short_name: 'Redact',
            description: 'Add redaction blocks and rasterize redacted pages before export.',
            url: '/redact-pdf.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Run OCR on a PDF',
            short_name: 'OCR PDF',
            description: 'Create searchable English OCR PDFs locally in the browser.',
            url: '/ocr-pdf.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Private PDF editor',
            short_name: 'Private PDF',
            description: 'Open the local PDF editor for private no-upload workflows.',
            url: '/private-pdf-editor.html',
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          }
        ],
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['pdfjs-dist'] }
})

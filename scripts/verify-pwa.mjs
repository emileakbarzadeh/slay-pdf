import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../dist/manifest.webmanifest', import.meta.url), 'utf8'))
const serviceWorker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const expectedShortcuts = [
  {
    name: 'Merge PDF files',
    short_name: 'Merge PDFs',
    url: '/merge-pdf.html',
  },
  {
    name: 'Split PDF files',
    short_name: 'Split PDFs',
    url: '/split-pdf.html',
  },
  {
    name: 'Sign a PDF',
    short_name: 'Sign PDF',
    url: '/sign-pdf.html',
  },
  {
    name: 'Organize PDF pages',
    short_name: 'Organize',
    url: '/organize-pdf-pages.html',
  },
  {
    name: 'Compress a PDF',
    short_name: 'Compress',
    url: '/compress-pdf.html',
  },
  {
    name: 'Redact a PDF',
    short_name: 'Redact',
    url: '/redact-pdf.html',
  },
  {
    name: 'Run OCR on a PDF',
    short_name: 'OCR PDF',
    url: '/ocr-pdf.html',
  },
  {
    name: 'Private PDF editor',
    short_name: 'Private PDF',
    url: '/private-pdf-editor.html',
  },
]

assert(manifest.name === 'Slay PDF', 'manifest app name is wrong')
assert(manifest.short_name === 'Slay PDF', 'manifest short_name is wrong')
assert(manifest.description?.includes('Adobe Acrobat alternative'), 'manifest description should include app positioning')
assert(manifest.id === '/', 'manifest id is wrong')
assert(manifest.start_url === '/', 'manifest start_url is wrong')
assert(manifest.display === 'standalone', 'manifest display mode is wrong')
assert(JSON.stringify(manifest.display_override) === JSON.stringify(['standalone', 'minimal-ui', 'browser']), 'manifest display_override is wrong')
assert(manifest.scope === '/', 'manifest scope is wrong')
assert(manifest.orientation === 'any', 'manifest orientation is wrong')
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'manifest must include app icons')
assert(manifest.icons.some((icon) => icon.src === 'icon-192.png' && icon.sizes === '192x192' && icon.type === 'image/png'), 'manifest is missing 192px PNG icon')
assert(manifest.icons.some((icon) => icon.src === 'icon-512.png' && icon.sizes === '512x512' && icon.type === 'image/png' && icon.purpose === 'any maskable'), 'manifest is missing 512px maskable PNG icon')
assert(Array.isArray(manifest.screenshots) && manifest.screenshots.length >= 1, 'manifest must include screenshots')
assert(manifest.screenshots.some((screenshot) => screenshot.src === 'og-image.png' && screenshot.sizes === '1200x630' && screenshot.type === 'image/png' && screenshot.form_factor === 'wide'), 'manifest is missing wide screenshot')
assert(Array.isArray(manifest.shortcuts), 'manifest shortcuts must be an array')
assert(manifest.shortcuts.length === expectedShortcuts.length, 'manifest shortcut count is wrong')

assert(serviceWorker.includes('NavigationRoute'), 'service worker must include an explicit navigation route')
assert(serviceWorker.includes('allowlist:[/^\\/(?:\\?.*)?$/]'), 'service worker navigation fallback must only allow the app root route')
assert(serviceWorker.includes('denylist:[/^\\/.*\\.(?:html|xml|json|txt|png|svg|webmanifest)(?:\\?.*)?$/]'), 'service worker navigation fallback must deny static SEO and metadata files')
assert(serviceWorker.includes('skipWaiting') && serviceWorker.includes('clientsClaim'), 'service worker must auto-activate updates')

for (const expected of expectedShortcuts) {
  const shortcut = manifest.shortcuts.find((item) => item.url === expected.url)
  assert(shortcut, `manifest is missing shortcut ${expected.url}`)
  assert(shortcut.name === expected.name, `${expected.url} shortcut name is wrong`)
  assert(shortcut.short_name === expected.short_name, `${expected.url} shortcut short_name is wrong`)
  assert(shortcut.description?.length >= 30, `${expected.url} shortcut description is too short`)
  assert(Array.isArray(shortcut.icons) && shortcut.icons.length >= 1, `${expected.url} shortcut is missing icons`)
  assert(shortcut.icons[0].src === 'favicon.svg', `${expected.url} shortcut icon source is wrong`)
  assert(shortcut.icons[0].type === 'image/svg+xml', `${expected.url} shortcut icon type is wrong`)
}

console.log(`PWA manifest verification passed for ${manifest.shortcuts.length} shortcuts.`)

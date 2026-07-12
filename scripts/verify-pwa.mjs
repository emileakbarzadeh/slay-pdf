import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../dist/manifest.webmanifest', import.meta.url), 'utf8'))

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
assert(manifest.start_url === '.', 'manifest start_url is wrong')
assert(manifest.display === 'standalone', 'manifest display mode is wrong')
assert(manifest.scope === '.', 'manifest scope is wrong')
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest must include app icons')
assert(Array.isArray(manifest.shortcuts), 'manifest shortcuts must be an array')
assert(manifest.shortcuts.length === expectedShortcuts.length, 'manifest shortcut count is wrong')

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

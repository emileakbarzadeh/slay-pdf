import { readdir, readFile, writeFile } from 'node:fs/promises'

const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)

const appHeadLines = [
  '    <meta name="theme-color" content="#f7f7f4" />',
  '    <meta name="application-name" content="Slay PDF" />',
  '    <meta name="apple-mobile-web-app-title" content="Slay PDF" />',
  '    <meta name="mobile-web-app-capable" content="yes" />',
  '    <meta name="apple-mobile-web-app-capable" content="yes" />',
]

const staticPageHeadLines = [
  ...appHeadLines,
  '    <link rel="manifest" href="/manifest.webmanifest" />',
]

function stripAppHeadMeta(html) {
  return html
    .replace(/^\s*<meta name="theme-color" content="[^"]+"\s*\/>\n/gm, '')
    .replace(/^\s*<meta name="application-name" content="[^"]+"\s*\/>\n/gm, '')
    .replace(/^\s*<meta name="apple-mobile-web-app-title" content="[^"]+"\s*\/>\n/gm, '')
    .replace(/^\s*<meta name="mobile-web-app-capable" content="[^"]+"\s*\/>\n/gm, '')
    .replace(/^\s*<meta name="apple-mobile-web-app-capable" content="[^"]+"\s*\/>\n/gm, '')
    .replace(/^\s*<link rel="manifest" href="[^"]+"\s*\/>\n/gm, '')
}

const files = [
  { file: 'index.html', url: new URL('index.html', rootDir) },
  ...(await readdir(publicDir))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => ({ file, url: new URL(file, publicDir) })),
]

let changed = 0

for (const { file, url } of files) {
  const html = await readFile(url, 'utf8')
  const withoutAppHeadMeta = stripAppHeadMeta(html)
  if (!withoutAppHeadMeta.includes('name="robots" content="index, follow, max-image-preview:large"')) {
    throw new Error(`${file} is missing indexable robots meta`)
  }

  const appHeadBlock = (file === 'index.html' ? appHeadLines : staticPageHeadLines).join('\n')
  const updated = withoutAppHeadMeta.replace(
    /(\s*<meta name="robots" content="index, follow, max-image-preview:large"\s*\/>)/,
    `$1\n${appHeadBlock}`,
  )

  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced app head metadata for ${files.length} HTML pages${changed ? ` (${changed} changed)` : ''}.`)

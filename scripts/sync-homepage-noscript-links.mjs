import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const site = 'https://slaypdf.com'
const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function labelForTitle(title) {
  return title.replace(/ - Slay PDF$/, '')
}

async function titleForPath(path) {
  const html = await readFile(new URL(basename(path), publicDir), 'utf8')
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
  if (!title) throw new Error(`${path} is missing a title`)
  return labelForTitle(title)
}

const sitemap = await readFile(new URL('sitemap.xml', publicDir), 'utf8')
const urls = [...sitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const prominentPaths = [
  '/free-pdf-editor.html',
  '/tools.html',
  '/search.html',
  '/sitemap.html',
  '/privacy.html',
  '/online-pdf-editor.html',
  '/adobe-acrobat-alternative.html',
  '/edit-pdf-without-uploading.html',
  '/secure-pdf-editor.html',
  '/browser-pdf-editor.html',
]
const sitemapPaths = new Set(urls.map((url) => new URL(url).pathname))
const htmlUrls = prominentPaths.map((path) => {
  if (!sitemapPaths.has(path)) throw new Error(`sitemap.xml is missing homepage noscript path: ${path}`)
  return `${site}${path}`
})

if (htmlUrls.length === 0) throw new Error('sitemap.xml has no HTML URLs for homepage noscript navigation')

const links = []
for (const url of htmlUrls) {
  const path = new URL(url).pathname
  links.push(`          <a href="${path}">${escapeHtml(await titleForPath(path))}</a>`)
}

const html = await readFile(new URL('index.html', rootDir), 'utf8')
const updated = html.replace(
  /(<nav aria-label="PDF tools">\n)[\s\S]*?(\n        <\/nav>)/,
  `$1${links.join('\n')}$2`,
)

if (updated === html) {
  console.log(`Synced compact homepage noscript navigation for ${htmlUrls.length} HTML pages.`)
} else {
  await writeFile(new URL('index.html', rootDir), updated)
  console.log(`Synced compact homepage noscript navigation for ${htmlUrls.length} HTML pages (1 changed).`)
}

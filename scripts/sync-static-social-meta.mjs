import { readdir, readFile, writeFile } from 'node:fs/promises'

const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)
const socialImage = 'https://slaypdf.com/og-image.png'
const socialImageAlt = 'Slay PDF local PDF editor preview'

function contentFor(html, selector) {
  return html.match(new RegExp(`<meta ${selector} content="([^"]+)"\\s*/>`))?.[1]
}

function hrefFor(html, selector) {
  return html.match(new RegExp(`<link ${selector} href="([^"]+)"\\s*/>`))?.[1]
}

function isoDate(lastmod) {
  return new Date(`${lastmod}T00:00:00.000Z`).toISOString()
}

function titleFor(html) {
  return html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
}

function metaTag(attribute, value, content) {
  return `    <meta ${attribute}="${value}" content="${content.replaceAll('"', '&quot;')}" />`
}

function stripManagedSocialMeta(html) {
  const managed = [
    'og:type',
    'og:locale',
    'og:site_name',
    'og:title',
    'og:description',
    'og:url',
    'og:updated_time',
    'og:image',
    'og:image:type',
    'og:image:width',
    'og:image:height',
    'og:image:alt',
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image',
    'twitter:image:alt',
  ]
  const expression = new RegExp(
    `^\\s*<meta (?:property|name)="(?:${managed.join('|')})" content="[^"]+"\\s*/>\\n`,
    'gm',
  )
  return html.replace(expression, '')
}

function socialBlockFor(html, file) {
  const title = contentFor(html, 'property="og:title"') ?? titleFor(html)
  const description = contentFor(html, 'property="og:description"') ?? contentFor(html, 'name="description"')
  const url = contentFor(html, 'property="og:url"') ?? hrefFor(html, 'rel="canonical"')

  if (!title) throw new Error(`${file} is missing an Open Graph title or title tag`)
  if (!description) throw new Error(`${file} is missing an Open Graph description or meta description`)
  if (!url) throw new Error(`${file} is missing an Open Graph URL`)
  const lastmod = lastmodByUrl.get(url)
  if (!lastmod) throw new Error(`${file} canonical URL is missing from sitemap lastmod data: ${url}`)

  return [
    metaTag('property', 'og:type', 'website'),
    metaTag('property', 'og:locale', 'en_US'),
    metaTag('property', 'og:site_name', 'Slay PDF'),
    metaTag('property', 'og:title', title),
    metaTag('property', 'og:description', description),
    metaTag('property', 'og:url', url),
    metaTag('property', 'og:updated_time', isoDate(lastmod)),
    metaTag('property', 'og:image', socialImage),
    metaTag('property', 'og:image:type', 'image/png'),
    metaTag('property', 'og:image:width', '1200'),
    metaTag('property', 'og:image:height', '630'),
    metaTag('property', 'og:image:alt', socialImageAlt),
    metaTag('name', 'twitter:card', 'summary_large_image'),
    metaTag('name', 'twitter:title', title),
    metaTag('name', 'twitter:description', description),
    metaTag('name', 'twitter:image', socialImage),
    metaTag('name', 'twitter:image:alt', socialImageAlt),
  ].join('\n')
}

const sitemap = await readFile(new URL('sitemap.xml', publicDir), 'utf8')
const lastmodByUrl = new Map([...sitemap.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<lastmod>(.*?)<\/lastmod>/g)].map((match) => [match[1], match[2]]))

const files = [
  { file: 'index.html', url: new URL('index.html', rootDir) },
  ...(await readdir(publicDir))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => ({ file, url: new URL(file, publicDir) })),
]
let changed = 0

function insertSocialMeta(html, block) {
  const headEnd = html.indexOf('</head>')
  const firstJsonLd = html.search(/\s*<script type="application\/ld\+json"(?: [^>]*)?>/)
  if (headEnd >= 0 && firstJsonLd >= 0 && firstJsonLd < headEnd) {
    return html.replace(
      /(\s*<script type="application\/ld\+json"(?: [^>]*)?>)/,
      `\n${block}$1`,
    )
  }
  return html.replace(/(\s*<title>)/, `\n${block}$1`)
}

for (const { file, url } of files) {
  const html = await readFile(url, 'utf8')
  const withoutSocialMeta = stripManagedSocialMeta(html)
  const updated = insertSocialMeta(withoutSocialMeta, socialBlockFor(html, file))
  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced social metadata for ${files.length} HTML pages${changed ? ` (${changed} changed)` : ''}.`)

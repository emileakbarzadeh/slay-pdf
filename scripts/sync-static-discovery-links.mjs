import { readdir, readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)

const discoveryLinks = [
  {
    rel: 'alternate',
    type: 'application/rss+xml',
    title: 'Slay PDF discovery feed',
    href: `${site}/feed.xml`,
  },
  {
    rel: 'alternate',
    type: 'application/feed+json',
    title: 'Slay PDF JSON discovery feed',
    href: `${site}/feed.json`,
  },
  {
    rel: 'alternate',
    type: 'application/json',
    title: 'Slay PDF structured page index',
    href: `${site}/pages.json`,
  },
  {
    rel: 'alternate',
    type: 'text/plain',
    title: 'Slay PDF compact LLM index',
    href: `${site}/llms.txt`,
  },
  {
    rel: 'alternate',
    type: 'text/plain',
    title: 'Slay PDF full text LLM index',
    href: `${site}/llms-full.txt`,
  },
]

function linkFor(link) {
  return `    <link rel="${link.rel}" type="${link.type}" title="${link.title}" href="${link.href}" />`
}

function languageLinksFor(canonical) {
  return [
    `    <link rel="alternate" hreflang="en" href="${canonical}" />`,
    `    <link rel="alternate" hreflang="x-default" href="${canonical}" />`,
  ].join('\n')
}

function stripDiscoveryLinks(html) {
  const hrefs = discoveryLinks.map((link) => link.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const expression = new RegExp(
    `^\\s*<link rel="alternate" type="[^"]+" title="[^"]+" href="(?:${hrefs.join('|')})"\\s*/>\\n`,
    'gm',
  )
  return html
    .replace(expression, '')
    .replace(/^\s*<link rel="alternate" hreflang="(?:en|x-default)" href="[^"]+"\s*\/>\n/gm, '')
}

const files = [
  { file: 'index.html', url: new URL('index.html', rootDir) },
  ...(await readdir(publicDir))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => ({ file, url: new URL(file, publicDir) })),
]

let changed = 0
const block = discoveryLinks.map(linkFor).join('\n')

for (const { file, url } of files) {
  const html = await readFile(url, 'utf8')
  const withoutLinks = stripDiscoveryLinks(html)
  const canonical = withoutLinks.match(/<link rel="canonical" href="([^"]+)"\s*\/>/)?.[1]
  if (!canonical) throw new Error(`${file} is missing canonical link`)
  const updated = withoutLinks.replace(
    /(\s*<link rel="canonical" href="[^"]+"\s*\/>)/,
    `$1\n${languageLinksFor(canonical)}\n${block}`,
  )
  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced discovery links for ${files.length} HTML pages${changed ? ` (${changed} changed)` : ''}.`)

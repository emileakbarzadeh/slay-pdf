import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const rootDir = new URL('../', import.meta.url)

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))

if (pagesJson.site !== site) throw new Error('pages.json site is wrong')
if (!Array.isArray(pagesJson.pages) || pagesJson.pages.length === 0) throw new Error('pages.json has no pages')

function decodeHtml(value) {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}

function textFromInlineHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function mainHtmlFor(html) {
  return html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? ''
}

function visibleContentFor(html) {
  const main = mainHtmlFor(html)
  const lines = []

  for (const match of main.matchAll(/<(h1|h2|p)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const text = textFromInlineHtml(match[2])
    if (text && !lines.includes(text)) lines.push(text)
  }

  return lines
}

function relatedLinksFor(html) {
  const main = mainHtmlFor(html)
  const links = []
  const seen = new Set()
  const relatedSections = [
    ...main.matchAll(/<(?:div|section) class="(?:links|tool-list)"[^>]*>([\s\S]*?)<\/(?:div|section)>/g),
  ]

  for (const section of relatedSections) {
    for (const match of section[1].matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const href = new URL(match[1], site).href
      const strong = match[2].match(/<strong>([\s\S]*?)<\/strong>/)?.[1]
      const span = match[2].match(/<span>([\s\S]*?)<\/span>/)?.[1]
      const label = strong && span
        ? `${textFromInlineHtml(strong)}: ${textFromInlineHtml(span)}`
        : textFromInlineHtml(match[2])
      if (!label || seen.has(href)) continue
      links.push({ label, href })
      seen.add(href)
    }
  }

  return links
}

async function htmlFor(page) {
  if (page.path === '/') return readFile(new URL('index.html', rootDir), 'utf8')
  return readFile(new URL(basename(page.path), publicDir), 'utf8')
}

const lines = [
  '# Slay PDF full text index',
  '',
  'Generated from canonical Slay PDF pages for answer engines and crawlers that need page-level content beyond the compact llms.txt summary.',
  '',
  `Site: ${site}/`,
  `Sitemap index: ${site}/sitemap-index.xml`,
  `Canonical sitemap: ${site}/sitemap.xml`,
  `Image sitemap: ${site}/image-sitemap.xml`,
  `Source index: ${site}/pages.json`,
  `Compact index: ${site}/llms.txt`,
  '',
]

for (const page of pagesJson.pages) {
  if (!page.title || !page.url || !page.description || !page.h1 || !page.lastmod) {
    throw new Error(`page index entry is missing llms-full fields for ${page.url ?? 'unknown URL'}`)
  }

  const html = await htmlFor(page)
  const content = visibleContentFor(html)
  const relatedLinks = relatedLinksFor(html)

  lines.push(`## ${page.title}`)
  lines.push(`URL: ${page.url}`)
  lines.push(`Last modified: ${page.lastmod}`)
  lines.push(`Summary: ${page.description}`)
  lines.push(`H1: ${page.h1}`)
  lines.push('')
  lines.push('Content:')
  for (const text of content) lines.push(`- ${text}`)
  if (relatedLinks.length > 0) {
    lines.push('')
    lines.push('Related links:')
    for (const link of relatedLinks) lines.push(`- ${link.label}: ${link.href}`)
  }
  lines.push('')
}

await writeFile(new URL('llms-full.txt', publicDir), `${lines.join('\n')}\n`)

console.log(`Generated llms-full.txt for ${pagesJson.pages.length} URLs.`)

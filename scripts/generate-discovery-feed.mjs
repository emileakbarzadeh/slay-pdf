import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function pubDate(lastmod) {
  return new Date(`${lastmod}T00:00:00.000Z`).toUTCString()
}

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))
const pages = pagesJson.pages

if (pagesJson.site !== site) throw new Error('pages.json site is wrong')
if (!Array.isArray(pages) || pages.length === 0) throw new Error('pages.json has no pages')

const latest = pages
  .map((page) => page.lastmod)
  .filter(Boolean)
  .sort()
  .at(-1)

const items = pages.map((page) => {
  if (!page.url || !page.title || !page.description || !page.lastmod) {
    throw new Error(`page index entry is missing feed fields for ${page.url ?? 'unknown URL'}`)
  }
  return [
    '    <item>',
    `      <title>${xml(page.title)}</title>`,
    `      <link>${xml(page.url)}</link>`,
    `      <guid isPermaLink="true">${xml(page.url)}</guid>`,
    `      <description>${xml(page.description)}</description>`,
    `      <pubDate>${pubDate(page.lastmod)}</pubDate>`,
    '    </item>',
  ].join('\n')
})

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Slay PDF pages</title>
    <link>${site}/</link>
    <description>Canonical Slay PDF app, tool and guide pages for local PDF editing.</description>
    <language>en</language>
    <lastBuildDate>${pubDate(latest)}</lastBuildDate>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`

await writeFile(new URL('feed.xml', publicDir), feed)

console.log(`Generated discovery feed for ${pages.length} URLs.`)

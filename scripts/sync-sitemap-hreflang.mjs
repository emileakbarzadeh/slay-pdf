import { readFile, writeFile } from 'node:fs/promises'

const publicDir = new URL('../public/', import.meta.url)
const sitemapUrl = new URL('sitemap.xml', publicDir)

function hreflangLinksFor(url) {
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${url}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${url}" />`,
  ].join('\n')
}

const originalSitemap = await readFile(sitemapUrl, 'utf8')
let sitemap = originalSitemap
sitemap = sitemap
  .replace(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  )
  .replace(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  )
  .replace(/^\s*<xhtml:link rel="alternate" hreflang="(?:en|x-default)" href="[^"]+"\s*\/>\n/gm, '')

const updated = sitemap.replace(/(    <loc>([^<]+)<\/loc>)/g, (match, locLine, url) => `${locLine}\n${hreflangLinksFor(url)}`)

if (updated !== originalSitemap) await writeFile(sitemapUrl, updated)

const count = [...updated.matchAll(/<url>/g)].length
console.log(`Synced sitemap hreflang annotations for ${count} URLs${updated !== originalSitemap ? ' (1 changed)' : ''}.`)

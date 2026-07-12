import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const rootDir = new URL('../', import.meta.url)

async function readPublic(path) {
  return readFile(new URL(path, publicDir), 'utf8')
}

async function readPage(url) {
  const pathname = new URL(url).pathname
  const html = pathname === '/' ? await readFile(new URL('index.html', rootDir), 'utf8') : await readPublic(basename(pathname))
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim()
  const h1 = html.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim()
  const structuredData = [...html.matchAll(/<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
  const webpage = structuredData.find((block) => block['@type'] === 'WebPage')
  const breadcrumb = structuredData.find((block) => block['@type'] === 'BreadcrumbList')
  const sitemap = sitemapMetadata.get(url)
  return {
    url,
    path: pathname,
    title,
    description,
    h1: h1 ?? title,
    lastmod: sitemap?.lastmod,
    changefreq: sitemap?.changefreq,
    priority: sitemap?.priority,
    webpageId: webpage?.['@id'],
    breadcrumbId: breadcrumb?.['@id'],
  }
}

const sitemap = await readPublic('sitemap.xml')
const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<changefreq>(.*?)<\/changefreq>\s*<priority>(.*?)<\/priority>\s*<\/url>/g)]
  .map((match) => ({
    url: match[1],
    lastmod: match[2],
    changefreq: match[3],
    priority: Number(match[4]),
  }))
const urls = sitemapEntries.map((entry) => entry.url)
const sitemapMetadata = new Map(sitemapEntries.map((entry) => [entry.url, entry]))

if (!urls.includes(`${site}/`)) throw new Error('sitemap is missing homepage')
if (sitemapEntries.length === 0) throw new Error('sitemap is missing annotated URL entries')

const pages = await Promise.all(urls.map(readPage))

await writeFile(new URL('pages.txt', publicDir), `${urls.join('\n')}\n`)
await writeFile(new URL('pages.json', publicDir), `${JSON.stringify({
  site,
  generatedFrom: `${site}/sitemap.xml`,
  pages,
}, null, 2)}\n`)

console.log(`Generated page indexes for ${pages.length} URLs.`)

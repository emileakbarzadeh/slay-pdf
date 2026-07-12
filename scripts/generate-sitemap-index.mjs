import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))
const pages = pagesJson.pages ?? []

if (pagesJson.site !== site) throw new Error('pages.json site is wrong')
if (!Array.isArray(pages) || pages.length === 0) throw new Error('pages.json has no pages')

const latestLastmod = pages
  .map((page) => page.lastmod)
  .sort()
  .at(-1)

if (!/^\d{4}-\d{2}-\d{2}$/.test(latestLastmod)) throw new Error('pages.json has no valid latest lastmod')

const entries = [
  `${site}/sitemap.xml`,
  `${site}/image-sitemap.xml`,
]

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((loc) => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${latestLastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>
`

await writeFile(new URL('sitemap-index.xml', publicDir), sitemapIndex)

console.log(`Generated sitemap index for ${entries.length} sitemaps.`)

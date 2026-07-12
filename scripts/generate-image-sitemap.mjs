import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const imageUrl = `${site}/og-image.png`

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))
const pages = pagesJson.pages

if (pagesJson.site !== site) throw new Error('pages.json site is wrong')
if (!Array.isArray(pages) || pages.length === 0) throw new Error('pages.json has no pages')

const entries = pages.map((page) => {
  if (!page.url || !page.title || !page.description) {
    throw new Error(`page index entry is missing image sitemap fields for ${page.url ?? 'unknown URL'}`)
  }

  return [
    '  <url>',
    `    <loc>${xml(page.url)}</loc>`,
    '    <image:image>',
    `      <image:loc>${xml(imageUrl)}</image:loc>`,
    `      <image:title>${xml(page.title)}</image:title>`,
    `      <image:caption>${xml(page.description)}</image:caption>`,
    '    </image:image>',
    '  </url>',
  ].join('\n')
})

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`

await writeFile(new URL('image-sitemap.xml', publicDir), sitemap)

console.log(`Generated image sitemap for ${pages.length} URLs.`)

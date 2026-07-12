import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)

function isoDate(lastmod) {
  return new Date(`${lastmod}T00:00:00.000Z`).toISOString()
}

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))
const pages = pagesJson.pages

if (pagesJson.site !== site) throw new Error('pages.json site is wrong')
if (!Array.isArray(pages) || pages.length === 0) throw new Error('pages.json has no pages')

const feed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Slay PDF pages',
  home_page_url: `${site}/`,
  feed_url: `${site}/feed.json`,
  description: 'Canonical Slay PDF app, tool and guide pages for local PDF editing.',
  language: 'en',
  items: pages.map((page) => {
    if (!page.url || !page.title || !page.description || !page.lastmod) {
      throw new Error(`page index entry is missing JSON feed fields for ${page.url ?? 'unknown URL'}`)
    }
    return {
      id: page.url,
      url: page.url,
      title: page.title,
      summary: page.description,
      content_text: page.description,
      date_modified: isoDate(page.lastmod),
    }
  }),
}

await writeFile(new URL('feed.json', publicDir), `${JSON.stringify(feed, null, 2)}\n`)

console.log(`Generated JSON feed for ${pages.length} URLs.`)

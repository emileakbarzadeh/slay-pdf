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
  return {
    url,
    path: pathname,
    title,
    description,
    h1: h1 ?? title,
  }
}

const sitemap = await readPublic('sitemap.xml')
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])

if (!urls.includes(`${site}/`)) throw new Error('sitemap is missing homepage')

const pages = await Promise.all(urls.map(readPage))

await writeFile(new URL('pages.txt', publicDir), `${urls.join('\n')}\n`)
await writeFile(new URL('pages.json', publicDir), `${JSON.stringify({
  site,
  generatedFrom: `${site}/sitemap.xml`,
  pages,
}, null, 2)}\n`)

console.log(`Generated page indexes for ${pages.length} URLs.`)

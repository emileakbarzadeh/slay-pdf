import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const host = 'slaypdf.com'
const key = 'b758a32ef4c84ce7bf2f4bd2468227f8'
const publicDir = new URL('../public/', import.meta.url)

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))
const pages = pagesJson.pages ?? []

if (pagesJson.site !== site) throw new Error('pages.json site is wrong')
if (!Array.isArray(pages) || pages.length === 0) throw new Error('pages.json has no pages')

const urlList = pages.map((page) => page.url)
if (urlList.some((url) => !url?.startsWith(`${site}/`))) throw new Error('pages.json includes an invalid IndexNow URL')
if (new Set(urlList).size !== urlList.length) throw new Error('pages.json includes duplicate IndexNow URLs')

const payload = {
  host,
  key,
  keyLocation: `${site}/${key}.txt`,
  urlList,
}

await writeFile(new URL('indexnow.json', publicDir), `${JSON.stringify(payload, null, 2)}\n`)
await writeFile(new URL('indexnow-urls.txt', publicDir), `${urlList.join('\n')}\n`)

console.log(`Generated IndexNow payload for ${urlList.length} URLs.`)

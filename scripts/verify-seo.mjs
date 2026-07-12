import { readFile, stat } from 'node:fs/promises'
import { basename } from 'node:path'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const live = process.argv.includes('--live')

async function readPublic(path) {
  return readFile(new URL(path, publicDir), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const sitemap = await readPublic('sitemap.xml')
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
assert(urls.includes(`${site}/`), 'sitemap is missing homepage')
assert(new Set(urls).size === urls.length, 'sitemap contains duplicate URLs')

const htmlUrls = urls.filter((url) => url.endsWith('.html'))
const titles = new Map()
const descriptions = new Map()
for (const url of htmlUrls) {
  const file = basename(new URL(url).pathname)
  const html = await readPublic(file)
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim()
  assert(title && title.length >= 15 && title.length <= 70, `${file} title should be 15-70 characters`)
  assert(description && description.length >= 80 && description.length <= 180, `${file} description should be 80-180 characters`)
  assert(html.match(/<h1>[^<]+<\/h1>/), `${file} is missing a visible h1`)
  assert(html.includes(`rel="canonical" href="${url}"`), `${file} canonical does not match sitemap URL`)
  assert(html.includes('name="robots" content="index, follow, max-image-preview:large"'), `${file} is missing indexable robots meta`)
  assert(html.includes(`property="og:url" content="${url}"`), `${file} Open Graph URL does not match sitemap URL`)
  assert(html.includes('property="og:title" content="'), `${file} is missing Open Graph title`)
  assert(html.includes('property="og:description" content="'), `${file} is missing Open Graph description`)
  assert(html.includes('property="og:image" content="https://slaypdf.com/og-image.png"'), `${file} is missing social preview image`)
  assert(html.includes('name="twitter:card" content="summary_large_image"'), `${file} is missing Twitter card metadata`)
  assert(html.includes('aria-label="Breadcrumb"'), `${file} is missing visible breadcrumbs`)
  assert(html.includes('"@type": "BreadcrumbList"'), `${file} is missing breadcrumb JSON-LD`)
  assert(!titles.has(title), `${file} title duplicates ${titles.get(title)}`)
  assert(!descriptions.has(description), `${file} description duplicates ${descriptions.get(description)}`)
  titles.set(title, file)
  descriptions.set(description, file)
}

const indexNow = JSON.parse(await readPublic('indexnow.json'))
assert(indexNow.host === 'slaypdf.com', 'IndexNow host is wrong')
assert(indexNow.keyLocation === `${site}/${indexNow.key}.txt`, 'IndexNow keyLocation does not match key')
assert((await readPublic(`${indexNow.key}.txt`)).trim() === indexNow.key, 'IndexNow key file content does not match payload key')
assert(indexNow.urlList.length === urls.length, 'IndexNow URL count differs from sitemap URL count')
for (const url of indexNow.urlList) assert(urls.includes(url), `IndexNow URL is missing from sitemap: ${url}`)

const llms = await readPublic('llms.txt')
for (const url of urls) assert(llms.includes(url), `llms.txt is missing ${url}`)

for (const asset of ['CNAME', 'robots.txt', 'og-image.png', 'seo.css']) {
  await stat(new URL(asset, publicDir))
}

if (live) {
  for (const url of urls) {
    const response = await fetch(url, { redirect: 'manual' })
    assert(response.ok, `live URL failed ${response.status}: ${url}`)
  }
  const keyResponse = await fetch(indexNow.keyLocation)
  assert(keyResponse.ok, `live IndexNow key failed ${keyResponse.status}`)
  assert((await keyResponse.text()).trim() === indexNow.key, 'live IndexNow key content mismatch')
}

console.log(`SEO verification passed for ${urls.length} sitemap URLs${live ? ' and live deployment' : ''}.`)

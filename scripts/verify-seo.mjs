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

const pageMetadata = new Map()
const htmlUrls = urls.filter((url) => url.endsWith('.html'))
const titles = new Map()
const descriptions = new Map()
const requiredSocialTags = [
  ['property', 'og:type', 'website'],
  ['property', 'og:site_name', 'Slay PDF'],
  ['property', 'og:image:type', 'image/png'],
  ['property', 'og:image:width', '1200'],
  ['property', 'og:image:height', '630'],
  ['property', 'og:image:alt', 'Slay PDF local PDF editor preview'],
  ['name', 'twitter:card', 'summary_large_image'],
  ['name', 'twitter:image', 'https://slaypdf.com/og-image.png'],
]
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
  assert(html.includes('name="twitter:title" content="'), `${file} is missing Twitter title metadata`)
  assert(html.includes('name="twitter:description" content="'), `${file} is missing Twitter description metadata`)
  for (const [attribute, name, content] of requiredSocialTags) {
    assert(html.includes(`${attribute}="${name}" content="${content}"`), `${file} is missing ${name} metadata`)
  }
  assert(html.includes('aria-label="Breadcrumb"'), `${file} is missing visible breadcrumbs`)
  assert(html.includes('"@type": "BreadcrumbList"'), `${file} is missing breadcrumb JSON-LD`)
  assert(!titles.has(title), `${file} title duplicates ${titles.get(title)}`)
  assert(!descriptions.has(description), `${file} description duplicates ${descriptions.get(description)}`)
  titles.set(title, file)
  descriptions.set(description, file)
  pageMetadata.set(url, { title, description, h1: html.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim() })
}

const rootHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
pageMetadata.set(`${site}/`, {
  title: rootHtml.match(/<title>([^<]+)<\/title>/)?.[1]?.trim(),
  description: rootHtml.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim(),
  h1: rootHtml.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim(),
})

const indexNow = JSON.parse(await readPublic('indexnow.json'))
assert(indexNow.host === 'slaypdf.com', 'IndexNow host is wrong')
assert(indexNow.keyLocation === `${site}/${indexNow.key}.txt`, 'IndexNow keyLocation does not match key')
assert((await readPublic(`${indexNow.key}.txt`)).trim() === indexNow.key, 'IndexNow key file content does not match payload key')
assert(indexNow.urlList.length === urls.length, 'IndexNow URL count differs from sitemap URL count')
for (const url of indexNow.urlList) assert(urls.includes(url), `IndexNow URL is missing from sitemap: ${url}`)

const pagesTxt = (await readPublic('pages.txt')).trim().split(/\n+/)
assert(JSON.stringify(pagesTxt) === JSON.stringify(urls), 'pages.txt must match sitemap URL order exactly')

const pagesJson = JSON.parse(await readPublic('pages.json'))
assert(pagesJson.site === site, 'pages.json site is wrong')
assert(pagesJson.generatedFrom === `${site}/sitemap.xml`, 'pages.json generatedFrom is wrong')
assert(Array.isArray(pagesJson.pages), 'pages.json pages must be an array')
assert(pagesJson.pages.length === urls.length, 'pages.json URL count differs from sitemap URL count')
for (const [index, page] of pagesJson.pages.entries()) {
  const expectedUrl = urls[index]
  const expected = pageMetadata.get(expectedUrl)
  assert(page.url === expectedUrl, `pages.json URL order mismatch at ${index}`)
  assert(page.path === new URL(expectedUrl).pathname, `pages.json path mismatch for ${expectedUrl}`)
  assert(page.title === expected?.title, `pages.json title mismatch for ${expectedUrl}`)
  assert(page.description === expected?.description, `pages.json description mismatch for ${expectedUrl}`)
}

const toolsHtml = await readPublic('tools.html')
const toolsStructuredData = [...toolsHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]))
const itemList = toolsStructuredData.find((block) => block['@type'] === 'ItemList')
assert(itemList, 'tools.html is missing ItemList JSON-LD')
const itemListUrls = itemList.itemListElement?.map((item) => item.url) ?? []
const toolsChildUrls = htmlUrls.filter((url) => url !== `${site}/tools.html`)
assert(itemListUrls.length === toolsChildUrls.length, 'tools.html ItemList count must match linked sitemap pages')
for (const [index, url] of toolsChildUrls.entries()) {
  assert(itemListUrls[index] === url, `tools.html ItemList URL mismatch at position ${index + 1}`)
  assert(toolsHtml.includes(`href="${new URL(url).pathname}"`), `tools.html is missing visible link to ${url}`)
}

const llms = await readPublic('llms.txt')
for (const url of urls) assert(llms.includes(url), `llms.txt is missing ${url}`)
assert(llms.includes(`${site}/pages.txt`), 'llms.txt is missing pages.txt')
assert(llms.includes(`${site}/pages.json`), 'llms.txt is missing pages.json')

for (const asset of ['CNAME', 'robots.txt', 'og-image.png', 'seo.css', 'pages.txt', 'pages.json']) {
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

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

function pubDate(lastmod) {
  return new Date(`${lastmod}T00:00:00.000Z`).toUTCString()
}

function decodeXml(value) {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}

function structuredDataBlocks(html, file) {
  return [...html.matchAll(/<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => {
      try {
        return JSON.parse(match[1])
      } catch (error) {
        throw new Error(`${file} has invalid JSON-LD: ${error.message}`)
      }
    })
}

function assertWebPageSchema({ html, file, url, title, description, h1 }) {
  assert(html.includes('type="application/ld+json" data-managed="webpage"'), `${file} is missing managed WebPage JSON-LD`)
  const blocks = structuredDataBlocks(html, file)
  const webpage = blocks.find((block) => block['@type'] === 'WebPage')
  assert(webpage, `${file} is missing WebPage JSON-LD`)
  assert(webpage['@context'] === 'https://schema.org', `${file} WebPage context is wrong`)
  assert(webpage['@id'] === `${url}#webpage`, `${file} WebPage @id does not match canonical URL`)
  assert(webpage.url === url, `${file} WebPage URL does not match canonical URL`)
  assert(webpage.name === title, `${file} WebPage name does not match title`)
  assert(webpage.headline === h1, `${file} WebPage headline does not match h1`)
  assert(webpage.description === description, `${file} WebPage description does not match meta description`)
  assert(webpage.dateModified === sitemapMetadata.get(url)?.lastmod, `${file} WebPage dateModified does not match sitemap lastmod`)
  assert(webpage.isPartOf?.['@type'] === 'WebSite', `${file} WebPage isPartOf should be WebSite`)
  assert(webpage.isPartOf?.['@id'] === `${site}/#website`, `${file} WebPage isPartOf @id is wrong`)
  assert(webpage.publisher?.['@type'] === 'Organization', `${file} WebPage publisher should be Organization`)
  assert(webpage.publisher?.['@id'] === `${site}/#organization`, `${file} WebPage publisher @id is wrong`)
  assert(webpage.primaryImageOfPage?.url === `${site}/og-image.png`, `${file} WebPage image URL is wrong`)
  assert(webpage.primaryImageOfPage?.width === 1200, `${file} WebPage image width is wrong`)
  assert(webpage.primaryImageOfPage?.height === 630, `${file} WebPage image height is wrong`)
  assert(webpage.inLanguage === 'en', `${file} WebPage language is wrong`)
  const breadcrumb = blocks.find((block) => block['@type'] === 'BreadcrumbList')
  if (breadcrumb) {
    assert(webpage.breadcrumb?.['@id'] === `${url}#breadcrumb`, `${file} WebPage breadcrumb reference is wrong`)
    assert(breadcrumb['@id'] === `${url}#breadcrumb`, `${file} BreadcrumbList @id is wrong`)
    assert(breadcrumb.itemListElement?.at(-1)?.item === url, `${file} breadcrumb must end at canonical URL`)
  }
}

const sitemap = await readPublic('sitemap.xml')
const sitemapLocs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<changefreq>(.*?)<\/changefreq>\s*<priority>(.*?)<\/priority>\s*<\/url>/g)]
  .map((match) => ({
    url: match[1],
    lastmod: match[2],
    changefreq: match[3],
    priority: Number(match[4]),
  }))
const urls = sitemapEntries.map((entry) => entry.url)
const sitemapMetadata = new Map(sitemapEntries.map((entry) => [entry.url, entry]))
assert(urls.includes(`${site}/`), 'sitemap is missing homepage')
assert(new Set(urls).size === urls.length, 'sitemap contains duplicate URLs')
assert(sitemapEntries.length === sitemapLocs.length, 'every sitemap URL must include lastmod, changefreq and priority')
for (const entry of sitemapEntries) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod), `${entry.url} sitemap lastmod must be YYYY-MM-DD`)
  assert(['daily', 'weekly', 'monthly', 'yearly'].includes(entry.changefreq), `${entry.url} sitemap changefreq is invalid`)
  assert(Number.isFinite(entry.priority) && entry.priority >= 0 && entry.priority <= 1, `${entry.url} sitemap priority must be 0-1`)
}

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
  const h1 = html.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim()
  assert(title && title.length >= 15 && title.length <= 70, `${file} title should be 15-70 characters`)
  assert(description && description.length >= 80 && description.length <= 180, `${file} description should be 80-180 characters`)
  assert(h1, `${file} is missing a visible h1`)
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
  assertWebPageSchema({ html, file, url, title, description, h1 })
  assert(!titles.has(title), `${file} title duplicates ${titles.get(title)}`)
  assert(!descriptions.has(description), `${file} description duplicates ${descriptions.get(description)}`)
  titles.set(title, file)
  descriptions.set(description, file)
  pageMetadata.set(url, { title, description, h1 })
}

const rootHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
assert(rootHtml.includes('rel="alternate" type="application/rss+xml" title="Slay PDF discovery feed" href="https://slaypdf.com/feed.xml"'), 'homepage is missing RSS alternate link')
const rootMetadata = {
  title: rootHtml.match(/<title>([^<]+)<\/title>/)?.[1]?.trim(),
  description: rootHtml.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim(),
  h1: rootHtml.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim(),
}
assertWebPageSchema({
  html: rootHtml,
  file: 'index.html',
  url: `${site}/`,
  ...rootMetadata,
})
pageMetadata.set(`${site}/`, rootMetadata)

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
  assert(page.h1 === expected?.h1, `pages.json h1 mismatch for ${expectedUrl}`)
  assert(page.lastmod === sitemapMetadata.get(expectedUrl)?.lastmod, `pages.json lastmod mismatch for ${expectedUrl}`)
  assert(page.changefreq === sitemapMetadata.get(expectedUrl)?.changefreq, `pages.json changefreq mismatch for ${expectedUrl}`)
  assert(page.priority === sitemapMetadata.get(expectedUrl)?.priority, `pages.json priority mismatch for ${expectedUrl}`)
  assert(page.webpageId === `${expectedUrl}#webpage`, `pages.json webpageId mismatch for ${expectedUrl}`)
  if (expectedUrl.endsWith('.html')) {
    assert(page.breadcrumbId === `${expectedUrl}#breadcrumb`, `pages.json breadcrumbId mismatch for ${expectedUrl}`)
  } else {
    assert(!page.breadcrumbId, `pages.json root page should not include a breadcrumbId`)
  }
}

const feed = await readPublic('feed.xml')
assert(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'feed.xml is missing XML declaration')
assert(feed.includes('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'), 'feed.xml is not an RSS 2.0 feed')
assert(feed.includes('<title>Slay PDF pages</title>'), 'feed.xml channel title is wrong')
assert(feed.includes(`<link>${site}/</link>`), 'feed.xml channel link is wrong')
assert(feed.includes(`<atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />`), 'feed.xml self link is wrong')
assert(feed.includes(`<lastBuildDate>${pubDate(sitemapEntries.map((entry) => entry.lastmod).sort().at(-1))}</lastBuildDate>`), 'feed.xml lastBuildDate does not match sitemap')
const feedItems = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
  const item = match[1]
  return {
    title: decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? ''),
    link: decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? ''),
    guid: decodeXml(item.match(/<guid isPermaLink="true">([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? ''),
    description: decodeXml(item.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() ?? ''),
    pubDate: item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim(),
  }
})
assert(feedItems.length === pagesJson.pages.length, 'feed.xml item count differs from pages.json')
for (const [index, item] of feedItems.entries()) {
  const page = pagesJson.pages[index]
  assert(item.title === page.title, `feed.xml title mismatch at ${index}`)
  assert(item.link === page.url, `feed.xml link mismatch at ${index}`)
  assert(item.guid === page.url, `feed.xml guid mismatch at ${index}`)
  assert(item.description === page.description, `feed.xml description mismatch at ${index}`)
  assert(item.pubDate === pubDate(page.lastmod), `feed.xml pubDate mismatch at ${index}`)
}

const toolsHtml = await readPublic('tools.html')
const toolsStructuredData = structuredDataBlocks(toolsHtml, 'tools.html')
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
assert(llms.includes('## Canonical Pages'), 'llms.txt is missing canonical pages section')
assert(llms.includes('## Discovery Files'), 'llms.txt is missing discovery files section')
assert(llms.includes('## Use Cases'), 'llms.txt is missing use cases section')
for (const page of pagesJson.pages) {
  assert(llms.includes(`- ${page.title}: ${page.url}`), `llms.txt is missing page heading for ${page.url}`)
  assert(llms.includes(`  Summary: ${page.description}`), `llms.txt is missing page summary for ${page.url}`)
  assert(llms.includes(`  Last modified: ${page.lastmod}`), `llms.txt is missing page lastmod for ${page.url}`)
}
assert(llms.includes(`${site}/pages.txt`), 'llms.txt is missing pages.txt')
assert(llms.includes(`${site}/pages.json`), 'llms.txt is missing pages.json')
assert(llms.includes(`${site}/feed.xml`), 'llms.txt is missing feed.xml')

const robots = await readPublic('robots.txt')
assert(robots.includes(`${site}/feed.xml`), 'robots.txt discovery comment is missing feed.xml')

for (const asset of ['CNAME', 'robots.txt', 'og-image.png', 'seo.css', 'pages.txt', 'pages.json', 'feed.xml']) {
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
  const feedResponse = await fetch(`${site}/feed.xml`)
  assert(feedResponse.ok, `live feed failed ${feedResponse.status}`)
  assert((await feedResponse.text()).includes('<title>Slay PDF pages</title>'), 'live feed content mismatch')
}

console.log(`SEO verification passed for ${urls.length} sitemap URLs${live ? ' and live deployment' : ''}.`)

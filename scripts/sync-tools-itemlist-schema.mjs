import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)

function decodeHtml(value) {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}

function textFromInlineHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
}

function linkHref(html, selector) {
  return html.match(new RegExp(`<link ${selector} href="([^"]+)"\\s*/>`))?.[1]
}

function tagContent(html, selector) {
  return html.match(new RegExp(`<meta ${selector} content="([^"]+)"\\s*/>`))?.[1]
}

function titleFor(html) {
  return html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
}

function visibleCatalogUrls(html) {
  const urls = []
  const sections = [
    ...html.matchAll(/<(?:section|div) class="(?:tool-list|links)"[^>]*>([\s\S]*?)<\/(?:section|div)>/g),
  ]

  for (const section of sections) {
    for (const link of section[1].matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const url = new URL(link[1], site).href
      if (url === `${site}/tools.html` || url === `${site}/sitemap.html`) continue
      if (!urls.includes(url)) urls.push(url)
    }
  }

  return urls
}

async function pageMetadataFor(url) {
  const file = basename(new URL(url).pathname)
  const html = await readFile(new URL(file, publicDir), 'utf8')
  const title = titleFor(html)
  const description = tagContent(html, 'name="description"')
  const canonical = linkHref(html, 'rel="canonical"')

  if (!title) throw new Error(`${file} is missing a title`)
  if (!description) throw new Error(`${file} is missing a meta description`)
  if (canonical !== url) throw new Error(`${file} canonical URL does not match tools catalog link`)

  return {
    title,
    description,
  }
}

function stripCatalogItemList(html) {
  let updated = html
  for (const match of html.matchAll(/^[ \t]*<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)^[ \t]*<\/script>\n?/gm)) {
    try {
      const data = JSON.parse(match[1])
      if (data['@type'] === 'ItemList' && (data['@id'] === `${site}/tools.html#itemlist` || data.name === 'Slay PDF tools and guides')) {
        updated = updated.replace(match[0], '')
      }
    } catch (error) {
      throw new Error(`tools.html has invalid JSON-LD: ${error.message}`)
    }
  }
  return updated
}

function scriptFor(schema) {
  const json = JSON.stringify(schema, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json" data-managed="tools-itemlist">\n${json}\n    </script>`
}

function insertCatalogItemList(html, schema) {
  const script = scriptFor(schema)
  if (html.includes('type="application/ld+json" data-managed="breadcrumb"')) {
    return html.replace(
      /(    <script type="application\/ld\+json" data-managed="breadcrumb">[\s\S]*?    <\/script>)/,
      `$1\n${script}`,
    )
  }

  return html.replace(/(\s*<title>)/, `\n${script}$1`)
}

const toolsUrl = new URL('tools.html', publicDir)
const html = await readFile(toolsUrl, 'utf8')
const urls = visibleCatalogUrls(html)
if (urls.length === 0) throw new Error('tools.html does not expose visible catalog links')

const items = await Promise.all(urls.map(async (url, index) => {
  const page = await pageMetadataFor(url)
  return {
    '@type': 'ListItem',
    position: index + 1,
    name: page.title.replace(/ - Slay PDF$/, ''),
    description: page.description,
    url,
    item: {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
    },
  }
}))

const schema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${site}/tools.html#itemlist`,
  name: 'Slay PDF tools and guides',
  description: 'Crawlable catalog of Slay PDF local PDF editor tools, workflows, guides and Adobe Acrobat alternative pages.',
  url: `${site}/tools.html`,
  inLanguage: 'en',
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  numberOfItems: items.length,
  mainEntityOfPage: {
    '@id': `${site}/tools.html#webpage`,
  },
  itemListElement: items,
}

const updated = insertCatalogItemList(stripCatalogItemList(html), schema)
if (updated !== html) await writeFile(toolsUrl, updated)

console.log(`Synced tools ItemList schema for ${items.length} catalog links${updated !== html ? ' (1 changed)' : ''}.`)

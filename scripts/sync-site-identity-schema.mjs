import { readFile, writeFile } from 'node:fs/promises'

const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)

function structuredDataScripts(html, file) {
  return [...html.matchAll(/^[ \t]*<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)^[ \t]*<\/script>/gm)]
    .map((match) => {
      try {
        return {
          fullMatch: match[0],
          attributes: match[0].match(/<script type="application\/ld\+json"([^>]*)>/)?.[1]?.trim(),
          data: JSON.parse(match[1]),
        }
      } catch (error) {
        throw new Error(`${file} has invalid JSON-LD: ${error.message}`)
      }
    })
}

function scriptFor(data, attributes) {
  const json = JSON.stringify(data, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json"${attributes ? ` ${attributes}` : ''}>\n${json}\n    </script>`
}

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))
if (!Array.isArray(pagesJson.pages) || pagesJson.pages.length === 0) {
  throw new Error('pages.json must contain canonical pages before syncing site identity schema')
}

const hasPart = pagesJson.pages.map((page) => {
  if (!page.url || !page.title || !page.webpageId) throw new Error(`pages.json entry is missing WebPage fields for ${page.url ?? 'unknown URL'}`)
  return {
    '@type': 'WebPage',
    '@id': page.webpageId,
    url: page.url,
    name: page.title,
  }
})

const siteNavigation = {
  '@type': 'ItemList',
  '@id': 'https://slaypdf.com/#site-navigation',
  name: 'Slay PDF site navigation',
  itemListElement: pagesJson.pages
    .filter((page) => page.path !== '/')
    .map((page, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SiteNavigationElement',
        '@id': `${page.url}#site-navigation`,
        name: page.title.replace(/ - Slay PDF$/, ''),
        url: page.url,
      },
    })),
}

const url = new URL('index.html', rootDir)
const html = await readFile(url, 'utf8')
let updated = html
let synced = false

for (const { fullMatch, attributes, data } of structuredDataScripts(html, 'index.html')) {
  if (!Array.isArray(data['@graph'])) continue

  const website = data['@graph'].find((node) => node['@type'] === 'WebSite')
  if (!website) continue

  const nextData = {
    ...data,
    '@graph': [
      ...data['@graph']
        .filter((node) => node['@id'] !== siteNavigation['@id'])
        .map((node) => (
          node['@type'] === 'WebSite'
            ? {
              ...node,
              hasPart,
            }
            : node
        )),
      siteNavigation,
    ],
  }

  updated = updated.replace(fullMatch, scriptFor(nextData, attributes))
  synced = true
}

if (!synced) throw new Error('index.html is missing WebSite JSON-LD graph')

if (updated !== html) {
  await writeFile(url, updated)
  console.log(`Synced WebSite hasPart schema for ${hasPart.length} canonical pages (1 changed).`)
} else {
  console.log(`Synced WebSite hasPart schema for ${hasPart.length} canonical pages.`)
}

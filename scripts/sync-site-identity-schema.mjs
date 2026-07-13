import { readFile, writeFile } from 'node:fs/promises'

const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)
const site = 'https://slaypdf.com/'
const sourceCodeUrl = 'https://github.com/emileakbarzadeh/slay-pdf'
const licenseUrl = 'https://www.gnu.org/licenses/agpl-3.0.en.html'

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

const prominentPaths = [
  '/',
  '/free-pdf-editor.html',
  '/tools.html',
  '/search.html',
  '/sitemap.html',
  '/link-to-slay-pdf.html',
  '/privacy.html',
  '/pdf-privacy-security.html',
  '/pdf-privacy-checklist.html',
  '/online-pdf-editor.html',
  '/adobe-acrobat-alternative.html',
  '/edit-pdf-without-uploading.html',
  '/secure-pdf-editor.html',
  '/browser-pdf-editor.html',
]

const pageByPath = new Map(pagesJson.pages.map((page) => [page.path, page]))
const prominentPages = prominentPaths.map((path) => {
  const page = pageByPath.get(path)
  if (!page) throw new Error(`pages.json is missing prominent page for site identity schema: ${path}`)
  return page
})

const hasPart = prominentPages.map((page) => {
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
  itemListElement: prominentPages
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

const searchAction = {
  '@type': 'SearchAction',
  name: 'Search Slay PDF tools',
  target: {
    '@type': 'EntryPoint',
    urlTemplate: 'https://slaypdf.com/search.html?q={search_term_string}',
  },
  'query-input': 'required name=search_term_string',
}

const sourceCode = {
  '@type': 'SoftwareSourceCode',
  '@id': `${site}#source-code`,
  name: 'Slay PDF source code',
  url: sourceCodeUrl,
  codeRepository: sourceCodeUrl,
  license: licenseUrl,
  programmingLanguage: ['TypeScript', 'JavaScript', 'HTML', 'CSS'],
  runtimePlatform: ['Web browser', 'WebAssembly'],
  isPartOf: {
    '@id': `${site}#app`,
  },
  publisher: {
    '@id': `${site}#organization`,
  },
  targetProduct: {
    '@id': `${site}#app`,
  },
}

function isSiteNavigationList(node) {
  return node['@type'] === 'ItemList' && (
    node['@id'] === siteNavigation['@id'] ||
    node.name === siteNavigation.name ||
    node.itemListElement?.some((item) => item.item?.['@type'] === 'SiteNavigationElement')
  )
}

function isSourceCodeNode(node) {
  return node['@type'] === 'SoftwareSourceCode' || node['@id'] === sourceCode['@id']
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
        .filter((node) => !isSiteNavigationList(node) && !isSourceCodeNode(node))
        .map((node) => (
          node['@type'] === 'WebSite'
            ? {
              ...node,
              hasPart,
              potentialAction: searchAction,
            }
            : node
        )),
      sourceCode,
      siteNavigation,
    ],
  }

  updated = updated.replace(fullMatch, scriptFor(nextData, attributes))
  synced = true
}

if (!synced) throw new Error('index.html is missing WebSite JSON-LD graph')

if (updated !== html) {
  await writeFile(url, updated)
  console.log(`Synced compact WebSite hasPart schema for ${hasPart.length} prominent pages (1 changed).`)
} else {
  console.log(`Synced compact WebSite hasPart schema for ${hasPart.length} prominent pages.`)
}

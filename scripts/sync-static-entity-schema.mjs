import { readdir, readFile, writeFile } from 'node:fs/promises'

const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)

function linkHref(html, selector) {
  return html.match(new RegExp(`<link ${selector} href="([^"]+)"\\s*/>`))?.[1]
}

function structuredDataScripts(html, file) {
  return [...html.matchAll(/^[ \t]*<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)^[ \t]*<\/script>/gm)]
    .map((match) => {
      try {
        return {
          fullMatch: match[0],
          data: JSON.parse(match[1]),
        }
      } catch (error) {
        throw new Error(`${file} has invalid JSON-LD: ${error.message}`)
      }
    })
}

function entityIdFor(url, type) {
  if (type === 'FAQPage') return `${url}#faq`
  if (type === 'ItemList') return `${url}#itemlist`
  return undefined
}

function withEntityMetadata(entity, url) {
  const id = entityIdFor(url, entity['@type'])
  if (!id) return entity
  return {
    ...entity,
    '@id': id,
    url,
    inLanguage: 'en',
  }
}

function syncEntityMetadata(data, url) {
  if (data['@type'] === 'FAQPage' || data['@type'] === 'ItemList') {
    return withEntityMetadata(data, url)
  }
  if (Array.isArray(data['@graph'])) {
    return {
      ...data,
      '@graph': data['@graph'].map((node) => (
        node['@type'] === 'FAQPage' || node['@type'] === 'ItemList'
          ? withEntityMetadata(node, url)
          : node
      )),
    }
  }
  return data
}

function scriptFor(data, managed) {
  const json = JSON.stringify(data, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json"${managed ? ` ${managed}` : ''}>\n${json}\n    </script>`
}

const files = [
  { file: 'index.html', url: new URL('index.html', rootDir) },
  ...(await readdir(publicDir))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => ({ file, url: new URL(file, publicDir) })),
]

let changed = 0
let synced = 0

for (const { file, url } of files) {
  const html = await readFile(url, 'utf8')
  const canonical = linkHref(html, 'rel="canonical"')
  if (!canonical) throw new Error(`${file} is missing a canonical URL`)

  let updated = html
  for (const { fullMatch, data } of structuredDataScripts(html, file)) {
    const nextData = syncEntityMetadata(data, canonical)
    if (JSON.stringify(nextData) === JSON.stringify(data)) continue
    const managed = fullMatch.match(/<script type="application\/ld\+json"([^>]*)>/)?.[1]?.trim()
    updated = updated.replace(fullMatch, scriptFor(nextData, managed))
    synced += 1
  }

  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced rich entity schema for ${synced} JSON-LD blocks${changed ? ` across ${changed} pages` : ''}.`)

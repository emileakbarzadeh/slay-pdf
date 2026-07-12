import { readdir, readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com/'
const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)
const sitemap = await readFile(new URL('sitemap.xml', publicDir), 'utf8')
const lastmodByUrl = new Map([...sitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>/g)].map((match) => [match[1], match[2]]))

function tagContent(html, selector) {
  return html.match(new RegExp(`<meta ${selector} content="([^"]+)"\\s*/>`))?.[1]
}

function linkHref(html, selector) {
  return html.match(new RegExp(`<link ${selector} href="([^"]+)"\\s*/>`))?.[1]
}

function titleFor(html) {
  return html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
}

function h1For(html) {
  return html.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim()
}

function stripManagedSchema(html) {
  return html.replace(
    /\n    <script type="application\/ld\+json" data-managed="webpage">[\s\S]*?<\/script>\n/,
    '\n',
  )
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

function hasBreadcrumbSchema(html, file) {
  return structuredDataScripts(html, file).some(({ data }) => data['@type'] === 'BreadcrumbList')
}

function webpageSchemaFor(html, file) {
  const url = linkHref(html, 'rel="canonical"')
  const title = titleFor(html)
  const description = tagContent(html, 'name="description"')
  const headline = h1For(html)
  const dateModified = url ? lastmodByUrl.get(url) : undefined

  if (!url) throw new Error(`${file} is missing a canonical URL`)
  if (!title) throw new Error(`${file} is missing a title`)
  if (!description) throw new Error(`${file} is missing a meta description`)
  if (!headline) throw new Error(`${file} is missing an h1`)
  if (!dateModified) throw new Error(`${file} canonical URL is missing from sitemap lastmod data`)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    headline,
    description,
    dateModified,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${site}#website`,
      name: 'Slay PDF',
      url: site,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${site}#organization`,
      name: 'Slay PDF',
      url: site,
      logo: `${site}favicon.svg`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${site}og-image.png`,
      width: 1200,
      height: 630,
    },
    inLanguage: 'en',
  }

  if (hasBreadcrumbSchema(html, file)) {
    schema.breadcrumb = {
      '@id': `${url}#breadcrumb`,
    }
  }

  return schema
}

function scriptFor(schema) {
  const json = JSON.stringify(schema, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json" data-managed="webpage">\n${json}\n    </script>`
}

function syncBreadcrumbIds(html, file) {
  const canonical = linkHref(html, 'rel="canonical"')
  if (!canonical) throw new Error(`${file} is missing a canonical URL`)
  let updated = html
  for (const { fullMatch, data } of structuredDataScripts(html, file)) {
    if (data['@type'] !== 'BreadcrumbList') continue
    const nextData = {
      '@context': data['@context'] ?? 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: data.itemListElement,
    }
    const json = JSON.stringify(nextData, null, 6)
      .split('\n')
      .map((line) => `      ${line}`)
      .join('\n')
    updated = updated.replace(fullMatch, `    <script type="application/ld+json">\n${json}\n    </script>`)
  }
  return updated
}

const files = [
  { file: 'index.html', url: new URL('index.html', rootDir) },
  ...(await readdir(publicDir))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => ({ file, url: new URL(file, publicDir) })),
]
let changed = 0

for (const { file, url } of files) {
  const html = await readFile(url, 'utf8')
  const withoutManagedSchema = stripManagedSchema(syncBreadcrumbIds(html, file))
  const updated = withoutManagedSchema.replace(
    /(\s*<script type="application\/ld\+json">)/,
    `\n${scriptFor(webpageSchemaFor(html, file))}$1`,
  )
  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced WebPage schema for ${files.length} static pages${changed ? ` (${changed} changed)` : ''}.`)

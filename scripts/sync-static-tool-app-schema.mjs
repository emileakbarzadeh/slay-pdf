import { readdir, readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com/'
const publicDir = new URL('../public/', import.meta.url)

function titleFor(html) {
  return html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
}

function h1For(html) {
  return html.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim()
}

function tagContent(html, selector) {
  return html.match(new RegExp(`<meta ${selector} content="([^"]+)"\\s*/>`))?.[1]
}

function linkHref(html, selector) {
  return html.match(new RegExp(`<link ${selector} href="([^"]+)"\\s*/>`))?.[1]
}

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

function stripManagedToolAppSchema(html) {
  return html.replace(
    /\n    <script type="application\/ld\+json" data-managed="tool-app">[\s\S]*?<\/script>\n/g,
    '\n',
  )
}

function visibleFeatureCards(html, file) {
  const section = html.match(/<section class="grid" aria-label="([^"]+)">([\s\S]*?)<\/section>/i)
  if (!section) return undefined

  const label = section[1].toLowerCase()
  if (label === 'privacy summary') return undefined

  const features = [...section[2].matchAll(/<article class="card"><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/article>/g)]
    .map((match) => ({
      name: textFromInlineHtml(match[1]),
      text: textFromInlineHtml(match[2]),
    }))

  if (features.length < 2) throw new Error(`${file} tool feature grid must contain at least two cards`)
  return features
}

function toolAppFor(html, file) {
  const features = visibleFeatureCards(html, file)
  if (!features) return undefined

  const canonical = linkHref(html, 'rel="canonical"')
  const title = titleFor(html)
  const headline = h1For(html)
  const description = tagContent(html, 'name="description"')

  if (!canonical) throw new Error(`${file} is missing a canonical URL`)
  if (!title) throw new Error(`${file} is missing a title`)
  if (!headline) throw new Error(`${file} is missing an h1`)
  if (!description) throw new Error(`${file} is missing a meta description`)

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${canonical}#tool`,
    name: title.replace(/ - Slay PDF$/, ''),
    alternateName: headline,
    description,
    url: canonical,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'PDF editor',
    operatingSystem: 'Web',
    browserRequirements: 'Requires a modern browser with WebAssembly and IndexedDB support.',
    isAccessibleForFree: true,
    inLanguage: 'en',
    isPartOf: {
      '@id': `${site}#app`,
    },
    publisher: {
      '@id': `${site}#organization`,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: features.map((feature) => `${feature.name}: ${feature.text}`),
  }
}

function scriptFor(schema) {
  const json = JSON.stringify(schema, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json" data-managed="tool-app">\n${json}\n    </script>`
}

function insertToolAppSchema(html, schema) {
  const script = scriptFor(schema)
  if (html.includes('type="application/ld+json" data-managed="howto"')) {
    return html.replace(
      /(    <script type="application\/ld\+json" data-managed="howto">[\s\S]*?    <\/script>)/,
      `$1\n${script}`,
    )
  }

  if (html.includes('type="application/ld+json" data-managed="breadcrumb"')) {
    return html.replace(
      /(    <script type="application\/ld\+json" data-managed="breadcrumb">[\s\S]*?    <\/script>)/,
      `$1\n${script}`,
    )
  }

  if (html.includes('type="application/ld+json" data-managed="webpage"')) {
    return html.replace(
      /(    <script type="application\/ld\+json" data-managed="webpage">[\s\S]*?    <\/script>)/,
      `$1\n${script}`,
    )
  }

  if (html.includes('<script type="application/ld+json"')) {
    return html.replace(
      /(\s*<script type="application\/ld\+json"(?: [^>]*)?>)/,
      `\n${script}$1`,
    )
  }

  return html.replace(/(\s*<title>)/, `\n${script}$1`)
}

const files = (await readdir(publicDir))
  .filter((file) => file.endsWith('.html'))
  .sort()

let changed = 0
let synced = 0

for (const file of files) {
  const url = new URL(file, publicDir)
  const html = await readFile(url, 'utf8')
  const toolApp = toolAppFor(html, file)
  const withoutToolApp = stripManagedToolAppSchema(html)
  const updated = toolApp ? insertToolAppSchema(withoutToolApp, toolApp) : withoutToolApp

  if (toolApp) synced += 1
  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced tool WebApplication schema for ${synced} static tool pages${changed ? ` (${changed} changed)` : ''}.`)

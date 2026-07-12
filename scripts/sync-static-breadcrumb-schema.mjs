import { readdir, readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com/'
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

function stripBreadcrumbSchema(html, file) {
  let updated = html
  for (const { fullMatch, data } of structuredDataScripts(html, file)) {
    if (data['@type'] === 'BreadcrumbList') updated = updated.replace(`${fullMatch}\n`, '')
  }
  return updated
}

function visibleBreadcrumbsFor(html, file) {
  const canonical = linkHref(html, 'rel="canonical"')
  const nav = html.match(/<nav class="crumbs" aria-label="Breadcrumb">([\s\S]*?)<\/nav>/)
  if (!canonical) throw new Error(`${file} is missing a canonical URL`)
  if (!nav) throw new Error(`${file} is missing visible breadcrumb navigation`)

  const items = [...nav[1].matchAll(/<(a|span)(?: href="([^"]+)")?[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((match, index) => {
      const [, tag, href, label] = match
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: textFromInlineHtml(label),
        item: tag === 'a' && href ? new URL(href, site).href : canonical,
      }
    })

  if (items.length < 2) throw new Error(`${file} breadcrumb navigation must contain at least two items`)
  if (items.some((item) => !item.name)) throw new Error(`${file} breadcrumb navigation contains an empty label`)
  if (items.at(-1).item !== canonical) throw new Error(`${file} breadcrumb navigation must end at its canonical URL`)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: items,
  }
}

function scriptFor(schema) {
  const json = JSON.stringify(schema, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json" data-managed="breadcrumb">\n${json}\n    </script>`
}

function insertBreadcrumbSchema(html, schema) {
  const script = scriptFor(schema)
  if (html.includes('type="application/ld+json" data-managed="webpage"')) {
    return html.replace(
      /(    <script type="application\/ld\+json" data-managed="webpage">[\s\S]*?    <\/script>)/,
      `$1\n${script}`,
    )
  }

  const withBreadcrumb = html.replace(
    /(\s*<script type="application\/ld\+json"(?: [^>]*)?>)/,
    `\n${script}$1`,
  )
  return withBreadcrumb === html
    ? html.replace(/(\s*<title>)/, `\n${script}$1`)
    : withBreadcrumb
}

const files = (await readdir(publicDir))
  .filter((file) => file.endsWith('.html'))
  .sort()

let changed = 0

for (const file of files) {
  const url = new URL(file, publicDir)
  const html = await readFile(url, 'utf8')
  const withoutBreadcrumb = stripBreadcrumbSchema(html, file)
  const updated = insertBreadcrumbSchema(withoutBreadcrumb, visibleBreadcrumbsFor(html, file))

  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced BreadcrumbList schema for ${files.length} static pages${changed ? ` (${changed} changed)` : ''}.`)

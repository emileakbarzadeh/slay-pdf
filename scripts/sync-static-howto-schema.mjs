import { readdir, readFile, writeFile } from 'node:fs/promises'

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

function stripAllHowToSchema(html, file) {
  let updated = html
  for (const { fullMatch, data } of structuredDataScripts(html, file)) {
    if (data['@type'] === 'HowTo') updated = updated.replace(`${fullMatch}\n`, '')
  }
  return updated
}

function stripManagedHowToSchema(html) {
  return html.replace(
    /\n    <script type="application\/ld\+json" data-managed="howto">[\s\S]*?<\/script>\n/g,
    '\n',
  )
}

function workflowFor(html, file) {
  const canonical = linkHref(html, 'rel="canonical"')
  const title = titleFor(html)
  const headline = h1For(html)
  const description = tagContent(html, 'name="description"')
  const section = html.match(/<section class="grid" aria-label="([^"]+)">([\s\S]*?)<\/section>/i)

  if (!section) return undefined
  const label = section[1].toLowerCase()
  if (!label.includes('workflow') && label !== 'pdf page organization tools') return undefined
  if (!canonical) throw new Error(`${file} is missing a canonical URL`)
  if (!title) throw new Error(`${file} is missing a title`)
  if (!headline) throw new Error(`${file} is missing an h1`)
  if (!description) throw new Error(`${file} is missing a meta description`)

  const steps = [...section[2].matchAll(/<article class="card"><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/article>/g)]
    .map((match, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: textFromInlineHtml(match[1]),
      text: textFromInlineHtml(match[2]),
    }))

  if (steps.length < 2) throw new Error(`${file} workflow grid must contain at least two step cards`)

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${canonical}#howto`,
    name: `${title.replace(/ - Slay PDF$/, '')} workflow`,
    description,
    url: canonical,
    inLanguage: 'en',
    tool: [
      {
        '@type': 'HowToTool',
        name: 'Slay PDF',
      },
    ],
    step: steps,
  }
}

function scriptFor(schema) {
  const json = JSON.stringify(schema, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json" data-managed="howto">\n${json}\n    </script>`
}

function insertHowToSchema(html, schema) {
  const script = scriptFor(schema)
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
  const howTo = workflowFor(html, file)
  const withoutHowTo = howTo ? stripAllHowToSchema(html, file) : stripManagedHowToSchema(html)
  const updated = howTo ? insertHowToSchema(withoutHowTo, howTo) : withoutHowTo

  if (howTo) synced += 1
  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced HowTo schema for ${synced} workflow pages${changed ? ` (${changed} changed)` : ''}.`)

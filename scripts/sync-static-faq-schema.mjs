import { readdir, readFile, writeFile } from 'node:fs/promises'

const publicDir = new URL('../public/', import.meta.url)

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

function stripAllTopLevelFaqSchema(html, file) {
  let updated = html
  for (const { fullMatch, data } of structuredDataScripts(html, file)) {
    if (data['@type'] === 'FAQPage') updated = updated.replace(`${fullMatch}\n`, '')
  }
  return updated
}

function visibleFaqItems(html) {
  const section = html.match(/<section class="faq" aria-label="Frequently asked questions">([\s\S]*?)<\/section>/i)
  if (!section) return []

  return [...section[1].matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)]
    .map((match) => ({
      question: textFromInlineHtml(match[1]),
      answer: textFromInlineHtml(match[2]),
    }))
    .filter((item) => item.question && item.answer)
}

function faqFor(html, file) {
  const canonical = linkHref(html, 'rel="canonical"')
  const items = visibleFaqItems(html)
  if (items.length === 0) return undefined
  if (items.length < 2) throw new Error(`${file} visible FAQ must contain at least two questions`)
  if (!canonical) throw new Error(`${file} is missing a canonical URL`)

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    url: canonical,
    inLanguage: 'en',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

function scriptFor(schema) {
  const json = JSON.stringify(schema, null, 6)
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')
  return `    <script type="application/ld+json" data-managed="faq">\n${json}\n    </script>`
}

function insertFaqSchema(html, schema) {
  const script = scriptFor(schema)
  const anchors = [
    'tool-app',
    'howto',
    'breadcrumb',
    'webpage',
  ]

  for (const anchor of anchors) {
    const pattern = new RegExp(`(    <script type="application\\/ld\\+json" data-managed="${anchor}">[\\s\\S]*?    <\\/script>)`)
    if (pattern.test(html)) return html.replace(pattern, `$1\n${script}`)
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
  const faq = faqFor(html, file)
  const withoutFaq = stripAllTopLevelFaqSchema(html, file)
  const updated = faq ? insertFaqSchema(withoutFaq, faq) : withoutFaq

  if (faq) synced += 1
  if (updated !== html) {
    await writeFile(url, updated)
    changed += 1
  }
}

console.log(`Synced FAQPage schema for ${synced} static pages${changed ? ` (${changed} changed)` : ''}.`)

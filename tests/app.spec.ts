import { expect, test } from '@playwright/test'
import type { Download, Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { PDFDocument, rgb } from 'pdf-lib'

async function samplePdf(pageCount = 2) {
  const document = await PDFDocument.create()
  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage([420, 594])
    if (index === 0) {
      page.drawRectangle({ x: 0, y: 297, width: 210, height: 297, color: rgb(0.95, 0.2, 0.32) })
      page.drawRectangle({ x: 210, y: 297, width: 210, height: 297, color: rgb(0.15, 0.42, 0.72) })
      page.drawRectangle({ x: 0, y: 0, width: 210, height: 297, color: rgb(0.16, 0.62, 0.38) })
      page.drawRectangle({ x: 210, y: 0, width: 210, height: 297, color: rgb(0.97, 0.78, 0.2) })
    }
    page.drawText('Slay PDF test document', { x: 48, y: 520, size: 20, color: rgb(0, 0, 0) })
    page.drawText(`Page ${index + 1}`, { x: 48, y: 486, size: 14, color: rgb(0.1, 0.1, 0.1) })
  }
  const bytes = await document.save()
  return Buffer.from(bytes)
}

async function landscapePdf() {
  const document = await PDFDocument.create()
  const page = document.addPage([640, 360])
  page.drawText('Landscape page', { x: 48, y: 288, size: 28, color: rgb(0, 0, 0) })
  return Buffer.from(await document.save())
}

async function expandDrawerIfVisible(page: Page) {
  const handle = page.getByRole('button', { name: /Expand export drawer|Collapse export drawer/ })
  const visible = await handle.isVisible().catch(() => false)
  if (!visible) return false
  const expanded = await handle.getAttribute('aria-expanded')
  if (expanded !== 'true') await handle.click()
  await expect(handle).toHaveAttribute('aria-expanded', 'true')
  return true
}

async function hideInspector(page: Page) {
  await page.getByTitle('Hide inspector').click()
}

async function waitForSavedPageCount(page: Page, count: number) {
  await expect.poll(async () => page.evaluate(async () => new Promise<number>((resolve) => {
    const open = indexedDB.open('slay-pdf')
    open.onerror = () => resolve(0)
    open.onsuccess = () => {
      const database = open.result
      if (!database.objectStoreNames.contains('workspaces')) {
        database.close()
        resolve(0)
        return
      }
      const transaction = database.transaction('workspaces', 'readonly')
      const request = transaction.objectStore('workspaces').get('active')
      request.onerror = () => resolve(0)
      request.onsuccess = () => {
        const workspace = request.result as { pages?: unknown[] } | undefined
        database.close()
        resolve(workspace?.pages?.length ?? 0)
      }
    }
  }))).toBe(count)
}

function decodeHtml(value: string) {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}

function textFromInlineHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
}

function workflowStepsFor(html: string) {
  const section = html.match(/<section class="grid" aria-label="([^"]+)">([\s\S]*?)<\/section>/i)
  if (!section) return undefined
  const label = section[1].toLowerCase()
  if (!label.includes('workflow') && label !== 'pdf page organization tools') return undefined

  return [...section[2].matchAll(/<article class="card"><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/article>/g)]
    .map((match, index) => ({
      position: index + 1,
      name: textFromInlineHtml(match[1]),
      text: textFromInlineHtml(match[2]),
    }))
}

function visibleToolFeatures(html: string) {
  const section = html.match(/<section class="grid" aria-label="([^"]+)">([\s\S]*?)<\/section>/i)
  if (!section) return undefined
  if (section[1].toLowerCase() === 'privacy summary') return undefined

  return [...section[2].matchAll(/<article class="card"><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/article>/g)]
    .map((match) => ({
      name: textFromInlineHtml(match[1]),
      text: textFromInlineHtml(match[2]),
    }))
}

function visibleRelatedLinks(html: string, url: string) {
  const links = new Set<string>()
  const relatedSections = [
    ...html.matchAll(/<(?:div|section) class="(?:links|tool-list)"[^>]*>([\s\S]*?)<\/(?:div|section)>/g),
  ]

  for (const section of relatedSections) {
    for (const link of section[1].matchAll(/<a href="([^"]+)"/g)) {
      const relatedUrl = new URL(link[1], 'https://slaypdf.com/').href
      if (relatedUrl !== url) links.add(relatedUrl)
    }
  }

  return [...links]
}

function visibleBreadcrumbItems(html: string, url: string) {
  const nav = html.match(/<nav class="crumbs" aria-label="Breadcrumb">([\s\S]*?)<\/nav>/)
  expect(nav).toBeTruthy()

  return [...(nav?.[1] ?? '').matchAll(/<(a|span)(?: href="([^"]+)")?[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((match, index) => {
      const [, tag, href, label] = match
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: textFromInlineHtml(label),
        item: tag === 'a' && href ? new URL(href, 'https://slaypdf.com/').href : url,
      }
    })
}

function structuredDataEntity(blocks: Record<string, any>[], type: string) {
  for (const block of blocks) {
    if (block['@type'] === type) return block
    const graphEntity = Array.isArray(block['@graph'])
      ? block['@graph'].find((node: Record<string, any>) => node['@type'] === type)
      : undefined
    if (graphEntity) return graphEntity
  }
  return undefined
}

function mainEntityIds(value: unknown) {
  if (!value) return []
  return (Array.isArray(value) ? value : [value])
    .map((entity) => (entity as { '@id'?: string })?.['@id'])
    .filter(Boolean)
}

function isoDate(lastmod: string | undefined) {
  expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  return new Date(`${lastmod}T00:00:00.000Z`).toISOString()
}

function appUseAction(name: string) {
  return {
    '@type': 'UseAction',
    name,
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://slaypdf.com/',
      actionPlatform: [
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform',
      ],
    },
  }
}

test('exposes crawlable SEO metadata and sitemap files', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Slay PDF - Free Local PDF Editor & Adobe Acrobat Alternative')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /free local PDF editor/i)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Adobe Acrobat alternative/i)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f7f7f4')
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'Slay PDF')
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Slay PDF')
  await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://slaypdf.com/')
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://slaypdf.com/')
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://slaypdf.com/')
  const discoveryLinks = [
    ['application/rss+xml', 'Slay PDF discovery feed', 'https://slaypdf.com/feed.xml'],
    ['application/feed+json', 'Slay PDF JSON discovery feed', 'https://slaypdf.com/feed.json'],
    ['application/json', 'Slay PDF structured page index', 'https://slaypdf.com/pages.json'],
    ['text/plain', 'Slay PDF compact LLM index', 'https://slaypdf.com/llms.txt'],
    ['text/plain', 'Slay PDF full text LLM index', 'https://slaypdf.com/llms-full.txt'],
  ] as const
  for (const [type, title, href] of discoveryLinks) {
    await expect(page.locator(`link[rel="alternate"][type="${type}"][title="${title}"]`)).toHaveAttribute('href', href)
  }
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Slay PDF - Free Local PDF Editor')
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://slaypdf.com/og-image.png')
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content', 'Slay PDF local PDF editor preview')

  const structuredGraphs = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? '{}')))
  expect(structuredGraphs.filter((block) => block['@type'] === 'WebPage')).toHaveLength(1)
  const rootWebPage = structuredGraphs.find((block) => block['@type'] === 'WebPage') as {
    '@id'?: string
    url?: string
    name?: string
    dateModified?: string
    isPartOf?: { '@id'?: string }
    mainEntity?: { '@id'?: string } | { '@id'?: string }[]
  } | undefined
  expect(rootWebPage?.['@id']).toBe('https://slaypdf.com/#webpage')
  expect(rootWebPage?.url).toBe('https://slaypdf.com/')
  expect(rootWebPage?.name).toBe('Slay PDF - Free Local PDF Editor & Adobe Acrobat Alternative')
  expect(rootWebPage?.isPartOf?.['@id']).toBe('https://slaypdf.com/#website')
  expect(mainEntityIds(rootWebPage?.mainEntity)).toEqual(['https://slaypdf.com/#app', 'https://slaypdf.com/#faq'])
  const siteGraph = structuredGraphs.find((block) => Array.isArray(block['@graph']))?.['@graph'] ?? []
  const organization = siteGraph.find((node: { '@type'?: string }) => node['@type'] === 'Organization') as {
    '@id'?: string
    name?: string
    url?: string
    logo?: string
    sameAs?: string[]
  } | undefined
  const webSite = siteGraph.find((node: { '@type'?: string }) => node['@type'] === 'WebSite') as {
    '@id'?: string
    name?: string
    url?: string
    publisher?: { '@id'?: string }
    inLanguage?: string
    hasPart?: { '@type'?: string; '@id'?: string; url?: string; name?: string }[]
  } | undefined
  const siteNavigation = siteGraph.find((node: { '@type'?: string; '@id'?: string }) => node['@type'] === 'ItemList' && node['@id'] === 'https://slaypdf.com/#site-navigation') as {
    name?: string
    itemListElement?: {
      '@type'?: string
      position?: number
      item?: { '@type'?: string; '@id'?: string; name?: string; url?: string }
    }[]
  } | undefined
  expect(organization?.['@id']).toBe('https://slaypdf.com/#organization')
  expect(organization?.name).toBe('Slay PDF')
  expect(organization?.url).toBe('https://slaypdf.com/')
  expect(organization?.logo).toBe('https://slaypdf.com/favicon.svg')
  expect(organization?.sameAs).toContain('https://github.com/emileakbarzadeh/slay-pdf')
  expect(webSite?.['@id']).toBe('https://slaypdf.com/#website')
  expect(webSite?.name).toBe('Slay PDF')
  expect(webSite?.url).toBe('https://slaypdf.com/')
  expect(webSite?.publisher?.['@id']).toBe('https://slaypdf.com/#organization')
  expect(webSite?.inLanguage).toBe('en')
  expect(siteNavigation?.name).toBe('Slay PDF site navigation')
  const rootFaq = siteGraph.find((node: { '@type'?: string }) => node['@type'] === 'FAQPage') as {
    '@id'?: string
    url?: string
    inLanguage?: string
    mainEntity?: unknown[]
  } | undefined
  expect(rootFaq?.['@id']).toBe('https://slaypdf.com/#faq')
  expect(rootFaq?.url).toBe('https://slaypdf.com/')
  expect(rootFaq?.inLanguage).toBe('en')
  expect(rootFaq?.mainEntity?.length).toBeGreaterThan(0)
  const app = structuredGraphs.find((block) => block['@type'] === 'WebApplication') as {
    '@id'?: string
    '@type'?: string
    name?: string
    offers?: { price?: string }
    featureList?: string[]
    isPartOf?: { '@id'?: string }
    publisher?: { '@id'?: string }
    image?: string
    screenshot?: { url?: string; width?: number; height?: number }
    softwareHelp?: string
    codeRepository?: string
    license?: string
    privacyPolicy?: string
    keywords?: string[]
    potentialAction?: unknown
  } | undefined
  expect(app?.['@id']).toBe('https://slaypdf.com/#app')
  expect(app?.['@type']).toBe('WebApplication')
  expect(app?.name).toBe('Slay PDF')
  expect(app?.isPartOf?.['@id']).toBe('https://slaypdf.com/#website')
  expect(app?.publisher?.['@id']).toBe('https://slaypdf.com/#organization')
  expect(app?.offers?.price).toBe('0')
  expect(app?.image).toBe('https://slaypdf.com/og-image.png')
  expect(app?.screenshot).toMatchObject({ url: 'https://slaypdf.com/og-image.png', width: 1200, height: 630 })
  expect(app?.softwareHelp).toBe('https://github.com/emileakbarzadeh/slay-pdf#readme')
  expect(app?.codeRepository).toBe('https://github.com/emileakbarzadeh/slay-pdf')
  expect(app?.license).toBe('https://www.gnu.org/licenses/agpl-3.0.en.html')
  expect(app?.privacyPolicy).toBe('https://slaypdf.com/privacy.html')
  expect(app?.keywords).toEqual(['local PDF editor', 'free PDF editor', 'Adobe Acrobat alternative', 'browser PDF editor', 'private PDF editor'])
  expect(app?.potentialAction).toEqual(appUseAction('Open Slay PDF'))
  expect(app?.featureList).toContain('Merge PDF files')
  expect(JSON.stringify(structuredGraphs)).toContain('FAQPage')
  expect(JSON.stringify(structuredGraphs)).toContain('Adobe Acrobat alternative')

  const robots = await (await page.request.get('/robots.txt')).text()
  expect(robots).toContain('Allow: /')
  expect(robots).toContain('Sitemap: https://slaypdf.com/sitemap-index.xml')
  expect(robots).toContain('Sitemap: https://slaypdf.com/sitemap.xml')
  expect(robots).toContain('Sitemap: https://slaypdf.com/image-sitemap.xml')
  expect(robots).toContain('https://slaypdf.com/feed.xml')
  expect(robots).toContain('https://slaypdf.com/feed.json')

  const sitemap = await (await page.request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('<loc>https://slaypdf.com/</loc>')
  expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
  const sitemapEntries = [...sitemap.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<lastmod>(.*?)<\/lastmod>[\s\S]*?<changefreq>(.*?)<\/changefreq>[\s\S]*?<priority>(.*?)<\/priority>[\s\S]*?<\/url>/g)]
    .map((match) => ({ url: match[1], lastmod: match[2], changefreq: match[3], priority: Number(match[4]) }))
  const sitemapByUrl = new Map(sitemapEntries.map((entry) => [entry.url, entry]))
  expect(sitemapByUrl.get('https://slaypdf.com/')?.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(rootWebPage?.dateModified).toBe(sitemapByUrl.get('https://slaypdf.com/')?.lastmod)
  await expect(page.locator('meta[property="og:updated_time"]')).toHaveAttribute('content', isoDate(sitemapByUrl.get('https://slaypdf.com/')?.lastmod))
  expect(sitemapEntries.every((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod))).toBe(true)
  expect(sitemapEntries.every((entry) => ['daily', 'weekly', 'monthly', 'yearly'].includes(entry.changefreq))).toBe(true)
  expect(sitemapEntries.every((entry) => entry.priority >= 0 && entry.priority <= 1)).toBe(true)
  for (const entry of sitemapEntries) {
    const block = sitemap.match(new RegExp(`<url>[\\s\\S]*?<loc>${entry.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>[\\s\\S]*?<\\/url>`))?.[0] ?? ''
    expect(block).toContain(`<xhtml:link rel="alternate" hreflang="en" href="${entry.url}" />`)
    expect(block).toContain(`<xhtml:link rel="alternate" hreflang="x-default" href="${entry.url}" />`)
  }
  expect(webSite?.hasPart).toHaveLength(sitemapEntries.length)
  expect(webSite?.hasPart?.[0]).toMatchObject({
    '@type': 'WebPage',
    '@id': 'https://slaypdf.com/#webpage',
    url: 'https://slaypdf.com/',
    name: 'Slay PDF - Free Local PDF Editor & Adobe Acrobat Alternative',
  })
  const htmlPaths = [...sitemap.matchAll(/<loc>https:\/\/slaypdf\.com\/([^<]+\.html)<\/loc>/g)].map((match) => match[1])
  expect(htmlPaths).toEqual(expect.arrayContaining([
    'free-pdf-editor.html',
    'tools.html',
    'faq.html',
    'privacy.html',
    'sitemap.html',
    'online-pdf-editor.html',
    'edit-pdf-without-uploading.html',
    'organize-pdf-pages.html',
    'adobe-acrobat-vs-slay-pdf.html',
    'combine-pdf-files.html',
    'remove-pages-from-pdf.html',
    'extract-pages-from-pdf.html',
    'make-pdf-searchable.html',
    'add-signature-to-pdf.html',
    'pdf-redaction-tool.html',
    'images-to-pdf.html',
    'jpg-to-pdf.html',
    'png-to-pdf.html',
    'edit-scanned-pdf.html',
    'flatten-pdf.html',
    'printable-poster-pdf.html',
    'adobe-acrobat-alternative.html',
    'merge-pdf.html',
    'split-pdf.html',
    'sign-pdf.html',
    'posterise-pdf.html',
    'private-pdf-editor.html',
    'delete-pdf-pages.html',
    'resize-pdf.html',
    'crop-pdf.html',
    'redact-pdf.html',
    'compress-pdf.html',
    'ocr-pdf.html',
    'pdf-to-images.html',
    'extract-pdf-text.html',
    'rotate-pdf.html',
    'annotate-pdf.html',
    'watermark-pdf.html',
    'add-page-numbers-to-pdf.html',
    'fill-pdf-forms.html',
    'password-protect-pdf.html',
    'free-adobe-pdf-editor-alternative.html',
    'acrobat-online-alternative.html',
    'adobe-pdf-merge-alternative.html',
    'adobe-compress-pdf-alternative.html',
    'adobe-fill-and-sign-alternative.html',
    'adobe-pdf-organizer-alternative.html',
    'free-pdf-editor-no-signup.html',
    'pdf-editor-no-watermark.html',
    'secure-pdf-editor.html',
    'browser-pdf-editor.html',
    'pdf-editor-for-mac.html',
    'pdf-editor-for-windows.html',
    'pdf-editor-for-chromebook.html'
  ]))
  expect(new Set(htmlPaths).size).toBe(htmlPaths.length)
  const navigationEntries = htmlPaths.map((path, index) => {
    const url = `https://slaypdf.com/${path}`
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SiteNavigationElement',
        '@id': `${url}#site-navigation`,
        name: webSite?.hasPart?.find((part) => part.url === url)?.name?.replace(/ - Slay PDF$/, ''),
        url,
      },
    }
  })
  expect(siteNavigation?.itemListElement).toEqual(navigationEntries)
  const homepageHtml = await (await page.request.get('/')).text()
  const noscriptNav = homepageHtml.match(/<nav aria-label="PDF tools">([\s\S]*?)<\/nav>/)?.[1] ?? ''
  const noscriptPaths = [...noscriptNav.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1])
  expect(noscriptPaths).toEqual(htmlPaths.map((path) => `/${path}`))
  const imageSitemap = await (await page.request.get('/image-sitemap.xml')).text()
  expect(imageSitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
  expect(imageSitemap).toContain('<image:loc>https://slaypdf.com/og-image.png</image:loc>')
  expect(imageSitemap).toContain('<image:title>Slay PDF - Free Local PDF Editor &amp; Adobe Acrobat Alternative</image:title>')
  expect(imageSitemap).toContain('<image:caption>Slay PDF is a free local PDF editor and Adobe Acrobat alternative for splitting, merging, signing, posterising, resizing and editing PDFs entirely in your browser.</image:caption>')
  expect([...imageSitemap.matchAll(/<image:image>/g)]).toHaveLength(sitemapEntries.length)
  for (const entry of sitemapEntries) {
    expect(imageSitemap).toContain(`<loc>${entry.url}</loc>`)
  }
  const latestLastmod = sitemapEntries.map((entry) => entry.lastmod).sort().at(-1)
  const sitemapIndex = await (await page.request.get('/sitemap-index.xml')).text()
  expect(sitemapIndex).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  expect(sitemapIndex).toContain('<loc>https://slaypdf.com/sitemap.xml</loc>')
  expect(sitemapIndex).toContain('<loc>https://slaypdf.com/image-sitemap.xml</loc>')
  expect([...sitemapIndex.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((match) => match[1])).toEqual([latestLastmod, latestLastmod])
  let workflowPageCount = 0
  let toolAppPageCount = 0
  const expectedWebPageAbout = new Map([
    ['adobe-acrobat-vs-slay-pdf.html', ['PDF editor', 'Adobe Acrobat alternative', 'Local PDF editing']],
    ['free-adobe-pdf-editor-alternative.html', ['PDF editor', 'Adobe Acrobat alternative', 'Local PDF editing']],
  ])
  for (const path of htmlPaths) {
    expect(sitemap).toContain(`<loc>https://slaypdf.com/${path}</loc>`)
    const response = await page.request.get(`/${path}`)
    expect(response.ok()).toBe(true)
    const html = await response.text()
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
    expect(webSite?.hasPart).toContainEqual({
      '@type': 'WebPage',
      '@id': `https://slaypdf.com/${path}#webpage`,
      url: `https://slaypdf.com/${path}`,
      name: title,
    })
    expect(html).toContain(`href="https://slaypdf.com/${path}"`)
    expect(html).toContain(`rel="alternate" hreflang="en" href="https://slaypdf.com/${path}"`)
    expect(html).toContain(`rel="alternate" hreflang="x-default" href="https://slaypdf.com/${path}"`)
    for (const [type, title, href] of discoveryLinks) {
      expect(html).toContain(`rel="alternate" type="${type}" title="${title}" href="${href}"`)
    }
    expect(html).toContain('<meta name="theme-color" content="#f7f7f4" />')
    expect(html).toContain('<meta name="application-name" content="Slay PDF" />')
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="Slay PDF" />')
    expect(html).toContain('<meta name="mobile-web-app-capable" content="yes" />')
    expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />')
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(html).toContain(`property="og:url" content="https://slaypdf.com/${path}"`)
    expect(html).toContain(`property="og:updated_time" content="${isoDate(sitemapByUrl.get(`https://slaypdf.com/${path}`)?.lastmod)}"`)
    expect(html).toContain('meta property="og:type" content="website"')
    expect(html).toContain('meta property="og:locale" content="en_US"')
    expect(html).toContain('meta property="og:site_name" content="Slay PDF"')
    expect(html).toContain('meta property="og:title"')
    expect(html).toContain('meta property="og:description"')
    expect(html).toContain('meta property="og:image" content="https://slaypdf.com/og-image.png"')
    expect(html).toContain('meta property="og:image:type" content="image/png"')
    expect(html).toContain('meta property="og:image:width" content="1200"')
    expect(html).toContain('meta property="og:image:height" content="630"')
    expect(html).toContain('meta property="og:image:alt" content="Slay PDF local PDF editor preview"')
    expect(html).toContain('meta name="twitter:card" content="summary_large_image"')
    expect(html).toContain('meta name="twitter:title"')
    expect(html).toContain('meta name="twitter:description"')
    expect(html).toContain('meta name="twitter:image" content="https://slaypdf.com/og-image.png"')
    expect(html).toContain('meta name="twitter:image:alt" content="Slay PDF local PDF editor preview"')
    expect(html).toContain('type="application/ld+json" data-managed="webpage"')
    const structuredData = [...html.matchAll(/<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]))
    expect(structuredData.filter((block) => block['@type'] === 'WebPage')).toHaveLength(1)
    const webpage = structuredData.find((block) => block['@type'] === 'WebPage')
    expect(webpage).toMatchObject({
      '@context': 'https://schema.org',
      '@id': `https://slaypdf.com/${path}#webpage`,
      url: `https://slaypdf.com/${path}`,
      dateModified: sitemapByUrl.get(`https://slaypdf.com/${path}`)?.lastmod,
      isPartOf: {
        '@id': 'https://slaypdf.com/#website',
      },
      publisher: {
        '@id': 'https://slaypdf.com/#organization',
      },
      primaryImageOfPage: {
        url: 'https://slaypdf.com/og-image.png',
        width: 1200,
        height: 630,
      },
      inLanguage: 'en',
      breadcrumb: {
        '@id': `https://slaypdf.com/${path}#breadcrumb`,
      },
    })
    if (expectedWebPageAbout.has(path)) {
      expect(webpage.about).toEqual(expectedWebPageAbout.get(path))
    } else {
      expect(webpage.about).toBeUndefined()
    }
    const faq = structuredDataEntity(structuredData, 'FAQPage') as {
      '@id'?: string
      url?: string
      inLanguage?: string
      mainEntity?: { '@type'?: string; name?: string; acceptedAnswer?: { '@type'?: string; text?: string } }[]
    } | undefined
    const itemListEntity = structuredDataEntity(structuredData, 'ItemList') as {
      '@id'?: string
      url?: string
      inLanguage?: string
      itemListElement?: unknown[]
    } | undefined
    const toolApp = structuredData.find((block) => block['@type'] === 'WebApplication' && block['@id'] === `https://slaypdf.com/${path}#tool`) as {
      '@context'?: string
      '@id'?: string
      name?: string
      alternateName?: string
      description?: string
      url?: string
      applicationCategory?: string
      applicationSubCategory?: string
      operatingSystem?: string
      browserRequirements?: string
      isAccessibleForFree?: boolean
      inLanguage?: string
      image?: string
      screenshot?: { url?: string; width?: number; height?: number }
      softwareHelp?: string
      codeRepository?: string
      license?: string
      privacyPolicy?: string
      keywords?: string[]
      isPartOf?: { '@id'?: string }
      publisher?: { '@id'?: string }
      offers?: { price?: string; priceCurrency?: string }
      potentialAction?: unknown
      featureList?: string[]
    } | undefined
    const expectedMainEntityIds = []
    if (toolApp) expectedMainEntityIds.push(`https://slaypdf.com/${path}#tool`)
    if (workflowStepsFor(html)) expectedMainEntityIds.push(`https://slaypdf.com/${path}#howto`)
    if (faq) expectedMainEntityIds.push(`https://slaypdf.com/${path}#faq`)
    if (itemListEntity) expectedMainEntityIds.push(`https://slaypdf.com/${path}#itemlist`)
    expect(mainEntityIds(webpage.mainEntity)).toEqual(expectedMainEntityIds)
    expect(webpage.relatedLink ?? []).toEqual(visibleRelatedLinks(html, `https://slaypdf.com/${path}`))
    if (faq) {
      expect(faq['@id']).toBe(`https://slaypdf.com/${path}#faq`)
      expect(faq.url).toBe(`https://slaypdf.com/${path}`)
      expect(faq.inLanguage).toBe('en')
      expect(faq.mainEntity?.length).toBeGreaterThan(0)
      expect(faq.mainEntity?.every((question) => question['@type'] === 'Question' && question.name && question.acceptedAnswer?.['@type'] === 'Answer' && question.acceptedAnswer.text)).toBe(true)
    }
    if (itemListEntity) {
      expect(itemListEntity['@id']).toBe(`https://slaypdf.com/${path}#itemlist`)
      expect(itemListEntity.url).toBe(`https://slaypdf.com/${path}`)
      expect(itemListEntity.inLanguage).toBe('en')
      expect(itemListEntity.itemListElement?.length).toBeGreaterThan(0)
    }
    const toolFeatures = visibleToolFeatures(html)
    if (toolFeatures) {
      toolAppPageCount += 1
      expect(html).toContain('type="application/ld+json" data-managed="tool-app"')
      expect(toolApp).toMatchObject({
        '@context': 'https://schema.org',
        '@id': `https://slaypdf.com/${path}#tool`,
        name: title?.replace(/ - Slay PDF$/, ''),
        url: `https://slaypdf.com/${path}`,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'PDF editor',
        operatingSystem: 'Web',
        browserRequirements: 'Requires a modern browser with WebAssembly and IndexedDB support.',
        isAccessibleForFree: true,
        inLanguage: 'en',
        image: 'https://slaypdf.com/og-image.png',
        screenshot: { url: 'https://slaypdf.com/og-image.png', width: 1200, height: 630 },
        softwareHelp: 'https://github.com/emileakbarzadeh/slay-pdf#readme',
        codeRepository: 'https://github.com/emileakbarzadeh/slay-pdf',
        license: 'https://www.gnu.org/licenses/agpl-3.0.en.html',
        privacyPolicy: 'https://slaypdf.com/privacy.html',
        keywords: ['local PDF editor', 'free PDF editor', 'Adobe Acrobat alternative', 'browser PDF editor', 'private PDF editor'],
        isPartOf: { '@id': 'https://slaypdf.com/#app' },
        publisher: { '@id': 'https://slaypdf.com/#organization' },
        offers: { price: '0', priceCurrency: 'USD' },
        potentialAction: appUseAction(`Open ${title?.replace(/ - Slay PDF$/, '')} in Slay PDF`),
      })
      expect(toolApp?.featureList).toEqual(toolFeatures.map((feature) => `${feature.name}: ${feature.text}`))
    } else {
      expect(html).not.toContain('data-managed="tool-app"')
    }
    const breadcrumb = structuredData.find((block) => block['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toMatchObject({
      '@id': `https://slaypdf.com/${path}#breadcrumb`,
    })
    expect(html).toContain('type="application/ld+json" data-managed="breadcrumb"')
    expect(breadcrumb?.itemListElement).toEqual(visibleBreadcrumbItems(html, `https://slaypdf.com/${path}`))
    const workflowSteps = workflowStepsFor(html)
    const howTo = structuredData.find((block) => block['@type'] === 'HowTo') as {
      '@id'?: string
      url?: string
      inLanguage?: string
      tool?: { '@type'?: string; name?: string }[]
      step?: { '@type'?: string; position?: number; name?: string; text?: string }[]
    } | undefined
    if (workflowSteps) {
      workflowPageCount += 1
      expect(html).toContain('type="application/ld+json" data-managed="howto"')
      expect(howTo?.['@id']).toBe(`https://slaypdf.com/${path}#howto`)
      expect(howTo?.url).toBe(`https://slaypdf.com/${path}`)
      expect(howTo?.inLanguage).toBe('en')
      expect(howTo?.tool?.[0]).toMatchObject({ '@type': 'HowToTool', name: 'Slay PDF' })
      expect(howTo?.step).toHaveLength(workflowSteps.length)
      for (const [index, step] of workflowSteps.entries()) {
        expect(howTo?.step?.[index]).toMatchObject({
          '@type': 'HowToStep',
          position: step.position,
          name: step.name,
          text: step.text,
        })
      }
    } else {
      expect(html).not.toContain('data-managed="howto"')
    }
    expect(html).toContain('<h1>')
    expect(html).toContain('"@type": "BreadcrumbList"')
    expect(html).toContain('aria-label="Breadcrumb"')
    if (path !== 'tools.html') expect(html).toContain('href="/tools.html"')
    expect(html).toContain('Open editor')
  }
  expect(workflowPageCount).toBe(21)
  expect(toolAppPageCount).toBe(49)

  const previewImage = await page.request.get('/og-image.png')
  expect(previewImage.ok()).toBe(true)
  expect(previewImage.headers()['content-type']).toContain('image/png')

  const manifest = await (await page.request.get('/manifest.webmanifest')).json() as {
    name?: string
    short_name?: string
    shortcuts?: { name?: string; short_name?: string; url?: string; description?: string; icons?: { src?: string; type?: string }[] }[]
  }
  expect(manifest.name).toBe('Slay PDF')
  expect(manifest.short_name).toBe('Slay PDF')
  const shortcutByUrl = new Map((manifest.shortcuts ?? []).map((shortcut) => [shortcut.url, shortcut]))
  for (const [url, name] of [
    ['/merge-pdf.html', 'Merge PDF files'],
    ['/split-pdf.html', 'Split PDF files'],
    ['/sign-pdf.html', 'Sign a PDF'],
    ['/organize-pdf-pages.html', 'Organize PDF pages'],
    ['/compress-pdf.html', 'Compress a PDF'],
    ['/redact-pdf.html', 'Redact a PDF'],
    ['/ocr-pdf.html', 'Run OCR on a PDF'],
    ['/private-pdf-editor.html', 'Private PDF editor'],
  ] as const) {
    const shortcut = shortcutByUrl.get(url)
    expect(shortcut?.name).toBe(name)
    expect(shortcut?.description?.length).toBeGreaterThan(30)
    expect(shortcut?.icons?.[0]).toMatchObject({ src: 'favicon.svg', type: 'image/svg+xml' })
  }

  const llms = await (await page.request.get('/llms.txt')).text()
  expect(llms).toContain('Free local PDF editor and Adobe Acrobat alternative')
  expect(llms).toContain('https://slaypdf.com/tools.html')
  expect(llms).toContain('https://slaypdf.com/faq.html')
  expect(llms).toContain('https://slaypdf.com/privacy.html')
  expect(llms).toContain('https://slaypdf.com/online-pdf-editor.html')
  expect(llms).toContain('https://slaypdf.com/edit-pdf-without-uploading.html')
  expect(llms).toContain('https://slaypdf.com/organize-pdf-pages.html')
  expect(llms).toContain('https://slaypdf.com/adobe-acrobat-vs-slay-pdf.html')
  expect(llms).toContain('https://slaypdf.com/combine-pdf-files.html')
  expect(llms).toContain('https://slaypdf.com/remove-pages-from-pdf.html')
  expect(llms).toContain('https://slaypdf.com/extract-pages-from-pdf.html')
  expect(llms).toContain('https://slaypdf.com/make-pdf-searchable.html')
  expect(llms).toContain('https://slaypdf.com/add-signature-to-pdf.html')
  expect(llms).toContain('https://slaypdf.com/pdf-redaction-tool.html')
  expect(llms).toContain('https://slaypdf.com/images-to-pdf.html')
  expect(llms).toContain('https://slaypdf.com/jpg-to-pdf.html')
  expect(llms).toContain('https://slaypdf.com/png-to-pdf.html')
  expect(llms).toContain('https://slaypdf.com/edit-scanned-pdf.html')
  expect(llms).toContain('https://slaypdf.com/flatten-pdf.html')
  expect(llms).toContain('https://slaypdf.com/printable-poster-pdf.html')
  expect(llms).toContain('https://slaypdf.com/merge-pdf.html')
  expect(llms).toContain('https://slaypdf.com/redact-pdf.html')
  expect(llms).toContain('https://slaypdf.com/extract-pdf-text.html')
  expect(llms).toContain('https://slaypdf.com/password-protect-pdf.html')
  expect(llms).toContain('https://slaypdf.com/free-adobe-pdf-editor-alternative.html')
  expect(llms).toContain('https://slaypdf.com/acrobat-online-alternative.html')
  expect(llms).toContain('https://slaypdf.com/adobe-pdf-merge-alternative.html')
  expect(llms).toContain('https://slaypdf.com/adobe-compress-pdf-alternative.html')
  expect(llms).toContain('https://slaypdf.com/adobe-fill-and-sign-alternative.html')
  expect(llms).toContain('https://slaypdf.com/adobe-pdf-organizer-alternative.html')
  expect(llms).toContain('https://slaypdf.com/free-pdf-editor-no-signup.html')
  expect(llms).toContain('https://slaypdf.com/pdf-editor-no-watermark.html')
  expect(llms).toContain('https://slaypdf.com/secure-pdf-editor.html')
  expect(llms).toContain('https://slaypdf.com/browser-pdf-editor.html')
  expect(llms).toContain('https://slaypdf.com/pdf-editor-for-mac.html')
  expect(llms).toContain('https://slaypdf.com/pdf-editor-for-windows.html')
  expect(llms).toContain('https://slaypdf.com/pdf-editor-for-chromebook.html')
  expect(llms).toContain('https://slaypdf.com/llms-full.txt')

  const llmsFull = await (await page.request.get('/llms-full.txt')).text()
  expect(llmsFull).toContain('# Slay PDF full text index')
  expect(llmsFull).toContain('Site: https://slaypdf.com/')
  expect(llmsFull).toContain('Sitemap index: https://slaypdf.com/sitemap-index.xml')
  expect(llmsFull).toContain('Canonical sitemap: https://slaypdf.com/sitemap.xml')
  expect(llmsFull).toContain('Image sitemap: https://slaypdf.com/image-sitemap.xml')
  expect(llmsFull).toContain('Source index: https://slaypdf.com/pages.json')
  expect(llmsFull).toContain('Compact index: https://slaypdf.com/llms.txt')
  expect(llmsFull).toContain('## Slay PDF - Free Local PDF Editor & Adobe Acrobat Alternative')
  expect(llmsFull).toContain('URL: https://slaypdf.com/')
  expect(llmsFull).toContain('## PDF Tools - Slay PDF')
  expect(llmsFull).toContain('Free PDF editor: Merge, split, sign, resize and edit PDFs locally.: https://slaypdf.com/free-pdf-editor.html')
  expect(llmsFull).toContain('## Merge PDF Files Locally - Slay PDF')
  expect(llmsFull).toContain('Related links:')
  for (const path of htmlPaths) expect(llmsFull).toContain(`URL: https://slaypdf.com/${path}`)

  const tools = await (await page.request.get('/tools.html')).text()
  expect(tools).toContain('"@type": "ItemList"')
  expect(tools).toContain('PDF Tools - Slay PDF')
  const visibleCatalogPaths = [...tools.matchAll(/<(?:section|div) class="(?:tool-list|links)"[^>]*>([\s\S]*?)<\/(?:section|div)>/g)]
    .flatMap((section) => [...section[1].matchAll(/<a href="([^"]+)"/g)].map((match) => match[1].replace(/^\//, '')))
    .filter((path, index, paths) => path !== 'sitemap.html' && path !== 'tools.html' && paths.indexOf(path) === index)
  const toolStructuredData = [...tools.matchAll(/<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]))
  const toolItemList = toolStructuredData.find((block) => block['@type'] === 'ItemList') as {
    '@id'?: string
    url?: string
    itemListOrder?: string
    numberOfItems?: number
    mainEntityOfPage?: { '@id'?: string }
    itemListElement: {
      '@type'?: string
      position?: number
      name?: string
      description?: string
      url: string
      item?: { '@type'?: string; '@id'?: string; url?: string; name?: string; description?: string }
    }[]
  } | undefined
  expect(toolItemList).toBeTruthy()
  const toolItemUrls = toolItemList?.itemListElement.map((item) => item.url) ?? []
  const expectedToolItemPaths = visibleCatalogPaths
  for (const path of expectedToolItemPaths) expect(htmlPaths).toContain(path)
  expect(toolItemList?.['@id']).toBe('https://slaypdf.com/tools.html#itemlist')
  expect(toolItemList?.url).toBe('https://slaypdf.com/tools.html')
  expect(toolItemList?.itemListOrder).toBe('https://schema.org/ItemListOrderAscending')
  expect(toolItemList?.numberOfItems).toBe(expectedToolItemPaths.length)
  expect(toolItemList?.mainEntityOfPage?.['@id']).toBe('https://slaypdf.com/tools.html#webpage')
  expect(toolItemUrls).toHaveLength(expectedToolItemPaths.length)
  for (const [index, path] of expectedToolItemPaths.entries()) {
    const url = `https://slaypdf.com/${path}`
    const item = toolItemList?.itemListElement[index]
    expect(item?.url).toBe(url)
    expect(item?.position).toBe(index + 1)
    expect(item?.description?.length).toBeGreaterThan(70)
    expect(item?.item).toMatchObject({
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
    })
    expect(item?.item?.name).toContain('Slay PDF')
    expect(item?.item?.description).toBe(item?.description)
    expect(tools).toContain(`href="/${path}"`)
  }
  const htmlSitemap = await (await page.request.get('/sitemap.html')).text()
  expect(htmlSitemap).toContain('HTML Sitemap - Slay PDF')
  expect(htmlSitemap).toContain('href="/"')
  for (const path of htmlPaths) expect(htmlSitemap).toContain(`href="/${path}"`)
  expect(tools).toContain('/password-protect-pdf.html')
  expect(tools).toContain('/sitemap.html')
  expect(tools).toContain('/faq.html')
  expect(tools).toContain('/privacy.html')
  expect(tools).toContain('/online-pdf-editor.html')
  expect(tools).toContain('/edit-pdf-without-uploading.html')
  expect(tools).toContain('/organize-pdf-pages.html')
  expect(tools).toContain('/adobe-acrobat-vs-slay-pdf.html')
  expect(tools).toContain('/combine-pdf-files.html')
  expect(tools).toContain('/remove-pages-from-pdf.html')
  expect(tools).toContain('/extract-pages-from-pdf.html')
  expect(tools).toContain('/make-pdf-searchable.html')
  expect(tools).toContain('/add-signature-to-pdf.html')
  expect(tools).toContain('/pdf-redaction-tool.html')
  expect(tools).toContain('/images-to-pdf.html')
  expect(tools).toContain('/jpg-to-pdf.html')
  expect(tools).toContain('/png-to-pdf.html')
  expect(tools).toContain('/edit-scanned-pdf.html')
  expect(tools).toContain('/flatten-pdf.html')
  expect(tools).toContain('/printable-poster-pdf.html')
  expect(tools).toContain('/free-adobe-pdf-editor-alternative.html')
  expect(tools).toContain('/acrobat-online-alternative.html')
  expect(tools).toContain('/adobe-pdf-merge-alternative.html')
  expect(tools).toContain('/adobe-compress-pdf-alternative.html')
  expect(tools).toContain('/adobe-fill-and-sign-alternative.html')
  expect(tools).toContain('/adobe-pdf-organizer-alternative.html')
  expect(tools).toContain('/free-pdf-editor-no-signup.html')
  expect(tools).toContain('/pdf-editor-no-watermark.html')
  expect(tools).toContain('/secure-pdf-editor.html')
  expect(tools).toContain('/browser-pdf-editor.html')
  expect(tools).toContain('/pdf-editor-for-mac.html')
  expect(tools).toContain('/pdf-editor-for-windows.html')
  expect(tools).toContain('/pdf-editor-for-chromebook.html')

  const indexNowKey = await (await page.request.get('/b758a32ef4c84ce7bf2f4bd2468227f8.txt')).text()
  expect(indexNowKey.trim()).toBe('b758a32ef4c84ce7bf2f4bd2468227f8')
  const indexNowPayload = await (await page.request.get('/indexnow.json')).json() as { host: string; key: string; keyLocation: string; urlList: string[] }
  expect(indexNowPayload.host).toBe('slaypdf.com')
  expect(indexNowPayload.keyLocation).toBe('https://slaypdf.com/b758a32ef4c84ce7bf2f4bd2468227f8.txt')
  expect(indexNowPayload.urlList).toContain('https://slaypdf.com/tools.html')
  const indexNowUrls = await (await page.request.get('/indexnow-urls.txt')).text()
  expect(indexNowUrls).toContain('https://slaypdf.com/tools.html')
  expect(indexNowPayload.urlList.every((url) => sitemap.includes(`<loc>${url}</loc>`))).toBe(true)

  const pagesTxt = await (await page.request.get('/pages.txt')).text()
  expect(pagesTxt.trim().split(/\n+/)).toEqual(['https://slaypdf.com/', ...htmlPaths.map((path) => `https://slaypdf.com/${path}`)])
  const pagesJson = await (await page.request.get('/pages.json')).json() as {
    site: string
    generatedFrom: string
    pages: {
      url: string
      path: string
      title: string
      description: string
      h1: string
      lastmod: string
      changefreq: string
      priority: number
      webpageId: string
      breadcrumbId?: string
    }[]
  }
  expect(pagesJson.site).toBe('https://slaypdf.com')
  expect(pagesJson.generatedFrom).toBe('https://slaypdf.com/sitemap.xml')
  expect(pagesJson.pages.map((entry) => entry.url)).toEqual(['https://slaypdf.com/', ...htmlPaths.map((path) => `https://slaypdf.com/${path}`)])
  for (const entry of pagesJson.pages) {
    const sitemapEntry = sitemapByUrl.get(entry.url)
    expect(entry.lastmod).toBe(sitemapEntry?.lastmod)
    expect(entry.changefreq).toBe(sitemapEntry?.changefreq)
    expect(entry.priority).toBe(sitemapEntry?.priority)
    expect(entry.webpageId).toBe(`${entry.url}#webpage`)
    if (entry.path.endsWith('.html')) {
      expect(entry.breadcrumbId).toBe(`${entry.url}#breadcrumb`)
    } else {
      expect(entry.breadcrumbId).toBeUndefined()
    }
  }
  const onlineEditor = pagesJson.pages.find((entry) => entry.path === '/online-pdf-editor.html')
  expect(onlineEditor?.title).toBe('Online PDF Editor - Slay PDF')
  expect(onlineEditor?.h1).toBe('Edit PDFs online, but keep the work local.')
  const feed = await (await page.request.get('/feed.xml')).text()
  expect(feed).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">')
  expect(feed).toContain('<title>Slay PDF pages</title>')
  expect(feed).toContain('<atom:link href="https://slaypdf.com/feed.xml" rel="self" type="application/rss+xml" />')
  const feedItems = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1])
  expect(feedItems).toHaveLength(pagesJson.pages.length)
  expect(feedItems[0]).toContain('<link>https://slaypdf.com/</link>')
  expect(feedItems[0]).toContain('<guid isPermaLink="true">https://slaypdf.com/</guid>')
  expect(feedItems[0]).toContain(`<pubDate>${new Date(`${sitemapByUrl.get('https://slaypdf.com/')?.lastmod}T00:00:00.000Z`).toUTCString()}</pubDate>`)
  expect(feedItems.some((item) => item.includes('<link>https://slaypdf.com/adobe-acrobat-alternative.html</link>'))).toBe(true)
  const jsonFeed = await (await page.request.get('/feed.json')).json() as {
    version: string
    title: string
    home_page_url: string
    feed_url: string
    language: string
    items: { id: string; url: string; title: string; summary: string; content_text: string; date_modified: string }[]
  }
  expect(jsonFeed.version).toBe('https://jsonfeed.org/version/1.1')
  expect(jsonFeed.title).toBe('Slay PDF pages')
  expect(jsonFeed.home_page_url).toBe('https://slaypdf.com/')
  expect(jsonFeed.feed_url).toBe('https://slaypdf.com/feed.json')
  expect(jsonFeed.language).toBe('en')
  expect(jsonFeed.items).toHaveLength(pagesJson.pages.length)
  for (const [index, item] of jsonFeed.items.entries()) {
    const entry = pagesJson.pages[index]
    expect(item.id).toBe(entry.url)
    expect(item.url).toBe(entry.url)
    expect(item.title).toBe(entry.title)
    expect(item.summary).toBe(entry.description)
    expect(item.content_text).toBe(entry.description)
    expect(item.date_modified).toBe(new Date(`${entry.lastmod}T00:00:00.000Z`).toISOString())
  }
  expect(llms).toContain('## Canonical Pages')
  expect(llms).toContain('## Discovery Files')
  expect(llms).toContain('## Use Cases')
  for (const entry of pagesJson.pages) {
    expect(llms).toContain(`- ${entry.title}: ${entry.url}`)
    expect(llms).toContain(`  Summary: ${entry.description}`)
    expect(llms).toContain(`  Last modified: ${entry.lastmod}`)
  }
  expect(llms).toContain('https://slaypdf.com/pages.txt')
  expect(llms).toContain('https://slaypdf.com/pages.json')
  expect(llms).toContain('https://slaypdf.com/sitemap-index.xml')
  expect(llms).toContain('https://slaypdf.com/sitemap.xml')
  expect(llms).toContain('https://slaypdf.com/image-sitemap.xml')
  expect(llms).toContain('https://slaypdf.com/feed.xml')
  expect(llms).toContain('https://slaypdf.com/feed.json')
})

test('imports, organizes, and exports a PDF locally', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'About Slay PDF' }).click()
  const about = page.getByRole('dialog', { name: 'About Slay PDF' })
  await expect(about).toBeVisible()
  await expect(about).toContainText('Slay PDF is a completely local PDF editor to split, merge, posterise, sign or edit any PDF.')
  await expect(about).toContainText('Super quick and no more random dodgy sites. Enterprise level security (since your data stays with you and is never sent over the internet)')
  await expect(about).toContainText('Your documents and edits stay in this browser. Passwords are never saved.')
  await expect(about.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/emileakbarzadeh/slay-pdf')
  await expect(about.getByText('License links')).toBeVisible()
  await expect(about.getByRole('link', { name: 'Slay PDF (AGPL-3.0)' })).toBeHidden()
  await about.getByText('License links').click()
  await expect(about.getByRole('link', { name: 'Slay PDF (AGPL-3.0)' })).toHaveAttribute('href', 'https://github.com/emileakbarzadeh/slay-pdf')
  await expect(about.getByRole('link', { name: 'GhostPDL/Ghostscript WASM (AGPL-3.0-or-later)' })).toHaveAttribute('href', 'https://github.com/okathira/ghostpdl-wasm')
  await expect(about.getByRole('link', { name: 'qpdf-wasm wrapper (ISC)' })).toHaveAttribute('href', 'https://github.com/neslinesli93/qpdf-wasm')
  await expect(about.getByRole('link', { name: 'QPDF engine source' })).toHaveAttribute('href', 'https://github.com/qpdf/qpdf')
  await expect(about.getByRole('link', { name: 'PDF.js (Apache-2.0)' })).toHaveAttribute('href', 'https://mozilla.github.io/pdf.js/')
  await expect(about.getByRole('link', { name: 'pdf-lib (MIT)' })).toHaveAttribute('href', 'https://pdf-lib.js.org/')
  await expect(about.getByRole('link', { name: 'Tesseract.js (Apache-2.0)' })).toHaveAttribute('href', 'https://github.com/naptha/tesseract.js')
  await about.getByRole('button', { name: 'Done' }).click()
  await expect(about).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Workspace actions' }).getByRole('button', { name: 'Import' })).toHaveCount(0)

  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await page.locator('.page-preview img').first().waitFor()
  await expect.poll(async () => page.locator('.page-preview img').first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(290)
  await expect(page.locator('.statusbar')).toContainText('2 pages')
  await expect.poll(async () => (await page.locator('.statusbar').boundingBox())?.height ?? 0).toBeLessThanOrEqual(27)
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.locator('.toolstrip > button').first()).toHaveText('Deselect all (2)')
  if (await page.getByRole('button', { name: 'Expand export drawer' }).isVisible().catch(() => false)) {
    await expect(page.getByRole('button', { name: /^Export all pages$/i })).toBeHidden()
  }
  await expandDrawerIfVisible(page)
  await expect(page.getByLabel('File name')).toHaveValue('sample')
  await page.getByRole('tab', { name: 'Document' }).click()
  await expect(page.getByLabel('Title')).toHaveValue('sample')
  await page.getByRole('tab', { name: 'Export' }).click()
  await expect(page.getByRole('button', { name: /^Export all pages$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Export selected pages$/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Other downloads' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Separate pages$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Page images$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Plain text$/i })).toBeVisible()
  await page.getByLabel('File name').fill('renamed.pdf')
  await expect(page.getByLabel('File name')).toHaveValue('renamed')
  await page.getByLabel('File name').fill('sample')
  await waitForSavedPageCount(page, 2)

  const headerDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  expect((await headerDownload).suggestedFilename()).toBe('sample.pdf')

  await hideInspector(page)
  await page.getByLabel('Select page 1').click()
  await page.getByTitle('Rotate right').click()
  await expect(page.getByText('90°')).toBeVisible()
  await page.getByTitle('Show inspector').click()
  await expandDrawerIfVisible(page)

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /^Export selected pages$/i }).click()
  const exported = await download
  expect(exported.suggestedFilename()).toBe('sample.pdf')
  await waitForSavedPageCount(page, 2)

  await page.reload()
  const recents = page.getByRole('dialog', { name: 'Recent PDFs' })
  await expect(recents).toBeVisible()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await expect(recents.locator('button').first()).toContainText('New PDF')
  await expect(recents.getByRole('button', { name: /sample/ })).toBeVisible()
  await recents.getByRole('button', { name: /sample/ }).click()
  await expect(recents).toBeHidden()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)

  await page.reload()
  const recentsAfterReload = page.getByRole('dialog', { name: 'Recent PDFs' })
  await expect(recentsAfterReload).toBeVisible()
  await recentsAfterReload.getByRole('button', { name: 'Clear recent' }).click()
  await expect(page.getByText('Drop PDFs or images here')).toBeVisible()
  await expect(page.getByTestId('page-tile')).toHaveCount(0)
})

test('deselects blank grid clicks and does not import internal thumbnail drags', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  await expect(page.getByRole('button', { name: 'Deselect all (2)' })).toBeVisible()
  await page.getByRole('button', { name: 'Deselect all (2)' }).click()
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()
  await page.getByRole('button', { name: 'Select all' }).click()
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Deselect all (2)' })).toBeVisible()
  await page.getByLabel('Select page 1').click()
  await expect(page.getByRole('button', { name: 'Select all (1)' })).toBeVisible()
  await page.locator('.page-grid').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()

  const preview = page.getByLabel('Select page 1')
  const box = await preview.boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width + 240, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)
})

test('supports range selection and workspace keyboard shortcuts', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Keyboard shortcut coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf(4)
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(4)
  await hideInspector(page)
  await page.getByRole('button', { name: 'Deselect all (4)' }).click()
  await page.getByLabel('Select page 1').click()
  await page.getByLabel('Select page 3').click({ modifiers: ['Shift'] })
  await expect(page.getByRole('button', { name: 'Select all (3)' })).toBeVisible()
  await expect(page.getByLabel('Select page 1')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Select page 2')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Select page 3')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Select page 4')).toHaveAttribute('aria-pressed', 'false')

  await page.keyboard.down('Meta')
  await expect(page.getByLabel('Keyboard shortcuts')).toBeVisible()
  await expect(page.getByLabel('Keyboard shortcuts')).toContainText('Cmd A')
  await page.keyboard.up('Meta')
  await expect(page.getByLabel('Keyboard shortcuts')).toBeHidden()

  await page.keyboard.press('Meta+Shift+A')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()
  await page.keyboard.press('Meta+A')
  await expect(page.getByRole('button', { name: 'Deselect all (4)' })).toBeVisible()
  await page.keyboard.press('Meta+Shift+A')
  await page.getByLabel('Select page 2').click()
  await page.keyboard.press(']')
  await expect(page.getByText('90°')).toBeVisible()
  await page.keyboard.press('Meta+Z')
  await expect(page.getByText('90°')).toBeHidden()
  await page.keyboard.press('Meta+Shift+Z')
  await expect(page.getByText('90°')).toBeVisible()
  await page.getByLabel('Select page 2').click()
  await page.keyboard.press('BracketLeft')
  await expect(page.getByText('90°')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()
  await page.getByLabel('Select page 2').click()
  await page.keyboard.press('Meta+D')
  await expect(page.getByTestId('page-tile')).toHaveCount(5)
  const shortcutDownload = page.waitForEvent('download')
  await page.keyboard.press('Meta+S')
  expect((await shortcutDownload).suggestedFilename()).toBe('sample.pdf')
  await page.keyboard.press('Delete')
  await expect(page.getByTestId('page-tile')).toHaveCount(4)
})

test('opens page edit options from the right click menu', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Right-click context menu is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  await page.locator('.page-grid').click({ position: { x: 5, y: 5 } })
  await page.getByLabel('Select page 2').click({ button: 'right' })
  const menu = page.getByRole('menu', { name: 'Page 2 actions' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Edit page' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Rotate left' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Rotate right' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Select all (1)' })).toBeVisible()

  await menu.getByRole('menuitem', { name: 'Rotate right' }).click()
  await expect(page.getByText('90°')).toBeVisible()
  await page.getByLabel('Select page 2').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Duplicate' }).click()
  await expect(page.getByTestId('page-tile')).toHaveCount(3)
  await page.getByLabel('Select page 2').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)
})

test('opens the editor from the hovered page edit affordance', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Hover affordance is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  await page.getByTestId('page-tile').first().hover()
  await expect(page.getByLabel('Edit page 1')).toBeVisible()
  await page.getByLabel('Edit page 1').click()
  await expect(page.getByRole('dialog', { name: 'Page editor' })).toBeVisible()
})

test('edits can be selected, moved, resized, and deleted with app modals', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Pointer transform coverage is desktop-only')
  let browserDialogs = 0
  page.on('dialog', async (dialog) => {
    browserDialogs += 1
    await dialog.dismiss()
  })
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await hideInspector(page)
  await page.locator('.page-number').first().click()
  await page.getByRole('button', { name: 'Text' }).click()
  const pageBox = await page.locator('.editor-page').boundingBox()
  expect(pageBox).not.toBeNull()
  if (!pageBox) return
  await page.mouse.move(pageBox.x + 120, pageBox.y + 130)
  await page.mouse.down()
  await page.mouse.move(pageBox.x + 260, pageBox.y + 185)
  await page.mouse.up()
  await expect(page.getByRole('dialog', { name: 'Add text' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Text' }).fill('Movable note')
  await page.getByRole('button', { name: 'Add text' }).click()
  await page.getByRole('button', { name: 'Select', exact: true }).click()
  await expect(page.getByTestId('overlay-frame')).toHaveCount(1)

  const frame = page.getByTestId('overlay-frame').first()
  await frame.click()
  const beforeMove = await frame.boundingBox()
  expect(beforeMove).not.toBeNull()
  if (!beforeMove) return
  await page.mouse.move(beforeMove.x + beforeMove.width / 2, beforeMove.y + beforeMove.height / 2)
  await page.mouse.down()
  await page.mouse.move(beforeMove.x + beforeMove.width / 2 + 80, beforeMove.y + beforeMove.height / 2 + 30)
  await page.mouse.up()
  await expect.poll(async () => (await frame.boundingBox())?.x ?? 0).toBeGreaterThan(beforeMove.x + 40)

  const beforeResize = await frame.boundingBox()
  expect(beforeResize).not.toBeNull()
  if (!beforeResize) return
  const handle = page.getByTestId('resize-se')
  const handleBox = await handle.boundingBox()
  expect(handleBox).not.toBeNull()
  if (!handleBox) return
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 70, handleBox.y + handleBox.height / 2 + 30)
  await page.mouse.up()
  await expect.poll(async () => (await frame.boundingBox())?.width ?? 0).toBeGreaterThan(beforeResize.width + 30)

  await page.getByRole('button', { name: 'Delete selected edit' }).click()
  const deleteDialog = page.getByRole('dialog', { name: 'Delete edit' })
  await expect(deleteDialog).toBeVisible()
  await deleteDialog.getByRole('button', { name: /^Delete$/ }).click()
  await expect(page.getByText('No edits')).toBeVisible()
  expect(browserDialogs).toBe(0)
})

test('keeps the add pages hover menu open while moving into it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Hover menu coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  const toggle = page.getByRole('button', { name: 'Add…' })
  await toggle.hover()
  const toggleBox = await toggle.boundingBox()
  const menu = page.locator('.add-pages-menu')
  await expect(menu).toBeVisible()
  const menuBox = await menu.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(menuBox).not.toBeNull()
  if (!toggleBox || !menuBox) return

  await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + 2)
  await page.mouse.move(menuBox.x + menuBox.width / 2, menuBox.y + menuBox.height - 2, { steps: 8 })
  await expect(page.getByRole('menuitem', { name: 'Split PDF marker' })).toBeVisible()
})

test('resizes and posterises selected pages from the tools dropdown', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Toolbar menu coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf(1)
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(1)
  await hideInspector(page)
  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Resize selected pages' }).click()
  const resizeDialog = page.getByRole('dialog', { name: 'Resize selected pages' })
  await expect(resizeDialog).toBeVisible()
  await resizeDialog.getByLabel('Paper size').selectOption('letter')
  await resizeDialog.getByLabel('Orientation').selectOption('landscape')
  await resizeDialog.getByRole('button', { name: 'Resize', exact: true }).click()
  await expect(resizeDialog).toBeHidden()

  const resizedDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  const resizedPath = await (await resizedDownload).path()
  expect(resizedPath).not.toBeNull()
  if (!resizedPath) return
  const resizedPdf = await PDFDocument.load(await readFile(resizedPath))
  expect(Math.round(resizedPdf.getPage(0).getWidth())).toBe(792)
  expect(Math.round(resizedPdf.getPage(0).getHeight())).toBe(612)
  await expect(page.getByTitle('Page has been resized')).toBeVisible()
  await page.locator('.page-number').first().click()
  const editor = page.getByRole('dialog', { name: 'Page editor' })
  await expect(editor.locator('.editor-title')).toContainText('Resized')
  await expect(editor.locator('.editor-title')).toContainText('Original 420 x 594 pt')
  await editor.getByTitle('Close').click()
  await expect(editor).toBeHidden()

  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Posterise selected pages' }).click()
  const posterDialog = page.getByRole('dialog', { name: 'Posterise selected pages' })
  await expect(posterDialog).toBeVisible()
  await expect(posterDialog.getByLabel('Orientation')).toHaveValue('landscape')
  await posterDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(posterDialog).toBeHidden()

  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Resize selected pages' }).click()
  await resizeDialog.getByLabel('Paper size').selectOption('custom')
  await resizeDialog.getByLabel('Width (mm)').fill('100')
  await resizeDialog.getByLabel('Height (mm)').fill('150')
  await expect(resizeDialog).toContainText('100 x 150 mm')
  await resizeDialog.getByRole('button', { name: 'Resize', exact: true }).click()

  const customDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  const customPath = await (await customDownload).path()
  expect(customPath).not.toBeNull()
  if (!customPath) return
  const customPdf = await PDFDocument.load(await readFile(customPath))
  expect(Math.round(customPdf.getPage(0).getWidth())).toBe(283)
  expect(Math.round(customPdf.getPage(0).getHeight())).toBe(425)

  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Posterise selected pages' }).click()
  await expect(posterDialog).toBeVisible()
  await expect(posterDialog.getByLabel('Orientation')).toHaveValue('portrait')
  await posterDialog.getByLabel('Columns').fill('2')
  await posterDialog.getByLabel('Rows').fill('2')
  await posterDialog.getByLabel('Paper size').selectOption('a4')
  await posterDialog.getByRole('button', { name: 'Posterise', exact: true }).click()
  await expect(page.getByTestId('page-tile')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Deselect all (4)' })).toBeVisible()
  await expect(page.locator('.page-preview img')).toHaveCount(4)
  const posterPreviewSources = await page.locator('.page-preview img').evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src))
  expect(new Set(posterPreviewSources).size).toBeGreaterThan(1)

  const posterDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  const posterPath = await (await posterDownload).path()
  expect(posterPath).not.toBeNull()
  if (!posterPath) return
  const posterPdf = await PDFDocument.load(await readFile(posterPath))
  expect(posterPdf.getPageCount()).toBe(4)
  expect(Math.round(posterPdf.getPage(0).getWidth())).toBe(595)
  expect(Math.round(posterPdf.getPage(0).getHeight())).toBe(842)
})

test('keeps the tools hover menu open while moving into it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Hover menu coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  const toggle = page.getByRole('button', { name: /Tools/ })
  await toggle.hover()
  const toggleBox = await toggle.boundingBox()
  const menu = page.locator('.tools-menu')
  await expect(menu).toBeVisible()
  const menuBox = await menu.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(menuBox).not.toBeNull()
  if (!toggleBox || !menuBox) return

  await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height - 2)
  await page.mouse.move(menuBox.x + menuBox.width / 2, menuBox.y + 2, { steps: 8 })
  await expect(page.getByRole('menuitem', { name: 'Resize selected pages' })).toBeVisible()
})

test('adds a split PDF marker from the add dropdown', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await page.getByRole('button', { name: 'Add…' }).click()
  await page.getByRole('menuitem', { name: 'Split PDF marker' }).click()
  await expect(page.getByTestId('split-marker')).toHaveCount(1)
  await expect(page.getByTestId('split-marker').getByText('New PDF')).toBeVisible()
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')

  const firstPage = await page.getByTestId('page-tile').first().boundingBox()
  const marker = await page.getByTestId('split-marker').boundingBox()
  const markerPanel = await page.getByTestId('split-marker-panel').boundingBox()
  expect(firstPage).not.toBeNull()
  expect(marker).not.toBeNull()
  expect(markerPanel).not.toBeNull()
  if (!firstPage || !marker || !markerPanel) return
  expect(marker.height).toBeGreaterThan(firstPage.height * 0.75)
  expect(markerPanel.height).toBeGreaterThan(firstPage.height * 0.7)
  expect(marker.x).toBeGreaterThan(firstPage.x)

  const downloads: Download[] = []
  page.on('download', (download) => downloads.push(download))
  await page.getByTitle('Download all pages').click()
  await expect.poll(() => downloads.length, { timeout: 30_000 }).toBe(2)
  await expect.poll(async () => Promise.all(downloads.map((download) => download.suggestedFilename()))).toEqual(['sample-001.pdf', 'sample-002.pdf'])

  for (const download of downloads) {
    const path = await download.path()
    expect(path).not.toBeNull()
    if (!path) continue
    const exported = await PDFDocument.load(await readFile(path))
    expect(exported.getPageCount()).toBe(1)
  }
})

test('opens the editor using the actual page aspect ratio', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'landscape.pdf',
    mimeType: 'application/pdf',
    buffer: await landscapePdf()
  })

  await page.locator('.page-preview img').first().waitFor()
  await hideInspector(page)
  await page.locator('.page-number').first().click()
  await expect.poll(async () => page.locator('.editor-page > img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(1400)
  const box = await page.locator('.editor-page').boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  expect(box.width / box.height).toBeGreaterThan(1.65)
  expect(box.width / box.height).toBeLessThan(1.9)
  await page.locator('.editor-stage').dispatchEvent('wheel', { deltaY: -80, ctrlKey: true, bubbles: true, cancelable: true })
  await expect(page.getByText('125%')).toBeVisible()
  await page.getByTitle('Fit page').click()
  await expect(page.getByText('100%')).toBeVisible()
  const stage = page.locator('.editor-stage')
  await stage.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 220, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointermove', { pointerId: 2, pointerType: 'touch', clientX: 280, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointerup', { pointerId: 2, pointerType: 'touch', clientX: 280, clientY: 220, bubbles: true, cancelable: true })
  await expect(page.getByText('160%')).toBeVisible()
  await page.getByTitle('Fit page').click()
  await page.getByTitle('Zoom in').click()
  await page.getByTitle('Zoom in').click()
  await expect(page.getByText('150%')).toBeVisible()
  await expect.poll(async () => page.locator('.editor-page > img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(2500)
  const zoomedBox = await page.locator('.editor-page').boundingBox()
  expect(zoomedBox).not.toBeNull()
  if (!zoomedBox) return
  expect(zoomedBox.width).toBeGreaterThan(box.width)
})

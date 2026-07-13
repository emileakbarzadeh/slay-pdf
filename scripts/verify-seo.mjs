import { readFile, stat } from 'node:fs/promises'
import { basename } from 'node:path'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const live = process.argv.includes('--live')
const appKeywords = [
  'local PDF editor',
  'free PDF editor',
  'Adobe Acrobat alternative',
  'browser PDF editor',
  'private PDF editor',
]
const appActionPlatform = [
  'https://schema.org/DesktopWebPlatform',
  'https://schema.org/MobileWebPlatform',
]

async function readPublic(path) {
  return readFile(new URL(path, publicDir), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function pubDate(lastmod) {
  return new Date(`${lastmod}T00:00:00.000Z`).toUTCString()
}

function isoDate(lastmod) {
  return new Date(`${lastmod}T00:00:00.000Z`).toISOString()
}

function decodeXml(value) {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}

function decodeHtml(value) {
  return decodeXml(value)
}

function textFromInlineHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
}

function visibleRelatedLinks(html, url) {
  const links = new Set()
  const relatedSections = [
    ...html.matchAll(/<(?:div|section) class="(?:links|tool-list)"[^>]*>([\s\S]*?)<\/(?:div|section)>/g),
  ]

  for (const section of relatedSections) {
    for (const link of section[1].matchAll(/<a href="([^"]+)"/g)) {
      const relatedUrl = new URL(link[1], site).href
      if (relatedUrl !== url) links.add(relatedUrl)
    }
  }

  return [...links]
}

function visibleBreadcrumbItems(html, file, url) {
  const nav = html.match(/<nav class="crumbs" aria-label="Breadcrumb">([\s\S]*?)<\/nav>/)
  assert(nav, `${file} is missing visible breadcrumb navigation`)

  const items = [...nav[1].matchAll(/<(a|span)(?: href="([^"]+)")?[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((match, index) => {
      const [, tag, href, label] = match
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: textFromInlineHtml(label),
        item: tag === 'a' && href ? new URL(href, site).href : url,
      }
    })

  assert(items.length >= 2, `${file} visible breadcrumb navigation must include at least two items`)
  assert(items.every((item) => item.name), `${file} visible breadcrumb navigation contains an empty label`)
  assert(items.at(-1)?.item === url, `${file} visible breadcrumb navigation must end at canonical URL`)
  return items
}

function structuredDataBlocks(html, file) {
  return [...html.matchAll(/<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => {
      try {
        return JSON.parse(match[1])
      } catch (error) {
        throw new Error(`${file} has invalid JSON-LD: ${error.message}`)
      }
    })
}

function structuredDataEntity(blocks, type) {
  for (const block of blocks) {
    if (block['@type'] === type) return block
    const graphEntity = Array.isArray(block['@graph'])
      ? block['@graph'].find((node) => node['@type'] === type)
      : undefined
    if (graphEntity) return graphEntity
  }
  return undefined
}

function workflowSteps(html, file) {
  const section = html.match(/<section class="grid" aria-label="([^"]+)">([\s\S]*?)<\/section>/i)
  if (!section) return undefined
  const label = section[1].toLowerCase()
  if (!label.includes('workflow') && label !== 'pdf page organization tools') return undefined

  const steps = [...section[2].matchAll(/<article class="card"><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/article>/g)]
    .map((match, index) => ({
      position: index + 1,
      name: textFromInlineHtml(match[1]),
      text: textFromInlineHtml(match[2]),
    }))

  assert(steps.length >= 2, `${file} workflow grid must include at least two visible steps`)
  return steps
}

function visibleToolFeatures(html, file) {
  const section = html.match(/<section class="grid" aria-label="([^"]+)">([\s\S]*?)<\/section>/i)
  if (!section) return undefined
  if (section[1].toLowerCase() === 'privacy summary') return undefined

  const features = [...section[2].matchAll(/<article class="card"><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/article>/g)]
    .map((match) => ({
      name: textFromInlineHtml(match[1]),
      text: textFromInlineHtml(match[2]),
    }))

  assert(features.length >= 2, `${file} tool feature grid must include at least two visible cards`)
  return features
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

function mainEntityIds(value) {
  if (!value) return []
  return (Array.isArray(value) ? value : [value])
    .map((entity) => entity?.['@id'])
    .filter(Boolean)
}

function expectedMainEntityIds({ html, file, url, blocks }) {
  const ids = []

  if (file === 'index.html') ids.push(`${url}#app`)
  if (structuredDataEntity(blocks, 'WebApplication')?.['@id'] === `${url}#tool`) ids.push(`${url}#tool`)
  if (workflowSteps(html, file) || structuredDataEntity(blocks, 'HowTo')) ids.push(`${url}#howto`)
  if (structuredDataEntity(blocks, 'FAQPage')) ids.push(`${url}#faq`)
  if (structuredDataEntity(blocks, 'ItemList')?.['@id'] === `${url}#itemlist`) ids.push(`${url}#itemlist`)

  return ids
}

function assertWebPageSchema({ html, file, url, title, description, h1 }) {
  assert(html.includes('type="application/ld+json" data-managed="webpage"'), `${file} is missing managed WebPage JSON-LD`)
  const blocks = structuredDataBlocks(html, file)
  const webpage = blocks.find((block) => block['@type'] === 'WebPage')
  assert(blocks.filter((block) => block['@type'] === 'WebPage').length === 1, `${file} must include exactly one top-level WebPage JSON-LD block`)
  assert(webpage, `${file} is missing WebPage JSON-LD`)
  assert(webpage['@context'] === 'https://schema.org', `${file} WebPage context is wrong`)
  assert(webpage['@id'] === `${url}#webpage`, `${file} WebPage @id does not match canonical URL`)
  assert(webpage.url === url, `${file} WebPage URL does not match canonical URL`)
  assert(webpage.name === title, `${file} WebPage name does not match title`)
  assert(webpage.headline === h1, `${file} WebPage headline does not match h1`)
  assert(webpage.description === description, `${file} WebPage description does not match meta description`)
  assert(webpage.dateModified === sitemapMetadata.get(url)?.lastmod, `${file} WebPage dateModified does not match sitemap lastmod`)
  assert(webpage.isPartOf?.['@type'] === 'WebSite', `${file} WebPage isPartOf should be WebSite`)
  assert(webpage.isPartOf?.['@id'] === `${site}/#website`, `${file} WebPage isPartOf @id is wrong`)
  assert(webpage.publisher?.['@type'] === 'Organization', `${file} WebPage publisher should be Organization`)
  assert(webpage.publisher?.['@id'] === `${site}/#organization`, `${file} WebPage publisher @id is wrong`)
  assert(webpage.primaryImageOfPage?.url === `${site}/og-image.png`, `${file} WebPage image URL is wrong`)
  assert(webpage.primaryImageOfPage?.width === 1200, `${file} WebPage image width is wrong`)
  assert(webpage.primaryImageOfPage?.height === 630, `${file} WebPage image height is wrong`)
  assert(webpage.inLanguage === 'en', `${file} WebPage language is wrong`)
  const expectedAbout = expectedWebPageAbout.get(file)
  if (expectedAbout) {
    assert(JSON.stringify(webpage.about) === JSON.stringify(expectedAbout), `${file} WebPage about topics are wrong`)
  } else {
    assert(!webpage.about, `${file} WebPage should not include unmanaged about topics`)
  }
  const expectedMainEntities = expectedMainEntityIds({ html, file, url, blocks })
  const actualMainEntities = mainEntityIds(webpage.mainEntity)
  assert(JSON.stringify(actualMainEntities) === JSON.stringify(expectedMainEntities), `${file} WebPage mainEntity references are wrong`)
  const expectedRelatedLinks = visibleRelatedLinks(html, url)
  const actualRelatedLinks = webpage.relatedLink ?? []
  assert(JSON.stringify(actualRelatedLinks) === JSON.stringify(expectedRelatedLinks), `${file} WebPage relatedLink entries must match visible related links`)
  const breadcrumb = blocks.find((block) => block['@type'] === 'BreadcrumbList')
  if (breadcrumb) {
    assert(webpage.breadcrumb?.['@id'] === `${url}#breadcrumb`, `${file} WebPage breadcrumb reference is wrong`)
    assert(breadcrumb['@id'] === `${url}#breadcrumb`, `${file} BreadcrumbList @id is wrong`)
    assert(JSON.stringify(breadcrumb.itemListElement) === JSON.stringify(visibleBreadcrumbItems(html, file, url)), `${file} BreadcrumbList must match visible breadcrumbs`)
  }
}

function assertRichEntitySchema({ html, file, url }) {
  const blocks = structuredDataBlocks(html, file)
  const faq = structuredDataEntity(blocks, 'FAQPage')
  const itemList = structuredDataEntity(blocks, 'ItemList')?.['@id'] === `${url}#itemlist`
    ? structuredDataEntity(blocks, 'ItemList')
    : undefined

  if (faq) {
    assert(faq['@id'] === `${url}#faq`, `${file} FAQPage @id is wrong`)
    assert(faq.url === url, `${file} FAQPage URL is wrong`)
    assert(faq.inLanguage === 'en', `${file} FAQPage language is wrong`)
    assert(Array.isArray(faq.mainEntity) && faq.mainEntity.length >= 1, `${file} FAQPage must include questions`)
    if (file !== 'index.html') {
      const visibleFaq = visibleFaqItems(html)
      assert(visibleFaq.length > 0, `${file} FAQPage JSON-LD must be backed by a visible FAQ section`)
      assert(html.includes('type="application/ld+json" data-managed="faq"'), `${file} FAQPage JSON-LD should be generated from visible FAQ content`)
      assert(faq.mainEntity.length === visibleFaq.length, `${file} FAQPage question count must match visible FAQ`)
    }
    for (const [index, question] of faq.mainEntity.entries()) {
      assert(question['@type'] === 'Question', `${file} FAQ question ${index + 1} type is wrong`)
      assert(question.name, `${file} FAQ question ${index + 1} is missing name`)
      assert(question.acceptedAnswer?.['@type'] === 'Answer', `${file} FAQ answer ${index + 1} type is wrong`)
      assert(question.acceptedAnswer?.text, `${file} FAQ answer ${index + 1} is missing text`)
      if (file !== 'index.html') {
        const visibleQuestion = visibleFaqItems(html)[index]
        assert(question.name === visibleQuestion?.question, `${file} FAQ question ${index + 1} must match visible FAQ text`)
        assert(question.acceptedAnswer.text === visibleQuestion?.answer, `${file} FAQ answer ${index + 1} must match visible FAQ text`)
      }
    }
  }

  if (itemList) {
    assert(itemList['@id'] === `${url}#itemlist`, `${file} ItemList @id is wrong`)
    assert(itemList.url === url, `${file} ItemList URL is wrong`)
    assert(itemList.inLanguage === 'en', `${file} ItemList language is wrong`)
    assert(Array.isArray(itemList.itemListElement) && itemList.itemListElement.length >= 1, `${file} ItemList must include items`)
    assert(itemList.itemListOrder === 'https://schema.org/ItemListOrderAscending', `${file} ItemList order is wrong`)
    assert(itemList.numberOfItems === itemList.itemListElement.length, `${file} ItemList numberOfItems must match item count`)
    for (const [index, item] of itemList.itemListElement.entries()) {
      assert(item['@type'] === 'ListItem', `${file} ItemList item ${index + 1} type is wrong`)
      assert(item.position === index + 1, `${file} ItemList item ${index + 1} position is wrong`)
      assert(item.url, `${file} ItemList item ${index + 1} URL is missing`)
      if (item.item) {
        assert(item.item['@type'] === 'WebPage', `${file} ItemList item ${index + 1} nested item type is wrong`)
        assert(item.item['@id'] === `${item.url}#webpage`, `${file} ItemList item ${index + 1} nested WebPage ID is wrong`)
        assert(item.item.url === item.url, `${file} ItemList item ${index + 1} nested WebPage URL is wrong`)
        assert(item.item.name, `${file} ItemList item ${index + 1} nested WebPage name is missing`)
        assert(item.item.description, `${file} ItemList item ${index + 1} nested WebPage description is missing`)
      }
    }
  }
}

function assertToolAppSchema({ html, file, url, title, description, h1 }) {
  const features = visibleToolFeatures(html, file)
  const blocks = structuredDataBlocks(html, file)
  const toolApp = blocks.find((block) => block['@type'] === 'WebApplication' && block['@id'] === `${url}#tool`)

  if (!features) {
    assert(!html.includes('data-managed="tool-app"'), `${file} should not include managed tool WebApplication JSON-LD without an eligible visible feature grid`)
    return
  }

  assert(html.includes('type="application/ld+json" data-managed="tool-app"'), `${file} is missing managed tool WebApplication JSON-LD`)
  assert(toolApp, `${file} is missing tool WebApplication JSON-LD`)
  assert(toolApp['@context'] === 'https://schema.org', `${file} tool WebApplication context is wrong`)
  assert(toolApp.name === title.replace(/ - Slay PDF$/, ''), `${file} tool WebApplication name is wrong`)
  assert(toolApp.alternateName === h1, `${file} tool WebApplication alternateName must match h1`)
  assert(toolApp.description === description, `${file} tool WebApplication description must match meta description`)
  assert(toolApp.url === url, `${file} tool WebApplication URL is wrong`)
  assert(toolApp.applicationCategory === 'BusinessApplication', `${file} tool WebApplication category is wrong`)
  assert(toolApp.applicationSubCategory === 'PDF editor', `${file} tool WebApplication subcategory is wrong`)
  assert(toolApp.operatingSystem === 'Web', `${file} tool WebApplication operating system is wrong`)
  assert(toolApp.browserRequirements === 'Requires a modern browser with WebAssembly and IndexedDB support.', `${file} tool WebApplication browser requirements are wrong`)
  assert(toolApp.isAccessibleForFree === true, `${file} tool WebApplication free access flag is wrong`)
  assert(toolApp.inLanguage === 'en', `${file} tool WebApplication language is wrong`)
  assert(toolApp.image === `${site}/og-image.png`, `${file} tool WebApplication image is wrong`)
  assert(toolApp.screenshot?.url === `${site}/og-image.png`, `${file} tool WebApplication screenshot URL is wrong`)
  assert(toolApp.screenshot?.width === 1200, `${file} tool WebApplication screenshot width is wrong`)
  assert(toolApp.screenshot?.height === 630, `${file} tool WebApplication screenshot height is wrong`)
  assert(toolApp.softwareHelp === 'https://github.com/emileakbarzadeh/slay-pdf#readme', `${file} tool WebApplication softwareHelp is wrong`)
  assert(toolApp.codeRepository === 'https://github.com/emileakbarzadeh/slay-pdf', `${file} tool WebApplication repository is wrong`)
  assert(toolApp.license === 'https://www.gnu.org/licenses/agpl-3.0.en.html', `${file} tool WebApplication license is wrong`)
  assert(toolApp.privacyPolicy === `${site}/privacy.html`, `${file} tool WebApplication privacyPolicy is wrong`)
  assert(JSON.stringify(toolApp.keywords) === JSON.stringify(appKeywords), `${file} tool WebApplication keywords are wrong`)
  assert(toolApp.isPartOf?.['@id'] === `${site}/#app`, `${file} tool WebApplication app reference is wrong`)
  assert(toolApp.publisher?.['@id'] === `${site}/#organization`, `${file} tool WebApplication publisher is wrong`)
  assert(toolApp.offers?.price === '0', `${file} tool WebApplication price is wrong`)
  assert(toolApp.offers?.priceCurrency === 'USD', `${file} tool WebApplication currency is wrong`)
  assert(toolApp.potentialAction?.['@type'] === 'UseAction', `${file} tool WebApplication action type is wrong`)
  assert(toolApp.potentialAction?.name === `Open ${title.replace(/ - Slay PDF$/, '')} in Slay PDF`, `${file} tool WebApplication action name is wrong`)
  assert(toolApp.potentialAction?.target?.['@type'] === 'EntryPoint', `${file} tool WebApplication action target type is wrong`)
  assert(toolApp.potentialAction?.target?.urlTemplate === `${site}/`, `${file} tool WebApplication action target URL is wrong`)
  assert(JSON.stringify(toolApp.potentialAction?.target?.actionPlatform) === JSON.stringify(appActionPlatform), `${file} tool WebApplication action platforms are wrong`)
  assert(JSON.stringify(toolApp.featureList) === JSON.stringify(features.map((feature) => `${feature.name}: ${feature.text}`)), `${file} tool WebApplication featureList must match visible feature cards`)
}

function assertHowToSchema({ html, file, url, title, description }) {
  const steps = workflowSteps(html, file)
  const blocks = structuredDataBlocks(html, file)
  const howTo = blocks.find((block) => block['@type'] === 'HowTo')

  if (!steps) {
    assert(!html.includes('data-managed="howto"'), `${file} should not include managed HowTo JSON-LD without an eligible visible workflow`)
    return
  }

  assert(html.includes('type="application/ld+json" data-managed="howto"'), `${file} is missing managed HowTo JSON-LD`)
  assert(howTo, `${file} is missing HowTo JSON-LD`)
  assert(howTo['@context'] === 'https://schema.org', `${file} HowTo context is wrong`)
  assert(howTo['@id'] === `${url}#howto`, `${file} HowTo @id does not match canonical URL`)
  assert(howTo.url === url, `${file} HowTo URL does not match canonical URL`)
  assert(howTo.name === `${title.replace(/ - Slay PDF$/, '')} workflow`, `${file} HowTo name is wrong`)
  assert(howTo.description === description, `${file} HowTo description does not match meta description`)
  assert(howTo.inLanguage === 'en', `${file} HowTo language is wrong`)
  assert(howTo.tool?.[0]?.['@type'] === 'HowToTool', `${file} HowTo tool type is wrong`)
  assert(howTo.tool?.[0]?.name === 'Slay PDF', `${file} HowTo tool name is wrong`)
  assert(howTo.step?.length === steps.length, `${file} HowTo step count must match visible workflow cards`)

  for (const [index, step] of steps.entries()) {
    const schemaStep = howTo.step[index]
    assert(schemaStep['@type'] === 'HowToStep', `${file} HowTo step ${index + 1} type is wrong`)
    assert(schemaStep.position === step.position, `${file} HowTo step ${index + 1} position is wrong`)
    assert(schemaStep.name === step.name, `${file} HowTo step ${index + 1} name does not match visible card`)
    assert(schemaStep.text === step.text, `${file} HowTo step ${index + 1} text does not match visible card`)
  }
}

function assertSiteIdentitySchema(html, file) {
  const blocks = structuredDataBlocks(html, file)
  const graph = blocks.find((block) => Array.isArray(block['@graph']))?.['@graph'] ?? []
  const organization = graph.find((node) => node['@type'] === 'Organization')
  const website = graph.find((node) => node['@type'] === 'WebSite')
  const sourceCode = graph.find((node) => node['@type'] === 'SoftwareSourceCode')
  const siteNavigation = graph.find((node) => node['@type'] === 'ItemList' && node['@id'] === `${site}/#site-navigation`)
  const app = blocks.find((block) => block['@type'] === 'WebApplication')

  assert(organization, `${file} is missing Organization JSON-LD`)
  assert(organization['@id'] === `${site}/#organization`, `${file} Organization @id is wrong`)
  assert(organization.name === 'Slay PDF', `${file} Organization name is wrong`)
  assert(organization.url === `${site}/`, `${file} Organization URL is wrong`)
  assert(organization.logo === `${site}/favicon.svg`, `${file} Organization logo is wrong`)
  assert(organization.sameAs?.includes('https://github.com/emileakbarzadeh/slay-pdf'), `${file} Organization sameAs is missing GitHub`)

  assert(website, `${file} is missing WebSite JSON-LD`)
  assert(website['@id'] === `${site}/#website`, `${file} WebSite @id is wrong`)
  assert(website.name === 'Slay PDF', `${file} WebSite name is wrong`)
  assert(website.url === `${site}/`, `${file} WebSite URL is wrong`)
  assert(website.description === 'Free local PDF editor and Adobe Acrobat alternative that runs in the browser.', `${file} WebSite description is wrong`)
  assert(website.publisher?.['@id'] === `${site}/#organization`, `${file} WebSite publisher is wrong`)
  assert(website.inLanguage === 'en', `${file} WebSite language is wrong`)
  assert(website.potentialAction?.['@type'] === 'SearchAction', `${file} WebSite search action type is wrong`)
  assert(website.potentialAction?.name === 'Search Slay PDF tools', `${file} WebSite search action name is wrong`)
  assert(website.potentialAction?.target?.['@type'] === 'EntryPoint', `${file} WebSite search action target type is wrong`)
  assert(website.potentialAction?.target?.urlTemplate === `${site}/search.html?q={search_term_string}`, `${file} WebSite search action URL is wrong`)
  assert(website.potentialAction?.['query-input'] === 'required name=search_term_string', `${file} WebSite search action query input is wrong`)
  const expectedHasPart = prominentSiteUrls.map((url) => {
    const metadata = pageMetadata.get(url)
    return {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: metadata?.title,
    }
  })
  assert(JSON.stringify(website.hasPart) === JSON.stringify(expectedHasPart), `${file} WebSite hasPart entries must match prominent site pages`)

  assert(sourceCode, `${file} is missing SoftwareSourceCode JSON-LD`)
  assert(sourceCode['@id'] === `${site}/#source-code`, `${file} SoftwareSourceCode @id is wrong`)
  assert(sourceCode.name === 'Slay PDF source code', `${file} SoftwareSourceCode name is wrong`)
  assert(sourceCode.url === 'https://github.com/emileakbarzadeh/slay-pdf', `${file} SoftwareSourceCode URL is wrong`)
  assert(sourceCode.codeRepository === 'https://github.com/emileakbarzadeh/slay-pdf', `${file} SoftwareSourceCode repository is wrong`)
  assert(sourceCode.license === 'https://www.gnu.org/licenses/agpl-3.0.en.html', `${file} SoftwareSourceCode license is wrong`)
  assert(JSON.stringify(sourceCode.programmingLanguage) === JSON.stringify(['TypeScript', 'JavaScript', 'HTML', 'CSS']), `${file} SoftwareSourceCode programming languages are wrong`)
  assert(JSON.stringify(sourceCode.runtimePlatform) === JSON.stringify(['Web browser', 'WebAssembly']), `${file} SoftwareSourceCode runtime platforms are wrong`)
  assert(sourceCode.isPartOf?.['@id'] === `${site}/#app`, `${file} SoftwareSourceCode app reference is wrong`)
  assert(sourceCode.publisher?.['@id'] === `${site}/#organization`, `${file} SoftwareSourceCode publisher is wrong`)
  assert(sourceCode.targetProduct?.['@id'] === `${site}/#app`, `${file} SoftwareSourceCode target product is wrong`)

  assert(siteNavigation, `${file} is missing site navigation ItemList JSON-LD`)
  const expectedNavigation = prominentNavigationUrls.map((url, index) => {
    const metadata = pageMetadata.get(url)
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SiteNavigationElement',
        '@id': `${url}#site-navigation`,
        name: metadata?.title?.replace(/ - Slay PDF$/, ''),
        url,
      },
    }
  })
  assert(siteNavigation.name === 'Slay PDF site navigation', `${file} site navigation name is wrong`)
  assert(JSON.stringify(siteNavigation.itemListElement) === JSON.stringify(expectedNavigation), `${file} site navigation entries must match prominent HTML pages`)

  assert(app, `${file} is missing WebApplication JSON-LD`)
  assert(app['@id'] === `${site}/#app`, `${file} WebApplication @id is wrong`)
  assert(app.name === 'Slay PDF', `${file} WebApplication name is wrong`)
  assert(app.url === `${site}/`, `${file} WebApplication URL is wrong`)
  assert(app.isPartOf?.['@id'] === `${site}/#website`, `${file} WebApplication isPartOf is wrong`)
  assert(app.publisher?.['@id'] === `${site}/#organization`, `${file} WebApplication publisher is wrong`)
  assert(app.offers?.price === '0', `${file} WebApplication price is wrong`)
  assert(app.image === `${site}/og-image.png`, `${file} WebApplication image is wrong`)
  assert(app.screenshot?.url === `${site}/og-image.png`, `${file} WebApplication screenshot URL is wrong`)
  assert(app.screenshot?.width === 1200, `${file} WebApplication screenshot width is wrong`)
  assert(app.screenshot?.height === 630, `${file} WebApplication screenshot height is wrong`)
  assert(app.privacyPolicy === `${site}/privacy.html`, `${file} WebApplication privacyPolicy is wrong`)
  assert(JSON.stringify(app.keywords) === JSON.stringify(appKeywords), `${file} WebApplication keywords are wrong`)
  assert(app.codeRepository === 'https://github.com/emileakbarzadeh/slay-pdf', `${file} WebApplication repository is wrong`)
  assert(app.potentialAction?.['@type'] === 'UseAction', `${file} WebApplication action type is wrong`)
  assert(app.potentialAction?.name === 'Open Slay PDF', `${file} WebApplication action name is wrong`)
  assert(app.potentialAction?.target?.['@type'] === 'EntryPoint', `${file} WebApplication action target type is wrong`)
  assert(app.potentialAction?.target?.urlTemplate === `${site}/`, `${file} WebApplication action target URL is wrong`)
  assert(JSON.stringify(app.potentialAction?.target?.actionPlatform) === JSON.stringify(appActionPlatform), `${file} WebApplication action platforms are wrong`)
}

const sitemap = await readPublic('sitemap.xml')
const sitemapLocs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const sitemapEntries = [...sitemap.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<lastmod>(.*?)<\/lastmod>[\s\S]*?<changefreq>(.*?)<\/changefreq>[\s\S]*?<priority>(.*?)<\/priority>[\s\S]*?<\/url>/g)]
  .map((match) => ({
    url: match[1],
    lastmod: match[2],
    changefreq: match[3],
    priority: Number(match[4]),
  }))
const urls = sitemapEntries.map((entry) => entry.url)
const sitemapMetadata = new Map(sitemapEntries.map((entry) => [entry.url, entry]))
const prominentSitePaths = [
  '/',
  '/free-pdf-editor.html',
  '/tools.html',
  '/search.html',
  '/sitemap.html',
  '/privacy.html',
  '/pdf-privacy-security.html',
  '/pdf-privacy-checklist.html',
  '/online-pdf-editor.html',
  '/adobe-acrobat-alternative.html',
  '/edit-pdf-without-uploading.html',
  '/secure-pdf-editor.html',
  '/browser-pdf-editor.html',
]
const prominentSiteUrls = prominentSitePaths.map((path) => new URL(path, `${site}/`).href)
const prominentNavigationUrls = prominentSiteUrls.filter((url) => url !== `${site}/`)
assert(urls.includes(`${site}/`), 'sitemap is missing homepage')
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'sitemap is missing xhtml namespace for hreflang alternates')
assert(new Set(urls).size === urls.length, 'sitemap contains duplicate URLs')
assert(sitemapEntries.length === sitemapLocs.length, 'every sitemap URL must include lastmod, changefreq and priority')
for (const entry of sitemapEntries) {
  const urlBlock = sitemap.match(new RegExp(`<url>[\\s\\S]*?<loc>${entry.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>[\\s\\S]*?<\\/url>`))?.[0] ?? ''
  assert(urlBlock.includes(`<xhtml:link rel="alternate" hreflang="en" href="${entry.url}" />`), `${entry.url} sitemap is missing en hreflang alternate`)
  assert(urlBlock.includes(`<xhtml:link rel="alternate" hreflang="x-default" href="${entry.url}" />`), `${entry.url} sitemap is missing x-default hreflang alternate`)
  assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod), `${entry.url} sitemap lastmod must be YYYY-MM-DD`)
  assert(['daily', 'weekly', 'monthly', 'yearly'].includes(entry.changefreq), `${entry.url} sitemap changefreq is invalid`)
  assert(Number.isFinite(entry.priority) && entry.priority >= 0 && entry.priority <= 1, `${entry.url} sitemap priority must be 0-1`)
}

const pageMetadata = new Map()
const htmlUrls = urls.filter((url) => url.endsWith('.html'))
const titles = new Map()
const descriptions = new Map()
const requiredDiscoveryLinks = [
  ['search', 'application/opensearchdescription+xml', 'Slay PDF tool search', `${site}/opensearch.xml`],
  ['alternate', 'application/rss+xml', 'Slay PDF discovery feed', `${site}/feed.xml`],
  ['alternate', 'application/feed+json', 'Slay PDF JSON discovery feed', `${site}/feed.json`],
  ['alternate', 'application/json', 'Slay PDF structured page index', `${site}/pages.json`],
  ['alternate', 'text/plain', 'Slay PDF compact LLM index', `${site}/llms.txt`],
  ['alternate', 'text/plain', 'Slay PDF full text LLM index', `${site}/llms-full.txt`],
]
const requiredAppHead = [
  '<meta name="theme-color" content="#f7f7f4" />',
  '<meta name="application-name" content="Slay PDF" />',
  '<meta name="apple-mobile-web-app-title" content="Slay PDF" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<link rel="manifest" href="/manifest.webmanifest" />',
]
const requiredStaticAppHead = [
  ...requiredAppHead,
]
const requiredSocialTags = [
  ['property', 'og:type', 'website'],
  ['property', 'og:locale', 'en_US'],
  ['property', 'og:site_name', 'Slay PDF'],
  ['property', 'og:image:type', 'image/png'],
  ['property', 'og:image:width', '1200'],
  ['property', 'og:image:height', '630'],
  ['property', 'og:image:alt', 'Slay PDF local PDF editor preview'],
  ['name', 'twitter:card', 'summary_large_image'],
  ['name', 'twitter:image', 'https://slaypdf.com/og-image.png'],
  ['name', 'twitter:image:alt', 'Slay PDF local PDF editor preview'],
]
const expectedWebPageAbout = new Map([
  ['adobe-acrobat-vs-slay-pdf.html', ['PDF editor', 'Adobe Acrobat alternative', 'Local PDF editing']],
  ['free-adobe-pdf-editor-alternative.html', ['PDF editor', 'Adobe Acrobat alternative', 'Local PDF editing']],
])
for (const url of htmlUrls) {
  const file = basename(new URL(url).pathname)
  const html = await readPublic(file)
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim()
  const h1 = html.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim()
  assert(title && title.length >= 15 && title.length <= 70, `${file} title should be 15-70 characters`)
  assert(description && description.length >= 80 && description.length <= 180, `${file} description should be 80-180 characters`)
  assert(h1, `${file} is missing a visible h1`)
  assert(html.includes(`rel="canonical" href="${url}"`), `${file} canonical does not match sitemap URL`)
  assert(html.includes(`rel="alternate" hreflang="en" href="${url}"`), `${file} is missing English hreflang alternate`)
  assert(html.includes(`rel="alternate" hreflang="x-default" href="${url}"`), `${file} is missing x-default hreflang alternate`)
  for (const [rel, type, title, href] of requiredDiscoveryLinks) {
    assert(html.includes(`rel="${rel}" type="${type}" title="${title}" href="${href}"`), `${file} is missing ${title} discovery link`)
  }
  for (const tag of requiredStaticAppHead) {
    assert(html.includes(tag), `${file} is missing app head metadata: ${tag}`)
  }
  assert(html.includes('name="robots" content="index, follow, max-image-preview:large"'), `${file} is missing indexable robots meta`)
  assert(html.includes(`property="og:url" content="${url}"`), `${file} Open Graph URL does not match sitemap URL`)
  const sitemapLastmod = sitemapMetadata.get(url)?.lastmod
  assert(sitemapLastmod, `${file} is missing sitemap lastmod data`)
  assert(html.includes(`property="og:updated_time" content="${isoDate(sitemapLastmod)}"`), `${file} Open Graph updated time does not match sitemap lastmod`)
  assert(html.includes('property="og:title" content="'), `${file} is missing Open Graph title`)
  assert(html.includes('property="og:description" content="'), `${file} is missing Open Graph description`)
  assert(html.includes('property="og:image" content="https://slaypdf.com/og-image.png"'), `${file} is missing social preview image`)
  assert(html.includes('name="twitter:title" content="'), `${file} is missing Twitter title metadata`)
  assert(html.includes('name="twitter:description" content="'), `${file} is missing Twitter description metadata`)
  for (const [attribute, name, content] of requiredSocialTags) {
    assert(html.includes(`${attribute}="${name}" content="${content}"`), `${file} is missing ${name} metadata`)
  }
  assert(html.includes('aria-label="Breadcrumb"'), `${file} is missing visible breadcrumbs`)
  assert(html.includes('data-managed="breadcrumb"'), `${file} is missing managed breadcrumb JSON-LD`)
  assert(html.includes('"@type": "BreadcrumbList"'), `${file} is missing breadcrumb JSON-LD`)
  assertWebPageSchema({ html, file, url, title, description, h1 })
  assertRichEntitySchema({ html, file, url })
  assertToolAppSchema({ html, file, url, title, description, h1 })
  assertHowToSchema({ html, file, url, title, description })
  assert(!titles.has(title), `${file} title duplicates ${titles.get(title)}`)
  assert(!descriptions.has(description), `${file} description duplicates ${descriptions.get(description)}`)
  titles.set(title, file)
  descriptions.set(description, file)
  pageMetadata.set(url, { title, description, h1 })
}

const rootHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
for (const [rel, type, title, href] of requiredDiscoveryLinks) {
  assert(rootHtml.includes(`rel="${rel}" type="${type}" title="${title}" href="${href}"`), `homepage is missing ${title} discovery link`)
}
for (const tag of requiredAppHead) {
  assert(rootHtml.includes(tag), `homepage is missing app head metadata: ${tag}`)
}
assert(rootHtml.includes(`rel="alternate" hreflang="en" href="${site}/"`), 'homepage is missing English hreflang alternate')
assert(rootHtml.includes(`rel="alternate" hreflang="x-default" href="${site}/"`), 'homepage is missing x-default hreflang alternate')
for (const [attribute, name, content] of requiredSocialTags) {
  assert(rootHtml.includes(`${attribute}="${name}" content="${content}"`), `homepage is missing ${name} metadata`)
}
const rootMetadata = {
  title: rootHtml.match(/<title>([^<]+)<\/title>/)?.[1]?.trim(),
  description: rootHtml.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim(),
  h1: rootHtml.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim(),
}
assertWebPageSchema({
  html: rootHtml,
  file: 'index.html',
  url: `${site}/`,
  ...rootMetadata,
})
assertRichEntitySchema({ html: rootHtml, file: 'index.html', url: `${site}/` })
pageMetadata.set(`${site}/`, rootMetadata)
assertSiteIdentitySchema(rootHtml, 'index.html')

const noscriptNav = rootHtml.match(/<nav aria-label="PDF tools">([\s\S]*?)<\/nav>/)?.[1]
assert(noscriptNav, 'homepage is missing noscript PDF tools navigation')
const noscriptPaths = [...noscriptNav.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1])
const expectedNoscriptPaths = prominentNavigationUrls.map((url) => new URL(url).pathname)
assert(JSON.stringify(noscriptPaths) === JSON.stringify(expectedNoscriptPaths), 'homepage noscript PDF tools navigation must match prominent HTML page order')

const indexNow = JSON.parse(await readPublic('indexnow.json'))
assert(indexNow.host === 'slaypdf.com', 'IndexNow host is wrong')
assert(indexNow.keyLocation === `${site}/${indexNow.key}.txt`, 'IndexNow keyLocation does not match key')
assert((await readPublic(`${indexNow.key}.txt`)).trim() === indexNow.key, 'IndexNow key file content does not match payload key')
assert(indexNow.urlList.length === urls.length, 'IndexNow URL count differs from sitemap URL count')
for (const url of indexNow.urlList) assert(urls.includes(url), `IndexNow URL is missing from sitemap: ${url}`)

const pagesTxt = (await readPublic('pages.txt')).trim().split(/\n+/)
assert(JSON.stringify(pagesTxt) === JSON.stringify(urls), 'pages.txt must match sitemap URL order exactly')

const pagesJson = JSON.parse(await readPublic('pages.json'))
assert(pagesJson.site === site, 'pages.json site is wrong')
assert(pagesJson.generatedFrom === `${site}/sitemap.xml`, 'pages.json generatedFrom is wrong')
assert(Array.isArray(pagesJson.pages), 'pages.json pages must be an array')
assert(pagesJson.pages.length === urls.length, 'pages.json URL count differs from sitemap URL count')
for (const [index, page] of pagesJson.pages.entries()) {
  const expectedUrl = urls[index]
  const expected = pageMetadata.get(expectedUrl)
  assert(page.url === expectedUrl, `pages.json URL order mismatch at ${index}`)
  assert(page.path === new URL(expectedUrl).pathname, `pages.json path mismatch for ${expectedUrl}`)
  assert(page.title === expected?.title, `pages.json title mismatch for ${expectedUrl}`)
  assert(page.description === expected?.description, `pages.json description mismatch for ${expectedUrl}`)
  assert(page.h1 === expected?.h1, `pages.json h1 mismatch for ${expectedUrl}`)
  assert(page.lastmod === sitemapMetadata.get(expectedUrl)?.lastmod, `pages.json lastmod mismatch for ${expectedUrl}`)
  assert(page.changefreq === sitemapMetadata.get(expectedUrl)?.changefreq, `pages.json changefreq mismatch for ${expectedUrl}`)
  assert(page.priority === sitemapMetadata.get(expectedUrl)?.priority, `pages.json priority mismatch for ${expectedUrl}`)
  assert(page.webpageId === `${expectedUrl}#webpage`, `pages.json webpageId mismatch for ${expectedUrl}`)
  if (expectedUrl.endsWith('.html')) {
    assert(page.breadcrumbId === `${expectedUrl}#breadcrumb`, `pages.json breadcrumbId mismatch for ${expectedUrl}`)
  } else {
    assert(!page.breadcrumbId, `pages.json root page should not include a breadcrumbId`)
  }
}

const imageSitemap = await readPublic('image-sitemap.xml')
assert(imageSitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'image-sitemap.xml is missing XML declaration')
assert(imageSitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), 'image-sitemap.xml is missing image namespace')
const imageSitemapEntries = [...imageSitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<image:image>\s*<image:loc>(.*?)<\/image:loc>\s*<image:title>([\s\S]*?)<\/image:title>\s*<image:caption>([\s\S]*?)<\/image:caption>\s*<\/image:image>\s*<\/url>/g)]
  .map((match) => ({
    url: decodeXml(match[1]),
    image: decodeXml(match[2]),
    title: decodeXml(match[3]),
    caption: decodeXml(match[4]),
  }))
assert(imageSitemapEntries.length === pagesJson.pages.length, 'image-sitemap.xml URL count differs from pages.json')
for (const [index, entry] of imageSitemapEntries.entries()) {
  const page = pagesJson.pages[index]
  assert(entry.url === page.url, `image-sitemap.xml URL mismatch at ${index}`)
  assert(entry.image === `${site}/og-image.png`, `image-sitemap.xml image URL mismatch for ${entry.url}`)
  assert(entry.title === page.title, `image-sitemap.xml title mismatch for ${entry.url}`)
  assert(entry.caption === page.description, `image-sitemap.xml caption mismatch for ${entry.url}`)
}

const latestLastmod = sitemapEntries.map((entry) => entry.lastmod).sort().at(-1)
const sitemapIndex = await readPublic('sitemap-index.xml')
assert(sitemapIndex.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap-index.xml is missing XML declaration')
assert(sitemapIndex.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap-index.xml is missing sitemapindex namespace')
const sitemapIndexEntries = [...sitemapIndex.matchAll(/<sitemap>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<\/sitemap>/g)]
  .map((match) => ({
    loc: decodeXml(match[1]),
    lastmod: match[2],
  }))
assert(JSON.stringify(sitemapIndexEntries.map((entry) => entry.loc)) === JSON.stringify([`${site}/sitemap.xml`, `${site}/image-sitemap.xml`]), 'sitemap-index.xml must list canonical and image sitemaps in order')
for (const entry of sitemapIndexEntries) {
  assert(entry.lastmod === latestLastmod, `${entry.loc} sitemap-index.xml lastmod must match latest sitemap lastmod`)
  assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod), `${entry.loc} sitemap-index.xml lastmod must be YYYY-MM-DD`)
}

const feed = await readPublic('feed.xml')
assert(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'feed.xml is missing XML declaration')
assert(feed.includes('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'), 'feed.xml is not an RSS 2.0 feed')
assert(feed.includes('<title>Slay PDF pages</title>'), 'feed.xml channel title is wrong')
assert(feed.includes(`<link>${site}/</link>`), 'feed.xml channel link is wrong')
assert(feed.includes(`<atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />`), 'feed.xml self link is wrong')
assert(feed.includes(`<lastBuildDate>${pubDate(latestLastmod)}</lastBuildDate>`), 'feed.xml lastBuildDate does not match sitemap')
const feedItems = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
  const item = match[1]
  return {
    title: decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? ''),
    link: decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? ''),
    guid: decodeXml(item.match(/<guid isPermaLink="true">([\s\S]*?)<\/guid>/)?.[1]?.trim() ?? ''),
    description: decodeXml(item.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() ?? ''),
    pubDate: item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim(),
  }
})
assert(feedItems.length === pagesJson.pages.length, 'feed.xml item count differs from pages.json')
for (const [index, item] of feedItems.entries()) {
  const page = pagesJson.pages[index]
  assert(item.title === page.title, `feed.xml title mismatch at ${index}`)
  assert(item.link === page.url, `feed.xml link mismatch at ${index}`)
  assert(item.guid === page.url, `feed.xml guid mismatch at ${index}`)
  assert(item.description === page.description, `feed.xml description mismatch at ${index}`)
  assert(item.pubDate === pubDate(page.lastmod), `feed.xml pubDate mismatch at ${index}`)
}

const jsonFeed = JSON.parse(await readPublic('feed.json'))
assert(jsonFeed.version === 'https://jsonfeed.org/version/1.1', 'feed.json version is wrong')
assert(jsonFeed.title === 'Slay PDF pages', 'feed.json title is wrong')
assert(jsonFeed.home_page_url === `${site}/`, 'feed.json home_page_url is wrong')
assert(jsonFeed.feed_url === `${site}/feed.json`, 'feed.json feed_url is wrong')
assert(jsonFeed.description === 'Canonical Slay PDF app, tool and guide pages for local PDF editing.', 'feed.json description is wrong')
assert(jsonFeed.language === 'en', 'feed.json language is wrong')
assert(Array.isArray(jsonFeed.items), 'feed.json items must be an array')
assert(jsonFeed.items.length === pagesJson.pages.length, 'feed.json item count differs from pages.json')
for (const [index, item] of jsonFeed.items.entries()) {
  const page = pagesJson.pages[index]
  assert(item.id === page.url, `feed.json id mismatch at ${index}`)
  assert(item.url === page.url, `feed.json url mismatch at ${index}`)
  assert(item.title === page.title, `feed.json title mismatch at ${index}`)
  assert(item.summary === page.description, `feed.json summary mismatch at ${index}`)
  assert(item.content_text === page.description, `feed.json content_text mismatch at ${index}`)
  assert(item.date_modified === isoDate(page.lastmod), `feed.json date_modified mismatch at ${index}`)
}

const toolsHtml = await readPublic('tools.html')
const toolsStructuredData = structuredDataBlocks(toolsHtml, 'tools.html')
const itemList = toolsStructuredData.find((block) => block['@type'] === 'ItemList')
assert(itemList, 'tools.html is missing ItemList JSON-LD')
const itemListUrls = itemList.itemListElement?.map((item) => item.url) ?? []
const toolsChildUrls = visibleRelatedLinks(toolsHtml, `${site}/tools.html`).filter((url) => url !== `${site}/sitemap.html`)
assert(new Set(toolsChildUrls).size === toolsChildUrls.length, 'tools.html visible catalog links must be unique')
for (const url of toolsChildUrls) assert(htmlUrls.includes(url), `tools.html visible catalog URL is missing from sitemap: ${url}`)
assert(itemList['@id'] === `${site}/tools.html#itemlist`, 'tools.html ItemList @id is wrong')
assert(itemList.url === `${site}/tools.html`, 'tools.html ItemList URL is wrong')
assert(itemList.description === 'Crawlable catalog of Slay PDF local PDF editor tools, workflows, guides and Adobe Acrobat alternative pages.', 'tools.html ItemList description is wrong')
assert(itemList.mainEntityOfPage?.['@id'] === `${site}/tools.html#webpage`, 'tools.html ItemList mainEntityOfPage is wrong')
assert(itemList.numberOfItems === toolsChildUrls.length, 'tools.html ItemList numberOfItems is wrong')
assert(itemListUrls.length === toolsChildUrls.length, 'tools.html ItemList count must match linked sitemap pages')
for (const [index, url] of toolsChildUrls.entries()) {
  const item = itemList.itemListElement[index]
  const metadata = pageMetadata.get(url)
  assert(itemListUrls[index] === url, `tools.html ItemList URL mismatch at position ${index + 1}`)
  assert(item.position === index + 1, `tools.html ItemList position mismatch for ${url}`)
  assert(item.name === metadata?.title?.replace(/ - Slay PDF$/, ''), `tools.html ItemList name mismatch for ${url}`)
  assert(item.description === metadata?.description, `tools.html ItemList description mismatch for ${url}`)
  assert(item.item?.['@type'] === 'WebPage', `tools.html ItemList nested item type mismatch for ${url}`)
  assert(item.item?.['@id'] === `${url}#webpage`, `tools.html ItemList nested WebPage ID mismatch for ${url}`)
  assert(item.item?.url === url, `tools.html ItemList nested WebPage URL mismatch for ${url}`)
  assert(item.item?.name === metadata?.title, `tools.html ItemList nested WebPage name mismatch for ${url}`)
  assert(item.item?.description === metadata?.description, `tools.html ItemList nested WebPage description mismatch for ${url}`)
  assert(toolsHtml.includes(`href="${new URL(url).pathname}"`), `tools.html is missing visible link to ${url}`)
}

const htmlSitemap = await readPublic('sitemap.html')
assert(htmlSitemap.includes('HTML Sitemap - Slay PDF'), 'sitemap.html is missing page title')
for (const url of urls) assert(htmlSitemap.includes(`href="${new URL(url).pathname}"`), `sitemap.html is missing visible link to ${url}`)

const llms = await readPublic('llms.txt')
assert(llms.includes('## Canonical Pages'), 'llms.txt is missing canonical pages section')
assert(llms.includes('## Discovery Files'), 'llms.txt is missing discovery files section')
assert(llms.includes('## Use Cases'), 'llms.txt is missing use cases section')
for (const page of pagesJson.pages) {
  assert(llms.includes(`- ${page.title}: ${page.url}`), `llms.txt is missing page heading for ${page.url}`)
  assert(llms.includes(`  Summary: ${page.description}`), `llms.txt is missing page summary for ${page.url}`)
  assert(llms.includes(`  Last modified: ${page.lastmod}`), `llms.txt is missing page lastmod for ${page.url}`)
}
assert(llms.includes(`${site}/sitemap-index.xml`), 'llms.txt is missing sitemap-index.xml')
assert(llms.includes(`${site}/sitemap.xml`), 'llms.txt is missing sitemap.xml')
assert(llms.includes(`${site}/image-sitemap.xml`), 'llms.txt is missing image-sitemap.xml')
assert(llms.includes(`${site}/opensearch.xml`), 'llms.txt is missing opensearch.xml')
assert(llms.includes(`${site}/pages.txt`), 'llms.txt is missing pages.txt')
assert(llms.includes(`${site}/pages.json`), 'llms.txt is missing pages.json')
assert(llms.includes(`${site}/feed.xml`), 'llms.txt is missing feed.xml')
assert(llms.includes(`${site}/feed.json`), 'llms.txt is missing feed.json')
assert(llms.includes(`${site}/llms-full.txt`), 'llms.txt is missing llms-full.txt')

const llmsFull = await readPublic('llms-full.txt')
assert(llmsFull.startsWith('# Slay PDF full text index'), 'llms-full.txt is missing title')
assert(llmsFull.includes(`Site: ${site}/`), 'llms-full.txt is missing site URL')
assert(llmsFull.includes(`Sitemap index: ${site}/sitemap-index.xml`), 'llms-full.txt is missing sitemap-index.xml reference')
assert(llmsFull.includes(`Canonical sitemap: ${site}/sitemap.xml`), 'llms-full.txt is missing sitemap.xml reference')
assert(llmsFull.includes(`Image sitemap: ${site}/image-sitemap.xml`), 'llms-full.txt is missing image-sitemap.xml reference')
assert(llmsFull.includes(`OpenSearch description: ${site}/opensearch.xml`), 'llms-full.txt is missing opensearch.xml reference')
assert(llmsFull.includes(`Source index: ${site}/pages.json`), 'llms-full.txt is missing pages.json reference')
assert(llmsFull.includes(`Compact index: ${site}/llms.txt`), 'llms-full.txt is missing llms.txt reference')
for (const page of pagesJson.pages) {
  assert(llmsFull.includes(`## ${page.title}`), `llms-full.txt is missing page heading for ${page.url}`)
  assert(llmsFull.includes(`URL: ${page.url}`), `llms-full.txt is missing URL for ${page.url}`)
  assert(llmsFull.includes(`Last modified: ${page.lastmod}`), `llms-full.txt is missing lastmod for ${page.url}`)
  assert(llmsFull.includes(`Summary: ${page.description}`), `llms-full.txt is missing summary for ${page.url}`)
  assert(llmsFull.includes(`H1: ${page.h1}`), `llms-full.txt is missing h1 for ${page.url}`)
}
assert(llmsFull.includes('Related links:'), 'llms-full.txt is missing related links')
assert(llmsFull.includes('Free PDF editor: Merge, split, sign, resize and edit PDFs locally.: https://slaypdf.com/free-pdf-editor.html'), 'llms-full.txt is missing formatted tool-list link')

const robots = await readPublic('robots.txt')
assert(robots.includes(`Sitemap: ${site}/sitemap-index.xml`), 'robots.txt is missing sitemap-index.xml')
assert(robots.includes(`Sitemap: ${site}/sitemap.xml`), 'robots.txt is missing sitemap.xml')
assert(robots.includes(`Sitemap: ${site}/image-sitemap.xml`), 'robots.txt is missing image-sitemap.xml')
assert(robots.includes(`${site}/feed.xml`), 'robots.txt discovery comment is missing feed.xml')
assert(robots.includes(`${site}/feed.json`), 'robots.txt discovery comment is missing feed.json')
assert(robots.includes(`${site}/opensearch.xml`), 'robots.txt discovery comment is missing opensearch.xml')
assert(robots.includes(`${site}/llms.txt`), 'robots.txt discovery comment is missing llms.txt')
assert(robots.includes(`${site}/llms-full.txt`), 'robots.txt discovery comment is missing llms-full.txt')

const opensearch = await readPublic('opensearch.xml')
assert(opensearch.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'opensearch.xml is missing XML declaration')
assert(opensearch.includes('<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">'), 'opensearch.xml is missing OpenSearch namespace')
assert(opensearch.includes('<ShortName>Slay PDF</ShortName>'), 'opensearch.xml short name is wrong')
assert(opensearch.includes('<Description>Search Slay PDF tools and local PDF editing guides.</Description>'), 'opensearch.xml description is wrong')
assert(opensearch.includes('<InputEncoding>UTF-8</InputEncoding>'), 'opensearch.xml input encoding is wrong')
assert(opensearch.includes(`<Url type="text/html" method="get" template="${site}/search.html?q={searchTerms}" />`), 'opensearch.xml search URL is wrong')

const securityTxt = await readPublic('.well-known/security.txt')
assert(securityTxt.includes('Contact: https://github.com/emileakbarzadeh/slay-pdf/issues/new'), 'security.txt contact is wrong')
assert(securityTxt.includes(`Canonical: ${site}/.well-known/security.txt`), 'security.txt canonical is wrong')
assert(securityTxt.includes('Policy: https://github.com/emileakbarzadeh/slay-pdf/security'), 'security.txt policy is wrong')
assert(securityTxt.includes('Preferred-Languages: en'), 'security.txt preferred language is wrong')
assert(/Expires: \d{4}-\d{2}-\d{2}T00:00:00Z/.test(securityTxt), 'security.txt expires value is wrong')

for (const asset of ['.nojekyll', 'CNAME', 'robots.txt', 'og-image.png', 'seo.css', 'opensearch.xml', 'pages.txt', 'pages.json', 'sitemap-index.xml', 'image-sitemap.xml', 'feed.xml', 'feed.json', 'llms.txt', 'llms-full.txt']) {
  await stat(new URL(asset, publicDir))
}

if (live) {
  for (const url of urls) {
    const response = await fetch(url, { redirect: 'manual' })
    assert(response.ok, `live URL failed ${response.status}: ${url}`)
  }
  const keyResponse = await fetch(indexNow.keyLocation)
  assert(keyResponse.ok, `live IndexNow key failed ${keyResponse.status}`)
  assert((await keyResponse.text()).trim() === indexNow.key, 'live IndexNow key content mismatch')
  const feedResponse = await fetch(`${site}/feed.xml`)
  assert(feedResponse.ok, `live feed failed ${feedResponse.status}`)
  assert((await feedResponse.text()).includes('<title>Slay PDF pages</title>'), 'live feed content mismatch')
  const jsonFeedResponse = await fetch(`${site}/feed.json`)
  assert(jsonFeedResponse.ok, `live JSON feed failed ${jsonFeedResponse.status}`)
  assert((await jsonFeedResponse.json()).title === 'Slay PDF pages', 'live JSON feed content mismatch')
  const opensearchResponse = await fetch(`${site}/opensearch.xml`)
  assert(opensearchResponse.ok, `live OpenSearch failed ${opensearchResponse.status}`)
  assert((await opensearchResponse.text()).includes(`<Url type="text/html" method="get" template="${site}/search.html?q={searchTerms}" />`), 'live OpenSearch content mismatch')
  const llmsFullResponse = await fetch(`${site}/llms-full.txt`)
  assert(llmsFullResponse.ok, `live llms-full.txt failed ${llmsFullResponse.status}`)
  assert((await llmsFullResponse.text()).includes('# Slay PDF full text index'), 'live llms-full.txt content mismatch')
  const imageSitemapResponse = await fetch(`${site}/image-sitemap.xml`)
  assert(imageSitemapResponse.ok, `live image sitemap failed ${imageSitemapResponse.status}`)
  assert((await imageSitemapResponse.text()).includes(`${site}/og-image.png`), 'live image sitemap content mismatch')
  const sitemapIndexResponse = await fetch(`${site}/sitemap-index.xml`)
  assert(sitemapIndexResponse.ok, `live sitemap index failed ${sitemapIndexResponse.status}`)
  const liveSitemapIndex = await sitemapIndexResponse.text()
  assert(liveSitemapIndex.includes(`${site}/sitemap.xml`) && liveSitemapIndex.includes(`${site}/image-sitemap.xml`), 'live sitemap index content mismatch')
  const securityTxtResponse = await fetch(`${site}/.well-known/security.txt`)
  assert(securityTxtResponse.ok, `live security.txt failed ${securityTxtResponse.status}`)
  assert((await securityTxtResponse.text()).includes(`Canonical: ${site}/.well-known/security.txt`), 'live security.txt content mismatch')
}

console.log(`SEO verification passed for ${urls.length} sitemap URLs${live ? ' and live deployment' : ''}.`)

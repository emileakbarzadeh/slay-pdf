import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const site = 'https://slaypdf.com'
const rootDir = new URL('../', import.meta.url)
const publicDir = new URL('../public/', import.meta.url)

const sitemapPage = {
  url: `${site}/sitemap.html`,
  title: 'HTML Sitemap - Slay PDF',
  description: 'Browse every canonical Slay PDF page for local PDF editing, PDF tools, private browser workflows and Adobe Acrobat alternative guides.',
  h1: 'Slay PDF sitemap',
}

const sections = [
  {
    title: 'Core pages',
    description: 'Start with the app, search page, complete tool index, HTML sitemap, privacy details and help pages.',
    paths: ['/', '/free-pdf-editor.html', '/tools.html', '/search.html', '/sitemap.html', '/faq.html', '/privacy.html'],
  },
  {
    title: 'Guides',
    description: 'Use these pages to pick the right private local workflow for online editing, no-upload documents, page organization and Acrobat comparisons.',
    paths: ['/online-pdf-editor.html', '/edit-pdf-without-uploading.html', '/organize-pdf-pages.html', '/adobe-acrobat-vs-slay-pdf.html'],
  },
  {
    title: 'PDF workflows',
    description: 'Step-by-step local workflows for combining, removing, extracting, searching, signing and redacting PDF content.',
    paths: ['/combine-pdf-files.html', '/remove-pages-from-pdf.html', '/extract-pages-from-pdf.html', '/make-pdf-searchable.html', '/add-signature-to-pdf.html', '/pdf-redaction-tool.html'],
  },
  {
    title: 'Image, scan and print workflows',
    description: 'Convert images, clean scans, flatten forms and build printable poster PDFs without uploading documents.',
    paths: ['/images-to-pdf.html', '/jpg-to-pdf.html', '/png-to-pdf.html', '/edit-scanned-pdf.html', '/flatten-pdf.html', '/printable-poster-pdf.html'],
  },
  {
    title: 'Tools',
    description: 'Direct links to each local PDF tool for editing, exporting, protecting and reorganizing documents in the browser.',
    paths: ['/merge-pdf.html', '/split-pdf.html', '/sign-pdf.html', '/posterise-pdf.html', '/private-pdf-editor.html', '/delete-pdf-pages.html', '/resize-pdf.html', '/crop-pdf.html', '/redact-pdf.html', '/compress-pdf.html', '/ocr-pdf.html', '/pdf-to-images.html', '/extract-pdf-text.html', '/rotate-pdf.html', '/annotate-pdf.html', '/watermark-pdf.html', '/add-page-numbers-to-pdf.html', '/fill-pdf-forms.html', '/password-protect-pdf.html'],
  },
  {
    title: 'Adobe alternatives',
    description: 'Acrobat-style workflows for people who want merge, compress, fill, sign, OCR, protect, rotate, crop, delete, extract, convert and organize jobs handled locally.',
    paths: ['/adobe-acrobat-alternative.html', '/free-adobe-pdf-editor-alternative.html', '/acrobat-online-alternative.html', '/adobe-pdf-merge-alternative.html', '/adobe-compress-pdf-alternative.html', '/adobe-fill-and-sign-alternative.html', '/adobe-pdf-organizer-alternative.html', '/adobe-split-pdf-alternative.html', '/adobe-sign-pdf-alternative.html', '/adobe-redact-pdf-alternative.html', '/adobe-ocr-pdf-alternative.html', '/adobe-protect-pdf-alternative.html', '/adobe-rotate-pdf-alternative.html', '/adobe-crop-pdf-alternative.html', '/adobe-delete-pages-pdf-alternative.html', '/adobe-extract-pages-pdf-alternative.html', '/adobe-pdf-to-jpg-alternative.html', '/adobe-add-page-numbers-alternative.html', '/adobe-acrobat-pro-alternative.html', '/adobe-pdf-editor-no-subscription.html', '/adobe-pdf-editor-without-login.html', '/adobe-local-pdf-editor-alternative.html', '/edit-pdf-without-adobe.html', '/merge-pdf-without-adobe.html', '/sign-pdf-without-adobe.html', '/compress-pdf-without-adobe.html', '/edit-pdf-without-acrobat.html', '/merge-pdf-without-acrobat.html', '/sign-pdf-without-acrobat.html', '/compress-pdf-without-acrobat.html', '/redact-pdf-without-adobe.html', '/password-protect-pdf-without-adobe.html', '/fill-pdf-forms-without-adobe.html', '/rotate-pdf-without-adobe.html', '/redact-pdf-without-acrobat.html', '/password-protect-pdf-without-acrobat.html', '/fill-pdf-forms-without-acrobat.html', '/rotate-pdf-without-acrobat.html'],
  },
  {
    title: 'PDF editor alternatives',
    description: 'Local browser alternatives for common PDF utility searches, with no signup and no Slay PDF app-server document uploads.',
    paths: ['/smallpdf-alternative.html', '/ilovepdf-alternative.html', '/sejda-alternative.html', '/pdf24-alternative.html'],
  },
  {
    title: 'Local PDF task pages',
    description: 'High-intent local PDF merger, splitter, signer and redactor pages for people avoiding remote document uploads.',
    paths: ['/local-pdf-merger.html', '/local-pdf-splitter.html', '/local-pdf-signer.html', '/local-pdf-redactor.html'],
  },
  {
    title: 'Free online PDF task pages',
    description: 'Free online PDF merger, splitter, signer and redactor pages that explain the local browser workflow behind the web app.',
    paths: ['/free-online-pdf-merger.html', '/free-online-pdf-splitter.html', '/free-online-pdf-signer.html', '/free-online-pdf-redactor.html'],
  },
  {
    title: 'Secure PDF task pages',
    description: 'Secure PDF merger, splitter, signer and redactor pages for local browser workflows on private documents.',
    paths: ['/secure-pdf-merger.html', '/secure-pdf-splitter.html', '/secure-pdf-signer.html', '/secure-pdf-redactor.html'],
  },
  {
    title: 'Private PDF task pages',
    description: 'Private PDF merger, splitter, signer and redactor pages for browser-only document handling.',
    paths: ['/private-pdf-merger.html', '/private-pdf-splitter.html', '/private-pdf-signer.html', '/private-pdf-redactor.html'],
  },
  {
    title: 'No-watermark PDF task pages',
    description: 'No-watermark PDF task pages for clean local merge, split, sign, redact, compress, rotate, crop and OCR exports.',
    paths: ['/merge-pdf-no-watermark.html', '/split-pdf-no-watermark.html', '/sign-pdf-no-watermark.html', '/redact-pdf-no-watermark.html', '/compress-pdf-no-watermark.html', '/rotate-pdf-no-watermark.html', '/crop-pdf-no-watermark.html', '/ocr-pdf-no-watermark.html'],
  },
  {
    title: 'Open source and local app pages',
    description: 'Pages for open source, client-side, offline-capable and transparent local PDF editor searches.',
    paths: ['/open-source-pdf-editor.html', '/open-source-adobe-acrobat-alternative.html', '/offline-pdf-editor.html', '/client-side-pdf-editor.html'],
  },
  {
    title: 'Role and document workflows',
    description: 'Pages for students, teachers, business documents and contract PDFs where a local browser editor can handle the job.',
    paths: ['/pdf-editor-for-students.html', '/pdf-editor-for-teachers.html', '/pdf-editor-for-business.html', '/contract-pdf-editor.html'],
  },
  {
    title: 'Everyday document workflows',
    description: 'Practical local PDF pages for invoices, receipts, tax paperwork and resumes that need quick cleanup before sharing or filing.',
    paths: ['/invoice-pdf-editor.html', '/receipt-pdf-organizer.html', '/tax-document-pdf-editor.html', '/resume-pdf-editor.html'],
  },
  {
    title: 'No-upload tool workflows',
    description: 'Direct pages for common private PDF jobs where local browser editing matters more than app-server upload workflows.',
    paths: ['/merge-pdf-without-uploading.html', '/split-pdf-without-uploading.html', '/sign-pdf-without-uploading.html', '/redact-pdf-without-uploading.html', '/compress-pdf-without-uploading.html', '/rotate-pdf-without-uploading.html', '/crop-pdf-without-uploading.html', '/password-protect-pdf-without-uploading.html', '/pdf-to-images-without-uploading.html', '/extract-pdf-text-without-uploading.html', '/ocr-pdf-without-uploading.html', '/fill-pdf-forms-without-uploading.html'],
  },
  {
    title: 'No-account and platform pages',
    description: 'Browser-first pages for no-signup, no-watermark, secure local editing and common desktop, mobile and Chromebook searches.',
    paths: ['/merge-pdf-no-signup.html', '/split-pdf-no-signup.html', '/sign-pdf-no-signup.html', '/redact-pdf-no-signup.html', '/compress-pdf-no-signup.html', '/rotate-pdf-no-signup.html', '/crop-pdf-no-signup.html', '/ocr-pdf-no-signup.html', '/free-pdf-editor-no-signup.html', '/pdf-editor-no-watermark.html', '/secure-pdf-editor.html', '/browser-pdf-editor.html', '/pdf-editor-for-mac.html', '/pdf-editor-for-windows.html', '/pdf-editor-for-chromebook.html', '/pdf-editor-for-linux.html', '/pdf-editor-for-iphone-ipad.html', '/android-pdf-editor.html'],
  },
]

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pathFor(url) {
  return new URL(url).pathname
}

async function htmlForPath(path) {
  if (path === '/') return readFile(new URL('index.html', rootDir), 'utf8')
  if (path === '/sitemap.html') return undefined
  return readFile(new URL(basename(path), publicDir), 'utf8')
}

async function pageForUrl(url) {
  const path = pathFor(url)
  if (path === '/sitemap.html') return { ...sitemapPage, path }

  const html = await htmlForPath(path)
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim()
  const h1 = html.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim()

  if (!title || !description || !h1) throw new Error(`Missing sitemap page metadata for ${url}`)
  return { url, path, title, description, h1 }
}

const sitemap = await readFile(new URL('sitemap.xml', publicDir), 'utf8')
const urls = [...sitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const pages = new Map()

for (const url of urls) {
  const page = await pageForUrl(url)
  pages.set(page.path, page)
}

for (const section of sections) {
  for (const path of section.paths) {
    if (!pages.has(path)) throw new Error(`HTML sitemap section references missing sitemap path: ${path}`)
  }
}

const sectionPaths = new Set(sections.flatMap((section) => section.paths))
const uncategorized = [...pages.keys()].filter((path) => !sectionPaths.has(path))
if (uncategorized.length > 0) throw new Error(`HTML sitemap is missing categories for: ${uncategorized.join(', ')}`)

const sectionHtml = sections.map((section) => `      <section class="content">
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.description)}</p>
      </section>
      <div class="links" aria-label="${escapeHtml(section.title)}">
${section.paths.map((path) => {
    const page = pages.get(path)
    return `        <a href="${escapeHtml(path)}">${escapeHtml(page.title.replace(/ - Slay PDF$/, ''))}</a>`
  }).join('\n')}
      </div>`).join('\n')

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="description" content="${escapeHtml(sitemapPage.description)}" />
    <link rel="canonical" href="${sitemapPage.url}" />
    <link rel="stylesheet" href="/seo.css" />
    <link rel="icon" href="/favicon.svg" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://slaypdf.com/#website",
        "name": "Slay PDF",
        "url": "https://slaypdf.com/"
      }
    </script>
    <title>${sitemapPage.title}</title>
  </head>
  <body>
    <main class="shell">
      <nav class="nav" aria-label="Slay PDF">
        <a class="brand" href="/"><span class="mark">S</span><span>Slay PDF</span></a>
        <a class="button" href="/">Open editor</a>
      </nav>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><a href="/tools.html">PDF tools</a><span>HTML Sitemap</span></nav>
      <section class="hero">
        <p class="kicker">Sitemap</p>
        <h1>${sitemapPage.h1}</h1>
        <p class="lead">Every canonical Slay PDF app, tool and guide page in one crawlable HTML index.</p>
      </section>
${sectionHtml}
      <footer>Open Slay PDF to edit PDFs locally, or use this sitemap to jump to a specific tool or guide.</footer>
    </main>
  </body>
</html>
`

await writeFile(new URL('sitemap.html', publicDir), html)

console.log(`Generated HTML sitemap for ${pages.size} URLs.`)

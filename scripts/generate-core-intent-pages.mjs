import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'pdf',
    title: 'PDF Editor and Tools - Slay PDF',
    kicker: 'PDF tools',
    h1: 'Open a local PDF workspace.',
    description: 'Open Slay PDF for local PDF editing tools: merge, split, sign, organize, redact, resize, OCR, annotate and export PDFs in your browser.',
    lead: 'Slay PDF is a browser workspace for everyday PDF jobs that should not require sending documents to another upload service.',
    featureLabel: 'PDF tool features',
    features: [
      ['Edit pages', 'Merge, split, reorder, rotate, delete, crop and resize PDF pages.'],
      ['Add marks', 'Place signatures, text, highlights, shapes, page numbers and watermarks.'],
      ['Export locally', 'Download PDFs, selected pages, separate PDFs, page images or extracted text.'],
    ],
    bodyHeading: 'A practical PDF workspace for common jobs.',
    body: [
      'Use Slay PDF when you need to clean up a PDF, combine files, sign a page, extract text, make a scan searchable or export only the pages that matter.',
      'The app opens from the web and runs common PDF editing work locally in the browser.',
    ],
    faqHeading: 'PDF tools FAQ',
    faqs: [
      ['What can I do with Slay PDF?', 'You can merge, split, sign, annotate, redact, rotate, crop, resize, OCR, extract text and export PDFs locally.'],
      ['Is Slay PDF only for one PDF at a time?', 'No. You can import multiple PDFs and image files into the same workspace.'],
      ['Do I need an account?', 'No. Common Slay PDF workflows do not require an account.'],
    ],
    links: [
      ['/free-pdf-editor.html', 'Free PDF editor'],
      ['/pdf-editor.html', 'PDF editor'],
      ['/tools.html', 'All PDF tools'],
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
    ],
    footer: 'Open Slay PDF for local browser PDF tools.',
  },
  {
    slug: 'pdf-editor',
    title: 'PDF Editor - Slay PDF',
    kicker: 'PDF editor',
    h1: 'Edit PDFs locally in your browser.',
    description: 'Use Slay PDF as a PDF editor for local browser workflows. Merge, split, sign, annotate, redact, resize, OCR and export PDFs without uploads.',
    lead: 'Slay PDF is a free PDF editor for common document cleanup, signing, page organization and local export jobs.',
    featureLabel: 'PDF editor features',
    features: [
      ['Page editor', 'Reorder pages, delete unwanted pages and open a page for visual edits.'],
      ['Document tools', 'Sign, annotate, redact, watermark, number pages, fill supported forms and OCR scans.'],
      ['Export options', 'Export all pages, selected pages, separate PDFs, page images or text.'],
    ],
    bodyHeading: 'A PDF editor built around local work.',
    body: [
      'Many PDF editor searches lead to upload-first tools. Slay PDF is built for the opposite path: open the app, import the document and finish common edits in the browser.',
      'Use Acrobat or a dedicated platform when you need enterprise controls. Use Slay PDF when the job is practical, private and local.',
    ],
    faqHeading: 'PDF editor FAQ',
    faqs: [
      ['Is Slay PDF a PDF editor?', 'Yes. It supports common PDF editing workflows such as page organization, visual edits, signing, annotation, redaction and export.'],
      ['Can I edit PDF text directly?', 'Slay PDF focuses on page edits and visual overlays rather than full paragraph reflow editing.'],
      ['Is it free?', 'Yes. Slay PDF is free for common local PDF workflows.'],
    ],
    links: [
      ['/edit-pdf.html', 'Edit PDF'],
      ['/free-pdf-editor.html', 'Free PDF editor'],
      ['/online-pdf-editor.html', 'Online PDF editor'],
      ['/pdf-editor-online-free.html', 'PDF editor online free'],
    ],
    footer: 'Open Slay PDF to edit PDFs locally.',
  },
  {
    slug: 'local-pdf-editor',
    title: 'Local PDF Editor - Slay PDF',
    kicker: 'Local PDF editor',
    h1: 'Use a local PDF editor in your browser.',
    description: 'Use Slay PDF as a local PDF editor. Edit, merge, split, sign, redact, OCR and export PDFs in your browser without app-server uploads.',
    lead: 'Slay PDF gives you local-first PDF editing from a static web app: convenient to open, but designed around browser-side document handling.',
    featureLabel: 'Local PDF editor features',
    features: [
      ['Browser processing', 'Common edits run in this browser rather than a Slay PDF app-server upload queue.'],
      ['Local workspace', 'Recent workspace data stays in browser storage and can be cleared.'],
      ['Private exports', 'Export PDFs locally, and passwords are never saved.'],
    ],
    bodyHeading: 'Local-first editing for sensitive PDFs.',
    body: [
      'A local PDF editor is useful for contracts, forms, scans, invoices, receipts and other documents that should not be handed to random converter sites.',
      'Slay PDF keeps common editing workflows on your device while still giving you web access from a modern browser.',
    ],
    faqHeading: 'Local PDF editor FAQ',
    faqs: [
      ['What does local PDF editor mean?', 'It means common PDF editing work runs in your browser rather than requiring a Slay PDF app-server document upload.'],
      ['Can I clear local workspace data?', 'Yes. Recent local workspace data can be cleared from the app.'],
      ['Can I use it offline?', 'Slay PDF is a static web app and can be installed as a PWA, subject to browser caching and device support.'],
    ],
    links: [
      ['/client-side-pdf-editor.html', 'Client-side PDF editor'],
      ['/offline-pdf-editor.html', 'Offline PDF editor'],
      ['/private-pdf-editor.html', 'Private PDF editor'],
      ['/secure-pdf-editor.html', 'Secure PDF editor'],
    ],
    footer: 'Open Slay PDF for local PDF editing.',
  },
  {
    slug: 'searchable-pdf',
    title: 'Searchable PDF - Slay PDF',
    kicker: 'Searchable PDF',
    h1: 'Create searchable PDFs locally.',
    description: 'Create searchable PDFs with Slay PDF. Run local English OCR on scanned pages and export searchable PDF files from your browser.',
    lead: 'Use Slay PDF when a scan or image-heavy PDF needs searchable text before archiving, sharing or filing.',
    featureLabel: 'Searchable PDF features',
    features: [
      ['English OCR', 'Run local English OCR on scanned PDF pages.'],
      ['Page cleanup', 'Rotate, crop, delete or reorder pages before OCR export.'],
      ['Local export', 'Download the searchable PDF from your browser.'],
    ],
    bodyHeading: 'Make scanned PDFs easier to find.',
    body: [
      'Searchable PDFs are useful for receipts, invoices, records, contracts and scanned packets where you need text search later.',
      'Slay PDF combines OCR with page cleanup so you can fix sideways scans or remove blank pages before export.',
    ],
    faqHeading: 'Searchable PDF FAQ',
    faqs: [
      ['Can Slay PDF make a scanned PDF searchable?', 'Yes. Slay PDF can run local English OCR and export searchable PDF files.'],
      ['Can I clean pages before OCR?', 'Yes. Rotate, crop, delete or reorder pages before exporting.'],
      ['Does OCR require uploading the PDF?', 'No. Common OCR work runs locally in this browser.'],
    ],
    links: [
      ['/make-pdf-searchable.html', 'Make PDF searchable'],
      ['/ocr-pdf.html', 'OCR PDF'],
      ['/local-pdf-ocr.html', 'Local PDF OCR'],
      ['/edit-scanned-pdf.html', 'Edit scanned PDF'],
    ],
    footer: 'Open Slay PDF to create searchable PDFs locally.',
  },
  {
    slug: 'no-upload-pdf-editor',
    title: 'No Upload PDF Editor - Slay PDF',
    kicker: 'No-upload PDF editor',
    h1: 'Edit PDFs without uploading them.',
    description: 'Use Slay PDF as a no-upload PDF editor. Merge, split, sign, redact, annotate, resize and export PDFs locally in your browser.',
    lead: 'Slay PDF is built for people who want online access without handing documents to an app-server upload workflow.',
    featureLabel: 'No-upload PDF editor features',
    features: [
      ['No app-server upload', 'Common PDF edits run locally in this browser.'],
      ['Sensitive document fit', 'Useful for forms, contracts, receipts, client files and scanned documents.'],
      ['Clear local state', 'Recent workspace data stays in browser storage and can be cleared.'],
    ],
    bodyHeading: 'Avoid upload-first PDF tools.',
    body: [
      'No-upload PDF editing matters when documents contain signatures, addresses, client details, financial records or internal notes.',
      'Slay PDF lets you open a web app and still keep common editing work local to the browser.',
    ],
    faqHeading: 'No-upload PDF editor FAQ',
    faqs: [
      ['Does Slay PDF upload my PDF to edit it?', 'No. Common editing and export workflows run locally in this browser.'],
      ['Can I still download edited PDFs?', 'Yes. Export all pages, selected pages or separate PDFs locally.'],
      ['Are passwords saved?', 'No. Passwords are never saved.'],
    ],
    links: [
      ['/edit-pdf-without-uploading.html', 'Edit PDF without uploading'],
      ['/private-pdf-editor.html', 'Private PDF editor'],
      ['/pdf-privacy-security.html', 'PDF privacy and security'],
      ['/pdf-privacy-checklist.html', 'PDF privacy checklist'],
    ],
    footer: 'Open Slay PDF when you need a no-upload PDF editor.',
  },
]

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pageHtml(page) {
  const canonical = `${site}/${page.slug}.html`
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="stylesheet" href="/seo.css" />
    <link rel="icon" href="/favicon.svg" />
    <title>${escapeHtml(page.title)}</title>
  </head>
  <body>
    <main class="shell">
      <nav class="nav" aria-label="Slay PDF">
        <a class="brand" href="/"><span class="mark">S</span><span>Slay PDF</span></a>
        <a class="button" href="/">Open editor</a>
      </nav>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><a href="/tools.html">PDF tools</a><span>${escapeHtml(page.title.replace(' - Slay PDF', ''))}</span></nav>
      <section class="hero">
        <p class="kicker">${escapeHtml(page.kicker)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p class="lead">${escapeHtml(page.lead)}</p>
      </section>
      <section class="grid" aria-label="${escapeHtml(page.featureLabel)}">
${page.features.map(([heading, text]) => `        <article class="card"><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p></article>`).join('\n')}
      </section>
      <section class="content">
        <h2>${escapeHtml(page.bodyHeading)}</h2>
${page.body.map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`).join('\n')}
      </section>
      <section class="faq" aria-label="Frequently asked questions">
        <h2>${escapeHtml(page.faqHeading)}</h2>
${page.faqs.map(([question, answer]) => `        <details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('\n')}
      </section>
      <div class="links" aria-label="Related PDF tools">
${page.links.map(([href, label]) => `        <a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join('\n')}
      </div>
      <footer>${escapeHtml(page.footer)}</footer>
    </main>
  </body>
</html>
`
}

function sitemapEntry(page) {
  const url = `${site}/${page.slug}.html`
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.88</priority>
  </url>
`
}

async function syncSitemap() {
  const sitemapUrl = new URL('sitemap.xml', publicDir)
  const original = await readFile(sitemapUrl, 'utf8')
  const slugPattern = pages.map((page) => page.slug.replaceAll('-', '\\-')).join('|')
  const generatedEntryPattern = new RegExp(`  <url>\\n    <loc>${site.replaceAll('.', '\\.')}\\/(?:${slugPattern})\\.html<\\/loc>[\\s\\S]*?  <\\/url>\\n`, 'g')
  const withoutGenerated = original.replace(generatedEntryPattern, '')
  const entries = pages.map(sitemapEntry).join('')
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/free-pdf-editor\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} core intent pages.`)

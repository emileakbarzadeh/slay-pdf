import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'best-free-pdf-editor',
    title: 'Best Free PDF Editor for Local Work - Slay PDF',
    kicker: 'Best free PDF editor fit',
    h1: 'A strong free PDF editor for private local work.',
    description: 'Use Slay PDF when the best free PDF editor is one that runs locally in your browser for merge, split, sign, redact, OCR and export workflows.',
    lead: 'The best PDF editor depends on the job. Slay PDF is strongest when you want quick browser access and local document handling for common edits.',
    featureLabel: 'Best free PDF editor criteria',
    features: [
      ['Local workflow', 'Common edits run in this browser without a Slay PDF app-server upload.'],
      ['No account wall', 'Open the app and start editing without creating a login.'],
      ['Common edits', 'Merge, split, sign, annotate, redact, resize, OCR and export PDFs.'],
    ],
    bodyHeading: 'Best when the job is practical, private and local.',
    body: [
      'Slay PDF is not trying to be every enterprise PDF platform. It is built for everyday edits that should be fast: remove pages, combine files, sign visually, clean scans, redact visible content and export the result.',
      'Use a full document platform when you need organization-controlled workflows, certificate signing or compliance systems. Use Slay PDF when the PDF should stay in your browser.',
    ],
    faqHeading: 'Best free PDF editor FAQ',
    faqs: [
      ['Is Slay PDF the best free PDF editor for every job?', 'No. It is best suited to common local browser workflows, not every enterprise PDF workflow.'],
      ['Does Slay PDF add watermarks?', 'No. Slay PDF does not add its own watermark to exports.'],
      ['Do I need to upload files?', 'No. Common PDF editing work runs locally in this browser.'],
    ],
    links: [
      ['/free-pdf-editor.html', 'Free PDF editor'],
      ['/pdf-editor.html', 'PDF editor'],
      ['/pdf-editor-no-watermark.html', 'PDF editor no watermark'],
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
    ],
    footer: 'Open Slay PDF when the best fit is a free local PDF editor.',
  },
  {
    slug: 'best-adobe-acrobat-alternative',
    title: 'Best Adobe Acrobat Alternative for Local Edits - Slay PDF',
    kicker: 'Best Acrobat alternative fit',
    h1: 'A practical Adobe Acrobat alternative for local PDF edits.',
    description: 'Use Slay PDF as an Adobe Acrobat alternative for common local PDF edits: merge, split, sign, organize, redact, resize, OCR and export.',
    lead: 'If the goal is a fast local PDF editor rather than a full enterprise document platform, Slay PDF is built for that job.',
    featureLabel: 'Adobe Acrobat alternative criteria',
    features: [
      ['Local-first', 'Documents and edits stay in this browser for common workflows.'],
      ['Everyday tools', 'Merge, split, sign, annotate, redact, rotate, crop, resize and OCR PDFs.'],
      ['Free access', 'No subscription or account wall for common local PDF work.'],
    ],
    bodyHeading: 'Use Acrobat when you need Acrobat. Use Slay PDF for the rest.',
    body: [
      'Adobe Acrobat is a broad document platform. Slay PDF is a lighter alternative for everyday tasks people repeatedly need from a PDF editor.',
      'It is especially useful when the document is private and uploading it to another site is the wrong tradeoff.',
    ],
    faqHeading: 'Best Adobe Acrobat alternative FAQ',
    faqs: [
      ['Can Slay PDF fully replace Adobe Acrobat?', 'It can replace many common local editing workflows, but not every Acrobat enterprise or certificate-signing feature.'],
      ['Can I use it without an Adobe account?', 'Yes. Slay PDF does not require an Adobe account.'],
      ['Is it local?', 'Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
      ['/adobe-acrobat-vs-slay-pdf.html', 'Adobe Acrobat vs Slay PDF'],
      ['/adobe-acrobat-replacement.html', 'Adobe Acrobat replacement'],
      ['/free-adobe-acrobat-alternative.html', 'Free Adobe Acrobat alternative'],
    ],
    footer: 'Open Slay PDF when you need a local Acrobat-style editor.',
  },
  {
    slug: 'pdf-editor-app',
    title: 'PDF Editor App - Slay PDF',
    kicker: 'PDF editor app',
    h1: 'Use a PDF editor app in your browser.',
    description: 'Use Slay PDF as a PDF editor app for browser-local workflows. Edit, sign, merge, split, redact, OCR and export PDFs without app-server uploads.',
    lead: 'Slay PDF opens like a web app and can be installed as a PWA, while keeping common PDF editing work in the browser.',
    featureLabel: 'PDF editor app features',
    features: [
      ['Installable PWA', 'Use Slay PDF from a browser and install it where your browser supports PWAs.'],
      ['Local workspace', 'Recent workspace data stays in browser storage and can be cleared.'],
      ['PDF exports', 'Download all pages, selected pages, separate PDFs, images or text.'],
    ],
    bodyHeading: 'An app-like PDF workspace without desktop install friction.',
    body: [
      'A browser PDF editor app is useful when you need fast access across devices without installing a heavy desktop suite.',
      'Slay PDF focuses on practical document workflows: page cleanup, signing, redaction, OCR, form filling and local export.',
    ],
    faqHeading: 'PDF editor app FAQ',
    faqs: [
      ['Is Slay PDF a PDF editor app?', 'Yes. It is a static browser app for common PDF editing workflows.'],
      ['Can I install it?', 'Slay PDF can be installed as a PWA where the browser and device support it.'],
      ['Does it need a desktop download?', 'No. It runs from a modern browser.'],
    ],
    links: [
      ['/online-pdf-editor.html', 'Online PDF editor'],
      ['/browser-pdf-editor.html', 'Browser PDF editor'],
      ['/free-pdf-editor-no-download.html', 'Free PDF editor no download'],
      ['/offline-pdf-editor.html', 'Offline PDF editor'],
    ],
    footer: 'Open Slay PDF as a browser PDF editor app.',
  },
  {
    slug: 'pdf-editor-software',
    title: 'PDF Editor Software - Slay PDF',
    kicker: 'PDF editor software',
    h1: 'Use PDF editor software that runs locally in the browser.',
    description: 'Use Slay PDF as PDF editor software for local browser workflows: merge, split, sign, annotate, redact, resize, OCR and export PDFs.',
    lead: 'Slay PDF is open-source PDF editor software delivered as a static web app for common local document workflows.',
    featureLabel: 'PDF editor software features',
    features: [
      ['Open source', 'Source code is available from the Slay PDF GitHub repository.'],
      ['Browser-based', 'Use a modern browser instead of a heavy desktop suite for common edits.'],
      ['Private by default', 'Documents and edits stay in this browser for common workflows.'],
    ],
    bodyHeading: 'Software for the everyday PDF jobs.',
    body: [
      'Traditional PDF editor software can be overkill when the job is merging, splitting, signing, redacting or exporting pages.',
      'Slay PDF keeps that smaller workflow focused and transparent, with static hosting and local browser processing.',
    ],
    faqHeading: 'PDF editor software FAQ',
    faqs: [
      ['Is Slay PDF software or a website?', 'It is a static web app: software that opens from the web and runs common workflows in your browser.'],
      ['Is it open source?', 'Yes. The source repository is linked from the app and press kit.'],
      ['Can it replace enterprise PDF software?', 'It replaces many common local editing tasks, not every enterprise PDF platform feature.'],
    ],
    links: [
      ['/open-source-pdf-editor.html', 'Open source PDF editor'],
      ['/self-hosted-pdf-editor.html', 'Self-hosted PDF editor'],
      ['/local-pdf-editor.html', 'Local PDF editor'],
      ['/pdf-editor-for-business.html', 'PDF editor for business'],
    ],
    footer: 'Open Slay PDF for local browser PDF editor software.',
  },
  {
    slug: 'free-pdf-software',
    title: 'Free PDF Software - Slay PDF',
    kicker: 'Free PDF software',
    h1: 'Free PDF software for common local edits.',
    description: 'Use Slay PDF as free PDF software for local browser workflows. Merge, split, sign, organize, redact, resize, OCR and export PDFs.',
    lead: 'Slay PDF gives you free PDF software for everyday edits without account walls, trial prompts or app-added export watermarks.',
    featureLabel: 'Free PDF software features',
    features: [
      ['No account wall', 'Start common PDF workflows without creating an account.'],
      ['No app watermark', 'Export PDFs without a Slay PDF-added watermark.'],
      ['Useful tools', 'Edit pages, sign, annotate, redact, OCR, extract text and export.'],
    ],
    bodyHeading: 'Free PDF software that stays focused.',
    body: [
      'Slay PDF is aimed at practical PDF jobs where a full document suite is unnecessary.',
      'It is a good fit for students, freelancers, small teams and anyone cleaning up private documents in the browser.',
    ],
    faqHeading: 'Free PDF software FAQ',
    faqs: [
      ['Is Slay PDF free PDF software?', 'Yes. It is free for common local PDF workflows.'],
      ['Does it require a trial?', 'No. Slay PDF does not use a trial wall for common workflows.'],
      ['Can I use it for private PDFs?', 'Yes. Common editing work runs locally in this browser.'],
    ],
    links: [
      ['/free-pdf-editor.html', 'Free PDF editor'],
      ['/free-pdf-editor-no-trial.html', 'Free PDF editor no trial'],
      ['/free-pdf-editor-no-signup.html', 'Free PDF editor no signup'],
      ['/pdf-editor-no-watermark.html', 'PDF editor no watermark'],
    ],
    footer: 'Open Slay PDF when you need free PDF software.',
  },
  {
    slug: 'web-based-pdf-editor',
    title: 'Web Based PDF Editor - Slay PDF',
    kicker: 'Web-based PDF editor',
    h1: 'Use a web-based PDF editor that keeps work local.',
    description: 'Use Slay PDF as a web-based PDF editor for merge, split, sign, redact, annotate, OCR and export workflows that run locally in your browser.',
    lead: 'Slay PDF has the convenience of a web-based PDF editor while avoiding an upload-first workflow for common edits.',
    featureLabel: 'Web-based PDF editor features',
    features: [
      ['Open from the web', 'Start from slaypdf.com in a modern browser.'],
      ['Local processing', 'Common edits run on your device in this browser.'],
      ['Full workspace', 'Organize pages, edit visually and export clean PDFs.'],
    ],
    bodyHeading: 'The web access without the upload queue.',
    body: [
      'Web-based PDF editors are convenient because they are easy to open. Slay PDF keeps that convenience while handling common work locally.',
      'Use it for documents where installing a desktop app is too much and uploading the PDF is the wrong tradeoff.',
    ],
    faqHeading: 'Web-based PDF editor FAQ',
    faqs: [
      ['Is Slay PDF web-based?', 'Yes. It opens from the web and runs common workflows in the browser.'],
      ['Are PDFs uploaded to an app server?', 'No. Common editing and export workflows run locally in this browser.'],
      ['Can I use it on mobile?', 'Slay PDF works in modern mobile browsers, with workflow comfort depending on screen size and device capability.'],
    ],
    links: [
      ['/online-pdf-editor.html', 'Online PDF editor'],
      ['/browser-based-pdf-editor.html', 'Browser-based PDF editor'],
      ['/edit-pdf-online.html', 'Edit PDF online'],
      ['/client-side-pdf-editor.html', 'Client-side PDF editor'],
    ],
    footer: 'Open Slay PDF as a web-based PDF editor.',
  },
  {
    slug: 'browser-based-pdf-editor',
    title: 'Browser Based PDF Editor - Slay PDF',
    kicker: 'Browser-based PDF editor',
    h1: 'Edit PDFs in a browser-based workspace.',
    description: 'Use Slay PDF as a browser-based PDF editor. Edit, organize, sign, redact, OCR and export PDFs locally from a modern browser.',
    lead: 'Slay PDF turns a modern browser into a practical PDF workspace for common local edits and exports.',
    featureLabel: 'Browser-based PDF editor features',
    features: [
      ['Modern browser', 'Use Slay PDF without installing a heavy desktop PDF suite.'],
      ['Local state', 'Recent workspaces use browser storage and can be cleared.'],
      ['Export options', 'Download PDFs, selected pages, separate PDFs, images or text.'],
    ],
    bodyHeading: 'A browser-based editor for repeat PDF cleanup.',
    body: [
      'Browser-based editing is useful for quick jobs: rotate a scan, remove a blank page, sign a form, combine files or export selected pages.',
      'Slay PDF keeps those workflows close to the document and avoids turning every small edit into an upload process.',
    ],
    faqHeading: 'Browser-based PDF editor FAQ',
    faqs: [
      ['Which browsers work best?', 'Use a modern browser with WebAssembly and IndexedDB support.'],
      ['Can I clear recent work?', 'Yes. Recent workspace data can be cleared from the app.'],
      ['Does it work without a login?', 'Yes. Common workflows do not require an account.'],
    ],
    links: [
      ['/browser-pdf-editor.html', 'Browser PDF editor'],
      ['/web-based-pdf-editor.html', 'Web-based PDF editor'],
      ['/local-pdf-editor.html', 'Local PDF editor'],
      ['/pdf-editor-for-chromebook.html', 'PDF editor for Chromebook'],
    ],
    footer: 'Open Slay PDF as a browser-based PDF editor.',
  },
  {
    slug: 'pdf-tool',
    title: 'PDF Tool - Slay PDF',
    kicker: 'PDF tool',
    h1: 'One PDF tool for common local edits.',
    description: 'Use Slay PDF as a PDF tool for common local workflows: merge, split, sign, rotate, crop, redact, OCR, extract text and export PDFs.',
    lead: 'Slay PDF groups the everyday PDF tools people reach for into one browser workspace.',
    featureLabel: 'PDF tool features',
    features: [
      ['Page tools', 'Merge, split, reorder, delete, rotate, crop and resize pages.'],
      ['Edit tools', 'Add signatures, text, highlights, shapes, watermarks, page numbers and redactions.'],
      ['Export tools', 'Download PDFs, separate PDFs, PNG page images or extracted text.'],
    ],
    bodyHeading: 'A single tool for the small PDF jobs.',
    body: [
      'Many PDF tasks are small but urgent. Slay PDF keeps common tools in one local workspace so you do not have to jump between upload-first converters.',
      'Import files, make the edits, then export the exact output you need.',
    ],
    faqHeading: 'PDF tool FAQ',
    faqs: [
      ['What PDF tools are included?', 'Slay PDF includes tools for page organization, signing, annotation, redaction, OCR, resizing, text extraction and export.'],
      ['Can I merge and split in the same workspace?', 'Yes. Import files, organize pages and export all pages, selected pages or separate PDFs.'],
      ['Does Slay PDF require signup?', 'No. Common local workflows do not require an account.'],
    ],
    links: [
      ['/tools.html', 'All PDF tools'],
      ['/pdf.html', 'PDF tools'],
      ['/merge-pdf.html', 'Merge PDF'],
      ['/split-pdf.html', 'Split PDF'],
    ],
    footer: 'Open Slay PDF when you need one practical PDF tool.',
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
    <priority>0.83</priority>
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/pdf-editor\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} discovery intent pages.`)

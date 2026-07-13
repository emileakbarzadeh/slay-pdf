import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'free-online-pdf-editor',
    title: 'Free Online PDF Editor - Slay PDF',
    kicker: 'Free online PDF editor',
    h1: 'Use a free online PDF editor without uploads.',
    description: 'Use a free online PDF editor that runs locally in your browser. Slay PDF edits, signs, merges, splits and exports PDFs without app-server uploads.',
    lead: 'Slay PDF opens like an online PDF editor, but the document work happens locally in your browser instead of a server-side upload queue.',
    featureLabel: 'Free online PDF editor features',
    features: [
      ['Free to use', 'Edit everyday PDFs without an account, trial or watermark workflow.'],
      ['Local browser work', 'Documents and edits stay in this browser. Passwords are never saved.'],
      ['Practical tools', 'Merge, split, delete, rotate, sign, annotate, crop, resize, redact and export PDFs.'],
    ],
    bodyHeading: 'Online convenience without handing over the document.',
    body: [
      'Most free online PDF editors are convenient because they open quickly. Slay PDF keeps that convenience while keeping common PDF edits on your device.',
      'Use it for forms, receipts, contracts, scans, study notes and client documents that only need fast browser-based edits.',
    ],
    faqHeading: 'Free online PDF editor FAQ',
    faqs: [
      ['Is Slay PDF a free online PDF editor?', 'Yes. Slay PDF is free to use in the browser and focuses on common local PDF editing workflows.'],
      ['Do I need to upload my PDF first?', 'No. PDF editing work runs locally in this browser instead of uploading documents to a Slay PDF application server.'],
      ['What can I edit?', 'You can merge, split, reorder, delete, rotate, crop, resize, sign, annotate, redact and export PDFs.'],
    ],
    links: [
      ['/online-pdf-editor.html', 'Online PDF editor'],
      ['/free-pdf-editor.html', 'Free PDF editor'],
      ['/edit-pdf.html', 'Edit PDF'],
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
    ],
    footer: 'Open Slay PDF to edit PDFs locally from the browser.',
  },
  {
    slug: 'edit-pdf-online',
    title: 'Edit PDF Online - Slay PDF',
    kicker: 'Edit PDF online',
    h1: 'Edit PDF online while keeping files local.',
    description: 'Edit PDF online with Slay PDF. Reorder, delete, sign, annotate, crop, resize, redact and export PDFs locally in your browser.',
    lead: 'Use Slay PDF when you want to edit a PDF online, but do not want the source document processed by a remote converter site.',
    featureLabel: 'Edit PDF online features',
    features: [
      ['Page edits', 'Reorder, delete, rotate, crop and resize pages before export.'],
      ['Markup tools', 'Add text, highlights, shapes, ink marks, signatures and redaction blocks.'],
      ['Local export', 'Download the finished PDF, selected pages, page images or extracted text from the browser.'],
    ],
    bodyHeading: 'A direct browser workflow for common PDF edits.',
    body: [
      'Slay PDF is built for practical PDF editing jobs: combining files, removing pages, fixing sideways scans, adding a signature, marking up a page and exporting the result.',
      'The workspace is local to the browser, which makes it a better fit for private documents than random upload-first tools.',
    ],
    faqHeading: 'Edit PDF online FAQ',
    faqs: [
      ['Can I edit a PDF online without uploading it?', 'Yes. Slay PDF runs editing work in the browser and does not upload documents to an app server.'],
      ['Can I add a signature or notes?', 'Yes. You can add visual signatures, text, highlights, shapes and ink marks before exporting.'],
      ['Can I export only selected pages?', 'Yes. Select the pages you need and export selected pages or split documents from the workspace.'],
    ],
    links: [
      ['/edit-pdf.html', 'Edit PDF'],
      ['/free-online-pdf-editor.html', 'Free online PDF editor'],
      ['/annotate-pdf-online.html', 'Annotate PDF online'],
      ['/sign-pdf-online.html', 'Sign PDF online'],
    ],
    footer: 'Open Slay PDF, make the edit and download the finished PDF locally.',
  },
  {
    slug: 'edit-pdf-online-free',
    title: 'Edit PDF Online Free - Slay PDF',
    kicker: 'Edit PDF online free',
    h1: 'Edit PDF online free with no account wall.',
    description: 'Edit PDF online free with Slay PDF. Make common PDF edits in your browser without signup, trial prompts, watermarks or app-server uploads.',
    lead: 'Use Slay PDF for quick PDF edits when a subscription, account wall or upload-first converter is too much friction.',
    featureLabel: 'Edit PDF online free features',
    features: [
      ['No signup flow', 'Open the app, import PDFs or images, edit pages and export.'],
      ['No watermark workflow', 'Download clean exports from the browser workspace.'],
      ['Private by default', 'Documents and edits stay in this browser. Passwords are never saved.'],
    ],
    bodyHeading: 'Free PDF edits for everyday documents.',
    body: [
      'Slay PDF covers the common edits people need immediately: merge PDFs, split pages, remove pages, sign, annotate, crop, resize, redact and export selected pages.',
      'It is not a full enterprise Acrobat replacement, but it is built for fast local PDF work without account walls.',
    ],
    faqHeading: 'Edit PDF online free FAQ',
    faqs: [
      ['Is Slay PDF free for PDF editing?', 'Yes. Slay PDF is free to use for common browser-based PDF editing workflows.'],
      ['Does Slay PDF add watermarks?', 'No. The app is designed for clean local PDF exports.'],
      ['Do my PDFs leave the browser?', 'No. The editing workflow runs locally in this browser.'],
    ],
    links: [
      ['/free-pdf-editor-no-signup.html', 'Free PDF editor no signup'],
      ['/free-online-pdf-editor.html', 'Free online PDF editor'],
      ['/pdf-editor-online-free.html', 'PDF editor online free'],
      ['/edit-pdf-without-uploading.html', 'Edit without uploading'],
    ],
    footer: 'Open Slay PDF to edit PDFs online free while keeping documents local.',
  },
  {
    slug: 'free-pdf-editor-online',
    title: 'Free PDF Editor Online - Slay PDF',
    kicker: 'Free PDF editor online',
    h1: 'Open a free PDF editor online that works locally.',
    description: 'Open a free PDF editor online with Slay PDF. Merge, split, sign, organize, redact and export PDFs locally from your browser.',
    lead: 'Slay PDF gives you the quick access of an online PDF editor with local browser processing for common document work.',
    featureLabel: 'Free PDF editor online features',
    features: [
      ['Fast import', 'Drop in PDFs, PNG, JPEG or WebP files and start arranging pages.'],
      ['Useful edits', 'Organize pages, add signatures, annotate, redact, crop, resize and export.'],
      ['Local workspace', 'Recent workspaces live in browser storage and can be cleared when done.'],
    ],
    bodyHeading: 'A free browser editor for quick PDF jobs.',
    body: [
      'Use Slay PDF for small but important document tasks: remove the wrong page, sign a form, merge attachments, rotate scans or export just the pages you need.',
      'The app runs as a static web app, so common edits happen in the browser rather than on a Slay PDF application server.',
    ],
    faqHeading: 'Free PDF editor online FAQ',
    faqs: [
      ['Can I use Slay PDF without installing software?', 'Yes. Open it in a modern browser and use the local PDF workspace.'],
      ['Can I import images as PDF pages?', 'Yes. Slay PDF accepts PDF files and PNG, JPEG or WebP images.'],
      ['Can I clear local recent work?', 'Yes. The app includes controls to clear the recent local workspace.'],
    ],
    links: [
      ['/free-online-pdf-editor.html', 'Free online PDF editor'],
      ['/online-pdf-editor.html', 'Online PDF editor'],
      ['/images-to-pdf-online.html', 'Images to PDF online'],
      ['/privacy.html', 'Privacy'],
    ],
    footer: 'Open Slay PDF to edit PDFs online from a local browser workspace.',
  },
  {
    slug: 'pdf-editor-online',
    title: 'PDF Editor Online - Slay PDF',
    kicker: 'PDF editor online',
    h1: 'Use a PDF editor online with local processing.',
    description: 'Use a PDF editor online with Slay PDF. Edit, organize, sign, annotate, redact and export PDFs in your browser without app-server uploads.',
    lead: 'Slay PDF is an online-accessible PDF editor for people who want quick browser tools without sending private documents to a server queue.',
    featureLabel: 'PDF editor online features',
    features: [
      ['Browser based', 'Open the editor from the web and work with PDFs in your local browser session.'],
      ['Page tools', 'Merge, split, reorder, delete, rotate, crop, resize and export PDF pages.'],
      ['Document marks', 'Add visual signatures, text, highlights, shapes, ink and redaction blocks.'],
    ],
    bodyHeading: 'The online PDF editor shape, with local execution.',
    body: [
      'Slay PDF is suited to repeated everyday PDF work: forms, receipts, contracts, school notes, client PDFs, scans and document packets.',
      'Because the app is static and client-side, your browser and device do the work for common editing and export operations.',
    ],
    faqHeading: 'PDF editor online FAQ',
    faqs: [
      ['What does online mean for Slay PDF?', 'The app opens from the web, then common PDF work runs locally in the browser.'],
      ['Can I use it on desktop and mobile browsers?', 'Yes. It is built for modern desktop and mobile browsers with WebAssembly support.'],
      ['Is it an Adobe Acrobat alternative?', 'It is an alternative for common local browser workflows, not every enterprise Acrobat feature.'],
    ],
    links: [
      ['/online-pdf-editor.html', 'Online PDF editor'],
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
      ['/browser-pdf-editor.html', 'Browser PDF editor'],
      ['/secure-pdf-editor.html', 'Secure PDF editor'],
    ],
    footer: 'Open Slay PDF to use an online PDF editor that keeps common work local.',
  },
  {
    slug: 'pdf-editor-online-free',
    title: 'PDF Editor Online Free - Slay PDF',
    kicker: 'PDF editor online free',
    h1: 'Use a PDF editor online free without uploads.',
    description: 'Use a PDF editor online free with Slay PDF. Merge, split, sign, annotate, redact and export PDFs locally without signup or app-server uploads.',
    lead: 'Slay PDF is for people who need a free online PDF editor workflow without signup forms, trial prompts or upload-first document processing.',
    featureLabel: 'PDF editor online free features',
    features: [
      ['Free workflow', 'Use the editor without account, trial or watermark steps.'],
      ['Common edits', 'Handle page organization, signing, annotation, redaction, resizing and exports.'],
      ['Local privacy', 'Documents and edits stay in this browser. Passwords are never saved.'],
    ],
    bodyHeading: 'Free online PDF work without the usual traps.',
    body: [
      'Slay PDF focuses on the work most people need: merge files, split pages, delete pages, sign documents, add notes, export selected pages and create page images.',
      'The local browser workflow is useful when you want quick edits without creating an account or uploading sensitive PDFs.',
    ],
    faqHeading: 'PDF editor online free FAQ',
    faqs: [
      ['Is there a trial requirement?', 'No. Slay PDF is free to use and does not rely on trial prompts for common PDF edits.'],
      ['Can I use it without creating an account?', 'Yes. Open the app and work locally in your browser.'],
      ['Does it replace every Acrobat Pro feature?', 'No. It focuses on common local browser editing, export and organization workflows.'],
    ],
    links: [
      ['/edit-pdf-online-free.html', 'Edit PDF online free'],
      ['/free-pdf-editor-no-trial.html', 'Free PDF editor no trial'],
      ['/free-pdf-editor-no-signup.html', 'Free PDF editor no signup'],
      ['/pdf-editor-no-watermark.html', 'PDF editor no watermark'],
    ],
    footer: 'Open Slay PDF to edit PDFs online free in your browser.',
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/online-pdf-editor\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} editor intent pages.`)

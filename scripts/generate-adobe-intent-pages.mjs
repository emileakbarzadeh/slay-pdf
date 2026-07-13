import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'adobe-acrobat-free-alternative',
    title: 'Adobe Acrobat Free Alternative - Slay PDF',
    kicker: 'Acrobat free alternative',
    h1: 'Use a free Adobe Acrobat alternative for everyday PDFs.',
    description: 'Use Slay PDF as a free Adobe Acrobat alternative for everyday PDF edits. Merge, split, sign, annotate and export PDFs locally in your browser.',
    lead: 'Slay PDF is built for the PDF jobs that should not require Acrobat: page cleanup, merging, splitting, signing, annotation and local export.',
    featureLabel: 'Adobe Acrobat free alternative features',
    features: [
      ['Free workflow', 'Open the app and finish common PDF edits without a subscription or trial prompt.'],
      ['Local documents', 'Documents and edits stay in this browser. Passwords are never saved.'],
      ['Common tools', 'Merge, split, delete, rotate, crop, resize, sign, annotate, redact and export PDFs.'],
    ],
    bodyHeading: 'Use Acrobat for platform work. Use Slay PDF for fast local edits.',
    body: [
      'Adobe Acrobat is a full document platform. Slay PDF is aimed at the everyday jobs people often need immediately: remove a page, combine files, sign visually, fix a scan or export selected pages.',
      'Because the app runs locally in the browser, it is a practical fit for private documents that do not need a cloud document workflow.',
    ],
    faqHeading: 'Adobe Acrobat free alternative FAQ',
    faqs: [
      ['Is Slay PDF a free Adobe Acrobat alternative?', 'Yes for common local PDF editing workflows such as merge, split, page removal, visual signing, annotation and export.'],
      ['When should I still use Acrobat?', 'Use Acrobat for enterprise document management, certificate signing, compliance workflows and advanced platform features.'],
      ['Do I need to upload PDFs to use Slay PDF?', 'No. Common PDF editing work runs locally in this browser.'],
    ],
    links: [
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
      ['/free-adobe-pdf-editor-alternative.html', 'Free Adobe PDF editor alternative'],
      ['/pdf-editor-online-free.html', 'PDF editor online free'],
      ['/edit-pdf-without-adobe.html', 'Edit PDF without Adobe'],
    ],
    footer: 'Open Slay PDF when you need a free local alternative for common Acrobat-style edits.',
  },
  {
    slug: 'free-adobe-acrobat-alternative',
    title: 'Free Adobe Acrobat Alternative - Slay PDF',
    kicker: 'Free Adobe Acrobat alternative',
    h1: 'Try a free Adobe Acrobat alternative that stays local.',
    description: 'Try a free Adobe Acrobat alternative with Slay PDF. Edit, organize, sign, redact and export PDFs locally from your browser without account walls.',
    lead: 'Slay PDF gives you a browser-based alternative for common Acrobat-style work without sending documents to a Slay PDF app server.',
    featureLabel: 'Free Adobe Acrobat alternative features',
    features: [
      ['No account wall', 'Import a PDF and start editing without creating an account.'],
      ['Useful exports', 'Download all pages, selected pages, separate PDFs, page images or extracted text.'],
      ['Private by default', 'Your documents and edits stay in this browser. Passwords are never saved.'],
    ],
    bodyHeading: 'For the Acrobat jobs that should be simple.',
    body: [
      'Many PDF tasks do not need a full document platform. Slay PDF focuses on local browser workflows for cleaning, organizing, signing and exporting PDFs.',
      'It is especially useful when the document contains private content and uploading to an online converter is not acceptable.',
    ],
    faqHeading: 'Free Adobe Acrobat alternative FAQ',
    faqs: [
      ['Can Slay PDF replace Acrobat for every feature?', 'No. It replaces common local editing workflows, not every enterprise Acrobat feature.'],
      ['Can I sign documents?', 'Yes. Slay PDF supports visual signatures and annotation marks for everyday signing workflows.'],
      ['Can I protect exports with a password?', 'Yes. Password-protected exports are available, and passwords are never saved.'],
    ],
    links: [
      ['/adobe-acrobat-free-alternative.html', 'Adobe Acrobat free alternative'],
      ['/adobe-acrobat-vs-slay-pdf.html', 'Acrobat comparison'],
      ['/sign-pdf-without-adobe.html', 'Sign PDF without Adobe'],
      ['/password-protect-pdf-without-adobe.html', 'Password protect without Adobe'],
    ],
    footer: 'Open Slay PDF for common Acrobat-style PDF work from your browser.',
  },
  {
    slug: 'adobe-pdf-editor-free-alternative',
    title: 'Adobe PDF Editor Free Alternative - Slay PDF',
    kicker: 'Adobe PDF editor free alternative',
    h1: 'Use a free alternative to Adobe PDF editor.',
    description: 'Use a free alternative to Adobe PDF editor with Slay PDF. Edit pages, sign, annotate, merge, split and export PDFs locally in your browser.',
    lead: 'Slay PDF covers everyday PDF editing from a local browser workspace, with no account wall and no app-server upload workflow.',
    featureLabel: 'Adobe PDF editor free alternative features',
    features: [
      ['Page editing', 'Reorder, delete, rotate, crop, resize and export selected pages.'],
      ['Document marks', 'Add visual signatures, text, highlights, shapes, ink and redaction blocks.'],
      ['Local output', 'Export PDFs, separate PDFs, PNG page images or extracted text from the browser.'],
    ],
    bodyHeading: 'A focused alternative for everyday edits.',
    body: [
      'If you need a full Adobe document platform, Acrobat still has a place. If you need fast PDF page edits, Slay PDF is designed to get out of the way.',
      'The app is static and client-side, so common editing work happens on your device rather than a Slay PDF processing server.',
    ],
    faqHeading: 'Adobe PDF editor free alternative FAQ',
    faqs: [
      ['What PDF edits does Slay PDF support?', 'It supports common workflows such as merging, splitting, deleting pages, rotating, cropping, resizing, signing, annotating and redacting.'],
      ['Can I export selected pages?', 'Yes. Select the pages you need and export only those pages.'],
      ['Does Slay PDF require an Adobe login?', 'No. Slay PDF does not require an Adobe account or a Slay PDF account.'],
    ],
    links: [
      ['/free-adobe-pdf-editor-alternative.html', 'Free Adobe PDF editor alternative'],
      ['/edit-pdf-online-free.html', 'Edit PDF online free'],
      ['/delete-pdf-pages-without-adobe.html', 'Delete pages without Adobe'],
      ['/annotate-pdf.html', 'Annotate PDF'],
    ],
    footer: 'Open Slay PDF to use a free local alternative for common Adobe PDF editor jobs.',
  },
  {
    slug: 'acrobat-pdf-editor-alternative',
    title: 'Acrobat PDF Editor Alternative - Slay PDF',
    kicker: 'Acrobat PDF editor alternative',
    h1: 'Use an Acrobat PDF editor alternative for local jobs.',
    description: 'Use Slay PDF as an Acrobat PDF editor alternative. Organize pages, sign, annotate, redact, resize and export PDFs locally in your browser.',
    lead: 'Slay PDF is a local browser alternative for common Acrobat PDF editor tasks: page organization, markup, signing, export and cleanup.',
    featureLabel: 'Acrobat PDF editor alternative features',
    features: [
      ['Organize pages', 'Merge files, split documents, reorder pages and delete what you do not need.'],
      ['Edit visually', 'Add text, highlights, shapes, ink, signatures, watermarks and redaction blocks.'],
      ['Export cleanly', 'Download all pages, selected pages, separate PDFs, images or text.'],
    ],
    bodyHeading: 'A lighter tool for common Acrobat-style edits.',
    body: [
      'Slay PDF is not trying to recreate every Acrobat Pro workflow. It is built for the local edits people repeatedly need from a PDF editor.',
      'Use it when the job is small, private and better handled in the browser than through another document platform.',
    ],
    faqHeading: 'Acrobat PDF editor alternative FAQ',
    faqs: [
      ['Can Slay PDF organize PDF pages?', 'Yes. You can merge, split, reorder, rotate and delete pages before export.'],
      ['Can I annotate PDFs?', 'Yes. Slay PDF supports text, highlights, shapes, ink marks, signatures and redaction blocks.'],
      ['Are my documents uploaded?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
      ['/edit-pdf-without-acrobat.html', 'Edit PDF without Acrobat'],
      ['/merge-pdf-without-acrobat.html', 'Merge PDF without Acrobat'],
      ['/redact-pdf-without-acrobat.html', 'Redact PDF without Acrobat'],
    ],
    footer: 'Open Slay PDF for local Acrobat-style page editing and PDF export.',
  },
  {
    slug: 'adobe-acrobat-replacement',
    title: 'Adobe Acrobat Replacement - Slay PDF',
    kicker: 'Adobe Acrobat replacement',
    h1: 'Replace Adobe Acrobat for common local PDF edits.',
    description: 'Use Slay PDF as an Adobe Acrobat replacement for common local PDF edits: merge, split, sign, annotate, redact, resize and export in your browser.',
    lead: 'Slay PDF can replace Acrobat for many everyday jobs, especially when the priority is quick local editing rather than a full cloud document platform.',
    featureLabel: 'Adobe Acrobat replacement features',
    features: [
      ['Common workflows', 'Handle merge, split, page removal, rotation, crop, resize, annotation and signing.'],
      ['Browser workspace', 'Work from a static web app with local browser storage for recent workspaces.'],
      ['Private exports', 'Documents and edits stay in this browser. Passwords are never saved.'],
    ],
    bodyHeading: 'Replace the heavy workflow when the job is small.',
    body: [
      'Acrobat is useful for enterprise PDF systems. Slay PDF is useful when you need a fast local editor for documents that do not belong in another upload queue.',
      'It is designed for forms, receipts, contracts, scans, client files and everyday PDFs that need practical edits.',
    ],
    faqHeading: 'Adobe Acrobat replacement FAQ',
    faqs: [
      ['Can Slay PDF fully replace Adobe Acrobat?', 'It can replace many everyday editing workflows, but not every Acrobat enterprise or certificate-signing feature.'],
      ['Can I work offline after loading the app?', 'Slay PDF is a static browser app and can be installed as a PWA, subject to browser caching and device support.'],
      ['Can I clear recent work?', 'Yes. Recent local workspace data can be cleared from the app.'],
    ],
    links: [
      ['/adobe-acrobat-vs-slay-pdf.html', 'Acrobat vs Slay PDF'],
      ['/offline-pdf-editor.html', 'Offline PDF editor'],
      ['/client-side-pdf-editor.html', 'Client-side PDF editor'],
      ['/secure-pdf-editor.html', 'Secure PDF editor'],
    ],
    footer: 'Open Slay PDF when a common PDF edit should not require Acrobat.',
  },
  {
    slug: 'adobe-acrobat-online-free-alternative',
    title: 'Adobe Acrobat Online Free Alternative - Slay PDF',
    kicker: 'Acrobat online free alternative',
    h1: 'Use an Adobe Acrobat online free alternative locally.',
    description: 'Use Slay PDF as an Adobe Acrobat online free alternative. Edit, merge, split, sign and export PDFs in your browser without app-server uploads.',
    lead: 'Slay PDF opens from the web like an online PDF editor, then handles common edits locally in your browser.',
    featureLabel: 'Adobe Acrobat online free alternative features',
    features: [
      ['Online access', 'Open Slay PDF from the web and start a browser PDF workspace.'],
      ['Local execution', 'Common PDF edits run on your device instead of an upload-first app server.'],
      ['Free exports', 'Download edited PDFs, selected pages, split PDFs, images or text without an account wall.'],
    ],
    bodyHeading: 'The online part without the remote document queue.',
    body: [
      'Online PDF tools are convenient because they are easy to open. Slay PDF keeps that access while processing common edits locally in the browser.',
      'Use it for quick Acrobat-style jobs where an Adobe login, subscription flow or document upload is not necessary.',
    ],
    faqHeading: 'Adobe Acrobat online free alternative FAQ',
    faqs: [
      ['Is Slay PDF an online tool?', 'Yes. It opens from the web, then common PDF editing work runs locally in the browser.'],
      ['Is it free to use?', 'Yes. Slay PDF is free for common local PDF workflows.'],
      ['Does it upload files like many online converters?', 'No. Slay PDF keeps documents and edits in this browser for common editing work.'],
    ],
    links: [
      ['/acrobat-online-alternative.html', 'Acrobat Online alternative'],
      ['/free-online-pdf-editor.html', 'Free online PDF editor'],
      ['/edit-pdf-online.html', 'Edit PDF online'],
      ['/pdf-editor-online-free.html', 'PDF editor online free'],
    ],
    footer: 'Open Slay PDF for a free online-accessible Acrobat alternative with local browser processing.',
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
    <priority>0.86</priority>
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/free-adobe-pdf-editor-alternative\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} Adobe intent pages.`)

import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'best-private-pdf-editor',
    title: 'Best Private PDF Editor for Local Work - Slay PDF',
    kicker: 'Best private PDF editor fit',
    h1: 'A private PDF editor for local browser work.',
    description: 'Use Slay PDF when the best private PDF editor is one that keeps common edits in your browser: merge, split, sign, redact, OCR and export.',
    lead: 'The best private PDF editor is the one that matches the risk of the document. Slay PDF is built for common edits where local browser processing matters.',
    featureLabel: 'Private PDF editor criteria',
    features: [
      ['Local editing', 'Common PDF edits run in this browser without a Slay PDF app-server upload.'],
      ['Clearable state', 'Recent workspace data stays in browser storage and can be cleared.'],
      ['Password handling', 'Export passwords are never saved by Slay PDF.'],
    ],
    bodyHeading: 'Best when the document should stay with you.',
    body: [
      'Private PDFs often include signatures, addresses, contracts, receipts, invoices or client details. Slay PDF avoids turning those everyday edits into an upload-first workflow.',
      'Use a managed enterprise platform when policy requires it. Use Slay PDF when common page edits, signing, redaction or export should happen locally in the browser.',
    ],
    faqHeading: 'Best private PDF editor FAQ',
    faqs: [
      ['Is Slay PDF the best private PDF editor for every situation?', 'No. It is best suited to common local browser workflows, not regulated enterprise document systems.'],
      ['Are my PDFs uploaded to Slay PDF?', 'No. Common editing and export workflows run locally in this browser.'],
      ['Can I clear recent work?', 'Yes. Recent local workspace data can be cleared from the app.'],
    ],
    links: [
      ['/private-pdf-editor.html', 'Private PDF editor'],
      ['/secure-pdf-editor.html', 'Secure PDF editor'],
      ['/pdf-privacy-security.html', 'PDF privacy and security'],
      ['/pdf-privacy-checklist.html', 'PDF privacy checklist'],
    ],
    footer: 'Open Slay PDF when the best fit is a private local PDF editor.',
  },
  {
    slug: 'best-no-upload-pdf-editor',
    title: 'Best No Upload PDF Editor for Local Edits - Slay PDF',
    kicker: 'Best no-upload PDF editor fit',
    h1: 'A no-upload PDF editor for common local edits.',
    description: 'Use Slay PDF when the best no-upload PDF editor is a browser app for local merge, split, sign, redact, annotate, OCR and export workflows.',
    lead: 'If the key requirement is avoiding app-server document uploads, Slay PDF is designed around local browser PDF work.',
    featureLabel: 'No-upload PDF editor criteria',
    features: [
      ['No upload queue', 'Common edits run locally in this browser.'],
      ['Useful exports', 'Download all pages, selected pages, separate PDFs, page images or text.'],
      ['No account wall', 'Start common PDF workflows without creating a login.'],
    ],
    bodyHeading: 'No-upload editing for everyday PDF tasks.',
    body: [
      'No-upload workflows are useful for contracts, scans, forms, receipts, school files and client documents.',
      'Slay PDF opens from the web, but the common editing workflow stays in your browser instead of a Slay PDF processing server.',
    ],
    faqHeading: 'Best no-upload PDF editor FAQ',
    faqs: [
      ['Does Slay PDF upload files for common edits?', 'No. Common editing and export workflows run locally in this browser.'],
      ['Can I export a clean PDF?', 'Yes. Export all pages, selected pages or separate PDFs from the browser.'],
      ['Does Slay PDF add a watermark?', 'No. Slay PDF does not add its own watermark to exports.'],
    ],
    links: [
      ['/no-upload-pdf-editor.html', 'No-upload PDF editor'],
      ['/edit-pdf-without-uploading.html', 'Edit PDF without uploading'],
      ['/merge-pdf-without-uploading.html', 'Merge PDF without uploading'],
      ['/sign-pdf-without-uploading.html', 'Sign PDF without uploading'],
    ],
    footer: 'Open Slay PDF when you need no-upload PDF editing.',
  },
  {
    slug: 'no-upload-pdf-tools',
    title: 'No Upload PDF Tools - Slay PDF',
    kicker: 'No-upload PDF tools',
    h1: 'Use PDF tools without uploading documents.',
    description: 'Use Slay PDF as no-upload PDF tools for merge, split, sign, redact, rotate, crop, resize, OCR, extract text and export workflows.',
    lead: 'Slay PDF groups common no-upload PDF tools into one browser workspace for private document cleanup and export.',
    featureLabel: 'No-upload PDF tools',
    features: [
      ['Page tools', 'Merge, split, reorder, rotate, crop, delete and resize pages locally.'],
      ['Edit tools', 'Add signatures, text, highlights, watermarks, redactions and page numbers.'],
      ['Conversion tools', 'Run English OCR, extract text and export page images from the browser.'],
    ],
    bodyHeading: 'One local workspace for no-upload PDF jobs.',
    body: [
      'Many PDF jobs are small but sensitive. Slay PDF keeps common tools together so you can finish the work without sending documents to a random converter site.',
      'Use it for forms, packets, scans, receipts, invoices and other files where local handling is the safer default.',
    ],
    faqHeading: 'No-upload PDF tools FAQ',
    faqs: [
      ['Which no-upload PDF tools are included?', 'Slay PDF includes page organization, signing, annotation, redaction, OCR, resizing, extraction and export tools.'],
      ['Can I work with multiple PDFs?', 'Yes. Import multiple PDFs or image files into the same workspace.'],
      ['Do I need an account?', 'No. Common workflows do not require an account.'],
    ],
    links: [
      ['/pdf-tool.html', 'PDF tool'],
      ['/tools.html', 'All PDF tools'],
      ['/pdf-to-images-without-uploading.html', 'PDF to images without uploading'],
      ['/extract-pdf-text-without-uploading.html', 'Extract PDF text without uploading'],
    ],
    footer: 'Open Slay PDF for no-upload PDF tools.',
  },
  {
    slug: 'private-pdf-software',
    title: 'Private PDF Software - Slay PDF',
    kicker: 'Private PDF software',
    h1: 'Private PDF software delivered as a browser app.',
    description: 'Use Slay PDF as private PDF software for local browser workflows: merge, split, sign, redact, OCR, organize, resize and export PDFs.',
    lead: 'Slay PDF is open-source PDF software delivered as a static web app, designed around browser-local document workflows.',
    featureLabel: 'Private PDF software features',
    features: [
      ['Open source', 'Source code is available from the Slay PDF GitHub repository.'],
      ['Local workflows', 'Common edits run in this browser rather than a Slay PDF app-server upload.'],
      ['Private exports', 'Export edited PDFs locally, and passwords are never saved.'],
    ],
    bodyHeading: 'Software for documents that should not be uploaded.',
    body: [
      'Private PDF software should make common edits practical without forcing every document into another hosted processing queue.',
      'Slay PDF focuses on everyday local workflows: page cleanup, signing, redaction, form work, OCR and export.',
    ],
    faqHeading: 'Private PDF software FAQ',
    faqs: [
      ['Is Slay PDF private PDF software?', 'It is a local-first browser app for common PDF editing workflows.'],
      ['Is it open source?', 'Yes. The source repository is linked from the app and press kit.'],
      ['Does privacy mean certified security?', 'No. Slay PDF privacy claims refer to browser-local processing for common workflows, not external certification.'],
    ],
    links: [
      ['/pdf-editor-software.html', 'PDF editor software'],
      ['/open-source-pdf-editor.html', 'Open source PDF editor'],
      ['/self-hosted-pdf-editor.html', 'Self-hosted PDF editor'],
      ['/private-pdf-editor.html', 'Private PDF editor'],
    ],
    footer: 'Open Slay PDF as private local PDF software.',
  },
  {
    slug: 'secure-pdf-app',
    title: 'Secure PDF App for Local Workflows - Slay PDF',
    kicker: 'Secure PDF app',
    h1: 'A secure-by-design PDF app for local browser edits.',
    description: 'Use Slay PDF as a secure PDF app for common local workflows. Edit, sign, redact, OCR and export PDFs in your browser without uploads.',
    lead: 'For Slay PDF, secure means reducing unnecessary document movement: common PDF work runs in the browser and passwords are never saved.',
    featureLabel: 'Secure PDF app features',
    features: [
      ['Local processing', 'Common edits run in this browser instead of an upload-first app server.'],
      ['Password care', 'Export passwords are never saved.'],
      ['Clear limits', 'Use enterprise systems when policy, certificate signing or compliance controls require them.'],
    ],
    bodyHeading: 'Security starts by avoiding unnecessary uploads.',
    body: [
      'No web app can make every document safe in every context. Slay PDF focuses on a practical security baseline for everyday PDFs: keep common edits local, be transparent about limits and avoid saving passwords.',
      'Use it when browser-local editing is enough for the document risk.',
    ],
    faqHeading: 'Secure PDF app FAQ',
    faqs: [
      ['Is Slay PDF certified for enterprise compliance?', 'No. Use organization-approved systems for compliance, certificate signing and managed document workflows.'],
      ['Why call it secure?', 'Because common workflows avoid app-server document uploads and passwords are never saved.'],
      ['Can I redact PDFs?', 'Yes. Slay PDF supports visible redaction blocks and flattened exports for common redaction workflows.'],
    ],
    links: [
      ['/secure-pdf-editor.html', 'Secure PDF editor'],
      ['/pdf-privacy-security.html', 'PDF privacy and security'],
      ['/redact-pdf.html', 'Redact PDF'],
      ['/password-protect-pdf.html', 'Password protect PDF'],
    ],
    footer: 'Open Slay PDF for secure-by-design local PDF workflows.',
  },
  {
    slug: 'client-side-pdf-tool',
    title: 'Client Side PDF Tool - Slay PDF',
    kicker: 'Client-side PDF tool',
    h1: 'Use a client-side PDF tool in your browser.',
    description: 'Use Slay PDF as a client-side PDF tool for local merge, split, sign, redact, OCR, extract text, resize and export workflows.',
    lead: 'Slay PDF uses client-side browser workflows for common PDF edits, keeping the everyday processing close to the document.',
    featureLabel: 'Client-side PDF tool features',
    features: [
      ['Browser execution', 'Common PDF edits run on your device in this browser.'],
      ['Wasm engines', 'PDF, OCR and export workflows use browser-side libraries and WebAssembly where needed.'],
      ['Local downloads', 'Export final PDFs, separate PDFs, images or text from the browser.'],
    ],
    bodyHeading: 'Client-side tools for common PDF work.',
    body: [
      'Client-side PDF tools are useful when a document does not belong in another upload queue but the edit still needs to happen quickly.',
      'Slay PDF keeps page organization, signing, OCR, redaction and export workflows in a browser workspace.',
    ],
    faqHeading: 'Client-side PDF tool FAQ',
    faqs: [
      ['What does client-side mean?', 'It means common work runs in the browser on your device rather than on a Slay PDF app server.'],
      ['Does it require WebAssembly?', 'Use a modern browser with WebAssembly and IndexedDB support for the full app experience.'],
      ['Can I export separate PDFs?', 'Yes. Use split markers or selected-page exports.'],
    ],
    links: [
      ['/client-side-pdf-editor.html', 'Client-side PDF editor'],
      ['/local-pdf-editor.html', 'Local PDF editor'],
      ['/browser-based-pdf-editor.html', 'Browser-based PDF editor'],
      ['/no-upload-pdf-tools.html', 'No-upload PDF tools'],
    ],
    footer: 'Open Slay PDF as a client-side PDF tool.',
  },
  {
    slug: 'offline-capable-pdf-editor',
    title: 'Offline Capable PDF Editor - Slay PDF',
    kicker: 'Offline-capable PDF editor',
    h1: 'Use an offline-capable PDF editor after loading the app.',
    description: 'Use Slay PDF as an offline-capable PDF editor. Install the PWA where supported and keep common PDF edits local in your browser.',
    lead: 'Slay PDF is a static web app that can be installed as a PWA where the browser supports it, with offline behavior subject to browser caching.',
    featureLabel: 'Offline-capable PDF editor features',
    features: [
      ['PWA install', 'Install Slay PDF where your browser and device support progressive web apps.'],
      ['Browser cache limits', 'Offline availability depends on browser caching and device support.'],
      ['Local workflows', 'Common edits run in this browser once the app is available.'],
    ],
    bodyHeading: 'Offline-capable, with honest browser limits.',
    body: [
      'Offline-capable PDF editing is useful when you need to keep working on documents without a stable connection.',
      'Slay PDF can support that workflow through browser caching and PWA installation, but the exact behavior depends on the browser and device.',
    ],
    faqHeading: 'Offline-capable PDF editor FAQ',
    faqs: [
      ['Is Slay PDF fully offline?', 'Slay PDF is a static web app and can be installed as a PWA, subject to browser caching and device support.'],
      ['Do I need to load the app first?', 'Yes. The app must be available in the browser cache before offline use can work.'],
      ['Will PDF edits upload when I reconnect?', 'No. Common editing work runs locally in this browser.'],
    ],
    links: [
      ['/offline-pdf-editor.html', 'Offline PDF editor'],
      ['/pdf-editor-app.html', 'PDF editor app'],
      ['/free-pdf-editor-no-download.html', 'Free PDF editor no download'],
      ['/local-pdf-editor.html', 'Local PDF editor'],
    ],
    footer: 'Open Slay PDF for offline-capable local PDF editing.',
  },
  {
    slug: 'pdf-editor-for-sensitive-documents',
    title: 'PDF Editor for Sensitive Documents - Slay PDF',
    kicker: 'Sensitive document PDF editor',
    h1: 'Edit sensitive PDFs without unnecessary uploads.',
    description: 'Use Slay PDF as a PDF editor for sensitive documents. Merge, split, sign, redact, annotate, OCR and export PDFs locally in your browser.',
    lead: 'Sensitive documents need a careful workflow. Slay PDF keeps common edits in the browser and makes privacy limits visible.',
    featureLabel: 'Sensitive document PDF editor features',
    features: [
      ['Local workflow', 'Common editing and export work runs in this browser.'],
      ['Redaction tools', 'Cover visible content and export flattened redacted pages for common workflows.'],
      ['Privacy notes', 'Read the privacy and security pages before handling high-risk files.'],
    ],
    bodyHeading: 'A practical workflow for sensitive everyday PDFs.',
    body: [
      'Sensitive PDFs include contracts, forms, receipts, invoices, identity documents, client files and internal notes.',
      'Slay PDF is useful when those documents need common edits and the safer default is avoiding unnecessary app-server uploads.',
    ],
    faqHeading: 'PDF editor for sensitive documents FAQ',
    faqs: [
      ['Can I use Slay PDF for sensitive PDFs?', 'Use it when browser-local editing is appropriate for the document risk and your policy.'],
      ['Can Slay PDF redact sensitive details?', 'Yes for visible redaction workflows, with flattened export options. Review the privacy notes for limits.'],
      ['Should I use it for regulated enterprise files?', 'Use organization-approved systems when policy, compliance or certificate signing requires them.'],
    ],
    links: [
      ['/private-pdf-editor.html', 'Private PDF editor'],
      ['/redact-pdf.html', 'Redact PDF'],
      ['/pdf-privacy-security.html', 'PDF privacy and security'],
      ['/pdf-privacy-checklist.html', 'PDF privacy checklist'],
    ],
    footer: 'Open Slay PDF for sensitive PDFs that can be edited locally.',
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
    <priority>0.82</priority>
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/no-upload-pdf-editor\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} privacy intent pages.`)

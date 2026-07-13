import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'pdf-editor-for-firefox',
    title: 'PDF Editor for Firefox - Slay PDF',
    kicker: 'Firefox PDF editor',
    h1: 'Edit PDFs in Firefox with local browser workflows.',
    description: 'Use Slay PDF as a PDF editor for Firefox. Merge, split, sign, redact, OCR, reorder and export PDFs locally from a modern Firefox browser.',
    lead: 'Slay PDF runs from the web and keeps common PDF edits in the browser, which makes it useful when Firefox is your everyday workspace.',
    featureLabel: 'Firefox PDF editor features',
    features: [
      ['No desktop suite', 'Open Slay PDF in Firefox instead of installing a heavy PDF editor for common jobs.'],
      ['Local workflow', 'Common edits and exports run in this browser without a Slay PDF app-server upload.'],
      ['Practical tools', 'Merge, split, reorder, sign, redact, OCR, resize and export PDFs.'],
    ],
    bodyHeading: 'A Firefox-friendly workflow for everyday PDF cleanup.',
    body: [
      'Firefox users often need a quick PDF editor for page cleanup, visual signing, redaction, form work, OCR or selected-page export.',
      'Slay PDF is built for those practical jobs. Use a managed enterprise tool when policy, certificate signing or compliance controls require one.',
    ],
    faqHeading: 'Firefox PDF editor FAQ',
    faqs: [
      ['Does Slay PDF work in Firefox?', 'Use a modern Firefox browser with WebAssembly and IndexedDB support for the full Slay PDF app experience.'],
      ['Are PDFs uploaded from Firefox?', 'No. Common editing and export workflows run locally in this browser.'],
      ['Can I install it?', 'Slay PDF can be installed as a PWA where your browser and device support it.'],
    ],
    links: [
      ['/browser-pdf-editor.html', 'Browser PDF editor'],
      ['/browser-based-pdf-editor.html', 'Browser-based PDF editor'],
      ['/client-side-pdf-editor.html', 'Client-side PDF editor'],
      ['/free-pdf-editor-no-install.html', 'Free PDF editor no install'],
    ],
    footer: 'Open Slay PDF in Firefox for local PDF editing.',
  },
  {
    slug: 'pdf-editor-for-safari',
    title: 'PDF Editor for Safari - Slay PDF',
    kicker: 'Safari PDF editor',
    h1: 'Edit PDFs in Safari without upload-first workflows.',
    description: 'Use Slay PDF as a PDF editor for Safari. Edit, organize, sign, redact, OCR and export PDFs locally from a modern Safari browser.',
    lead: 'Slay PDF gives Safari users a browser PDF workspace for common edits that should stay close to the document.',
    featureLabel: 'Safari PDF editor features',
    features: [
      ['Web app access', 'Open Slay PDF from Safari on supported Apple devices.'],
      ['Local editing', 'Common PDF work runs in this browser rather than a Slay PDF processing server.'],
      ['Export control', 'Download all pages, selected pages, separate PDFs, images or text.'],
    ],
    bodyHeading: 'A local PDF editor path for Safari.',
    body: [
      'Safari can be enough for common PDF cleanup when the editor is built as a browser app.',
      'Use Slay PDF to organize pages, add a visual signature, redact visible content, OCR scans and export clean files without creating an account.',
    ],
    faqHeading: 'Safari PDF editor FAQ',
    faqs: [
      ['Does Slay PDF work in Safari?', 'Use a modern Safari browser with WebAssembly and IndexedDB support for the full app experience.'],
      ['Is this an Apple Preview replacement?', 'It can replace common browser-based PDF editing tasks, but not every Apple Preview or desktop workflow.'],
      ['Does Slay PDF save passwords?', 'No. Export passwords are never saved by Slay PDF.'],
    ],
    links: [
      ['/pdf-editor-for-mac.html', 'PDF editor for Mac'],
      ['/pdf-editor-for-iphone-ipad.html', 'PDF editor for iPhone and iPad'],
      ['/mac-preview-pdf-editor-alternative.html', 'Mac Preview PDF editor alternative'],
      ['/offline-capable-pdf-editor.html', 'Offline-capable PDF editor'],
    ],
    footer: 'Open Slay PDF in Safari for private local PDF workflows.',
  },
  {
    slug: 'pdf-editor-for-edge',
    title: 'PDF Editor for Microsoft Edge - Slay PDF',
    kicker: 'Edge PDF editor',
    h1: 'Edit PDFs in Microsoft Edge with Slay PDF.',
    description: 'Use Slay PDF as a PDF editor for Microsoft Edge. Merge, split, reorder, sign, redact, OCR and export PDFs locally in the browser.',
    lead: 'Slay PDF works as a browser PDF editor for common document jobs when Microsoft Edge is the browser already open.',
    featureLabel: 'Microsoft Edge PDF editor features',
    features: [
      ['Browser-first', 'Open Slay PDF in Edge without a desktop PDF suite for common edits.'],
      ['Local processing', 'Common edits run on your device in this browser.'],
      ['No account wall', 'Start common PDF workflows without creating a Slay PDF account.'],
    ],
    bodyHeading: 'Use Edge for quick local PDF work.',
    body: [
      'Edge users can use Slay PDF for practical edits such as deleting blank pages, combining files, adding signatures, redacting visible content and exporting selected pages.',
      'For managed enterprise documents, use the PDF workflow required by your organization.',
    ],
    faqHeading: 'Microsoft Edge PDF editor FAQ',
    faqs: [
      ['Does Slay PDF work in Edge?', 'Use a modern Edge browser with WebAssembly and IndexedDB support for the full app experience.'],
      ['Can I reorder PDF pages?', 'Yes. Slay PDF supports page organization workflows including reordering, deleting, rotating and splitting.'],
      ['Does it require a Microsoft account?', 'No. Slay PDF does not require a Microsoft account for common local workflows.'],
    ],
    links: [
      ['/pdf-editor-for-windows.html', 'PDF editor for Windows'],
      ['/browser-pdf-editor.html', 'Browser PDF editor'],
      ['/free-pdf-editor-no-download.html', 'Free PDF editor no download'],
      ['/pdf-editor-without-email.html', 'PDF editor without email'],
    ],
    footer: 'Open Slay PDF in Edge for local PDF editing.',
  },
  {
    slug: 'reorder-pdf-pages',
    title: 'Reorder PDF Pages - Slay PDF',
    kicker: 'Reorder PDF pages',
    h1: 'Reorder PDF pages locally in your browser.',
    description: 'Reorder PDF pages with Slay PDF. Drag pages, delete extras, rotate scans, split sections and export the finished PDF from your browser.',
    lead: 'When a PDF packet is out of order, Slay PDF gives you a local browser workspace for dragging pages into the right sequence.',
    featureLabel: 'Reorder PDF pages features',
    features: [
      ['Drag pages', 'Move pages around the workspace and keep related sections together.'],
      ['Clean the packet', 'Delete blank pages, rotate sideways scans and add split markers where needed.'],
      ['Export locally', 'Download all pages, selected pages or separate PDFs from the browser.'],
    ],
    bodyHeading: 'Fix page order without sending the PDF away.',
    body: [
      'Reordering PDF pages is one of the most common document cleanup jobs: scanned forms, contracts, invoices, school packets and signed paperwork often arrive in the wrong order.',
      'Slay PDF keeps that page organization workflow local so the edited file can be exported directly from the browser.',
    ],
    faqHeading: 'Reorder PDF pages FAQ',
    faqs: [
      ['Can I drag pages into a new order?', 'Yes. Use the page workspace to move pages, delete extras and export the new PDF.'],
      ['Can I split the PDF while reordering?', 'Yes. Add split markers to create separate PDFs from one workspace.'],
      ['Does Slay PDF upload the document?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/organize-pdf-pages.html', 'Organize PDF pages'],
      ['/pdf-page-organizer.html', 'PDF page organizer'],
      ['/delete-pdf-pages.html', 'Delete PDF pages'],
      ['/split-pdf.html', 'Split PDF'],
    ],
    footer: 'Open Slay PDF to reorder PDF pages locally.',
  },
  {
    slug: 'legal-pdf-editor',
    title: 'Legal PDF Editor for Local Workflows - Slay PDF',
    kicker: 'Legal PDF editor',
    h1: 'Edit legal PDFs without unnecessary uploads.',
    description: 'Use Slay PDF as a legal PDF editor for local browser workflows: merge packets, reorder pages, sign visually, redact visible content and export.',
    lead: 'Legal documents often contain names, addresses, signatures and case details. Slay PDF is built for common edits where local handling is the safer default.',
    featureLabel: 'Legal PDF editor features',
    features: [
      ['Packet cleanup', 'Merge, split, reorder, rotate and delete pages in the browser.'],
      ['Visual edits', 'Add signatures, text, highlights, page numbers, watermarks and redaction blocks.'],
      ['Clear limits', 'Use counsel-approved or court-required systems when compliance or certificate signing requires them.'],
    ],
    bodyHeading: 'A practical editor for legal document cleanup.',
    body: [
      'Use Slay PDF for everyday legal PDF preparation such as organizing exhibits, removing blank pages, adding a visible signature or flattening redactions for common workflows.',
      'It is not a substitute for legal advice, certified e-signature platforms or organization-controlled document systems.',
    ],
    faqHeading: 'Legal PDF editor FAQ',
    faqs: [
      ['Can I use Slay PDF for legal documents?', 'Use it when local browser editing is appropriate for the document and your policy. It is not legal advice or a compliance certification.'],
      ['Can Slay PDF redact legal PDFs?', 'Slay PDF supports visible redaction blocks and flattened exports for common redaction workflows.'],
      ['Are documents uploaded?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/contract-pdf-editor.html', 'Contract PDF editor'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
      ['/redact-pdf.html', 'Redact PDF'],
      ['/sign-pdf.html', 'Sign PDF'],
    ],
    footer: 'Open Slay PDF for local legal PDF cleanup when policy allows.',
  },
  {
    slug: 'bank-statement-pdf-editor',
    title: 'Bank Statement PDF Editor - Slay PDF',
    kicker: 'Bank statement PDF editor',
    h1: 'Edit bank statement PDFs locally in your browser.',
    description: 'Use Slay PDF as a bank statement PDF editor for local page cleanup, redaction, OCR, text extraction, splitting and export workflows.',
    lead: 'Bank statements are sensitive documents. Slay PDF helps with common cleanup tasks without turning the file into an app-server upload.',
    featureLabel: 'Bank statement PDF editor features',
    features: [
      ['Local handling', 'Common edits run in this browser for a better privacy baseline.'],
      ['Statement cleanup', 'Delete pages, rotate scans, redact visible content, OCR and export selected pages.'],
      ['Separate files', 'Split one statement packet into separate PDFs where needed.'],
    ],
    bodyHeading: 'Keep financial PDFs close while cleaning them up.',
    body: [
      'Financial PDFs can include account numbers, addresses, transaction details and signatures. A local browser workflow reduces unnecessary document movement for common edits.',
      'Use Slay PDF to prepare a clean export, then share only what the receiving party actually needs.',
    ],
    faqHeading: 'Bank statement PDF editor FAQ',
    faqs: [
      ['Can Slay PDF edit bank statements?', 'It can handle common PDF workflows such as page cleanup, redaction blocks, OCR, text extraction and export.'],
      ['Does Slay PDF read or store my banking data?', 'Common workflows run locally in the browser, and Slay PDF does not save export passwords.'],
      ['Should I redact account details?', 'Redact only according to your own requirements and verify the exported PDF before sharing it.'],
    ],
    links: [
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
      ['/redact-pdf.html', 'Redact PDF'],
      ['/extract-pdf-text.html', 'Extract PDF text'],
      ['/separate-pdf-pages.html', 'Separate PDF pages'],
    ],
    footer: 'Open Slay PDF for local bank statement PDF cleanup.',
  },
  {
    slug: 'medical-pdf-editor',
    title: 'Medical PDF Editor for Local Workflows - Slay PDF',
    kicker: 'Medical PDF editor',
    h1: 'Edit medical PDFs with a local browser workflow.',
    description: 'Use Slay PDF as a medical PDF editor for local page cleanup, signing, redaction, OCR, page extraction and export workflows.',
    lead: 'Medical PDFs can include private health details. Slay PDF is useful for common edits where unnecessary uploads are the wrong tradeoff.',
    featureLabel: 'Medical PDF editor features',
    features: [
      ['Local workflow', 'Common edits and exports run in this browser.'],
      ['Careful cleanup', 'Reorder pages, delete extras, sign, redact visible content, OCR scans and export selected pages.'],
      ['Policy limits', 'Use healthcare-approved systems when compliance or patient-record policy requires them.'],
    ],
    bodyHeading: 'A careful PDF workflow for health documents.',
    body: [
      'Use Slay PDF for common health-document tasks such as organizing a packet, signing a form, extracting pages or redacting visible details before sharing.',
      'It does not provide healthcare compliance certification. Follow the requirements that apply to your document and organization.',
    ],
    faqHeading: 'Medical PDF editor FAQ',
    faqs: [
      ['Can I use Slay PDF for medical PDFs?', 'Use it only when local browser editing is appropriate for your document, policy and risk level.'],
      ['Are medical PDFs uploaded to Slay PDF?', 'No. Common editing and export workflows run locally in this browser.'],
      ['Can Slay PDF extract selected pages?', 'Yes. You can export selected pages or separate PDFs from the workspace.'],
    ],
    links: [
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
      ['/private-pdf-editor.html', 'Private PDF editor'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/extract-pages-from-pdf.html', 'Extract pages from PDF'],
    ],
    footer: 'Open Slay PDF for local medical PDF cleanup when policy allows.',
  },
  {
    slug: 'school-pdf-editor',
    title: 'School PDF Editor - Slay PDF',
    kicker: 'School PDF editor',
    h1: 'Edit school PDFs quickly in the browser.',
    description: 'Use Slay PDF as a school PDF editor for assignments, forms, scans, notes and packets. Merge, split, sign, reorder, OCR and export locally.',
    lead: 'School PDFs are often practical jobs: clean a scan, sign a form, combine notes, extract pages or submit a smaller packet.',
    featureLabel: 'School PDF editor features',
    features: [
      ['No account wall', 'Start common PDF edits without creating a Slay PDF account.'],
      ['Useful for packets', 'Merge files, reorder pages, delete extras, add page numbers and export.'],
      ['Local work', 'Common edits run in this browser rather than a Slay PDF app-server upload.'],
    ],
    bodyHeading: 'A fast PDF workflow for students and teachers.',
    body: [
      'Use Slay PDF for everyday school document work: signed forms, class notes, scanned homework, research packets and selected-page exports.',
      'It is designed to be quick and practical rather than a heavy document platform.',
    ],
    faqHeading: 'School PDF editor FAQ',
    faqs: [
      ['Is Slay PDF useful for school PDFs?', 'Yes. It is useful for common tasks such as merging, splitting, signing, OCR, page reordering and export.'],
      ['Does it add a watermark?', 'No. Slay PDF does not add its own watermark to exports.'],
      ['Does it require a signup?', 'No. Common workflows do not require a Slay PDF account.'],
    ],
    links: [
      ['/pdf-editor-for-students.html', 'PDF editor for students'],
      ['/pdf-editor-for-teachers.html', 'PDF editor for teachers'],
      ['/free-pdf-editor-no-signup.html', 'Free PDF editor no signup'],
      ['/ocr-pdf.html', 'OCR PDF'],
    ],
    footer: 'Open Slay PDF for local school PDF editing.',
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
    <priority>0.8</priority>
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/pdf-editor-for-sensitive-documents\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} platform and document intent pages.`)

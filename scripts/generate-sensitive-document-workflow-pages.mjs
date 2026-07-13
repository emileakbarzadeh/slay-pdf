import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'insurance-claim-pdf-editor',
    title: 'Insurance Claim PDF Editor - Slay PDF',
    kicker: 'Insurance claim PDF editor',
    h1: 'Edit insurance claim PDFs locally in your browser.',
    description: 'Use Slay PDF as an insurance claim PDF editor for local page cleanup, signing, redaction, OCR, text export and PDF packet exports.',
    lead: 'Insurance claim packets often include private details, receipts, photos, statements and forms. Slay PDF helps with common cleanup before you share the file.',
    featureLabel: 'Insurance claim PDF editor features',
    features: [
      ['Packet cleanup', 'Merge files, reorder pages, delete extras, rotate scans and split claim packets.'],
      ['Private details', 'Add visible redaction blocks, text, highlights, signatures and page numbers.'],
      ['Local exports', 'Download all pages, selected pages, separate PDFs, images or text from the browser.'],
    ],
    bodyHeading: 'Prepare claim packets without unnecessary uploads.',
    body: [
      'Use Slay PDF to organize insurance paperwork, attach receipts, sign forms, OCR scanned pages and export a clean claim packet.',
      'It does not provide insurance advice or claims guidance. Review the exported PDF and follow the requirements from your insurer.',
    ],
    faqHeading: 'Insurance claim PDF editor FAQ',
    faqs: [
      ['Can Slay PDF edit insurance claim PDFs?', 'Yes. It can handle common PDF workflows such as page cleanup, signing, redaction, OCR and export.'],
      ['Can I combine receipts and forms?', 'Yes. Import multiple PDFs or images, order the pages and export one packet.'],
      ['Are claim documents uploaded?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
      ['/receipt-pdf-organizer.html', 'Receipt PDF organizer'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/redact-pdf.html', 'Redact PDF'],
    ],
    footer: 'Open Slay PDF for local insurance claim PDF cleanup.',
  },
  {
    slug: 'rental-lease-pdf-editor',
    title: 'Rental Lease PDF Editor - Slay PDF',
    kicker: 'Rental lease PDF editor',
    h1: 'Edit rental lease PDFs with local browser tools.',
    description: 'Use Slay PDF as a rental lease PDF editor to sign, fill supported fields, reorder pages, redact visible details and export locally.',
    lead: 'Rental lease PDFs often need quick signing, initials, page cleanup, redaction or selected-page exports.',
    featureLabel: 'Rental lease PDF editor features',
    features: [
      ['Sign visually', 'Place visible signatures or initials on lease pages before export.'],
      ['Clean pages', 'Delete blank pages, rotate scans, reorder sections and export selected pages.'],
      ['Local workflow', 'Common edits run in this browser without a Slay PDF app-server upload.'],
    ],
    bodyHeading: 'Handle lease paperwork without a heavy PDF suite.',
    body: [
      'Use Slay PDF to prepare a lease copy for review, signature or sharing when a local browser workflow is appropriate.',
      'It is not legal advice and does not replace a lease signing platform when your landlord, agent or policy requires one.',
    ],
    faqHeading: 'Rental lease PDF editor FAQ',
    faqs: [
      ['Can I sign a lease PDF?', 'Yes. Slay PDF supports visual signature overlays for common signing workflows.'],
      ['Can I fill lease form fields?', 'Slay PDF can edit supported AcroForm fields and add text overlays when visual text is enough.'],
      ['Does Slay PDF upload rental documents?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/contract-pdf-editor.html', 'Contract PDF editor'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/fill-pdf-forms.html', 'Fill PDF forms'],
      ['/legal-pdf-editor.html', 'Legal PDF editor'],
    ],
    footer: 'Open Slay PDF for local rental lease PDF editing.',
  },
  {
    slug: 'mortgage-document-pdf-editor',
    title: 'Mortgage Document PDF Editor - Slay PDF',
    kicker: 'Mortgage document PDF editor',
    h1: 'Edit mortgage document PDFs locally.',
    description: 'Use Slay PDF as a mortgage document PDF editor for local packet cleanup, selected-page export, redaction, OCR and PDF compression.',
    lead: 'Mortgage packets can be large and sensitive. Slay PDF helps prepare cleaner PDF exports without sending common edits to an app server.',
    featureLabel: 'Mortgage PDF editor features',
    features: [
      ['Large packet cleanup', 'Delete extras, reorder sections, rotate scans and split document groups.'],
      ['Sensitive details', 'Redact visible identifiers and export selected pages where appropriate.'],
      ['Smaller exports', 'Use compression presets after page cleanup when a file is too large.'],
    ],
    bodyHeading: 'Clean up mortgage PDF packets carefully.',
    body: [
      'Use Slay PDF for practical mortgage-document tasks such as organizing statements, combining supporting files, OCRing scans or exporting selected pages.',
      'Follow lender, broker or legal requirements for official submissions and signatures.',
    ],
    faqHeading: 'Mortgage document PDF editor FAQ',
    faqs: [
      ['Can Slay PDF edit mortgage PDFs?', 'Yes. It can handle common PDF cleanup, redaction, OCR, compression and export workflows.'],
      ['Can I export only selected pages?', 'Yes. Select pages or add split markers before export.'],
      ['Does compression always reduce the file?', 'No. Compression results depend on the original PDF content and existing compression.'],
    ],
    links: [
      ['/bank-statement-pdf-editor.html', 'Bank statement PDF editor'],
      ['/reduce-pdf-size-for-email.html', 'Reduce PDF size for email'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
      ['/separate-pdf-pages.html', 'Separate PDF pages'],
    ],
    footer: 'Open Slay PDF for local mortgage PDF cleanup.',
  },
  {
    slug: 'pay-stub-pdf-editor',
    title: 'Pay Stub PDF Editor - Slay PDF',
    kicker: 'Pay stub PDF editor',
    h1: 'Edit pay stub PDFs with a local workflow.',
    description: 'Use Slay PDF as a pay stub PDF editor for local redaction, page cleanup, splitting, OCR, text export and selected-page PDF exports.',
    lead: 'Pay stubs contain sensitive employment and income details. Slay PDF is useful when common edits should stay in the browser.',
    featureLabel: 'Pay stub PDF editor features',
    features: [
      ['Local redaction', 'Cover visible details before exporting a flattened copy.'],
      ['Selected pages', 'Export only the pay stub pages needed for a request.'],
      ['Text and OCR', 'Extract text or run OCR when the document is scanned.'],
    ],
    bodyHeading: 'Prepare pay stub PDFs before sharing.',
    body: [
      'Use Slay PDF to remove extra pages, redact visible identifiers, split packets and export clean copies from the browser.',
      'Always review the exported PDF before sharing income, employment or identity documents.',
    ],
    faqHeading: 'Pay stub PDF editor FAQ',
    faqs: [
      ['Can I redact a pay stub PDF?', 'Yes. Slay PDF supports visible redaction blocks and flattened exports for common redaction workflows.'],
      ['Can I split one pay stub packet?', 'Yes. Use selected-page export or split markers to create separate PDFs.'],
      ['Are pay stubs uploaded?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/bank-statement-pdf-editor.html', 'Bank statement PDF editor'],
      ['/redact-pdf.html', 'Redact PDF'],
      ['/extract-pdf-text.html', 'Extract PDF text'],
      ['/split-pdf.html', 'Split PDF'],
    ],
    footer: 'Open Slay PDF for local pay stub PDF cleanup.',
  },
  {
    slug: 'utility-bill-pdf-editor',
    title: 'Utility Bill PDF Editor - Slay PDF',
    kicker: 'Utility bill PDF editor',
    h1: 'Edit utility bill PDFs locally in your browser.',
    description: 'Use Slay PDF as a utility bill PDF editor for local page cleanup, redaction, selected-page export, OCR and PDF compression.',
    lead: 'Utility bills often prove address or identity and can include account details. Slay PDF helps prepare a clean copy locally.',
    featureLabel: 'Utility bill PDF editor features',
    features: [
      ['Address documents', 'Crop, rotate, reorder and export the pages needed for proof-of-address requests.'],
      ['Visible redaction', 'Cover account numbers or other visible details where appropriate.'],
      ['Browser export', 'Download the final PDF from this browser.'],
    ],
    bodyHeading: 'Prepare proof-of-address PDFs with care.',
    body: [
      'Use Slay PDF to clean scanned utility bills, remove extra pages, redact visible account details and export selected pages.',
      'Check the receiving party requirements before redacting or changing any proof-of-address document.',
    ],
    faqHeading: 'Utility bill PDF editor FAQ',
    faqs: [
      ['Can I crop a utility bill PDF?', 'Yes. Slay PDF supports crop, rotate, resize and export workflows.'],
      ['Can I redact account numbers?', 'Yes. Add visible redaction blocks and export a flattened copy for common redaction workflows.'],
      ['Does Slay PDF upload utility bills?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/crop-pdf.html', 'Crop PDF'],
      ['/redact-pdf.html', 'Redact PDF'],
      ['/extract-pages-from-pdf.html', 'Extract pages from PDF'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
    ],
    footer: 'Open Slay PDF for local utility bill PDF editing.',
  },
  {
    slug: 'passport-application-pdf-editor',
    title: 'Passport Application PDF Editor - Slay PDF',
    kicker: 'Passport application PDF editor',
    h1: 'Edit passport application PDFs with local tools.',
    description: 'Use Slay PDF as a passport application PDF editor for local form filling, signing, page cleanup, OCR and PDF export workflows.',
    lead: 'Passport application PDFs can include identity details. Use Slay PDF for common local edits when the official instructions allow it.',
    featureLabel: 'Passport application PDF editor features',
    features: [
      ['Form support', 'Edit supported PDF form fields or add visual text overlays where appropriate.'],
      ['Signature workflow', 'Place visual signatures when accepted by the receiving process.'],
      ['Page cleanup', 'Rotate scans, delete extra pages and export the final PDF.'],
    ],
    bodyHeading: 'Prepare application PDFs carefully.',
    body: [
      'Use Slay PDF to fill supported fields, add text, sign visually, clean pages and export a local copy.',
      'Slay PDF is not a government service. Follow the official passport application instructions for signatures, printing and submission.',
    ],
    faqHeading: 'Passport application PDF editor FAQ',
    faqs: [
      ['Can I fill a passport application PDF?', 'Slay PDF can edit supported AcroForm fields and add visual text overlays for common workflows.'],
      ['Can I sign the PDF?', 'Yes. Slay PDF supports visual signature overlays, but you must follow the official signature requirements.'],
      ['Are application documents uploaded?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/fill-pdf-forms.html', 'Fill PDF forms'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/government-form-pdf-editor.html', 'Government form PDF editor'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
    ],
    footer: 'Open Slay PDF for local passport application PDF editing.',
  },
  {
    slug: 'visa-application-pdf-editor',
    title: 'Visa Application PDF Editor - Slay PDF',
    kicker: 'Visa application PDF editor',
    h1: 'Edit visa application PDFs locally.',
    description: 'Use Slay PDF as a visa application PDF editor for local form filling, signing, page cleanup, OCR, selected-page export and PDF compression.',
    lead: 'Visa application packets can include passports, statements, photos and supporting documents. Slay PDF helps prepare local PDF copies when appropriate.',
    featureLabel: 'Visa application PDF editor features',
    features: [
      ['Application packets', 'Combine supporting PDFs and images into one ordered packet.'],
      ['Forms and signatures', 'Fill supported fields, add text overlays and place visual signatures.'],
      ['Local outputs', 'Export selected pages, separate PDFs, page images, text or compressed PDFs.'],
    ],
    bodyHeading: 'Prepare visa PDFs without extra upload steps.',
    body: [
      'Use Slay PDF for common PDF preparation: organize documents, clean scans, OCR pages, reduce file size and export selected pages.',
      'Slay PDF is not an immigration service. Follow the official instructions from the relevant authority.',
    ],
    faqHeading: 'Visa application PDF editor FAQ',
    faqs: [
      ['Can Slay PDF combine visa documents?', 'Yes. Import PDFs or images, order the pages and export a combined PDF.'],
      ['Can I reduce a visa PDF file size?', 'Yes. Delete unnecessary pages and use compression presets, with results depending on the source file.'],
      ['Does Slay PDF upload visa documents?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/passport-application-pdf-editor.html', 'Passport application PDF editor'],
      ['/images-to-pdf.html', 'Images to PDF'],
      ['/reduce-pdf-size-for-email.html', 'Reduce PDF size for email'],
      ['/merge-pdf.html', 'Merge PDF'],
    ],
    footer: 'Open Slay PDF for local visa application PDF editing.',
  },
  {
    slug: 'government-form-pdf-editor',
    title: 'Government Form PDF Editor - Slay PDF',
    kicker: 'Government form PDF editor',
    h1: 'Edit government form PDFs with a local browser workflow.',
    description: 'Use Slay PDF as a government form PDF editor for supported form fields, text overlays, signatures, page cleanup, OCR and export.',
    lead: 'Government forms often include private information. Slay PDF can handle common local PDF edits when the official process allows it.',
    featureLabel: 'Government form PDF editor features',
    features: [
      ['Supported fields', 'Edit supported AcroForm text fields, checkboxes, choices and radio groups.'],
      ['Visual edits', 'Add text, signatures, highlights, redaction blocks and page numbers.'],
      ['Local downloads', 'Export the prepared PDF from this browser.'],
    ],
    bodyHeading: 'Fill and prepare forms carefully.',
    body: [
      'Use Slay PDF to fill supported fields, add visual text, sign, clean scanned pages and export final PDF copies.',
      'Slay PDF is not a government service. Follow the official instructions for each form and submission process.',
    ],
    faqHeading: 'Government form PDF editor FAQ',
    faqs: [
      ['Can Slay PDF fill government PDF forms?', 'It can edit supported PDF form fields and add visual text overlays. Some form features may be unsupported.'],
      ['Can I add a signature?', 'Yes. Add a visual signature overlay when that matches the form instructions.'],
      ['Are forms uploaded?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/fill-pdf-forms.html', 'Fill PDF forms'],
      ['/pdf-form-filler.html', 'PDF form filler'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
    ],
    footer: 'Open Slay PDF for local government form PDF editing.',
  },
  {
    slug: 'nda-pdf-editor',
    title: 'NDA PDF Editor - Slay PDF',
    kicker: 'NDA PDF editor',
    h1: 'Edit NDA PDFs locally in your browser.',
    description: 'Use Slay PDF as an NDA PDF editor for local signing, text overlays, page cleanup, redaction, page numbering and PDF export.',
    lead: 'NDAs are usually sensitive business documents. Slay PDF is useful for common local edits when a simple visual workflow is enough.',
    featureLabel: 'NDA PDF editor features',
    features: [
      ['Visual signing', 'Place signature text or initials before exporting a copy.'],
      ['Document cleanup', 'Reorder pages, delete extras, add page numbers and export selected pages.'],
      ['Sensitive terms', 'Use redaction blocks for visible details when appropriate.'],
    ],
    bodyHeading: 'Prepare NDA copies without a full document platform.',
    body: [
      'Use Slay PDF to sign a review copy, add text, clean pages or export a shareable PDF from the browser.',
      'Use a managed signing or legal workflow when the NDA requires certificate signing, audit trails or counsel-approved systems.',
    ],
    faqHeading: 'NDA PDF editor FAQ',
    faqs: [
      ['Can I sign an NDA PDF?', 'Yes. Slay PDF supports visual signature overlays for common signing workflows.'],
      ['Can I add text to an NDA?', 'Yes. Add text overlays or edit supported form fields where available.'],
      ['Does Slay PDF upload NDA documents?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/contract-pdf-editor.html', 'Contract PDF editor'],
      ['/legal-pdf-editor.html', 'Legal PDF editor'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/pdf-editor-for-business.html', 'PDF editor for business'],
    ],
    footer: 'Open Slay PDF for local NDA PDF editing.',
  },
  {
    slug: 'w9-pdf-editor',
    title: 'W-9 PDF Editor - Slay PDF',
    kicker: 'W-9 PDF editor',
    h1: 'Edit W-9 PDFs with local browser tools.',
    description: 'Use Slay PDF as a W-9 PDF editor for supported form fields, text overlays, visual signatures, redaction, local export and PDF compression.',
    lead: 'W-9 PDFs include tax identity details. Slay PDF helps with common local form and export workflows when browser editing is appropriate.',
    featureLabel: 'W-9 PDF editor features',
    features: [
      ['Form fields', 'Edit supported AcroForm fields or add visual text overlays.'],
      ['Signature support', 'Add a visual signature when it matches the receiving process.'],
      ['Local export', 'Download the completed PDF without a Slay PDF app-server upload.'],
    ],
    bodyHeading: 'Handle tax form PDFs carefully.',
    body: [
      'Use Slay PDF to fill supported W-9 fields, add text, sign visually and export a local copy.',
      'Slay PDF does not provide tax advice. Verify the form and follow the requirements from the requesting party or tax authority.',
    ],
    faqHeading: 'W-9 PDF editor FAQ',
    faqs: [
      ['Can Slay PDF fill a W-9 PDF?', 'It can edit supported PDF form fields and add visual text overlays.'],
      ['Can I sign a W-9 PDF?', 'Yes. Add a visual signature overlay when that is appropriate for your workflow.'],
      ['Are W-9 documents uploaded?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/tax-document-pdf-editor.html', 'Tax document PDF editor'],
      ['/fill-pdf-forms.html', 'Fill PDF forms'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
    ],
    footer: 'Open Slay PDF for local W-9 PDF editing.',
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/w9-pdf-editor\.html<\/loc>[\s\S]*?  <\/url>\n/
  const fallbackAnchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/tax-document-pdf-editor\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.match(fallbackAnchorPattern)
      ? withoutGenerated.replace(fallbackAnchorPattern, (match) => `${match}${entries}`)
      : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} sensitive document workflow pages.`)

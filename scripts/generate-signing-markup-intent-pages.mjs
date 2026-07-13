import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'add-initials-to-pdf',
    title: 'Add Initials to PDF - Slay PDF',
    kicker: 'Add initials to PDF',
    h1: 'Add initials to a PDF locally in your browser.',
    description: 'Add initials to PDFs with Slay PDF. Place visible initials, signatures, dates or text overlays and export the finished PDF locally.',
    lead: 'Use Slay PDF when a PDF needs simple visual initials before sending, filing or reviewing.',
    featureLabel: 'Add initials to PDF features',
    features: [
      ['Visual initials', 'Place initials with the text or signature tools in the page editor.'],
      ['Move and scale', 'Select overlays to position and resize initials before export.'],
      ['Local export', 'Download the initialed PDF from the browser.'],
    ],
    bodyHeading: 'Initial a PDF without a full signing platform.',
    body: [
      'Initials are useful for leases, NDAs, contracts, forms and approval packets where a visible mark is enough.',
      'Use a managed signing platform when certificate signing, audit trails or organization policy require it.',
    ],
    faqHeading: 'Add initials to PDF FAQ',
    faqs: [
      ['Can I add initials to a PDF?', 'Yes. Add visible initials with text or signature overlays, then export the PDF.'],
      ['Can I move initials after adding them?', 'Yes. Select overlays in the page editor to move or scale them before export.'],
      ['Does Slay PDF upload the document?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/sign-pdf.html', 'Sign PDF'],
      ['/add-signature-to-pdf.html', 'Add signature to PDF'],
      ['/pdf-signature.html', 'PDF signature'],
      ['/rental-lease-pdf-editor.html', 'Rental lease PDF editor'],
    ],
    footer: 'Open Slay PDF to add initials to PDFs locally.',
  },
  {
    slug: 'add-date-to-pdf',
    title: 'Add Date to PDF - Slay PDF',
    kicker: 'Add date to PDF',
    h1: 'Add a date to a PDF before exporting.',
    description: 'Add dates to PDFs with Slay PDF. Place visible date text, signatures, notes, highlights or stamps and export locally from your browser.',
    lead: 'Use Slay PDF when a form, contract, approval page or record needs a visible date added quickly.',
    featureLabel: 'Add date to PDF features',
    features: [
      ['Text dates', 'Use the text tool to place a visible date on the page.'],
      ['Combine with signing', 'Add dates next to signatures, initials or approval notes.'],
      ['Browser export', 'Download the dated PDF locally after reviewing placement.'],
    ],
    bodyHeading: 'Place dates where the document needs them.',
    body: [
      'Date overlays are useful for signed forms, review packets, approvals and records.',
      'Slay PDF creates visible edits in the exported PDF. Use the official workflow required by the receiver if a certified date or audit trail is needed.',
    ],
    faqHeading: 'Add date to PDF FAQ',
    faqs: [
      ['Can I add a date to a PDF?', 'Yes. Use the text tool to place a visible date before exporting.'],
      ['Can I add a date next to a signature?', 'Yes. Add a signature overlay and a text date overlay on the same page.'],
      ['Is the date certified?', 'No. It is a visible document edit, not a certified timestamp or signing audit trail.'],
    ],
    links: [
      ['/sign-pdf.html', 'Sign PDF'],
      ['/add-initials-to-pdf.html', 'Add initials to PDF'],
      ['/fill-pdf-forms.html', 'Fill PDF forms'],
      ['/government-form-pdf-editor.html', 'Government form PDF editor'],
    ],
    footer: 'Open Slay PDF to add visible dates to PDFs locally.',
  },
  {
    slug: 'stamp-pdf',
    title: 'Stamp PDF - Slay PDF',
    kicker: 'Stamp PDF',
    h1: 'Add a visible stamp to a PDF.',
    description: 'Stamp PDFs with Slay PDF by adding visible text, watermark text, approval marks, review notes or rectangles before local export.',
    lead: 'Use Slay PDF for simple visible stamps such as REVIEW, APPROVED, DRAFT or CONFIDENTIAL when a practical browser workflow is enough.',
    featureLabel: 'PDF stamp features',
    features: [
      ['Text stamp', 'Place visible text overlays on individual pages.'],
      ['Watermark stamp', 'Apply a diagonal text watermark at export time.'],
      ['Markup tools', 'Combine text with highlights, rectangles, ink or signatures.'],
    ],
    bodyHeading: 'Create simple PDF stamps in the browser.',
    body: [
      'A visible PDF stamp can help mark draft copies, internal review packets, approvals or confidential material.',
      'Slay PDF does not provide certificate stamping or audit trails. It creates visible edits in the exported PDF.',
    ],
    faqHeading: 'Stamp PDF FAQ',
    faqs: [
      ['Can I stamp a PDF?', 'Yes. Add visible text overlays or export-time watermark text to create a simple stamp.'],
      ['Can I stamp every page?', 'Use the watermark setting for export-time text across the PDF.'],
      ['Is this a certified stamp?', 'No. Slay PDF adds visible marks, not certificate-based stamps or audit trails.'],
    ],
    links: [
      ['/watermark-pdf.html', 'Watermark PDF'],
      ['/add-watermark-to-pdf.html', 'Add watermark to PDF'],
      ['/annotate-pdf.html', 'Annotate PDF'],
      ['/approval-stamp-pdf.html', 'Approval stamp PDF'],
    ],
    footer: 'Open Slay PDF to add visible PDF stamps locally.',
  },
  {
    slug: 'confidential-watermark-pdf',
    title: 'Confidential Watermark PDF - Slay PDF',
    kicker: 'Confidential watermark PDF',
    h1: 'Add a confidential watermark to a PDF.',
    description: 'Add a confidential watermark to PDFs with Slay PDF. Apply visible export-time watermark text and download the marked PDF locally.',
    lead: 'Use Slay PDF when a document needs a visible CONFIDENTIAL watermark before sharing or review.',
    featureLabel: 'Confidential watermark features',
    features: [
      ['Watermark text', 'Set CONFIDENTIAL or custom watermark text before export.'],
      ['Opacity control', 'Adjust watermark strength so it stays visible without overwhelming the page.'],
      ['Local download', 'Export the marked PDF from this browser.'],
    ],
    bodyHeading: 'Mark confidential PDFs before export.',
    body: [
      'Confidential watermarks are useful for drafts, review copies, internal packets and sensitive documents.',
      'A visible watermark is not access control. Use encryption or approved document systems when policy requires stronger protection.',
    ],
    faqHeading: 'Confidential watermark PDF FAQ',
    faqs: [
      ['Can I add a confidential watermark?', 'Yes. Use the watermark setting and enter CONFIDENTIAL or your preferred text.'],
      ['Can I change opacity?', 'Yes. Slay PDF includes watermark opacity control before export.'],
      ['Does a watermark secure the PDF?', 'No. A visible watermark is a label, not access control or certification.'],
    ],
    links: [
      ['/watermark-pdf.html', 'Watermark PDF'],
      ['/add-watermark-to-pdf.html', 'Add watermark to PDF'],
      ['/password-protect-pdf.html', 'Password protect PDF'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
    ],
    footer: 'Open Slay PDF to add confidential watermarks locally.',
  },
  {
    slug: 'draft-watermark-pdf',
    title: 'Draft Watermark PDF - Slay PDF',
    kicker: 'Draft watermark PDF',
    h1: 'Add a draft watermark to a PDF.',
    description: 'Add a DRAFT watermark to PDFs with Slay PDF. Use export-time watermark text, adjust opacity and download the marked PDF locally.',
    lead: 'Use Slay PDF when a review copy needs a visible DRAFT label before it leaves your browser.',
    featureLabel: 'Draft watermark features',
    features: [
      ['DRAFT label', 'Set the export watermark text to DRAFT or another review label.'],
      ['Page cleanup first', 'Reorder, delete, rotate or annotate pages before watermark export.'],
      ['Local workflow', 'Download the watermarked PDF from the browser.'],
    ],
    bodyHeading: 'Mark draft copies before sharing.',
    body: [
      'Draft watermarks help distinguish review copies from final documents.',
      'Slay PDF applies the watermark during export so you can finish page cleanup and markup first.',
    ],
    faqHeading: 'Draft watermark PDF FAQ',
    faqs: [
      ['Can I add a DRAFT watermark?', 'Yes. Enter DRAFT in the watermark field before exporting.'],
      ['Can I watermark after editing pages?', 'Yes. Watermark export can be combined with page cleanup, annotations and page numbers.'],
      ['Does Slay PDF upload the PDF to watermark it?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/watermark-pdf.html', 'Watermark PDF'],
      ['/confidential-watermark-pdf.html', 'Confidential watermark PDF'],
      ['/annotate-pdf.html', 'Annotate PDF'],
      ['/review-pdf.html', 'Review PDF'],
    ],
    footer: 'Open Slay PDF to add draft watermarks locally.',
  },
  {
    slug: 'approval-stamp-pdf',
    title: 'Approval Stamp PDF - Slay PDF',
    kicker: 'Approval stamp PDF',
    h1: 'Add an approval stamp to a PDF.',
    description: 'Add approval stamps to PDFs with Slay PDF using visible text overlays, signatures, dates, highlights or watermark text before local export.',
    lead: 'Use Slay PDF for simple approval marks such as APPROVED, REVIEWED or signed/date annotations.',
    featureLabel: 'Approval stamp PDF features',
    features: [
      ['Approval text', 'Place visible APPROVED, REVIEWED or custom text on the page.'],
      ['Date and signature', 'Combine approval text with dates, initials or signatures.'],
      ['Local export', 'Download the marked PDF locally from the browser.'],
    ],
    bodyHeading: 'Mark approval copies visibly.',
    body: [
      'Approval marks are useful for internal review packets, school forms, business documents and lightweight workflows.',
      'Use a managed approval system when you need audit trails, certificate signatures or organization controls.',
    ],
    faqHeading: 'Approval stamp PDF FAQ',
    faqs: [
      ['Can I add an approval stamp to a PDF?', 'Yes. Use visible text overlays, signatures, dates or watermark text before exporting.'],
      ['Can I add APPROVED to every page?', 'Use the watermark setting for export-time text across the PDF.'],
      ['Is this an audited approval?', 'No. Slay PDF creates visible marks, not an approval audit trail.'],
    ],
    links: [
      ['/stamp-pdf.html', 'Stamp PDF'],
      ['/add-date-to-pdf.html', 'Add date to PDF'],
      ['/add-initials-to-pdf.html', 'Add initials to PDF'],
      ['/pdf-editor-for-business.html', 'PDF editor for business'],
    ],
    footer: 'Open Slay PDF to add visible approval stamps locally.',
  },
  {
    slug: 'review-pdf',
    title: 'Review PDF - Slay PDF',
    kicker: 'Review PDF',
    h1: 'Review and mark up a PDF locally.',
    description: 'Review PDFs with Slay PDF. Add highlights, text, drawings, rectangles, signatures, redactions and watermarks before exporting locally.',
    lead: 'Use Slay PDF for practical review markup when the PDF should stay in your browser.',
    featureLabel: 'PDF review features',
    features: [
      ['Markup tools', 'Add text, highlights, rectangles, ink drawings and signatures.'],
      ['Page organization', 'Delete extras, reorder pages, rotate scans and split sections.'],
      ['Export options', 'Download a PDF, selected pages, separate PDFs, page images or text.'],
    ],
    bodyHeading: 'Review PDFs without sending them away.',
    body: [
      'PDF review often means highlighting important areas, adding notes, drawing attention to a section and exporting a clean copy.',
      'Slay PDF keeps that workflow in the browser for common documents.',
    ],
    faqHeading: 'Review PDF FAQ',
    faqs: [
      ['Can I review a PDF in Slay PDF?', 'Yes. Use highlights, text, drawings, rectangles, signatures and page tools before export.'],
      ['Can I export only reviewed pages?', 'Yes. Select the pages you need or use split markers before export.'],
      ['Does review markup upload the PDF?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/annotate-pdf.html', 'Annotate PDF'],
      ['/highlight-pdf.html', 'Highlight PDF'],
      ['/draw-on-pdf.html', 'Draw on PDF'],
      ['/draft-watermark-pdf.html', 'Draft watermark PDF'],
    ],
    footer: 'Open Slay PDF to review PDFs locally.',
  },
  {
    slug: 'sign-and-date-pdf',
    title: 'Sign and Date PDF - Slay PDF',
    kicker: 'Sign and date PDF',
    h1: 'Sign and date a PDF in the browser.',
    description: 'Sign and date PDFs with Slay PDF. Add visible signatures, dates, initials or text overlays and export the finished PDF locally.',
    lead: 'Use Slay PDF when a PDF needs a visible signature and date without uploading it to another site.',
    featureLabel: 'Sign and date PDF features',
    features: [
      ['Visible signature', 'Place a visual signature overlay on the page.'],
      ['Date text', 'Add a date with the text tool next to the signature.'],
      ['Local download', 'Export the signed and dated PDF from this browser.'],
    ],
    bodyHeading: 'Add the common signing marks together.',
    body: [
      'Many everyday PDFs need a signature, date and sometimes initials. Slay PDF keeps those visible edits in one page editor.',
      'For certificate signing, identity verification or audit trails, use the signing system required by the receiver.',
    ],
    faqHeading: 'Sign and date PDF FAQ',
    faqs: [
      ['Can I sign and date a PDF?', 'Yes. Add a visual signature overlay and a text date overlay before exporting.'],
      ['Can I add initials too?', 'Yes. Use text or signature overlays for initials.'],
      ['Is this certificate signing?', 'No. Slay PDF creates visible signing marks, not certificate signatures or audit trails.'],
    ],
    links: [
      ['/sign-pdf.html', 'Sign PDF'],
      ['/add-signature-to-pdf.html', 'Add signature to PDF'],
      ['/add-date-to-pdf.html', 'Add date to PDF'],
      ['/add-initials-to-pdf.html', 'Add initials to PDF'],
    ],
    footer: 'Open Slay PDF to sign and date PDFs locally.',
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/add-signature-to-pdf\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} signing and markup intent pages.`)

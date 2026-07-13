import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'combine-pdf',
    title: 'Combine PDF - Slay PDF',
    kicker: 'Combine PDF',
    h1: 'Combine PDFs locally in your browser.',
    description: 'Combine PDF files with Slay PDF. Merge PDFs and images locally in your browser, reorder pages and export a clean PDF without app-server uploads.',
    lead: 'Use Slay PDF when you need to combine PDFs, image scans or selected pages into one local browser workspace.',
    featureLabel: 'Combine PDF features',
    features: [
      ['Multiple inputs', 'Import PDF files and common image formats into the same workspace.'],
      ['Page control', 'Reorder, rotate, delete or split pages before export.'],
      ['Local export', 'Download one combined PDF from the browser without a Slay PDF app-server upload.'],
    ],
    bodyHeading: 'A combine-PDF workflow for private documents.',
    body: [
      'Combining PDFs often means receipts, contracts, scans or client files. Slay PDF keeps the everyday merge workflow in the browser so those files do not need to enter another upload queue.',
      'After importing, you can remove extra pages, rotate scans, add annotations or export only the selected pages.',
    ],
    faqHeading: 'Combine PDF FAQ',
    faqs: [
      ['Can Slay PDF combine multiple PDFs?', 'Yes. Import multiple PDFs, reorder the pages and export the combined result.'],
      ['Can I combine images with PDFs?', 'Yes. Slay PDF can import common image formats and include them in the exported PDF.'],
      ['Are files uploaded to combine PDFs?', 'No. Common combine and export workflows run locally in this browser.'],
    ],
    links: [
      ['/merge-pdf.html', 'Merge PDF'],
      ['/combine-pdf-files.html', 'Combine PDF files'],
      ['/merge-pdf-online.html', 'Merge PDF online'],
      ['/merge-pdf-without-uploading.html', 'Merge PDF without uploading'],
    ],
    footer: 'Open Slay PDF to combine PDF pages locally.',
  },
  {
    slug: 'add-watermark-to-pdf',
    title: 'Add Watermark to PDF - Slay PDF',
    kicker: 'Add watermark to PDF',
    h1: 'Add a watermark to a PDF locally.',
    description: 'Add a watermark to PDF files with Slay PDF. Apply draft, confidential or review marks locally in your browser and export a clean PDF.',
    lead: 'Use Slay PDF to add visible watermark text or marks before exporting a PDF from the local browser workspace.',
    featureLabel: 'Add watermark to PDF features',
    features: [
      ['Visual marks', 'Add text, shapes or signature-style marks to the page editor.'],
      ['Common labels', 'Create draft, confidential, review or internal-use markings.'],
      ['Local output', 'Export the edited PDF from the browser without an app-server document upload.'],
    ],
    bodyHeading: 'Watermark private PDFs without sending them away.',
    body: [
      'Watermarks are often added to drafts, contracts, proof copies and internal documents. Slay PDF keeps that work in the same local editor used for annotation and export.',
      'For stronger privacy workflows, combine watermarking with redaction, password-protected export or selected-page export.',
    ],
    faqHeading: 'Add watermark to PDF FAQ',
    faqs: [
      ['Can I add a text watermark?', 'Yes. Add text in the page editor and position it on the PDF before exporting.'],
      ['Can I watermark selected pages?', 'Yes. Edit the pages that need a mark, then export all pages or only selected pages.'],
      ['Does Slay PDF add its own watermark?', 'No. Slay PDF is a PDF editor with no app-added watermark on exports.'],
    ],
    links: [
      ['/watermark-pdf.html', 'Watermark PDF'],
      ['/annotate-pdf.html', 'Annotate PDF'],
      ['/pdf-editor-no-watermark.html', 'PDF editor no watermark'],
      ['/redact-pdf.html', 'Redact PDF'],
    ],
    footer: 'Open Slay PDF to add PDF watermarks locally.',
  },
  {
    slug: 'posterize-pdf',
    title: 'Posterize PDF - Slay PDF',
    kicker: 'Posterize PDF',
    h1: 'Posterize a PDF into printable tiles.',
    description: 'Posterize PDF pages with Slay PDF. Split one PDF page into printable tiles, choose paper size and export locally from your browser.',
    lead: 'Posterize is the common US spelling for the same posterise workflow: turn one PDF page into multiple printable pages.',
    featureLabel: 'Posterize PDF features',
    features: [
      ['Tile layout', 'Choose rows and columns for the printable output.'],
      ['Paper size', 'Use common page sizes or custom dimensions for tiled exports.'],
      ['No stretching', 'Preserve page aspect ratio and use white letterboxing where needed.'],
    ],
    bodyHeading: 'Print a large PDF using normal paper.',
    body: [
      'Slay PDF can split a source page across multiple output pages for signs, posters, notices or classroom materials.',
      'The posterize workflow sits inside the same page editor, so you can crop, rotate or resize before exporting printable tiles.',
    ],
    faqHeading: 'Posterize PDF FAQ',
    faqs: [
      ['Is posterize the same as posterise?', 'For this tool, yes. Slay PDF uses both spellings for the printable tile workflow.'],
      ['Can I choose A4 or Letter output?', 'Yes. Choose common paper sizes or custom dimensions before export.'],
      ['Will the PDF be stretched?', 'No. Slay PDF preserves the content aspect ratio and adds white letterboxing where needed.'],
    ],
    links: [
      ['/posterise-pdf.html', 'Posterise PDF'],
      ['/printable-poster-pdf.html', 'Printable poster PDF'],
      ['/resize-pdf.html', 'Resize PDF'],
      ['/crop-pdf.html', 'Crop PDF'],
    ],
    footer: 'Open Slay PDF to posterize PDF pages locally.',
  },
  {
    slug: 'pdf-page-organizer',
    title: 'PDF Page Organizer - Slay PDF',
    kicker: 'PDF page organizer',
    h1: 'Organize PDF pages without uploading files.',
    description: 'Organize PDF pages with Slay PDF. Reorder, delete, rotate, split, merge and export PDF pages locally in your browser.',
    lead: 'Slay PDF gives you a visual page organizer for everyday cleanup: reorder pages, delete blanks, fix rotation and export the exact result.',
    featureLabel: 'PDF page organizer features',
    features: [
      ['Reorder pages', 'Drag pages into the order you need.'],
      ['Clean up scans', 'Delete blanks, rotate sideways pages and crop margins.'],
      ['Export choices', 'Download all pages, selected pages or separate PDFs using split markers.'],
    ],
    bodyHeading: 'A local workspace for page cleanup.',
    body: [
      'PDF page organization is often the whole job: remove the wrong page, put attachments in order or split a packet into separate files.',
      'Slay PDF focuses on that practical workflow and keeps common page operations in the browser.',
    ],
    faqHeading: 'PDF page organizer FAQ',
    faqs: [
      ['Can I reorder pages?', 'Yes. Drag pages in the workspace to change the final export order.'],
      ['Can I split one PDF into multiple PDFs?', 'Yes. Add split markers and export separate PDFs from the workspace.'],
      ['Can I export only selected pages?', 'Yes. Select pages and use the selected-pages export.'],
    ],
    links: [
      ['/organize-pdf-pages.html', 'Organize PDF pages'],
      ['/split-pdf.html', 'Split PDF'],
      ['/delete-pdf-pages.html', 'Delete PDF pages'],
      ['/rotate-pdf.html', 'Rotate PDF'],
    ],
    footer: 'Open Slay PDF to organize PDF pages locally.',
  },
  {
    slug: 'pdf-form-filler',
    title: 'PDF Form Filler - Slay PDF',
    kicker: 'PDF form filler',
    h1: 'Fill PDF forms locally in your browser.',
    description: 'Fill PDF forms with Slay PDF. Edit supported form fields, add text or signatures and export PDFs locally without app-server uploads.',
    lead: 'Use Slay PDF for practical form work: supported AcroForm fields, visual text, signatures and export from the browser.',
    featureLabel: 'PDF form filler features',
    features: [
      ['Supported fields', 'Edit supported PDF form fields when the document exposes them.'],
      ['Visual edits', 'Add text, signatures, check marks or annotations when a form is flattened.'],
      ['Private workflow', 'Documents and edits stay in this browser for common form-filling work.'],
    ],
    bodyHeading: 'Form filling without another document upload.',
    body: [
      'Some PDFs contain editable fields. Others are scans or flattened forms that need visual text and signatures. Slay PDF supports both practical paths inside one local workspace.',
      'After filling, you can export the full document, selected pages or a password-protected PDF.',
    ],
    faqHeading: 'PDF form filler FAQ',
    faqs: [
      ['Can Slay PDF fill PDF forms?', 'Yes for supported AcroForm fields, and it can also add visual text and signatures to flattened forms.'],
      ['Can I sign a filled form?', 'Yes. Add a visual signature or approval mark before export.'],
      ['Are form values saved on a server?', 'No. Common editing work stays in this browser, and passwords are never saved.'],
    ],
    links: [
      ['/fill-pdf-forms.html', 'Fill PDF forms'],
      ['/fill-pdf-forms-without-uploading.html', 'Fill PDF forms without uploading'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/password-protect-pdf.html', 'Password protect PDF'],
    ],
    footer: 'Open Slay PDF to fill PDF forms locally.',
  },
  {
    slug: 'pdf-signature',
    title: 'PDF Signature - Slay PDF',
    kicker: 'PDF signature',
    h1: 'Add a signature to a PDF locally.',
    description: 'Add a PDF signature with Slay PDF. Place visual signatures, initials and approval marks in your browser and export the signed PDF locally.',
    lead: 'Slay PDF handles everyday visual signing workflows for forms, approvals and quick document packets.',
    featureLabel: 'PDF signature features',
    features: [
      ['Visual signatures', 'Place a drawn or imported signature-style mark on the page.'],
      ['Position controls', 'Move, scale and align signature marks in the page editor.'],
      ['Clean export', 'Download the signed PDF without a Slay PDF app-added watermark.'],
    ],
    bodyHeading: 'A fast local signing workflow for everyday PDFs.',
    body: [
      'Slay PDF is designed for visual signatures and quick approval marks, not organization-controlled certificate signing.',
      'That makes it useful for common forms, receipts, school documents, internal approvals and other PDFs that need a visible signature before export.',
    ],
    faqHeading: 'PDF signature FAQ',
    faqs: [
      ['Can I add a signature to a PDF?', 'Yes. Add a visual signature mark and place it on the page before export.'],
      ['Is this certificate signing?', 'No. Use a dedicated certificate-signing workflow for regulated or organization-controlled signatures.'],
      ['Can I export only the signed pages?', 'Yes. Select the pages you need and export selected pages.'],
    ],
    links: [
      ['/sign-pdf.html', 'Sign PDF'],
      ['/add-signature-to-pdf.html', 'Add signature to PDF'],
      ['/sign-pdf-online.html', 'Sign PDF online'],
      ['/sign-pdf-without-uploading.html', 'Sign PDF without uploading'],
    ],
    footer: 'Open Slay PDF to add visual PDF signatures locally.',
  },
  {
    slug: 'separate-pdf-pages',
    title: 'Separate PDF Pages - Slay PDF',
    kicker: 'Separate PDF pages',
    h1: 'Separate PDF pages into new files.',
    description: 'Separate PDF pages with Slay PDF. Add split markers, select pages and download separate PDFs locally from your browser.',
    lead: 'Use split markers when one imported PDF needs to become multiple downloaded PDFs from the same local workspace.',
    featureLabel: 'Separate PDF pages features',
    features: [
      ['Split markers', 'Place markers between pages to define separate output PDFs.'],
      ['Selected exports', 'Export selected pages when you only need part of the document.'],
      ['Local downloads', 'Download separate PDFs from the browser without app-server uploads.'],
    ],
    bodyHeading: 'Split one workspace into multiple PDFs.',
    body: [
      'Separating pages is useful for statements, receipts, forms, packets and scanned batches that need to become individual files.',
      'Slay PDF keeps split markers visible in the workspace so the export boundaries are clear before download.',
    ],
    faqHeading: 'Separate PDF pages FAQ',
    faqs: [
      ['Can Slay PDF download multiple PDFs?', 'Yes. Add split markers and use the separate-pages export to download multiple PDFs.'],
      ['Can I separate only selected pages?', 'Yes. Use page selection when only part of the workspace should be exported.'],
      ['Are separated files created on a server?', 'No. Common split and export workflows run locally in this browser.'],
    ],
    links: [
      ['/split-pdf.html', 'Split PDF'],
      ['/split-pdf-online.html', 'Split PDF online'],
      ['/extract-pages-from-pdf.html', 'Extract pages from PDF'],
      ['/delete-pdf-pages.html', 'Delete PDF pages'],
    ],
    footer: 'Open Slay PDF to separate PDF pages locally.',
  },
  {
    slug: 'extract-pages-from-pdf-online',
    title: 'Extract Pages from PDF Online - Slay PDF',
    kicker: 'Extract PDF pages online',
    h1: 'Extract pages from a PDF online, locally.',
    description: 'Extract pages from PDF online with Slay PDF. Select pages in your browser and export a new PDF without app-server document uploads.',
    lead: 'Slay PDF opens from the web like an online PDF tool, then lets you extract pages locally in the browser.',
    featureLabel: 'Extract pages from PDF online features',
    features: [
      ['Page selection', 'Select the exact pages you want to keep.'],
      ['New PDF export', 'Download a PDF containing only the selected pages.'],
      ['No upload queue', 'Common extract workflows run on your device in this browser.'],
    ],
    bodyHeading: 'Online access with local page extraction.',
    body: [
      'Extracting pages is a common reason people open an online PDF tool. Slay PDF keeps the convenient web access while avoiding a Slay PDF app-server upload for common edits.',
      'Use it to pull invoices, signed pages, exhibits, forms or receipt pages from a larger document.',
    ],
    faqHeading: 'Extract pages from PDF online FAQ',
    faqs: [
      ['Can I extract selected pages into a new PDF?', 'Yes. Select pages and export a new PDF containing only those pages.'],
      ['Can I delete pages instead?', 'Yes. Delete unwanted pages or export only the pages you selected.'],
      ['Do I need an account?', 'No. Slay PDF does not require an account for common local PDF workflows.'],
    ],
    links: [
      ['/extract-pages-from-pdf.html', 'Extract pages from PDF'],
      ['/extract-pdf-pages-without-uploading.html', 'Extract PDF pages without uploading'],
      ['/delete-pages-pdf-online.html', 'Delete PDF pages online'],
      ['/split-pdf-online.html', 'Split PDF online'],
    ],
    footer: 'Open Slay PDF to extract PDF pages locally from your browser.',
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
    <priority>0.84</priority>
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/combine-pdf-files\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} feature alias pages.`)

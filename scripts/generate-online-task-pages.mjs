import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'merge-pdf-online',
    title: 'Merge PDF Online - Slay PDF',
    kicker: 'Merge PDF online',
    h1: 'Merge PDF online without uploading.',
    description: 'Merge PDF online with Slay PDF. Combine, reorder and delete pages in your browser, then export one PDF without uploading documents to an app server.',
    lead: 'Use Slay PDF when you need an online PDF merger, but do not want to hand the source documents to another app server.',
    featureLabel: 'Merge PDF online features',
    features: [
      ['Combine files', 'Import multiple PDFs and images, then arrange every page in one visual workspace.'],
      ['Clean the order', 'Delete unwanted pages and drag the rest into the final merged sequence.'],
      ['Export locally', 'Download one merged PDF from the browser without an account or watermark workflow.'],
    ],
    bodyHeading: 'A web merger that keeps the work local.',
    body: [
      'Slay PDF opens in the browser like an online PDF tool, but the merge workflow runs on your device. That makes it useful for forms, receipts, statements and document bundles where uploading originals is not worth it.',
      'For broader merge-specific guidance, use the dedicated local merge page or the free online merger page.',
    ],
    faqHeading: 'Merge PDF online FAQ',
    faqs: [
      ['Can I merge PDF files online for free?', 'Yes. Slay PDF can merge PDF pages in the browser without an account, subscription or watermark workflow.'],
      ['Are my PDFs uploaded while merging?', 'No. The source PDFs stay in this browser instead of being uploaded to a Slay PDF application server.'],
      ['Can I remove pages before exporting?', 'Yes. Delete unwanted pages and reorder the rest before downloading the merged PDF.'],
    ],
    links: [
      ['/merge-pdf.html', 'Merge PDF locally'],
      ['/free-online-pdf-merger.html', 'Free online PDF merger'],
      ['/combine-pdf-files.html', 'Combine PDF files'],
      ['/delete-pdf-pages.html', 'Delete PDF pages'],
    ],
    footer: 'Open Slay PDF, import your files, arrange the pages and export one merged PDF locally.',
  },
  {
    slug: 'split-pdf-online',
    title: 'Split PDF Online - Slay PDF',
    kicker: 'Split PDF online',
    h1: 'Split PDF online without uploading.',
    description: 'Split PDF online with Slay PDF. Delete, extract or separate pages in your browser and download clean PDFs without uploading documents.',
    lead: 'Use Slay PDF to split a PDF from the browser while keeping pages, edits and exports local to your device.',
    featureLabel: 'Split PDF online features',
    features: [
      ['Select pages', 'Choose the pages you want to keep, remove or export from the workspace.'],
      ['Separate documents', 'Use split markers or selected pages to create smaller PDFs from one source file.'],
      ['Local downloads', 'Export the result from the browser without sending the PDF to an app server.'],
    ],
    bodyHeading: 'Online splitting without the upload step.',
    body: [
      'Slay PDF is useful when a large PDF only needs a few pages extracted, removed or separated. Import the PDF, pick the pages, place split markers where needed and download the output files.',
      'The dedicated split pages include more detail for selected-page exports and split-marker workflows.',
    ],
    faqHeading: 'Split PDF online FAQ',
    faqs: [
      ['Can I split a PDF online without an account?', 'Yes. Slay PDF can split PDF pages in the browser without an account or subscription.'],
      ['Can one PDF become multiple PDFs?', 'Yes. Add split markers in the workspace and export separate PDFs from those split points.'],
      ['Does Slay PDF upload my file to split it?', 'No. Splitting work runs locally in this browser.'],
    ],
    links: [
      ['/split-pdf.html', 'Split PDF locally'],
      ['/free-online-pdf-splitter.html', 'Free online PDF splitter'],
      ['/extract-pages-from-pdf.html', 'Extract pages from PDF'],
      ['/remove-pages-from-pdf.html', 'Remove pages from PDF'],
    ],
    footer: 'Open Slay PDF, select or split the pages you need and download the result locally.',
  },
  {
    slug: 'sign-pdf-online',
    title: 'Sign PDF Online - Slay PDF',
    kicker: 'Sign PDF online',
    h1: 'Sign PDF online without uploading.',
    description: 'Sign PDF online with Slay PDF. Add a visual signature, text and marks in your browser, then export the signed PDF without uploading documents.',
    lead: 'Use Slay PDF for quick approval marks, typed notes and visual signatures when an online signing tool should not receive the source file.',
    featureLabel: 'Sign PDF online features',
    features: [
      ['Add signatures', 'Place a visual signature on the PDF page and adjust its position before export.'],
      ['Add notes', 'Use text, highlights, shapes and ink marks for quick review or approval edits.'],
      ['Keep it local', 'Download the signed PDF from the browser. Passwords are never saved.'],
    ],
    bodyHeading: 'Simple signing for everyday PDFs.',
    body: [
      'Slay PDF is not a certificate authority or enterprise e-signature workflow. It is for common visual signing jobs: approvals, forms, initials, notes and quick document markups.',
      'Because the app runs locally, it is a practical option for documents where uploading to a random signing site is unnecessary.',
    ],
    faqHeading: 'Sign PDF online FAQ',
    faqs: [
      ['Can I sign a PDF online for free?', 'Yes. Slay PDF lets you place visual signatures and marks in the browser without an account flow.'],
      ['Is this a legal digital certificate signature?', 'No. Slay PDF adds visual signatures and marks; it does not issue certificate-backed digital signatures.'],
      ['Are signed PDFs uploaded first?', 'No. The signing workflow runs locally in this browser.'],
    ],
    links: [
      ['/sign-pdf.html', 'Sign PDF locally'],
      ['/free-online-pdf-signer.html', 'Free online PDF signer'],
      ['/add-signature-to-pdf.html', 'Add signature to PDF'],
      ['/annotate-pdf.html', 'Annotate PDF'],
    ],
    footer: 'Open Slay PDF, place the signature or marks and export the signed PDF locally.',
  },
  {
    slug: 'compress-pdf-online',
    title: 'Compress PDF Online - Slay PDF',
    kicker: 'Compress PDF online',
    h1: 'Compress PDF online without uploading.',
    description: 'Compress PDF online with Slay PDF. Use browser export presets to reduce PDF size and download the result without uploading documents.',
    lead: 'Use Slay PDF when you need a smaller PDF from a web app, but want the compression workflow to stay in the browser.',
    featureLabel: 'Compress PDF online features',
    features: [
      ['Choose presets', 'Use compression settings aimed at smaller browser-exported PDFs.'],
      ['Clean first', 'Delete unwanted pages before compression so the exported file is smaller.'],
      ['Download locally', 'Export the compressed PDF from your browser without account or upload steps.'],
    ],
    bodyHeading: 'Compress PDFs from a local browser workflow.',
    body: [
      'PDF compression usually depends on the document content. Removing pages, reducing image-heavy output and exporting with a compression preset can reduce file size for everyday sharing.',
      'Slay PDF keeps this workflow local, which is useful for private forms, receipts, scans and client documents.',
    ],
    faqHeading: 'Compress PDF online FAQ',
    faqs: [
      ['Can I compress a PDF online for free?', 'Yes. Slay PDF includes browser export presets for smaller PDFs without an account or subscription.'],
      ['Will every PDF become much smaller?', 'No. Compression depends on the source document, images and existing PDF structure.'],
      ['Does compression upload the PDF?', 'No. Slay PDF runs the export workflow in this browser.'],
    ],
    links: [
      ['/compress-pdf.html', 'Compress PDF locally'],
      ['/free-online-pdf-compressor.html', 'Free online PDF compressor'],
      ['/compress-pdf-without-uploading.html', 'Compress without uploading'],
      ['/delete-pdf-pages.html', 'Delete PDF pages'],
    ],
    footer: 'Open Slay PDF, choose a compression export and download the smaller PDF locally.',
  },
  {
    slug: 'rotate-pdf-online',
    title: 'Rotate PDF Online - Slay PDF',
    kicker: 'Rotate PDF online',
    h1: 'Rotate PDF online without uploading.',
    description: 'Rotate PDF online with Slay PDF. Fix sideways pages in your browser and export the corrected PDF without uploading documents.',
    lead: 'Use Slay PDF to correct sideways scans or mixed-orientation PDFs from the browser while keeping documents on your device.',
    featureLabel: 'Rotate PDF online features',
    features: [
      ['Fix sideways scans', 'Rotate selected pages left or right until the document reads correctly.'],
      ['Handle mixed pages', 'Correct only the pages that need rotation before exporting the final PDF.'],
      ['Export privately', 'Download the rotated PDF without sending the source file to an app server.'],
    ],
    bodyHeading: 'Quick rotation for scanned PDFs.',
    body: [
      'Sideways pages are common in scanned forms, receipts and office documents. Slay PDF lets you rotate individual pages, review the order and export the corrected file.',
      'The local workflow is useful when a small orientation fix should not require account creation or a document upload.',
    ],
    faqHeading: 'Rotate PDF online FAQ',
    faqs: [
      ['Can I rotate selected pages only?', 'Yes. Select only the pages that need rotation before exporting.'],
      ['Does rotating a PDF require uploading it?', 'No. Slay PDF rotates pages in the browser.'],
      ['Can I rotate pages after merging PDFs?', 'Yes. Import multiple files, arrange pages and rotate the pages that need correction.'],
    ],
    links: [
      ['/rotate-pdf.html', 'Rotate PDF locally'],
      ['/free-online-pdf-rotator.html', 'Free online PDF rotator'],
      ['/rotate-pdf-without-uploading.html', 'Rotate without uploading'],
      ['/organize-pdf-pages.html', 'Organize PDF pages'],
    ],
    footer: 'Open Slay PDF, rotate the pages that need correction and export the fixed PDF locally.',
  },
  {
    slug: 'crop-pdf-online',
    title: 'Crop PDF Online - Slay PDF',
    kicker: 'Crop PDF online',
    h1: 'Crop PDF online without uploading.',
    description: 'Crop PDF online with Slay PDF. Trim margins and clean scanned pages in your browser, then export cropped PDFs without uploading documents.',
    lead: 'Use Slay PDF to crop PDF margins and clean scanned pages from a browser-based workflow that keeps the file local.',
    featureLabel: 'Crop PDF online features',
    features: [
      ['Trim margins', 'Crop away excess white space and scanner borders from selected pages.'],
      ['Review pages', 'Inspect page previews before exporting the cropped PDF.'],
      ['Stay local', 'Download cropped pages from the browser without upload or account steps.'],
    ],
    bodyHeading: 'Crop scans and margins from the browser.',
    body: [
      'Cropping is useful for scanned paperwork, screenshots, receipts and pages with oversized margins. Slay PDF lets you prepare the pages and export the adjusted document locally.',
      'For page size changes rather than crop boxes, use the resize page workflow.',
    ],
    faqHeading: 'Crop PDF online FAQ',
    faqs: [
      ['Can I crop a PDF online for free?', 'Yes. Slay PDF can crop PDF pages in the browser without an account or watermark workflow.'],
      ['Can I crop only some pages?', 'Yes. Apply edits to the pages that need trimming before export.'],
      ['Are cropped PDFs uploaded?', 'No. The crop and export workflow runs locally in this browser.'],
    ],
    links: [
      ['/crop-pdf.html', 'Crop PDF locally'],
      ['/free-online-pdf-cropper.html', 'Free online PDF cropper'],
      ['/resize-pdf.html', 'Resize PDF pages'],
      ['/edit-scanned-pdf.html', 'Edit scanned PDF'],
    ],
    footer: 'Open Slay PDF, crop the pages and export the cleaned PDF locally.',
  },
  {
    slug: 'delete-pages-pdf-online',
    title: 'Delete PDF Pages Online - Slay PDF',
    kicker: 'Delete PDF pages online',
    h1: 'Delete PDF pages online without uploading.',
    description: 'Delete PDF pages online with Slay PDF. Remove blank, duplicate or unwanted pages in your browser and export a clean PDF without uploads.',
    lead: 'Use Slay PDF to remove pages from a PDF in the browser when you want a quick online tool but do not want to upload the document.',
    featureLabel: 'Delete PDF pages online features',
    features: [
      ['Remove pages', 'Select blank, duplicate or unwanted pages and delete them from the workspace.'],
      ['Check the order', 'Review the remaining pages before exporting the cleaned PDF.'],
      ['Download locally', 'Export the cleaned document from this browser without an app-server upload.'],
    ],
    bodyHeading: 'Remove unwanted pages before sharing.',
    body: [
      'Many PDFs include blank pages, duplicate scans, covers, instructions or pages that should not be shared. Slay PDF lets you remove those pages and export a clean PDF locally.',
      'If you want to keep only a few pages, the split and extract workflows may be a better fit.',
    ],
    faqHeading: 'Delete PDF pages online FAQ',
    faqs: [
      ['Can I delete PDF pages online for free?', 'Yes. Slay PDF can remove pages from a PDF in the browser without an account or subscription.'],
      ['Can I undo before export?', 'You can adjust the workspace before exporting. Download only when the page list looks correct.'],
      ['Does deleting pages upload my PDF?', 'No. Page removal runs locally in this browser.'],
    ],
    links: [
      ['/delete-pdf-pages.html', 'Delete PDF pages locally'],
      ['/free-online-pdf-page-remover.html', 'Free online page remover'],
      ['/remove-pages-from-pdf.html', 'Remove pages from PDF'],
      ['/extract-pages-from-pdf.html', 'Extract pages from PDF'],
    ],
    footer: 'Open Slay PDF, delete unwanted pages and export the cleaned PDF locally.',
  },
  {
    slug: 'annotate-pdf-online',
    title: 'Annotate PDF Online - Slay PDF',
    kicker: 'Annotate PDF online',
    h1: 'Annotate PDF online without uploading.',
    description: 'Annotate PDF online with Slay PDF. Add text, highlights, shapes, ink, signatures and redactions in your browser without uploading documents.',
    lead: 'Use Slay PDF to mark up PDFs from the browser while keeping the document and edits on your device.',
    featureLabel: 'Annotate PDF online features',
    features: [
      ['Add marks', 'Place text, highlights, rectangles, ink drawings, signatures and redaction blocks.'],
      ['Adjust edits', 'Move and scale annotation items on the page editor before export.'],
      ['Export locally', 'Download the marked-up PDF from the browser without app-server uploads.'],
    ],
    bodyHeading: 'Markup tools for quick review work.',
    body: [
      'Slay PDF is aimed at practical annotations: adding notes, highlights, approval marks, signatures and simple redactions before sharing a PDF.',
      'Because the workspace is local, it is useful for school notes, client documents, forms, scans and contracts that only need quick visual edits.',
    ],
    faqHeading: 'Annotate PDF online FAQ',
    faqs: [
      ['Can I annotate PDFs online without signing up?', 'Yes. Slay PDF lets you add marks in the browser without an account flow.'],
      ['What annotations can I add?', 'You can add text, highlights, shapes, ink, signatures and redaction blocks.'],
      ['Are annotated PDFs uploaded?', 'No. The annotation workflow runs locally in this browser.'],
    ],
    links: [
      ['/annotate-pdf.html', 'Annotate PDF locally'],
      ['/free-online-pdf-annotator.html', 'Free online PDF annotator'],
      ['/sign-pdf.html', 'Sign PDF locally'],
      ['/redact-pdf.html', 'Redact PDF locally'],
    ],
    footer: 'Open Slay PDF, add the marks you need and export the annotated PDF locally.',
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/free-online-pdf-page-numbering\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} online PDF task pages.`)

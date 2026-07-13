import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'ocr-scanned-pdf',
    title: 'OCR Scanned PDF - Slay PDF',
    kicker: 'OCR scanned PDF',
    h1: 'OCR scanned PDFs locally in your browser.',
    description: 'OCR scanned PDFs with Slay PDF. Add an English searchable text layer to scanned pages and export the finished PDF locally in your browser.',
    lead: 'Use Slay PDF when a scanned PDF needs searchable text but the document should not be sent to an upload-first converter.',
    featureLabel: 'OCR scanned PDF features',
    features: [
      ['English OCR', 'Run OCR on selected PDF pages and add a searchable text layer.'],
      ['Clean first', 'Rotate, crop, delete or reorder pages before OCR export.'],
      ['Local export', 'Download the searchable PDF from this browser.'],
    ],
    bodyHeading: 'Make scans easier to search.',
    body: [
      'Scanned PDFs are often just page images. OCR adds recognized text so the exported PDF is easier to search, copy from and archive.',
      'OCR quality depends on scan quality, language, contrast and page orientation, so review the exported file before relying on it.',
    ],
    faqHeading: 'OCR scanned PDF FAQ',
    faqs: [
      ['Can Slay PDF OCR scanned PDFs?', 'Yes. Slay PDF can run English OCR and add a searchable text layer during export.'],
      ['Does OCR upload the PDF?', 'No. Common OCR and export workflows run locally in this browser.'],
      ['Is OCR perfect?', 'No. OCR accuracy depends on the scan, so always review the output.'],
    ],
    links: [
      ['/ocr-pdf.html', 'OCR PDF'],
      ['/make-pdf-searchable.html', 'Make PDF searchable'],
      ['/local-pdf-ocr.html', 'Local PDF OCR'],
      ['/extract-pdf-text.html', 'Extract PDF text'],
    ],
    footer: 'Open Slay PDF to OCR scanned PDFs locally.',
  },
  {
    slug: 'make-scanned-pdf-searchable',
    title: 'Make Scanned PDF Searchable - Slay PDF',
    kicker: 'Make scanned PDF searchable',
    h1: 'Make a scanned PDF searchable without uploading.',
    description: 'Make scanned PDFs searchable with Slay PDF. Run local browser OCR, add a text layer and export a searchable PDF without a signup flow.',
    lead: 'A searchable scanned PDF is easier to find, quote and archive. Slay PDF handles that workflow in the browser for common documents.',
    featureLabel: 'Searchable scanned PDF features',
    features: [
      ['OCR text layer', 'Add recognized English text to scanned PDF pages.'],
      ['Page cleanup', 'Delete extras, rotate pages and crop scans before exporting.'],
      ['No account wall', 'Create a searchable export without a Slay PDF account.'],
    ],
    bodyHeading: 'Turn a scan into a searchable PDF.',
    body: [
      'Use this workflow for scanned forms, receipts, notes, packets and document archives where search matters.',
      'Because OCR can misread poor scans, check the output before sending or storing it as the final copy.',
    ],
    faqHeading: 'Make scanned PDF searchable FAQ',
    faqs: [
      ['How do I make a scanned PDF searchable?', 'Import the PDF, clean up pages if needed, choose searchable OCR PDF export and download the result.'],
      ['Can I do this without uploading?', 'Yes. Slay PDF runs common OCR and export workflows locally in the browser.'],
      ['Can I OCR only selected pages?', 'Use selected-page workflows when only part of the document needs export.'],
    ],
    links: [
      ['/searchable-pdf.html', 'Searchable PDF'],
      ['/make-pdf-searchable.html', 'Make PDF searchable'],
      ['/ocr-pdf-without-uploading.html', 'OCR PDF without uploading'],
      ['/edit-scanned-pdf.html', 'Edit scanned PDF'],
    ],
    footer: 'Open Slay PDF to make scanned PDFs searchable.',
  },
  {
    slug: 'extract-text-from-scanned-pdf',
    title: 'Extract Text From Scanned PDF - Slay PDF',
    kicker: 'Extract text from scanned PDF',
    h1: 'Extract text from scanned PDFs locally.',
    description: 'Extract text from scanned PDFs with Slay PDF by running local OCR, then exporting text or a searchable PDF from the browser.',
    lead: 'For scanned documents, text extraction usually starts with OCR. Slay PDF keeps that workflow in the browser for common files.',
    featureLabel: 'Scanned PDF text extraction features',
    features: [
      ['OCR first', 'Recognize English text from scanned page images.'],
      ['Text export', 'Download plain text from the composed document.'],
      ['Searchable PDF', 'Export a PDF with an OCR text layer when a PDF output is needed.'],
    ],
    bodyHeading: 'Get usable text out of scanned pages.',
    body: [
      'Extracted text is useful for notes, records, receipts, research packets and archives.',
      'OCR accuracy depends on the original scan. Review names, numbers and important details before using the extracted text.',
    ],
    faqHeading: 'Extract text from scanned PDF FAQ',
    faqs: [
      ['Can Slay PDF extract text from scanned PDFs?', 'Yes. Run OCR for scanned pages, then export plain text or a searchable PDF.'],
      ['Does it work on image-only PDFs?', 'OCR is designed for image-based scanned pages, with accuracy depending on quality.'],
      ['Does Slay PDF send scans to a server?', 'No. Common OCR and export workflows run locally in this browser.'],
    ],
    links: [
      ['/extract-pdf-text.html', 'Extract PDF text'],
      ['/extract-pdf-text-without-uploading.html', 'Extract PDF text without uploading'],
      ['/ocr-scanned-pdf.html', 'OCR scanned PDF'],
      ['/pdf-to-images.html', 'PDF to images'],
    ],
    footer: 'Open Slay PDF to extract scanned PDF text locally.',
  },
  {
    slug: 'copy-text-from-pdf',
    title: 'Copy Text From PDF - Slay PDF',
    kicker: 'Copy text from PDF',
    h1: 'Copy text from a PDF with local text export.',
    description: 'Copy text from PDFs with Slay PDF by exporting plain text from the composed document. Use OCR first when the PDF is scanned.',
    lead: 'When you need the words inside a PDF, Slay PDF can export text from the edited document and can add OCR for scanned pages.',
    featureLabel: 'Copy PDF text features',
    features: [
      ['Plain text export', 'Download extracted text from the PDF workflow.'],
      ['OCR support', 'Use OCR when the PDF is a scan instead of real text.'],
      ['Edit first', 'Remove unneeded pages before exporting text from the document.'],
    ],
    bodyHeading: 'Export text before pasting it where you need it.',
    body: [
      'Text export is useful for notes, summaries, search, records and moving PDF content into another document.',
      'Some PDFs contain images of text rather than selectable text. For those, run OCR first and review the result.',
    ],
    faqHeading: 'Copy text from PDF FAQ',
    faqs: [
      ['Can I copy text from a PDF?', 'Yes. Use Slay PDF text export for PDFs with text, or OCR first for scanned PDFs.'],
      ['Can I export text from selected pages?', 'Yes. Select the pages you need before using text export.'],
      ['Will formatting stay identical?', 'No. Plain text export focuses on text content rather than preserving layout.'],
    ],
    links: [
      ['/extract-pdf-text.html', 'Extract PDF text'],
      ['/extract-pdf-text-without-uploading.html', 'Extract PDF text without uploading'],
      ['/searchable-pdf.html', 'Searchable PDF'],
      ['/ocr-pdf.html', 'OCR PDF'],
    ],
    footer: 'Open Slay PDF to copy PDF text with local export.',
  },
  {
    slug: 'remove-blank-pages-from-pdf',
    title: 'Remove Blank Pages From PDF - Slay PDF',
    kicker: 'Remove blank PDF pages',
    h1: 'Remove blank pages from a PDF manually and locally.',
    description: 'Remove blank pages from PDFs with Slay PDF by reviewing thumbnails, deleting unwanted pages and exporting the cleaned PDF from your browser.',
    lead: 'Scanned packets often include blank separator pages. Slay PDF lets you review pages visually and delete the ones you do not want.',
    featureLabel: 'Remove blank pages features',
    features: [
      ['Visual review', 'Use page thumbnails to find blank or unwanted pages.'],
      ['Manual deletion', 'Delete selected pages intentionally before export.'],
      ['Clean export', 'Download the cleaned PDF locally from the browser.'],
    ],
    bodyHeading: 'Clean scanned packets without an upload queue.',
    body: [
      'Blank pages appear in contracts, school packets, tax paperwork, bank statements and medical forms after scanning.',
      'Slay PDF keeps the cleanup simple: review the pages, delete blank pages, reorder if needed and export the final PDF.',
    ],
    faqHeading: 'Remove blank pages from PDF FAQ',
    faqs: [
      ['Can Slay PDF automatically detect blank pages?', 'No. Review the pages visually and delete the blank pages you choose.'],
      ['Can I undo page cleanup?', 'Use the current workspace controls while editing, and verify the export before sharing.'],
      ['Does deleting pages upload the PDF?', 'No. Common page editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/delete-pdf-pages.html', 'Delete PDF pages'],
      ['/remove-pages-from-pdf.html', 'Remove pages from PDF'],
      ['/organize-pdf-pages.html', 'Organize PDF pages'],
      ['/reorder-pdf-pages.html', 'Reorder PDF pages'],
    ],
    footer: 'Open Slay PDF to remove blank PDF pages locally.',
  },
  {
    slug: 'highlight-pdf',
    title: 'Highlight PDF - Slay PDF',
    kicker: 'Highlight PDF',
    h1: 'Highlight a PDF locally in your browser.',
    description: 'Highlight PDFs with Slay PDF. Add highlight blocks, text, drawings, rectangles, signatures and redactions before exporting locally.',
    lead: 'Use Slay PDF when a PDF needs quick visual markup and the document should stay in the browser.',
    featureLabel: 'PDF highlighting features',
    features: [
      ['Highlight blocks', 'Mark important areas with adjustable highlight overlays.'],
      ['More markup', 'Add text, drawings, rectangles, signatures and redaction blocks.'],
      ['Flattened export', 'Download the marked-up PDF from the browser.'],
    ],
    bodyHeading: 'Mark up PDFs without leaving the browser.',
    body: [
      'Highlighting is useful for review packets, class notes, contracts, forms and scanned documents.',
      'Slay PDF keeps highlight and annotation work in the same workspace as page cleanup and export.',
    ],
    faqHeading: 'Highlight PDF FAQ',
    faqs: [
      ['Can I highlight a PDF in Slay PDF?', 'Yes. Open a page in the editor and add highlight overlays before exporting.'],
      ['Can I add notes too?', 'Yes. Add text overlays, rectangles and ink drawings where needed.'],
      ['Does Slay PDF upload highlighted PDFs?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/annotate-pdf.html', 'Annotate PDF'],
      ['/annotate-pdf-online.html', 'Annotate PDF online'],
      ['/draw-on-pdf.html', 'Draw on PDF'],
      ['/pdf-editor.html', 'PDF editor'],
    ],
    footer: 'Open Slay PDF to highlight PDFs locally.',
  },
  {
    slug: 'draw-on-pdf',
    title: 'Draw On PDF - Slay PDF',
    kicker: 'Draw on PDF',
    h1: 'Draw on a PDF in the browser.',
    description: 'Draw on PDFs with Slay PDF. Add ink marks, text, highlights, rectangles, signatures and redactions, then export the edited PDF locally.',
    lead: 'Drawing on a PDF is useful for quick markup, corrections, notes, signatures and visual review.',
    featureLabel: 'Draw on PDF features',
    features: [
      ['Ink tool', 'Draw freehand marks directly on the page editor.'],
      ['Edit controls', 'Move, resize and tune overlays before exporting.'],
      ['Local download', 'Export the edited PDF from this browser.'],
    ],
    bodyHeading: 'Add freehand PDF markup without a desktop suite.',
    body: [
      'Use Slay PDF to draw attention to areas of a PDF, mark a scan, add a simple note or combine drawing with highlights and text.',
      'For precise certified review workflows, use the document system required by your organization.',
    ],
    faqHeading: 'Draw on PDF FAQ',
    faqs: [
      ['Can I draw on a PDF?', 'Yes. Use the ink tool in the page editor to add freehand marks.'],
      ['Can I move or resize edits?', 'Yes. Select overlays in the editor to move or scale them before export.'],
      ['Does drawing on a PDF require signup?', 'No. Common local PDF workflows do not require a Slay PDF account.'],
    ],
    links: [
      ['/annotate-pdf.html', 'Annotate PDF'],
      ['/highlight-pdf.html', 'Highlight PDF'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/edit-pdf.html', 'Edit PDF'],
    ],
    footer: 'Open Slay PDF to draw on PDFs locally.',
  },
  {
    slug: 'reduce-pdf-size-for-email',
    title: 'Reduce PDF Size for Email - Slay PDF',
    kicker: 'Reduce PDF size for email',
    h1: 'Reduce PDF size for email in your browser.',
    description: 'Reduce PDF size for email with Slay PDF. Delete unnecessary pages, choose compression presets and export a smaller PDF locally.',
    lead: 'Email attachment limits make oversized PDFs annoying. Slay PDF helps reduce size with page cleanup and compression presets.',
    featureLabel: 'Reduce PDF size features',
    features: [
      ['Remove extras', 'Delete unneeded pages before export to reduce the file.'],
      ['Compression presets', 'Choose screen, ebook or printer compression depending on the use case.'],
      ['Local export', 'Download the compressed PDF from the browser.'],
    ],
    bodyHeading: 'Shrink the file before attaching it.',
    body: [
      'The best compression result depends on document content. Removing pages and compressing image-heavy PDFs usually helps most.',
      'After export, check the file size and visual quality before sending it by email.',
    ],
    faqHeading: 'Reduce PDF size for email FAQ',
    faqs: [
      ['Can Slay PDF reduce PDF size for email?', 'Yes. Clean up pages and use compression presets before exporting the PDF.'],
      ['Does compression always make a PDF smaller?', 'No. Results depend on the original PDF content and existing compression.'],
      ['Does Slay PDF upload the PDF to compress it?', 'No. Common export and compression workflows run locally in this browser.'],
    ],
    links: [
      ['/compress-pdf.html', 'Compress PDF'],
      ['/compress-pdf-online.html', 'Compress PDF online'],
      ['/compress-pdf-without-uploading.html', 'Compress PDF without uploading'],
      ['/local-pdf-compressor.html', 'Local PDF compressor'],
    ],
    footer: 'Open Slay PDF to reduce PDF size for email.',
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/reorder-pdf-pages\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} workflow alias intent pages.`)

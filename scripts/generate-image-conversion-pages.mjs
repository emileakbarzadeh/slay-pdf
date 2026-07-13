import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'pdf-to-png',
    title: 'PDF to PNG - Slay PDF',
    kicker: 'PDF to PNG',
    h1: 'Convert PDF pages to PNG locally.',
    description: 'Convert PDF to PNG locally with Slay PDF. Export selected PDF pages as PNG images from your browser without uploading documents.',
    lead: 'Use Slay PDF to turn PDF pages into PNG files for previews, thumbnails, visual records and systems that need images instead of PDFs.',
    featureLabel: 'PDF to PNG features',
    features: [
      ['PNG output', 'Export PDF pages as PNG files bundled in a local download.'],
      ['Selected pages', 'Choose all pages or only the pages that need image output.'],
      ['Edit first', 'Rotate, crop, annotate or delete pages before exporting PNG images.'],
    ],
    bodyHeading: 'Page image export without a converter upload.',
    body: [
      'Slay PDF renders the selected pages in your browser and downloads PNG page images. This is useful for previews, receipts, form snapshots, thumbnails and visual archives.',
      'Because the export runs locally, the source PDF is not sent to a Slay PDF application server.',
    ],
    faqHeading: 'PDF to PNG FAQ',
    faqs: [
      ['Can Slay PDF convert PDF pages to PNG?', 'Yes. Use page image export to download selected PDF pages as PNG image files.'],
      ['Can I export only some PDF pages as PNG?', 'Yes. Select the pages you need before choosing the page images download.'],
      ['Does PDF to PNG conversion upload my document?', 'No. The conversion workflow runs locally in this browser.'],
    ],
    links: [
      ['/pdf-to-images.html', 'PDF to images'],
      ['/pdf-to-png-online.html', 'PDF to PNG online'],
      ['/convert-pdf-to-png.html', 'Convert PDF to PNG'],
      ['/split-pdf.html', 'Split PDF'],
    ],
    footer: 'Open Slay PDF, select pages and download PNG page images locally.',
  },
  {
    slug: 'pdf-to-png-online',
    title: 'PDF to PNG Online - Slay PDF',
    kicker: 'PDF to PNG online',
    h1: 'Convert PDF to PNG online without uploading.',
    description: 'Convert PDF to PNG online with Slay PDF. Export selected pages as PNG images in your browser without uploading the source PDF.',
    lead: 'Use Slay PDF when you want an online PDF to PNG converter, but the document should stay in your browser.',
    featureLabel: 'PDF to PNG online features',
    features: [
      ['Browser converter', 'Open the static web app and export page images from your device.'],
      ['Private workflow', 'Your source PDF and edits stay in this browser. Passwords are never saved.'],
      ['Page control', 'Delete, rotate or crop pages before downloading PNG images.'],
    ],
    bodyHeading: 'Online convenience with local processing.',
    body: [
      'Most online PDF converters begin with an upload box. Slay PDF opens online, but the PDF-to-PNG work happens in the browser on your device.',
      'That makes it a practical option for private forms, scans, contracts and receipts that only need page images.',
    ],
    faqHeading: 'PDF to PNG online FAQ',
    faqs: [
      ['Is Slay PDF a free online PDF to PNG converter?', 'Yes. It can export PDF pages as PNG images from the browser without an account flow.'],
      ['Are the PNG files downloaded in a zip?', 'Yes. Page image exports are downloaded as a local archive of PNG files.'],
      ['Is the PDF uploaded first?', 'No. The PDF-to-PNG workflow runs locally in this browser.'],
    ],
    links: [
      ['/pdf-to-png.html', 'PDF to PNG'],
      ['/pdf-to-images.html', 'PDF to images'],
      ['/pdf-to-images-without-uploading.html', 'PDF to images without uploading'],
      ['/crop-pdf-online.html', 'Crop PDF online'],
    ],
    footer: 'Open Slay PDF, choose the pages and download PNG images locally.',
  },
  {
    slug: 'convert-pdf-to-png',
    title: 'Convert PDF to PNG - Slay PDF',
    kicker: 'Convert PDF to PNG',
    h1: 'Convert PDF to PNG in your browser.',
    description: 'Convert PDF to PNG with Slay PDF. Render selected pages as PNG image files locally in your browser without uploads or account walls.',
    lead: 'Use Slay PDF for the common PDF-to-PNG job: pick the pages, clean them if needed and download PNG image files from the browser.',
    featureLabel: 'Convert PDF to PNG features',
    features: [
      ['Local rendering', 'Render page images from the browser workspace instead of a remote converter queue.'],
      ['Clean exports', 'Apply page edits before PNG export so the images match the final document.'],
      ['No account wall', 'Download page images without signup, subscription or watermark workflow.'],
    ],
    bodyHeading: 'A practical local PDF-to-PNG workflow.',
    body: [
      'PDF-to-PNG conversion is often needed for uploads, previews, visual records and workflows that do not accept PDFs. Slay PDF handles page image export from the same workspace used for page edits.',
      'Import the PDF, choose the pages and export PNG images locally.',
    ],
    faqHeading: 'Convert PDF to PNG FAQ',
    faqs: [
      ['Can I convert a PDF to PNG without installing software?', 'Yes. Slay PDF runs in a modern browser and exports PNG page images locally.'],
      ['Can I edit pages before converting?', 'Yes. Rotate, crop, delete or annotate pages before exporting PNG images.'],
      ['Does Slay PDF save the converted images?', 'No. The images download to your device; Slay PDF does not save export passwords or uploaded source files on an app server.'],
    ],
    links: [
      ['/pdf-to-png.html', 'PDF to PNG'],
      ['/pdf-to-png-online.html', 'PDF to PNG online'],
      ['/pdf-to-images.html', 'PDF to images'],
      ['/rotate-pdf-online.html', 'Rotate PDF online'],
    ],
    footer: 'Open Slay PDF, render selected pages and download PNG images locally.',
  },
  {
    slug: 'images-to-pdf-online',
    title: 'Images to PDF Online - Slay PDF',
    kicker: 'Images to PDF online',
    h1: 'Convert images to PDF online without uploading.',
    description: 'Convert images to PDF online with Slay PDF. Import PNG, JPEG or WebP images, arrange pages and export one PDF locally in your browser.',
    lead: 'Use Slay PDF to build a PDF from images in the browser while keeping the source files and export local to your device.',
    featureLabel: 'Images to PDF online features',
    features: [
      ['Multiple formats', 'Import PNG, JPEG and WebP images into one PDF workspace.'],
      ['Page order', 'Arrange, rotate, crop or resize image pages before export.'],
      ['Local PDF export', 'Download one PDF from the browser without sending images to an app server.'],
    ],
    bodyHeading: 'Build a PDF from images locally.',
    body: [
      'Image-to-PDF conversion is useful for receipts, photos, screenshots, scanned forms and document packets. Slay PDF lets you arrange those images as pages and download one PDF.',
      'The workflow runs in the browser, so the images are not uploaded to a Slay PDF application server.',
    ],
    faqHeading: 'Images to PDF online FAQ',
    faqs: [
      ['Can I convert images to PDF online for free?', 'Yes. Slay PDF can build a PDF from images in the browser without an account or subscription.'],
      ['Which image formats can I import?', 'The app accepts PNG, JPEG and WebP image files.'],
      ['Can I reorder images before exporting?', 'Yes. Arrange image pages in the workspace before downloading the PDF.'],
    ],
    links: [
      ['/images-to-pdf.html', 'Images to PDF'],
      ['/jpg-to-pdf.html', 'JPG to PDF'],
      ['/png-to-pdf.html', 'PNG to PDF'],
      ['/merge-pdf-online.html', 'Merge PDF online'],
    ],
    footer: 'Open Slay PDF, import images, arrange pages and export one PDF locally.',
  },
  {
    slug: 'jpg-to-pdf-online',
    title: 'JPG to PDF Online - Slay PDF',
    kicker: 'JPG to PDF online',
    h1: 'Convert JPG to PDF online without uploading.',
    description: 'Convert JPG to PDF online with Slay PDF. Arrange JPEG images as PDF pages and download one local PDF from your browser.',
    lead: 'Use Slay PDF to turn JPEG images into a PDF from the browser without uploading the images to a converter server.',
    featureLabel: 'JPG to PDF online features',
    features: [
      ['JPEG import', 'Add one JPG or many JPEG images to the workspace.'],
      ['Arrange pages', 'Reorder and rotate image pages before exporting the final PDF.'],
      ['Private output', 'Download the PDF locally from your browser.'],
    ],
    bodyHeading: 'Turn JPEG images into one PDF.',
    body: [
      'JPG-to-PDF conversion is useful for receipts, photos, scanned pages and image-based document packets. Slay PDF lets you order the images and export a PDF locally.',
      'The browser workflow avoids account gates and app-server uploads.',
    ],
    faqHeading: 'JPG to PDF online FAQ',
    faqs: [
      ['Can I convert multiple JPG files into one PDF?', 'Yes. Import multiple JPEG images, arrange them and export one PDF.'],
      ['Can I rotate JPG pages before export?', 'Yes. Rotate or reorder pages in the workspace before downloading the PDF.'],
      ['Are JPG files uploaded for conversion?', 'No. Slay PDF converts images to PDF locally in this browser.'],
    ],
    links: [
      ['/jpg-to-pdf.html', 'JPG to PDF'],
      ['/images-to-pdf-online.html', 'Images to PDF online'],
      ['/png-to-pdf-online.html', 'PNG to PDF online'],
      ['/combine-pdf-files.html', 'Combine PDF files'],
    ],
    footer: 'Open Slay PDF, add JPG files, arrange pages and export one PDF locally.',
  },
  {
    slug: 'png-to-pdf-online',
    title: 'PNG to PDF Online - Slay PDF',
    kicker: 'PNG to PDF online',
    h1: 'Convert PNG to PDF online without uploading.',
    description: 'Convert PNG to PDF online with Slay PDF. Arrange PNG images as PDF pages and export one PDF locally in your browser.',
    lead: 'Use Slay PDF to turn PNG screenshots, scans or graphics into a PDF from the browser while keeping files local.',
    featureLabel: 'PNG to PDF online features',
    features: [
      ['PNG import', 'Add one PNG or a set of PNG images to the workspace.'],
      ['Page controls', 'Reorder, rotate, crop or resize image pages before export.'],
      ['Local download', 'Export one PDF from your browser without uploading images.'],
    ],
    bodyHeading: 'Create a PDF from PNG files.',
    body: [
      'PNG-to-PDF conversion is useful for screenshots, scans, diagrams and visual records. Slay PDF lets you turn those images into ordered PDF pages.',
      'The conversion runs locally in the browser and downloads the finished PDF to your device.',
    ],
    faqHeading: 'PNG to PDF online FAQ',
    faqs: [
      ['Can I convert PNG files to PDF online?', 'Yes. Slay PDF can import PNG files and export them as PDF pages from the browser.'],
      ['Can I mix PNG with JPG files?', 'Yes. You can import supported image files together and export one PDF.'],
      ['Does PNG to PDF conversion upload images?', 'No. The image-to-PDF workflow runs locally in this browser.'],
    ],
    links: [
      ['/png-to-pdf.html', 'PNG to PDF'],
      ['/images-to-pdf-online.html', 'Images to PDF online'],
      ['/jpg-to-pdf-online.html', 'JPG to PDF online'],
      ['/resize-pdf.html', 'Resize PDF'],
    ],
    footer: 'Open Slay PDF, import PNG files and export one PDF locally.',
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/png-to-pdf\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} image conversion pages.`)

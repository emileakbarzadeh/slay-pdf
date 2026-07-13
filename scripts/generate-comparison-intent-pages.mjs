import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const lastmod = '2026-07-13'

const pages = [
  {
    slug: 'slay-pdf-vs-adobe-acrobat',
    title: 'Slay PDF vs Adobe Acrobat - Local PDF Editing Comparison',
    kicker: 'Slay PDF vs Adobe Acrobat',
    h1: 'Slay PDF vs Adobe Acrobat for everyday PDF edits.',
    description: 'Compare Slay PDF vs Adobe Acrobat for common PDF edits. Slay PDF is built for local browser merge, split, sign, redact, OCR and export workflows.',
    lead: 'Use this comparison when the question is whether a common PDF job needs a full document platform or a quick local browser editor.',
    featureLabel: 'Slay PDF vs Adobe Acrobat comparison',
    features: [
      ['Slay PDF fit', 'Fast local browser workflows for page cleanup, signing, redaction, OCR and export.'],
      ['Acrobat fit', 'A broader document platform for enterprise workflows, compliance systems and advanced document management.'],
      ['Decision point', 'Choose Slay PDF when the document should stay in the browser and the task is practical.'],
    ],
    bodyHeading: 'Different tools for different levels of PDF work.',
    body: [
      'Slay PDF is not trying to recreate every Acrobat workflow. It is built for everyday edits that should be quick: merge, split, delete, reorder, sign visually, redact, OCR and export.',
      'Adobe Acrobat is the better fit when you need a full enterprise document platform, managed signing, compliance workflows or organization-controlled document systems.',
    ],
    faqHeading: 'Slay PDF vs Adobe Acrobat FAQ',
    faqs: [
      ['When should I choose Slay PDF?', 'Choose Slay PDF for common local browser edits such as merge, split, sign, redact, OCR and selected-page export.'],
      ['When should I choose Acrobat?', 'Choose Acrobat for enterprise document management, certificate signing, compliance workflows and advanced platform features.'],
      ['Is Slay PDF affiliated with Adobe?', 'No. Slay PDF is independent and is not affiliated with Adobe.'],
    ],
    links: [
      ['/adobe-acrobat-vs-slay-pdf.html', 'Adobe Acrobat vs Slay PDF'],
      ['/adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
      ['/best-adobe-acrobat-alternative.html', 'Best Adobe Acrobat alternative fit'],
      ['/free-adobe-acrobat-alternative.html', 'Free Adobe Acrobat alternative'],
    ],
    footer: 'Slay PDF is independent and is not affiliated with Adobe.',
  },
  {
    slug: 'slay-pdf-vs-smallpdf',
    title: 'Slay PDF vs Smallpdf - Local PDF Workflow Comparison',
    kicker: 'Slay PDF vs Smallpdf',
    h1: 'Slay PDF vs Smallpdf for local PDF jobs.',
    description: 'Compare Slay PDF vs Smallpdf for everyday PDF tasks. Slay PDF focuses on local browser editing, no signup flow and common PDF exports.',
    lead: 'This comparison is about workflow fit: local browser editing in Slay PDF versus choosing another online PDF utility.',
    featureLabel: 'Slay PDF vs Smallpdf comparison',
    features: [
      ['Local-first workflow', 'Slay PDF keeps common editing and export workflows in this browser.'],
      ['One workspace', 'Merge, split, sign, annotate, redact, OCR, resize and export from one page.'],
      ['No account wall', 'Start common tasks without creating a Slay PDF account.'],
    ],
    bodyHeading: 'Compare the workflow, not just the tool name.',
    body: [
      'If the priority is browser-local handling for common edits, Slay PDF is designed around that path.',
      'Use whichever PDF utility best matches the document risk, required feature depth and team policy.',
    ],
    faqHeading: 'Slay PDF vs Smallpdf FAQ',
    faqs: [
      ['Is Slay PDF a Smallpdf clone?', 'No. Slay PDF is an independent local PDF editor focused on browser-side workflows.'],
      ['Why choose Slay PDF?', 'Choose it when common PDF work should stay in your browser without a signup flow.'],
      ['Does Slay PDF upload documents for common edits?', 'No. Common editing and export workflows run locally in this browser.'],
    ],
    links: [
      ['/smallpdf-alternative.html', 'Smallpdf alternative'],
      ['/best-no-upload-pdf-editor.html', 'Best no-upload PDF editor fit'],
      ['/no-upload-pdf-tools.html', 'No-upload PDF tools'],
      ['/free-pdf-editor-no-signup.html', 'Free PDF editor no signup'],
    ],
    footer: 'Slay PDF is independent and is not affiliated with Smallpdf.',
  },
  {
    slug: 'slay-pdf-vs-ilovepdf',
    title: 'Slay PDF vs iLovePDF - Local PDF Workflow Comparison',
    kicker: 'Slay PDF vs iLovePDF',
    h1: 'Slay PDF vs iLovePDF for browser PDF edits.',
    description: 'Compare Slay PDF vs iLovePDF for common PDF jobs. Slay PDF focuses on local browser editing, privacy-first workflows and clean exports.',
    lead: 'Use this page when deciding whether a local browser PDF workspace is the better fit for the document in front of you.',
    featureLabel: 'Slay PDF vs iLovePDF comparison',
    features: [
      ['Local browser edits', 'Slay PDF runs common editing workflows in this browser.'],
      ['Practical tools', 'Merge, split, sign, annotate, redact, OCR, crop, resize and export PDFs.'],
      ['Privacy fit', 'Useful when unnecessary app-server uploads are the wrong tradeoff.'],
    ],
    bodyHeading: 'A local-first path for everyday PDF edits.',
    body: [
      'Slay PDF is strongest when the document is private and the job is practical: organize pages, sign, redact, OCR, resize or export selected pages.',
      'For any PDF tool, choose based on document sensitivity, required features and the policies you need to follow.',
    ],
    faqHeading: 'Slay PDF vs iLovePDF FAQ',
    faqs: [
      ['Is Slay PDF affiliated with iLovePDF?', 'No. Slay PDF is independent and is not affiliated with iLovePDF.'],
      ['What is the main Slay PDF advantage?', 'The main fit is local browser processing for common PDF editing workflows.'],
      ['Can Slay PDF export selected pages?', 'Yes. You can export all pages, selected pages or separate PDFs.'],
    ],
    links: [
      ['/ilovepdf-alternative.html', 'iLovePDF alternative'],
      ['/private-pdf-editor.html', 'Private PDF editor'],
      ['/pdf-editor-for-sensitive-documents.html', 'PDF editor for sensitive documents'],
      ['/merge-pdf-without-uploading.html', 'Merge PDF without uploading'],
    ],
    footer: 'Slay PDF is independent and is not affiliated with iLovePDF.',
  },
  {
    slug: 'slay-pdf-vs-sejda',
    title: 'Slay PDF vs Sejda - Local PDF Workflow Comparison',
    kicker: 'Slay PDF vs Sejda',
    h1: 'Slay PDF vs Sejda for local browser PDF work.',
    description: 'Compare Slay PDF vs Sejda for common PDF edits. Slay PDF is a local browser PDF editor for merge, split, sign, redact and export workflows.',
    lead: 'This comparison focuses on Slay PDF as a local browser workspace for common PDF jobs and private document handling.',
    featureLabel: 'Slay PDF vs Sejda comparison',
    features: [
      ['Local workspace', 'Import files, organize pages and export from the browser.'],
      ['Common edits', 'Handle signing, annotation, redaction, OCR, resize, crop and selected-page export.'],
      ['Clear limits', 'Use dedicated enterprise tools when policy or certificate signing requires them.'],
    ],
    bodyHeading: 'Use Slay PDF when local browser editing is the priority.',
    body: [
      'Slay PDF is built for practical PDF tasks that should not need a full platform or an upload-first workflow.',
      'The right choice depends on feature needs, document risk, browser support and team policy.',
    ],
    faqHeading: 'Slay PDF vs Sejda FAQ',
    faqs: [
      ['Is Slay PDF affiliated with Sejda?', 'No. Slay PDF is independent and is not affiliated with Sejda.'],
      ['Can Slay PDF redact PDFs?', 'Yes. Slay PDF supports visible redaction blocks and flattened exports for common redaction workflows.'],
      ['Can Slay PDF work without signup?', 'Yes. Common local workflows do not require a Slay PDF account.'],
    ],
    links: [
      ['/sejda-alternative.html', 'Sejda alternative'],
      ['/redact-pdf.html', 'Redact PDF'],
      ['/sign-pdf.html', 'Sign PDF'],
      ['/pdf-editor-no-account.html', 'PDF editor no account'],
    ],
    footer: 'Slay PDF is independent and is not affiliated with Sejda.',
  },
  {
    slug: 'local-pdf-editor-vs-online-pdf-editor',
    title: 'Local PDF Editor vs Online PDF Editor - Slay PDF',
    kicker: 'Local vs online PDF editor',
    h1: 'Local PDF editor vs online PDF editor.',
    description: 'Compare local PDF editors and online PDF editors. Slay PDF opens from the web but keeps common PDF edits local in your browser.',
    lead: 'Slay PDF gives you online access with local browser processing for common PDF tasks, which is useful when both convenience and privacy matter.',
    featureLabel: 'Local vs online PDF editor comparison',
    features: [
      ['Online access', 'Open Slay PDF from the web in a modern browser.'],
      ['Local work', 'Common edits run in the browser rather than a Slay PDF app-server upload.'],
      ['Decision point', 'Choose based on document sensitivity, browser support and required feature depth.'],
    ],
    bodyHeading: 'The useful middle ground: web access, local workflow.',
    body: [
      'Online PDF editors are convenient because they are easy to open. Local PDF editors are useful because documents do not need to leave the device for common edits.',
      'Slay PDF combines those ideas: a static web app with browser-local workflows for merge, split, sign, redact, OCR and export.',
    ],
    faqHeading: 'Local vs online PDF editor FAQ',
    faqs: [
      ['Is Slay PDF local or online?', 'It opens from the web, then common PDF editing work runs locally in this browser.'],
      ['When is local better?', 'Local is better when unnecessary document uploads are the wrong tradeoff.'],
      ['When is online better?', 'Online access is helpful when you need to open a tool quickly without installing desktop software.'],
    ],
    links: [
      ['/local-pdf-editor.html', 'Local PDF editor'],
      ['/online-pdf-editor.html', 'Online PDF editor'],
      ['/web-based-pdf-editor.html', 'Web-based PDF editor'],
      ['/client-side-pdf-tool.html', 'Client-side PDF tool'],
    ],
    footer: 'Open Slay PDF for web access with local browser PDF processing.',
  },
  {
    slug: 'pdf-editor-comparison',
    title: 'PDF Editor Comparison - Slay PDF',
    kicker: 'PDF editor comparison',
    h1: 'Compare PDF editors by workflow fit.',
    description: 'Use this PDF editor comparison to decide when Slay PDF fits: local browser editing, no-upload workflows, signing, redaction, OCR and export.',
    lead: 'A useful PDF editor comparison starts with the document risk, the task, and whether the file should be uploaded anywhere.',
    featureLabel: 'PDF editor comparison criteria',
    features: [
      ['Privacy model', 'Does the tool require uploading documents for the task?'],
      ['Task coverage', 'Does it handle merge, split, sign, redact, OCR, resize and export?'],
      ['Workflow cost', 'Does the job require an account, desktop install, trial flow or enterprise platform?'],
    ],
    bodyHeading: 'How to compare PDF editors quickly.',
    body: [
      'For quick PDF edits, start with the workflow: page organization, visual signing, annotation, redaction, OCR, form work or export.',
      'Slay PDF is a strong fit when those tasks can happen locally in the browser and the document does not need an enterprise platform.',
    ],
    faqHeading: 'PDF editor comparison FAQ',
    faqs: [
      ['What should I compare first?', 'Compare privacy model, task coverage, export options and whether the workflow requires an account or upload.'],
      ['Where does Slay PDF fit?', 'Slay PDF fits common local browser workflows such as merge, split, sign, redact, OCR and selected-page export.'],
      ['Where does Slay PDF not fit?', 'Use dedicated enterprise tools for compliance systems, certificate signing and managed document workflows.'],
    ],
    links: [
      ['/best-free-pdf-editor.html', 'Best free PDF editor fit'],
      ['/best-private-pdf-editor.html', 'Best private PDF editor fit'],
      ['/pdf-editor.html', 'PDF editor'],
      ['/pdf-privacy-checklist.html', 'PDF privacy checklist'],
    ],
    footer: 'Open Slay PDF when the comparison points to local browser PDF editing.',
  },
  {
    slug: 'free-pdf-editor-comparison',
    title: 'Free PDF Editor Comparison - Slay PDF',
    kicker: 'Free PDF editor comparison',
    h1: 'Compare free PDF editors by privacy and task fit.',
    description: 'Use this free PDF editor comparison to decide when Slay PDF fits: local browser edits, no signup flow, no app watermark and common PDF exports.',
    lead: 'Free PDF editors can differ sharply in privacy model, account requirements, export limits and whether they add watermarks.',
    featureLabel: 'Free PDF editor comparison criteria',
    features: [
      ['No upload needed', 'Common Slay PDF edits run locally in this browser.'],
      ['No app watermark', 'Slay PDF does not add its own watermark to exports.'],
      ['No account wall', 'Start common workflows without creating a Slay PDF account.'],
    ],
    bodyHeading: 'Free should still be practical.',
    body: [
      'A free PDF editor is not useful if the workflow blocks the exact task you need. Compare whether it can merge, split, sign, redact, OCR and export the pages you need.',
      'Slay PDF is built for common local workflows where free access, privacy and clean exports matter.',
    ],
    faqHeading: 'Free PDF editor comparison FAQ',
    faqs: [
      ['Does Slay PDF require signup?', 'No. Common local PDF workflows do not require an account.'],
      ['Does Slay PDF add watermarks?', 'No. Slay PDF does not add its own watermark to exports.'],
      ['Is Slay PDF free for common workflows?', 'Yes. Slay PDF is free for common local PDF editing workflows.'],
    ],
    links: [
      ['/free-pdf-editor.html', 'Free PDF editor'],
      ['/free-pdf-software.html', 'Free PDF software'],
      ['/pdf-editor-no-watermark.html', 'PDF editor no watermark'],
      ['/free-pdf-editor-no-signup.html', 'Free PDF editor no signup'],
    ],
    footer: 'Open Slay PDF when you need a free local PDF editor.',
  },
  {
    slug: 'browser-pdf-editor-vs-desktop-pdf-editor',
    title: 'Browser PDF Editor vs Desktop PDF Editor - Slay PDF',
    kicker: 'Browser vs desktop PDF editor',
    h1: 'Browser PDF editor vs desktop PDF editor.',
    description: 'Compare browser PDF editors and desktop PDF editors. Slay PDF is a browser PDF editor for common local merge, split, sign, OCR and export workflows.',
    lead: 'The choice between browser and desktop PDF editing depends on the task, document risk, install constraints and required feature depth.',
    featureLabel: 'Browser vs desktop PDF editor comparison',
    features: [
      ['Browser editor fit', 'Quick access, local workflows and no heavy desktop install for common edits.'],
      ['Desktop editor fit', 'Deep platform integration, offline control and specialized document workflows.'],
      ['Slay PDF fit', 'A static browser app for common local PDF edits and exports.'],
    ],
    bodyHeading: 'Choose the smallest tool that handles the document safely.',
    body: [
      'A browser PDF editor can be enough for page cleanup, signing, OCR, redaction and selected-page export.',
      'A desktop PDF editor can be better when you need advanced local integrations, heavy batch processing or organization-managed document systems.',
    ],
    faqHeading: 'Browser vs desktop PDF editor FAQ',
    faqs: [
      ['Is Slay PDF a browser PDF editor?', 'Yes. Slay PDF runs from a modern browser and handles common workflows locally.'],
      ['Does Slay PDF require desktop installation?', 'No. It runs from the browser and can be installed as a PWA where supported.'],
      ['When should I use desktop software?', 'Use desktop software when you need deeper OS integration, specialized workflows or organization-managed tools.'],
    ],
    links: [
      ['/browser-pdf-editor.html', 'Browser PDF editor'],
      ['/browser-based-pdf-editor.html', 'Browser-based PDF editor'],
      ['/pdf-editor-software.html', 'PDF editor software'],
      ['/free-pdf-editor-no-install.html', 'Free PDF editor no install'],
    ],
    footer: 'Open Slay PDF when a browser PDF editor is enough.',
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
    <priority>0.81</priority>
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
  const anchorPattern = /  <url>\n    <loc>https:\/\/slaypdf\.com\/adobe-acrobat-vs-slay-pdf\.html<\/loc>[\s\S]*?  <\/url>\n/
  const updated = withoutGenerated.match(anchorPattern)
    ? withoutGenerated.replace(anchorPattern, (match) => `${match}${entries}`)
    : withoutGenerated.replace('</urlset>', `${entries}</urlset>`)

  if (updated !== original) await writeFile(sitemapUrl, updated)
}

for (const page of pages) {
  await writeFile(new URL(`${page.slug}.html`, publicDir), pageHtml(page))
}

await syncSitemap()

console.log(`Generated ${pages.length} comparison intent pages.`)

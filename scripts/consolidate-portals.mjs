import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { portalFiles, portalGroups, portalPaths, site } from './portal-pages.mjs'

const publicDir = new URL('../public/', import.meta.url)
const rootDir = new URL('../', import.meta.url)
const keep = new Set(portalFiles)
const today = new Date().toISOString().slice(0, 10)

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function portalBody() {
  const groups = portalGroups.map((group) => `
      <section class="section" aria-labelledby="${group.title.toLowerCase().replaceAll(' ', '-')}">
        <div class="section-heading">
          <p class="kicker">Tool shelf</p>
          <h2 id="${group.title.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(group.title)}</h2>
          <p>${escapeHtml(group.description)}</p>
        </div>
        <div class="tool-list">
          ${group.pages.map(([file, title, description], index) => `<a href="/${file}" class="tool-link"><span class="tool-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><span aria-hidden="true">&rarr;</span></a>`).join('\n          ')}
        </div>
      </section>`).join('')

  return `<body>
    <main class="shell">
      <nav class="nav" aria-label="Slay PDF">
        <a class="brand" href="/"><span class="mark">S</span><span>Slay PDF</span></a>
        <a class="button" href="/">Open editor</a>
      </nav>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>PDF tools</span></nav>
      <section class="hero portal-hero">
        <p class="kicker">The PDF workbench</p>
        <h1>Pick a job. Keep the document.</h1>
        <p>Thirty useful doors, not three hundred search-engine hallways. Every tool opens the same private browser workspace, with a workflow shaped around the job.</p>
        <div class="actions"><a class="button" href="/">Open a PDF</a><a class="text-link" href="/pdf-privacy-security.html">How local processing works</a></div>
      </section>
      ${groups}
      <footer><a href="/privacy.html">Privacy</a><a href="/sitemap.html">Sitemap</a><a href="https://github.com/emileakbarzadeh/slay-pdf">Source</a></footer>
    </main>
  </body>`
}

const htmlFiles = (await readdir(publicDir)).filter((file) => file.endsWith('.html'))
for (const file of htmlFiles) {
  if (!keep.has(file)) await rm(new URL(file, publicDir))
}

for (const file of portalFiles) {
  const url = new URL(file, publicDir)
  const html = await readFile(url, 'utf8')
  const pruned = html
    .replace(/<a\b[^>]*href="\/([^"?#]+\.html)(?:[?#][^"]*)?"[^>]*>[\s\S]*?<\/a>/g, (link, target) => (
      keep.has(target) ? link : ''
    ))
    .replace(/^[ \t]+$/gm, '')
  if (pruned !== html) await writeFile(url, pruned)
}

const toolsUrl = new URL('tools.html', publicDir)
const toolsHtml = await readFile(toolsUrl, 'utf8')
await writeFile(toolsUrl, toolsHtml.replace(/<body>[\s\S]*<\/body>/, portalBody()))

const homepageUrl = new URL('index.html', rootDir)
const homepage = await readFile(homepageUrl, 'utf8')
await writeFile(homepageUrl, homepage.replace(/"dateModified": "\d{4}-\d{2}-\d{2}"/g, `"dateModified": "${today}"`))

const entries = portalPaths.map((path, index) => {
  const url = `${site}${path}`
  const priority = index === 0 ? '1.0' : path === '/tools.html' ? '0.9' : '0.8'
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
}).join('\n')

await writeFile(new URL('sitemap.xml', publicDir), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`)

console.log(`Consolidated the site to ${portalPaths.length} canonical portal URLs.`)

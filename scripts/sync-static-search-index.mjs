import { readFile, writeFile } from 'node:fs/promises'

const site = 'https://slaypdf.com'
const publicDir = new URL('../public/', import.meta.url)
const searchUrl = new URL('search.html', publicDir)

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function searchTextFor(page) {
  return [
    page.title,
    page.description,
    page.h1,
    page.path,
  ].join(' ').toLowerCase().replace(/\s+/g, ' ').trim()
}

const pagesJson = JSON.parse(await readFile(new URL('pages.json', publicDir), 'utf8'))
if (pagesJson.site !== site) throw new Error('pages.json site is wrong')
if (!Array.isArray(pagesJson.pages) || pagesJson.pages.length === 0) throw new Error('pages.json has no pages')

const pages = pagesJson.pages.filter((page) => page.path !== '/')
for (const page of pages) {
  if (!page.path || !page.title || !page.description || !page.h1) {
    throw new Error(`pages.json entry is missing search fields for ${page.url ?? 'unknown URL'}`)
  }
}

const links = pages.map((page) => {
  const title = page.title.replace(/ - Slay PDF$/, '')
  return `        <a href="${escapeHtml(page.path)}" data-search-text="${escapeHtml(searchTextFor(page))}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(page.description)}</span></a>`
}).join('\n')

const script = `    <script>
      const input = document.querySelector('#q')
      const results = document.querySelector('#search-results')
      const summary = document.querySelector('#search-summary')
      const links = [...results.querySelectorAll('a[data-search-text]')]
      const params = new URLSearchParams(window.location.search)
      const initialQuery = params.get('q') || ''

      function render(query) {
        const terms = query.trim().toLowerCase().split(/\\s+/).filter(Boolean)
        let count = 0

        for (const link of links) {
          const matches = terms.every((term) => link.dataset.searchText.includes(term))
          link.hidden = !matches
          if (matches) count += 1
        }

        summary.textContent = terms.length === 0
          ? \`Showing \${count} indexed Slay PDF pages.\`
          : \`Showing \${count} result\${count === 1 ? '' : 's'} for "\${query}".\`
      }

      if (initialQuery) input.value = initialQuery
      render(initialQuery)
      input.addEventListener('input', () => render(input.value))
    </script>`

const html = await readFile(searchUrl, 'utf8')
let updated = html
updated = updated.replace(
  /<p id="search-summary">[\s\S]*?<\/p>/,
  `<p id="search-summary">Showing ${pages.length} indexed Slay PDF pages.</p>`,
)
updated = updated.replace(
  /(<div id="search-results" class="tool-list" aria-labelledby="search-results-heading">\n)[\s\S]*?(\n      <\/div>)/,
  `$1${links}$2`,
)
updated = updated.replace(
  /    <script>\n      const input = document\.querySelector\('#q'\)[\s\S]*?\n    <\/script>/,
  script,
)

if (updated === html) {
  console.log(`Search page static index already contains ${pages.length} pages.`)
} else {
  await writeFile(searchUrl, updated)
  console.log(`Synced static search page index for ${pages.length} pages.`)
}

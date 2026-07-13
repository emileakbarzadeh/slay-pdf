import { spawn } from 'node:child_process'

const steps = [
  'seo:online-task-pages',
  'seo:sitemap-hreflang',
  'seo:html-sitemap',
  'seo:noscript',
  'seo:app-head',
  'seo:discovery',
  'seo:breadcrumbs',
  'seo:social',
  'seo:tools-itemlist',
  'seo:toolapps',
  'seo:faq',
  'seo:schema',
  'seo:howto',
  'seo:entities',
  'seo:index',
  'seo:search-index',
  'seo:indexnow',
  'seo:image-sitemap',
  'seo:sitemap-index',
  'seo:sitegraph',
  'seo:homepage-structured-data',
  'seo:feed',
  'seo:feed:json',
  'seo:llms',
  'seo:llms:full',
]

function run(step) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', step], { stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${step} exited with code ${code}`))
    })
  })
}

for (const step of steps) {
  await run(step)
}

console.log(`Generated SEO artifacts with ${steps.length} steps.`)

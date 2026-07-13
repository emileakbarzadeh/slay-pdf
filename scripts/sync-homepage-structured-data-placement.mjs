import { readFile, writeFile } from 'node:fs/promises'

const indexUrl = new URL('../index.html', import.meta.url)

const html = await readFile(indexUrl, 'utf8')
const scripts = []
let withoutStructuredData = html.replace(/\n[ \t]*<script type="application\/ld\+json"(?: [^>]*)?>[\s\S]*?\n[ \t]*<\/script>\n/g, (match) => {
  scripts.push(match.trimEnd())
  return '\n'
})

if (scripts.length === 0) throw new Error('index.html has no JSON-LD structured data scripts to place')
if (!withoutStructuredData.includes('\n  </body>')) throw new Error('index.html is missing a closing body tag')

withoutStructuredData = withoutStructuredData.replace(/\n{3,}/g, '\n\n')
const structuredDataBlock = `${scripts.join('\n')}\n`
const updated = withoutStructuredData.replace(/\n  <\/body>/, `${structuredDataBlock}  </body>`)

if (updated !== html) {
  await writeFile(indexUrl, updated)
  console.log(`Moved ${scripts.length} homepage JSON-LD scripts after the app shell.`)
} else {
  console.log(`Homepage JSON-LD placement is already optimized for ${scripts.length} scripts.`)
}

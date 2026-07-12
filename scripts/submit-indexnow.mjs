import { readFile } from 'node:fs/promises'

const payload = JSON.parse(await readFile(new URL('../public/indexnow.json', import.meta.url), 'utf8'))
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
})

if (!response.ok) {
  const body = await response.text()
  throw new Error(`IndexNow submission failed: ${response.status} ${response.statusText}\n${body}`)
}

console.log(`Submitted ${payload.urlList.length} URLs to IndexNow for ${payload.host}.`)

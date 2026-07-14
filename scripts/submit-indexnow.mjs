import { readFile } from 'node:fs/promises'

const live = process.argv.includes('--live')
const livePayloadUrl = 'https://slaypdf.com/indexnow.json'

async function localPayload() {
  return JSON.parse(await readFile(new URL('../public/indexnow.json', import.meta.url), 'utf8'))
}

async function livePayload() {
  const expected = await localPayload()
  let lastError
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${livePayloadUrl}?indexnow=${Date.now()}-${attempt}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Live IndexNow payload failed: ${response.status} ${response.statusText}`)
      const payload = await response.json()
      if (JSON.stringify(payload.urlList) !== JSON.stringify(expected.urlList)) {
        throw new Error('Live IndexNow payload does not match the deployed commit yet')
      }
      const keyResponse = await fetch(payload.keyLocation, { cache: 'no-store' })
      if (!keyResponse.ok || (await keyResponse.text()).trim() !== payload.key) {
        throw new Error('Live IndexNow key is unavailable or invalid')
      }
      return payload
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, attempt * 3000))
    }
  }
  throw lastError
}

const payload = live ? await livePayload() : await localPayload()
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
})

if (!response.ok) {
  const body = await response.text()
  throw new Error(`IndexNow submission failed: ${response.status} ${response.statusText}\n${body}`)
}

console.log(`Submitted ${payload.urlList.length} URLs to IndexNow for ${payload.host}${live ? ' from the live deployment' : ''}.`)

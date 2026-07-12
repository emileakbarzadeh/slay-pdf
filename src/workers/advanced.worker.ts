import createQpdf from '@neslinesli93/qpdf-wasm'
import qpdfWasmUrl from '@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url'
import createGhostscript from '@okathira/ghostpdl-wasm'
import ghostscriptWasmUrl from '@okathira/ghostpdl-wasm/gs.wasm?url'

type Compression = 'lossless' | 'screen' | 'ebook' | 'printer'
type ProcessRequest = { action: 'process'; bytes: ArrayBuffer; compression: Compression; password?: string }
type DecryptRequest = { action: 'decrypt'; bytes: ArrayBuffer; password: string }
type Request = ProcessRequest | DecryptRequest

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function compress(bytes: Uint8Array, preset: Exclude<Compression, 'lossless'>) {
  self.postMessage({ type: 'progress', progress: 0.24, label: 'Loading compression engine' })
  const module = await createGhostscript({ locateFile: () => ghostscriptWasmUrl })
  module.FS.writeFile('/input.pdf', bytes)
  try {
    module.callMain([
      '-sDEVICE=pdfwrite',
      `-dPDFSETTINGS=/${preset}`,
      '-dCompatibilityLevel=1.7',
      '-dNOPAUSE',
      '-dBATCH',
      '-dSAFER',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-sOutputFile=/compressed.pdf',
      '/input.pdf'
    ])
  } catch (error) {
    if (!(error instanceof Error && error.name === 'ExitStatus')) throw error
  }
  return module.FS.readFile('/compressed.pdf', { encoding: 'binary' }) as Uint8Array
}

async function optimizeAndEncrypt(bytes: Uint8Array, password?: string) {
  self.postMessage({ type: 'progress', progress: 0.68, label: password ? 'Optimizing and encrypting' : 'Optimizing PDF' })
  const module = await createQpdf({ locateFile: () => qpdfWasmUrl })
  const fs = module.FS as typeof module.FS & {
    writeFile(path: string, data: Uint8Array): void
    readFile(path: string): Uint8Array
  }
  fs.writeFile('/input.pdf', bytes)
  const args = ['--object-streams=generate', '--compress-streams=y', '--recompress-flate', '--compression-level=9']
  if (password) args.push('--encrypt', password, crypto.randomUUID(), '256', '--print=full', '--modify=all', '--extract=y', '--')
  args.push('/input.pdf', '/output.pdf')
  try {
    module.callMain(args)
  } catch (error) {
    if (!(error instanceof Error && error.name === 'ExitStatus')) throw error
  }
  return fs.readFile('/output.pdf')
}

async function decrypt(bytes: Uint8Array, password: string) {
  self.postMessage({ type: 'progress', progress: 0.45, label: 'Unlocking PDF' })
  const module = await createQpdf({ locateFile: () => qpdfWasmUrl })
  const fs = module.FS as typeof module.FS & {
    writeFile(path: string, data: Uint8Array): void
    readFile(path: string): Uint8Array
  }
  fs.writeFile('/input.pdf', bytes)
  try {
    module.callMain([`--password=${password}`, '--decrypt', '/input.pdf', '/output.pdf'])
  } catch (error) {
    if (!(error instanceof Error && error.name === 'ExitStatus')) throw error
  }
  return fs.readFile('/output.pdf')
}

self.onmessage = async (event: MessageEvent<Request>) => {
  try {
    let bytes: Uint8Array<ArrayBufferLike> = new Uint8Array(event.data.bytes)
    if (event.data.action === 'decrypt') {
      bytes = await decrypt(bytes, event.data.password)
    } else {
      if (event.data.compression !== 'lossless') bytes = await compress(bytes, event.data.compression)
      bytes = await optimizeAndEncrypt(bytes, event.data.password)
    }
    const result = toArrayBuffer(bytes)
    self.postMessage({ type: 'result', bytes: result }, { transfer: [result] })
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Advanced PDF processing failed.' })
  }
}

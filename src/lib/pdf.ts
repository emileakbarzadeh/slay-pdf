import { PDFCheckBox, PDFDocument, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField } from 'pdf-lib'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import type { FormField, SourceDocument, WorkspacePage } from '../types'
import { decryptPdf } from './processing'

pdfjs.GlobalWorkerOptions.workerSrc = import.meta.env.MODE === 'test'
  ? new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()
  : workerUrl

const MAX_FILE_SIZE = 200 * 1024 * 1024

export type ImportedDocument = { source: SourceDocument; pages: WorkspacePage[] }

export function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`
}

async function inspectForms(blob: Blob): Promise<FormField[]> {
  try {
    const document = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: false })
    return document.getForm().getFields().map((field) => {
      const name = field.getName()
      if (field instanceof PDFTextField) return { name, type: 'text', value: field.getText() ?? '' }
      if (field instanceof PDFCheckBox) return { name, type: 'checkbox', value: field.isChecked() ? 'true' : 'false' }
      if (field instanceof PDFDropdown) return { name, type: 'choice', value: field.getSelected()[0] ?? '', options: field.getOptions() }
      if (field instanceof PDFOptionList) return { name, type: 'choice', value: field.getSelected()[0] ?? '', options: field.getOptions() }
      if (field instanceof PDFRadioGroup) return { name, type: 'radio', value: field.getSelected() ?? '', options: field.getOptions() }
      return { name, type: 'unsupported', value: '' }
    })
  } catch {
    return []
  }
}

async function imageToPdf(file: File): Promise<Blob> {
  const bytes = await file.arrayBuffer()
  const doc = await PDFDocument.create()
  const type = file.type.toLowerCase()
  let image
  if (type === 'image/png') image = await doc.embedPng(bytes)
  else if (type === 'image/jpeg' || type === 'image/jpg') image = await doc.embedJpg(bytes)
  else {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
    image = await doc.embedPng(await (await fetch(canvas.toDataURL('image/png'))).arrayBuffer())
    bitmap.close()
  }
  const scale = Math.min(1, 1440 / Math.max(image.width, image.height))
  const page = doc.addPage([image.width * scale, image.height * scale])
  page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
  const output = await doc.save()
  return new Blob([output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer], { type: 'application/pdf' })
}

export async function importFile(file: File): Promise<ImportedDocument> {
  if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name} is larger than the 200 MB limit.`)
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage = file.type.startsWith('image/')
  if (!isPdf && !isImage) throw new Error(`${file.name} is not a PDF or supported image.`)

  let blob = isPdf ? file : await imageToPdf(file)
  const sourceId = uid('source')
  let pdfDocument
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    pdfDocument = await pdfjs.getDocument({ data: bytes }).promise
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') {
      const password = window.prompt(`Password for ${file.name}`)
      if (!password) throw new Error(`${file.name} is password protected.`)
      try {
        blob = await decryptPdf(blob, password)
        const bytes = new Uint8Array(await blob.arrayBuffer())
        pdfDocument = await pdfjs.getDocument({ data: bytes }).promise
      } catch {
        throw new Error(`${file.name} could not be unlocked with that password.`)
      }
    } else {
      throw new Error(`${file.name} could not be opened.`)
    }
  }

  const pages: WorkspacePage[] = []
  for (let index = 0; index < pdfDocument.numPages; index += 1) {
    const page = await pdfDocument.getPage(index + 1)
    const viewport = page.getViewport({ scale: 1 })
    pages.push({
      id: uid('page'),
      sourceId,
      sourcePageIndex: index,
      width: viewport.width,
      height: viewport.height,
      rotation: 0,
      crop: { top: 0, right: 0, bottom: 0, left: 0 },
      overlays: []
    })
    page.cleanup()
  }
  await pdfDocument.destroy()

  return {
    source: { id: sourceId, name: file.name.replace(/\.[^.]+$/, '') + '.pdf', blob, size: blob.size, pageCount: pages.length, createdAt: Date.now(), formFields: await inspectForms(blob) },
    pages
  }
}

export async function renderPage(source: SourceDocument, pageIndex: number, scale = 0.35, quality = 0.82) {
  const bytes = new Uint8Array(await source.blob.arrayBuffer())
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise
  const page = await pdfDocument.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale })
  const canvas = window.document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext('2d', { alpha: false })!
  await page.render({ canvasContext: context, canvas, viewport }).promise
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  page.cleanup()
  await pdfDocument.destroy()
  return dataUrl
}

export async function extractText(source: SourceDocument, pageIndexes?: number[]) {
  return extractTextFromBlob(source.blob, pageIndexes)
}

export async function extractTextFromBlob(blob: Blob, pageIndexes?: number[]) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise
  const indexes = pageIndexes ?? Array.from({ length: pdfDocument.numPages }, (_, index) => index)
  const text: string[] = []
  for (const index of indexes) {
    const page = await pdfDocument.getPage(index + 1)
    const content = await page.getTextContent()
    text.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '))
    page.cleanup()
  }
  await pdfDocument.destroy()
  return text.join('\n\n')
}

export async function renderPageBlob(source: SourceDocument, pageIndex: number, type: 'image/png' | 'image/jpeg', scale = 2) {
  return renderPdfPageBlob(source.blob, pageIndex, type, scale)
}

export async function renderPdfPageBlob(blob: Blob, pageIndex: number, type: 'image/png' | 'image/jpeg', scale = 2) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise
  const page = await pdfDocument.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale })
  const canvas = window.document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext('2d', { alpha: false })!
  await page.render({ canvasContext: context, canvas, viewport }).promise
  const output = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Image export failed')), type, 0.9))
  page.cleanup()
  await pdfDocument.destroy()
  return output
}

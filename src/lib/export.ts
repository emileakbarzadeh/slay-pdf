import JSZip from 'jszip'
import { degrees, PDFCheckBox, PDFDocument, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField, rgb, StandardFonts } from 'pdf-lib'
import type { ExportSettings, PageOverlay, SourceDocument, WorkspaceItem, WorkspacePage } from '../types'
import { isWorkspacePage } from '../types'
import type { OcrPage } from './ocr'
import { recognizePages } from './ocr'
import { extractTextFromBlob, renderPageBlob, renderPdfPageBlob } from './pdf'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function pdfFilenameBase(filename: string) {
  const fallback = filename.trim() || 'local-pdf.pdf'
  return fallback.replace(/\.pdf$/i, '') || 'local-pdf'
}

export function ensurePdfFilename(filename: string) {
  return `${pdfFilenameBase(filename)}.pdf`
}

function parseHex(value: string) {
  const hex = value.replace('#', '')
  const valid = /^[0-9a-f]{6}$/i.test(hex) ? hex : '161918'
  return rgb(parseInt(valid.slice(0, 2), 16) / 255, parseInt(valid.slice(2, 4), 16) / 255, parseInt(valid.slice(4, 6), 16) / 255)
}

type PageBox = { x: number; y: number; width: number; height: number }

export function fitIntoBox(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): PageBox {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height
  }
}

function drawOverlay(page: ReturnType<PDFDocument['addPage']>, overlay: PageOverlay, font: Awaited<ReturnType<PDFDocument['embedFont']>>, box?: PageBox) {
  const width = page.getWidth()
  const height = page.getHeight()
  const drawBox = box ?? { x: 0, y: 0, width, height }
  const x = overlay.type === 'ink' ? 0 : drawBox.x + overlay.x * drawBox.width
  const y = overlay.type === 'ink' ? 0 : drawBox.y + drawBox.height - ((overlay.y + overlay.height) * drawBox.height)
  const boxWidth = overlay.type === 'ink' ? 0 : overlay.width * drawBox.width
  const boxHeight = overlay.type === 'ink' ? 0 : overlay.height * drawBox.height

  if (overlay.type === 'text') {
    page.drawText(overlay.text, { x, y: y + Math.max(0, boxHeight - overlay.fontSize), size: overlay.fontSize, font, color: parseHex(overlay.color), maxWidth: boxWidth })
  } else if (overlay.type === 'signature') {
    page.drawText(overlay.text, { x, y: y + boxHeight * 0.25, size: Math.max(12, Math.min(38, boxHeight * 0.62)), font, color: rgb(0.05, 0.18, 0.32), maxWidth: boxWidth })
    page.drawLine({ start: { x, y: y + boxHeight * 0.18 }, end: { x: x + boxWidth, y: y + boxHeight * 0.18 }, thickness: 0.7, color: rgb(0.1, 0.2, 0.3) })
  } else if (overlay.type === 'highlight') {
    page.drawRectangle({ x, y, width: boxWidth, height: boxHeight, color: parseHex(overlay.color), opacity: overlay.opacity })
  } else if (overlay.type === 'rectangle') {
    page.drawRectangle({ x, y, width: boxWidth, height: boxHeight, borderColor: parseHex(overlay.color), borderWidth: overlay.lineWidth })
  } else if (overlay.type === 'redact') {
    page.drawRectangle({ x, y, width: boxWidth, height: boxHeight, color: rgb(0, 0, 0) })
  } else if (overlay.type === 'ink') {
    for (let index = 1; index < overlay.points.length; index += 1) {
      const start = overlay.points[index - 1]
      const end = overlay.points[index]
      page.drawLine({
        start: { x: drawBox.x + start.x * drawBox.width, y: drawBox.y + drawBox.height - start.y * drawBox.height },
        end: { x: drawBox.x + end.x * drawBox.width, y: drawBox.y + drawBox.height - end.y * drawBox.height },
        thickness: overlay.lineWidth,
        color: parseHex(overlay.color),
        lineCap: 1
      })
    }
  }
}

function applyFormValues(document: PDFDocument, source: SourceDocument, flatten: boolean) {
  const fields = source.formFields ?? []
  if (!fields.length) return
  const form = document.getForm()
  for (const fieldValue of fields) {
    try {
      const field = form.getField(fieldValue.name)
      if (field instanceof PDFTextField) field.setText(fieldValue.value)
      else if (field instanceof PDFCheckBox) fieldValue.value === 'true' ? field.check() : field.uncheck()
      else if (field instanceof PDFDropdown) fieldValue.value ? field.select(fieldValue.value) : field.clear()
      else if (field instanceof PDFOptionList) fieldValue.value ? field.select(fieldValue.value) : field.clear()
      else if (field instanceof PDFRadioGroup) fieldValue.value ? field.select(fieldValue.value) : field.clear()
    } catch {
      // Some real-world PDFs contain malformed fields; leave those unchanged.
    }
  }
  if (flatten) {
    try {
      form.flatten()
    } catch {
      form.updateFieldAppearances()
    }
  }
}

function nearlyEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.5
}

async function addOcrTextLayer(blob: Blob, ocrPages: OcrPage[]) {
  const document = await PDFDocument.load(await blob.arrayBuffer())
  const font = await document.embedFont(StandardFonts.Helvetica)
  document.getPages().forEach((page, index) => {
    const ocr = ocrPages[index]
    if (!ocr) return
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()
    for (const word of ocr.words) {
      const x = (word.bbox.x0 / ocr.imageWidth) * pageWidth
      const y = pageHeight - (word.bbox.y1 / ocr.imageHeight) * pageHeight
      const height = ((word.bbox.y1 - word.bbox.y0) / ocr.imageHeight) * pageHeight
      page.drawText(word.text, {
        x,
        y,
        size: Math.max(4, height * 0.72),
        font,
        color: rgb(0, 0, 0),
        opacity: 0,
        maxWidth: Math.max(4, ((word.bbox.x1 - word.bbox.x0) / ocr.imageWidth) * pageWidth)
      })
    }
  })
  const bytes = await document.save({ useObjectStreams: true })
  return new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: 'application/pdf' })
}

export async function buildPdf(
  pages: WorkspacePage[],
  sources: SourceDocument[],
  settings: ExportSettings,
  onProgress?: (progress: number) => void
) {
  if (!pages.length) throw new Error('Add at least one page before exporting.')
  const output = await PDFDocument.create()
  const font = await output.embedFont(StandardFonts.Helvetica)
  const signatureFont = await output.embedFont(StandardFonts.TimesRomanItalic)
  const sourceDocuments = new Map<string, PDFDocument>()

  for (let index = 0; index < pages.length; index += 1) {
    const item = pages[index]
    const source = sources.find((candidate) => candidate.id === item.sourceId)
    if (!source) throw new Error('A source document is missing from local storage.')
    let page
    let sourceDocument = sourceDocuments.get(source.id)
    if (!sourceDocument) {
      sourceDocument = await PDFDocument.load(await source.blob.arrayBuffer(), { ignoreEncryption: false })
      applyFormValues(sourceDocument, source, settings.flattenForms)
      sourceDocuments.set(source.id, sourceDocument)
    }
    const sourcePage = sourceDocument.getPage(item.sourcePageIndex)
    const shouldReframe = !nearlyEqual(item.width, sourcePage.getWidth()) || !nearlyEqual(item.height, sourcePage.getHeight())
    let contentBox: PageBox | undefined

    // Rasterizing pages with redactions removes the underlying text and image data.
    if (item.overlays.some((overlay) => overlay.type === 'redact')) {
      const imageBlob = await renderPageBlob(source, item.sourcePageIndex, 'image/png', 2)
      const image = await output.embedPng(await imageBlob.arrayBuffer())
      page = output.addPage([item.width, item.height])
      contentBox = fitIntoBox(image.width, image.height, item.width, item.height)
      page.drawImage(image, contentBox)
    } else if (shouldReframe) {
      const sourceWidth = sourcePage.getWidth()
      const sourceHeight = sourcePage.getHeight()
      const croppedWidth = sourceWidth * (1 - item.crop.left - item.crop.right)
      const croppedHeight = sourceHeight * (1 - item.crop.top - item.crop.bottom)
      const embedded = await output.embedPage(sourcePage, {
        left: item.crop.left * sourceWidth,
        right: sourceWidth * (1 - item.crop.right),
        bottom: item.crop.bottom * sourceHeight,
        top: sourceHeight * (1 - item.crop.top)
      })
      page = output.addPage([item.width, item.height])
      contentBox = fitIntoBox(croppedWidth, croppedHeight, item.width, item.height)
      page.drawPage(embedded, contentBox)
    } else {
      const [copied] = await output.copyPages(sourceDocument, [item.sourcePageIndex])
      page = output.addPage(copied)
      if (item.crop.left || item.crop.right || item.crop.top || item.crop.bottom) {
        const width = page.getWidth()
        const height = page.getHeight()
        page.setCropBox(item.crop.left * width, item.crop.bottom * height, width * (1 - item.crop.left - item.crop.right), height * (1 - item.crop.top - item.crop.bottom))
      }
    }

    page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360))
    for (const overlay of item.overlays) drawOverlay(page, overlay, overlay.type === 'signature' ? signatureFont : font, contentBox)
    if (settings.watermark.trim()) {
      const size = Math.max(22, Math.min(54, page.getWidth() / 10))
      const textWidth = font.widthOfTextAtSize(settings.watermark, size)
      page.drawText(settings.watermark, {
        x: (page.getWidth() - textWidth) / 2,
        y: page.getHeight() / 2,
        size,
        font,
        color: rgb(0.3, 0.32, 0.31),
        opacity: settings.watermarkOpacity,
        rotate: degrees(35)
      })
    }
    if (settings.pageNumbers) {
      const label = `${index + 1} / ${pages.length}`
      page.drawText(label, { x: (page.getWidth() - font.widthOfTextAtSize(label, 9)) / 2, y: 14, size: 9, font, color: rgb(0.3, 0.32, 0.31) })
    }
    onProgress?.((index + 1) / pages.length)
  }

  const metadata = settings.metadata
  if (metadata.title) output.setTitle(metadata.title)
  if (metadata.author) output.setAuthor(metadata.author)
  if (metadata.subject) output.setSubject(metadata.subject)
  if (metadata.keywords) output.setKeywords(metadata.keywords.split(',').map((value) => value.trim()).filter(Boolean))
  output.setProducer('Local PDF')
  output.setModificationDate(new Date())
  const bytes = await output.save({ useObjectStreams: true })
  return new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: 'application/pdf' })
}

export async function buildSearchablePdf(
  pages: WorkspacePage[],
  sources: SourceDocument[],
  settings: ExportSettings,
  onProgress?: (progress: number, label: string) => void
) {
  const ocr = await recognizePages(pages, sources, (progress, label) => onProgress?.(progress * 0.62, label))
  const composed = await buildPdf(pages, sources, settings, (progress) => onProgress?.(0.62 + progress * 0.24, 'Building OCR PDF'))
  return addOcrTextLayer(composed, ocr)
}

export function splitPdfGroups(items: WorkspaceItem[]) {
  const hasMarkers = hasSplitMarkers(items)
  const pages = items.filter(isWorkspacePage)
  if (!hasMarkers) return pages.map((page) => [page])

  const groups: WorkspacePage[][] = []
  let current: WorkspacePage[] = []
  for (const item of items) {
    if (isWorkspacePage(item)) {
      current.push(item)
    } else if (current.length) {
      groups.push(current)
      current = []
    }
  }
  if (current.length) groups.push(current)
  return groups
}

export function hasSplitMarkers(items: WorkspaceItem[]) {
  return items.some((item) => !isWorkspacePage(item))
}

export function splitPdfFilename(filename: string, index: number) {
  return `${pdfFilenameBase(filename)}-${String(index + 1).padStart(3, '0')}.pdf`
}

export async function exportSplit(items: WorkspaceItem[], sources: SourceDocument[], settings: ExportSettings, onProgress?: (progress: number) => void) {
  const zip = new JSZip()
  const groups = splitPdfGroups(items)
  const hasMarkers = hasSplitMarkers(items)
  const prefix = hasMarkers ? 'document' : 'page'
  for (let index = 0; index < groups.length; index += 1) {
    const blob = await buildPdf(groups[index], sources, { ...settings, pageNumbers: false }, undefined)
    zip.file(`${prefix}-${String(index + 1).padStart(3, '0')}.pdf`, await blob.arrayBuffer())
    onProgress?.((index + 1) / groups.length)
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export async function exportImages(pages: WorkspacePage[], sources: SourceDocument[], settings: ExportSettings, onProgress?: (progress: number) => void) {
  const zip = new JSZip()
  const composed = await buildPdf(pages, sources, settings, (progress) => onProgress?.(progress * 0.45))
  for (let index = 0; index < pages.length; index += 1) {
    zip.file(`page-${String(index + 1).padStart(3, '0')}.png`, await renderPdfPageBlob(composed, index, 'image/png', 2))
    onProgress?.(0.45 + ((index + 1) / pages.length) * 0.55)
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export async function exportText(pages: WorkspacePage[], sources: SourceDocument[], settings: ExportSettings, onProgress?: (progress: number) => void) {
  const composed = await buildPdf(pages, sources, settings, (progress) => onProgress?.(progress * 0.7))
  const text = await extractTextFromBlob(composed)
  onProgress?.(1)
  return new Blob([text], { type: 'text/plain;charset=utf-8' })
}

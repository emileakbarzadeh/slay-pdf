import { describe, expect, it } from 'vitest'
import { PDFDocument, rgb } from 'pdf-lib'
import JSZip from 'jszip'
import { buildPdf, ensurePdfFilename, exportSplit, exportText, fitIntoBox, pdfFilenameBase, splitPdfFilename, splitPdfGroups } from './export'
import { defaultExportSettings, type SourceDocument, type WorkspacePage } from '../types'

async function makeSource() {
  const document = await PDFDocument.create()
  const page = document.addPage([612, 792])
  page.drawText('Original page', { x: 72, y: 720, size: 18, color: rgb(0, 0, 0) })
  const form = document.getForm()
  const name = form.createTextField('full_name')
  name.addToPage(page, { x: 72, y: 650, width: 220, height: 28 })
  const approved = form.createCheckBox('approved')
  approved.addToPage(page, { x: 72, y: 610, width: 18, height: 18 })
  const bytes = await document.save()
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: 'application/pdf' })
  const source: SourceDocument = {
    id: 'source-1',
    name: 'form.pdf',
    blob,
    size: blob.size,
    pageCount: 1,
    createdAt: 1,
    formFields: [
      { name: 'full_name', type: 'text', value: 'Ada Lovelace' },
      { name: 'approved', type: 'checkbox', value: 'true' }
    ]
  }
  const workspacePage: WorkspacePage = {
    id: 'page-1',
    sourceId: source.id,
    sourcePageIndex: 0,
    width: 612,
    height: 792,
    rotation: 0,
    crop: { top: 0, right: 0, bottom: 0, left: 0 },
    overlays: []
  }
  return { source, page: workspacePage }
}

describe('buildPdf', () => {
  it('applies AcroForm values and flattens fields', async () => {
    const { source, page } = await makeSource()
    const output = await buildPdf([page], [source], { ...defaultExportSettings, flattenForms: true })
    const loaded = await PDFDocument.load(await output.arrayBuffer())

    expect(loaded.getPageCount()).toBe(1)
    expect(loaded.getForm().getFields()).toHaveLength(0)
  })

  it('writes crop boxes from page settings', async () => {
    const { source, page } = await makeSource()
    const output = await buildPdf([{ ...page, crop: { top: 0.1, right: 0.2, bottom: 0.05, left: 0.15 } }], [source], defaultExportSettings)
    const loaded = await PDFDocument.load(await output.arrayBuffer())
    const crop = loaded.getPage(0).getCropBox()

    expect(Math.round(crop.x)).toBe(92)
    expect(Math.round(crop.y)).toBe(40)
    expect(Math.round(crop.width)).toBe(398)
    expect(Math.round(crop.height)).toBe(673)
  })

  it('resizes pages to the workspace page size during export', async () => {
    const { source, page } = await makeSource()
    const output = await buildPdf([{ ...page, width: 612, height: 792 }], [source], defaultExportSettings)
    const loaded = await PDFDocument.load(await output.arrayBuffer())
    const exportedPage = loaded.getPage(0)

    expect(Math.round(exportedPage.getWidth())).toBe(612)
    expect(Math.round(exportedPage.getHeight())).toBe(792)
  })

  it('fits resized page content without stretching', () => {
    const fit = fitIntoBox(612, 792, 792, 612)

    expect(fit.x).toBeCloseTo(159.55)
    expect(fit.y).toBe(0)
    expect(fit.width).toBeCloseTo(472.91)
    expect(fit.height).toBe(612)
  })

  it('exports text from the composed edited document', async () => {
    const { source, page } = await makeSource()
    const textBlob = await exportText([{
      ...page,
      overlays: [{ id: 'overlay-1', type: 'text', x: 0.12, y: 0.2, width: 0.5, height: 0.08, text: 'Overlay text', color: '#161918', fontSize: 18 }]
    }], [source], defaultExportSettings)

    await expect(textBlob.text()).resolves.toContain('Overlay text')
  })

  it('uses split markers as document boundaries', async () => {
    const { source, page } = await makeSource()
    const nextPage = { ...page, id: 'page-2' }
    const groups = splitPdfGroups([page, { id: 'split-1', kind: 'split' }, nextPage])

    expect(groups).toEqual([[page], [nextPage]])

    const zipBlob = await exportSplit([page, { id: 'split-1', kind: 'split' }, nextPage], [source], defaultExportSettings)
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer())
    const files = Object.keys(zip.files).sort()

    expect(files).toEqual(['document-001.pdf', 'document-002.pdf'])
    const first = await PDFDocument.load(await zip.files['document-001.pdf'].async('arraybuffer'))
    const second = await PDFDocument.load(await zip.files['document-002.pdf'].async('arraybuffer'))
    expect(first.getPageCount()).toBe(1)
    expect(second.getPageCount()).toBe(1)
    expect(splitPdfFilename('bundle.pdf', 1)).toBe('bundle-002.pdf')
    expect(splitPdfFilename('bundle', 1)).toBe('bundle-002.pdf')
    expect(pdfFilenameBase('sample.pdf')).toBe('sample')
    expect(ensurePdfFilename('sample')).toBe('sample.pdf')
  })
})

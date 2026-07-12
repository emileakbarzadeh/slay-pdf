import { expect, test } from '@playwright/test'
import { PDFDocument, rgb } from 'pdf-lib'

async function samplePdf() {
  const document = await PDFDocument.create()
  const page = document.addPage([420, 594])
  page.drawText('Local PDF test document', { x: 48, y: 520, size: 20, color: rgb(0, 0, 0) })
  page.drawText('Page one', { x: 48, y: 486, size: 14, color: rgb(0.1, 0.1, 0.1) })
  const second = document.addPage([420, 594])
  second.drawText('Page two', { x: 48, y: 520, size: 18, color: rgb(0, 0, 0) })
  const bytes = await document.save()
  return Buffer.from(bytes)
}

async function landscapePdf() {
  const document = await PDFDocument.create()
  const page = document.addPage([640, 360])
  page.drawText('Landscape page', { x: 48, y: 288, size: 28, color: rgb(0, 0, 0) })
  return Buffer.from(await document.save())
}

async function hideInspector(page: import('@playwright/test').Page) {
  await page.getByTitle('Hide inspector').click()
}

test('imports, organizes, and exports a PDF locally', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await expect(page.getByText('2 pages')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Export all pages$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Export selected pages$/i })).toBeVisible()

  const headerDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  expect((await headerDownload).suggestedFilename()).toBe('local-pdf.pdf')

  await hideInspector(page)
  await page.getByLabel('Select page 1').click()
  await page.getByTitle('Rotate right').click()
  await expect(page.getByText('90°')).toBeVisible()
  await page.getByTitle('Show inspector').click()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /^Export selected pages$/i }).click()
  const exported = await download
  expect(exported.suggestedFilename()).toBe('local-pdf.pdf')
})

test('deselects blank grid clicks and does not import internal thumbnail drags', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  await page.getByLabel('Select page 1').click()
  await expect(page.locator('.toolstrip > span')).toHaveText('1 selected')
  await page.locator('.page-grid').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.toolstrip > span')).toHaveText('2 pages')

  const preview = page.getByLabel('Select page 1')
  const box = await preview.boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width + 240, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)
})

test('opens the editor using the actual page aspect ratio', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'landscape.pdf',
    mimeType: 'application/pdf',
    buffer: await landscapePdf()
  })

  await page.locator('.page-preview img').first().waitFor()
  await hideInspector(page)
  await page.locator('.page-number').first().click()
  const box = await page.locator('.editor-page').boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  expect(box.width / box.height).toBeGreaterThan(1.65)
  expect(box.width / box.height).toBeLessThan(1.9)
})

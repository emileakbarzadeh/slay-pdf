import { expect, test } from '@playwright/test'
import type { Download, Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
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

async function expandDrawerIfVisible(page: Page) {
  const handle = page.getByRole('button', { name: /Expand export drawer|Collapse export drawer/ })
  const visible = await handle.isVisible().catch(() => false)
  if (!visible) return false
  const expanded = await handle.getAttribute('aria-expanded')
  if (expanded !== 'true') await handle.click()
  await expect(handle).toHaveAttribute('aria-expanded', 'true')
  return true
}

async function hideInspector(page: Page) {
  await page.getByTitle('Hide inspector').click()
}

test('imports, organizes, and exports a PDF locally', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'About Local PDF' }).click()
  const about = page.getByRole('dialog', { name: 'About Local PDF' })
  await expect(about).toBeVisible()
  await expect(about.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/emile/local-pdf')
  await about.getByRole('button', { name: 'Done' }).click()
  await expect(about).toBeHidden()

  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await expect(page.getByText('2 pages')).toBeVisible()
  if (await page.getByRole('button', { name: 'Expand export drawer' }).isVisible().catch(() => false)) {
    await expect(page.getByRole('button', { name: /^Export all pages$/i })).toBeHidden()
  }
  await expandDrawerIfVisible(page)
  await expect(page.getByLabel('File name')).toHaveValue('sample')
  await page.getByRole('tab', { name: 'Document' }).click()
  await expect(page.getByLabel('Title')).toHaveValue('sample')
  await page.getByRole('tab', { name: 'Export' }).click()
  await expect(page.getByRole('button', { name: /^Export all pages$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Export selected pages$/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Other downloads' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Separate pages$/i })).toBeVisible()

  const headerDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  expect((await headerDownload).suggestedFilename()).toBe('sample.pdf')

  await hideInspector(page)
  await page.getByLabel('Select page 1').click()
  await page.getByTitle('Rotate right').click()
  await expect(page.getByText('90°')).toBeVisible()
  await page.getByTitle('Show inspector').click()
  await expandDrawerIfVisible(page)

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /^Export selected pages$/i }).click()
  const exported = await download
  expect(exported.suggestedFilename()).toBe('sample.pdf')

  await page.reload()
  const recents = page.getByRole('dialog', { name: 'Recent PDFs' })
  await expect(recents).toBeVisible()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await expect(recents.locator('button').first()).toContainText('New PDF')
  await expect(recents.getByRole('button', { name: /sample/ })).toBeVisible()
  await recents.getByRole('button', { name: /sample/ }).click()
  await expect(recents).toBeHidden()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)

  await page.reload()
  const recentsAfterReload = page.getByRole('dialog', { name: 'Recent PDFs' })
  await expect(recentsAfterReload).toBeVisible()
  await recentsAfterReload.getByRole('button', { name: 'Clear recent' }).click()
  await expect(page.getByText('Drop PDFs or images here')).toBeVisible()
  await expect(page.getByTestId('page-tile')).toHaveCount(0)
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
  await expect(page.getByRole('button', { name: 'Deselect all' })).toBeVisible()
  await page.getByRole('button', { name: 'Deselect all' }).click()
  await expect(page.locator('.toolstrip > span')).toHaveText('2 pages')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()
  await page.getByRole('button', { name: 'Select all' }).click()
  await expect(page.locator('.toolstrip > span')).toHaveText('2 selected')
  await expect(page.getByRole('button', { name: 'Deselect all' })).toBeVisible()
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

test('opens page edit options from the right click menu', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Right-click context menu is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  await page.locator('.page-grid').click({ position: { x: 5, y: 5 } })
  await page.getByLabel('Select page 2').click({ button: 'right' })
  const menu = page.getByRole('menu', { name: 'Page 2 actions' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Edit page' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Rotate left' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Rotate right' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
  await expect(page.locator('.toolstrip > span')).toHaveText('1 selected')

  await menu.getByRole('menuitem', { name: 'Rotate right' }).click()
  await expect(page.getByText('90°')).toBeVisible()
  await page.getByLabel('Select page 2').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Duplicate' }).click()
  await expect(page.getByTestId('page-tile')).toHaveCount(3)
  await page.getByLabel('Select page 2').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(page.getByTestId('page-tile')).toHaveCount(2)
})

test('opens the editor from the hovered page edit affordance', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Hover affordance is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  await page.getByTestId('page-tile').first().hover()
  await expect(page.getByLabel('Edit page 1')).toBeVisible()
  await page.getByLabel('Edit page 1').click()
  await expect(page.getByRole('dialog', { name: 'Page editor' })).toBeVisible()
})

test('edits can be selected, moved, resized, and deleted with app modals', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Pointer transform coverage is desktop-only')
  let browserDialogs = 0
  page.on('dialog', async (dialog) => {
    browserDialogs += 1
    await dialog.dismiss()
  })
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await hideInspector(page)
  await page.locator('.page-number').first().click()
  await page.getByRole('button', { name: 'Text' }).click()
  const pageBox = await page.locator('.editor-page').boundingBox()
  expect(pageBox).not.toBeNull()
  if (!pageBox) return
  await page.mouse.move(pageBox.x + 120, pageBox.y + 130)
  await page.mouse.down()
  await page.mouse.move(pageBox.x + 260, pageBox.y + 185)
  await page.mouse.up()
  await expect(page.getByRole('dialog', { name: 'Add text' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Text' }).fill('Movable note')
  await page.getByRole('button', { name: 'Add text' }).click()
  await page.getByRole('button', { name: 'Select', exact: true }).click()
  await expect(page.getByTestId('overlay-frame')).toHaveCount(1)

  const frame = page.getByTestId('overlay-frame').first()
  await frame.click()
  const beforeMove = await frame.boundingBox()
  expect(beforeMove).not.toBeNull()
  if (!beforeMove) return
  await page.mouse.move(beforeMove.x + beforeMove.width / 2, beforeMove.y + beforeMove.height / 2)
  await page.mouse.down()
  await page.mouse.move(beforeMove.x + beforeMove.width / 2 + 80, beforeMove.y + beforeMove.height / 2 + 30)
  await page.mouse.up()
  await expect.poll(async () => (await frame.boundingBox())?.x ?? 0).toBeGreaterThan(beforeMove.x + 40)

  const beforeResize = await frame.boundingBox()
  expect(beforeResize).not.toBeNull()
  if (!beforeResize) return
  const handle = page.getByTestId('resize-se')
  const handleBox = await handle.boundingBox()
  expect(handleBox).not.toBeNull()
  if (!handleBox) return
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 70, handleBox.y + handleBox.height / 2 + 30)
  await page.mouse.up()
  await expect.poll(async () => (await frame.boundingBox())?.width ?? 0).toBeGreaterThan(beforeResize.width + 30)

  await page.getByRole('button', { name: 'Delete selected edit' }).click()
  const deleteDialog = page.getByRole('dialog', { name: 'Delete edit' })
  await expect(deleteDialog).toBeVisible()
  await deleteDialog.getByRole('button', { name: /^Delete$/ }).click()
  await expect(page.getByText('No edits')).toBeVisible()
  expect(browserDialogs).toBe(0)
})

test('adds a split PDF marker from the add dropdown', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await page.getByRole('button', { name: 'Add…' }).click()
  await page.getByRole('menuitem', { name: 'Split PDF marker' }).click()
  await expect(page.getByTestId('split-marker')).toHaveCount(1)
  await expect(page.getByTestId('split-marker').getByText('New PDF')).toBeVisible()
  await expect(page.getByText('2 pages')).toBeVisible()

  const firstPage = await page.getByTestId('page-tile').first().boundingBox()
  const marker = await page.getByTestId('split-marker').boundingBox()
  const markerPanel = await page.getByTestId('split-marker-panel').boundingBox()
  expect(firstPage).not.toBeNull()
  expect(marker).not.toBeNull()
  expect(markerPanel).not.toBeNull()
  if (!firstPage || !marker || !markerPanel) return
  expect(marker.height).toBeGreaterThan(firstPage.height * 0.75)
  expect(markerPanel.height).toBeGreaterThan(firstPage.height * 0.7)
  expect(marker.x).toBeGreaterThan(firstPage.x)

  const downloads: Download[] = []
  page.on('download', (download) => downloads.push(download))
  await page.getByTitle('Download all pages').click()
  await expect.poll(() => downloads.length, { timeout: 30_000 }).toBe(2)
  await expect.poll(async () => Promise.all(downloads.map((download) => download.suggestedFilename()))).toEqual(['sample-001.pdf', 'sample-002.pdf'])

  for (const download of downloads) {
    const path = await download.path()
    expect(path).not.toBeNull()
    if (!path) continue
    const exported = await PDFDocument.load(await readFile(path))
    expect(exported.getPageCount()).toBe(1)
  }
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
  await expect.poll(async () => page.locator('.editor-page > img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(1400)
  const box = await page.locator('.editor-page').boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  expect(box.width / box.height).toBeGreaterThan(1.65)
  expect(box.width / box.height).toBeLessThan(1.9)
  await page.locator('.editor-stage').dispatchEvent('wheel', { deltaY: -80, ctrlKey: true, bubbles: true, cancelable: true })
  await expect(page.getByText('125%')).toBeVisible()
  await page.getByTitle('Fit page').click()
  await expect(page.getByText('100%')).toBeVisible()
  const stage = page.locator('.editor-stage')
  await stage.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 220, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointermove', { pointerId: 2, pointerType: 'touch', clientX: 280, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 220, bubbles: true, cancelable: true })
  await stage.dispatchEvent('pointerup', { pointerId: 2, pointerType: 'touch', clientX: 280, clientY: 220, bubbles: true, cancelable: true })
  await expect(page.getByText('160%')).toBeVisible()
  await page.getByTitle('Fit page').click()
  await page.getByTitle('Zoom in').click()
  await page.getByTitle('Zoom in').click()
  await expect(page.getByText('150%')).toBeVisible()
  await expect.poll(async () => page.locator('.editor-page > img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(2500)
  const zoomedBox = await page.locator('.editor-page').boundingBox()
  expect(zoomedBox).not.toBeNull()
  if (!zoomedBox) return
  expect(zoomedBox.width).toBeGreaterThan(box.width)
})

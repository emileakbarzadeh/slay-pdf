import { expect, test } from '@playwright/test'
import type { Download, Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { PDFDocument, rgb } from 'pdf-lib'

async function samplePdf(pageCount = 2) {
  const document = await PDFDocument.create()
  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage([420, 594])
    if (index === 0) {
      page.drawRectangle({ x: 0, y: 297, width: 210, height: 297, color: rgb(0.95, 0.2, 0.32) })
      page.drawRectangle({ x: 210, y: 297, width: 210, height: 297, color: rgb(0.15, 0.42, 0.72) })
      page.drawRectangle({ x: 0, y: 0, width: 210, height: 297, color: rgb(0.16, 0.62, 0.38) })
      page.drawRectangle({ x: 210, y: 0, width: 210, height: 297, color: rgb(0.97, 0.78, 0.2) })
    }
    page.drawText('Slay PDF test document', { x: 48, y: 520, size: 20, color: rgb(0, 0, 0) })
    page.drawText(`Page ${index + 1}`, { x: 48, y: 486, size: 14, color: rgb(0.1, 0.1, 0.1) })
  }
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

async function waitForSavedPageCount(page: Page, count: number) {
  await expect.poll(async () => page.evaluate(async () => new Promise<number>((resolve) => {
    const open = indexedDB.open('slay-pdf')
    open.onerror = () => resolve(0)
    open.onsuccess = () => {
      const database = open.result
      if (!database.objectStoreNames.contains('workspaces')) {
        database.close()
        resolve(0)
        return
      }
      const transaction = database.transaction('workspaces', 'readonly')
      const request = transaction.objectStore('workspaces').get('active')
      request.onerror = () => resolve(0)
      request.onsuccess = () => {
        const workspace = request.result as { pages?: unknown[] } | undefined
        database.close()
        resolve(workspace?.pages?.length ?? 0)
      }
    }
  }))).toBe(count)
}

test('exposes crawlable SEO metadata and sitemap files', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Slay PDF - Free Local PDF Editor & Adobe Acrobat Alternative')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /free local PDF editor/i)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Adobe Acrobat alternative/i)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://slaypdf.com/')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Slay PDF - Free Local PDF Editor')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://slaypdf.com/og-image.png')
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')

  const structuredData = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(structuredData).not.toBeNull()
  const app = JSON.parse(structuredData ?? '{}') as { '@type'?: string; name?: string; offers?: { price?: string }; featureList?: string[] }
  expect(app['@type']).toBe('WebApplication')
  expect(app.name).toBe('Slay PDF')
  expect(app.offers?.price).toBe('0')
  expect(app.featureList).toContain('Merge PDF files')
  const structuredGraphs = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? '{}')))
  expect(JSON.stringify(structuredGraphs)).toContain('FAQPage')
  expect(JSON.stringify(structuredGraphs)).toContain('Adobe Acrobat alternative')

  const robots = await (await page.request.get('/robots.txt')).text()
  expect(robots).toContain('Allow: /')
  expect(robots).toContain('Sitemap: https://slaypdf.com/sitemap.xml')

  const sitemap = await (await page.request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('<loc>https://slaypdf.com/</loc>')
  for (const path of [
    'free-pdf-editor.html',
    'adobe-acrobat-alternative.html',
    'merge-pdf.html',
    'split-pdf.html',
    'sign-pdf.html',
    'posterise-pdf.html',
    'private-pdf-editor.html'
  ]) {
    expect(sitemap).toContain(`<loc>https://slaypdf.com/${path}</loc>`)
    const response = await page.request.get(`/${path}`)
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain(`href="https://slaypdf.com/${path}"`)
    expect(html).toContain('Open editor')
  }

  const previewImage = await page.request.get('/og-image.png')
  expect(previewImage.ok()).toBe(true)
  expect(previewImage.headers()['content-type']).toContain('image/png')

  const llms = await (await page.request.get('/llms.txt')).text()
  expect(llms).toContain('Free local PDF editor and Adobe Acrobat alternative')
  expect(llms).toContain('https://slaypdf.com/merge-pdf.html')
})

test('imports, organizes, and exports a PDF locally', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'About Slay PDF' }).click()
  const about = page.getByRole('dialog', { name: 'About Slay PDF' })
  await expect(about).toBeVisible()
  await expect(about).toContainText('Slay PDF is a completely local PDF editor to split, merge, posterise, sign or edit any PDF.')
  await expect(about).toContainText('Super quick and no more random dodgy sites. Enterprise level security (since your data stays with you and is never sent over the internet)')
  await expect(about).toContainText('Your documents and edits stay in this browser. Passwords are never saved.')
  await expect(about.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/emileakbarzadeh/slay-pdf')
  await expect(about.getByText('License links')).toBeVisible()
  await expect(about.getByRole('link', { name: 'Slay PDF (AGPL-3.0)' })).toBeHidden()
  await about.getByText('License links').click()
  await expect(about.getByRole('link', { name: 'Slay PDF (AGPL-3.0)' })).toHaveAttribute('href', 'https://github.com/emileakbarzadeh/slay-pdf')
  await expect(about.getByRole('link', { name: 'GhostPDL/Ghostscript WASM (AGPL-3.0-or-later)' })).toHaveAttribute('href', 'https://github.com/okathira/ghostpdl-wasm')
  await expect(about.getByRole('link', { name: 'qpdf-wasm wrapper (ISC)' })).toHaveAttribute('href', 'https://github.com/neslinesli93/qpdf-wasm')
  await expect(about.getByRole('link', { name: 'QPDF engine source' })).toHaveAttribute('href', 'https://github.com/qpdf/qpdf')
  await expect(about.getByRole('link', { name: 'PDF.js (Apache-2.0)' })).toHaveAttribute('href', 'https://mozilla.github.io/pdf.js/')
  await expect(about.getByRole('link', { name: 'pdf-lib (MIT)' })).toHaveAttribute('href', 'https://pdf-lib.js.org/')
  await expect(about.getByRole('link', { name: 'Tesseract.js (Apache-2.0)' })).toHaveAttribute('href', 'https://github.com/naptha/tesseract.js')
  await about.getByRole('button', { name: 'Done' }).click()
  await expect(about).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Workspace actions' }).getByRole('button', { name: 'Import' })).toHaveCount(0)

  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await page.locator('.page-preview img').first().waitFor()
  await expect.poll(async () => page.locator('.page-preview img').first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(290)
  await expect(page.locator('.statusbar')).toContainText('2 pages')
  await expect.poll(async () => (await page.locator('.statusbar').boundingBox())?.height ?? 0).toBeLessThanOrEqual(27)
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.locator('.toolstrip > button').first()).toHaveText('Deselect all (2)')
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
  await expect(page.getByRole('button', { name: /^Page images$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Plain text$/i })).toBeVisible()
  await page.getByLabel('File name').fill('renamed.pdf')
  await expect(page.getByLabel('File name')).toHaveValue('renamed')
  await page.getByLabel('File name').fill('sample')
  await waitForSavedPageCount(page, 2)

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
  await waitForSavedPageCount(page, 2)

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
  await expect(page.getByRole('button', { name: 'Deselect all (2)' })).toBeVisible()
  await page.getByRole('button', { name: 'Deselect all (2)' }).click()
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()
  await page.getByRole('button', { name: 'Select all' }).click()
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Deselect all (2)' })).toBeVisible()
  await page.getByLabel('Select page 1').click()
  await expect(page.getByRole('button', { name: 'Select all (1)' })).toBeVisible()
  await page.locator('.page-grid').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()

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

test('supports range selection and workspace keyboard shortcuts', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Keyboard shortcut coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf(4)
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(4)
  await hideInspector(page)
  await page.getByRole('button', { name: 'Deselect all (4)' }).click()
  await page.getByLabel('Select page 1').click()
  await page.getByLabel('Select page 3').click({ modifiers: ['Shift'] })
  await expect(page.getByRole('button', { name: 'Select all (3)' })).toBeVisible()
  await expect(page.getByLabel('Select page 1')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Select page 2')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Select page 3')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Select page 4')).toHaveAttribute('aria-pressed', 'false')

  await page.keyboard.down('Meta')
  await expect(page.getByLabel('Keyboard shortcuts')).toBeVisible()
  await expect(page.getByLabel('Keyboard shortcuts')).toContainText('Cmd A')
  await page.keyboard.up('Meta')
  await expect(page.getByLabel('Keyboard shortcuts')).toBeHidden()

  await page.keyboard.press('Meta+Shift+A')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()
  await page.keyboard.press('Meta+A')
  await expect(page.getByRole('button', { name: 'Deselect all (4)' })).toBeVisible()
  await page.keyboard.press('Meta+Shift+A')
  await page.getByLabel('Select page 2').click()
  await page.keyboard.press(']')
  await expect(page.getByText('90°')).toBeVisible()
  await page.keyboard.press('Meta+Z')
  await expect(page.getByText('90°')).toBeHidden()
  await page.keyboard.press('Meta+Shift+Z')
  await expect(page.getByText('90°')).toBeVisible()
  await page.getByLabel('Select page 2').click()
  await page.keyboard.press('BracketLeft')
  await expect(page.getByText('90°')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Select all' })).toBeVisible()
  await page.getByLabel('Select page 2').click()
  await page.keyboard.press('Meta+D')
  await expect(page.getByTestId('page-tile')).toHaveCount(5)
  const shortcutDownload = page.waitForEvent('download')
  await page.keyboard.press('Meta+S')
  expect((await shortcutDownload).suggestedFilename()).toBe('sample.pdf')
  await page.keyboard.press('Delete')
  await expect(page.getByTestId('page-tile')).toHaveCount(4)
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
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')
  await expect(page.getByRole('button', { name: 'Select all (1)' })).toBeVisible()

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

test('keeps the add pages hover menu open while moving into it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Hover menu coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  const toggle = page.getByRole('button', { name: 'Add…' })
  await toggle.hover()
  const toggleBox = await toggle.boundingBox()
  const menu = page.locator('.add-pages-menu')
  await expect(menu).toBeVisible()
  const menuBox = await menu.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(menuBox).not.toBeNull()
  if (!toggleBox || !menuBox) return

  await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + 2)
  await page.mouse.move(menuBox.x + menuBox.width / 2, menuBox.y + menuBox.height - 2, { steps: 8 })
  await expect(page.getByRole('menuitem', { name: 'Split PDF marker' })).toBeVisible()
})

test('resizes and posterises selected pages from the tools dropdown', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Toolbar menu coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf(1)
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(1)
  await hideInspector(page)
  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Resize selected pages' }).click()
  const resizeDialog = page.getByRole('dialog', { name: 'Resize selected pages' })
  await expect(resizeDialog).toBeVisible()
  await resizeDialog.getByLabel('Paper size').selectOption('letter')
  await resizeDialog.getByLabel('Orientation').selectOption('landscape')
  await resizeDialog.getByRole('button', { name: 'Resize', exact: true }).click()
  await expect(resizeDialog).toBeHidden()

  const resizedDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  const resizedPath = await (await resizedDownload).path()
  expect(resizedPath).not.toBeNull()
  if (!resizedPath) return
  const resizedPdf = await PDFDocument.load(await readFile(resizedPath))
  expect(Math.round(resizedPdf.getPage(0).getWidth())).toBe(792)
  expect(Math.round(resizedPdf.getPage(0).getHeight())).toBe(612)
  await expect(page.getByTitle('Page has been resized')).toBeVisible()
  await page.locator('.page-number').first().click()
  const editor = page.getByRole('dialog', { name: 'Page editor' })
  await expect(editor.locator('.editor-title')).toContainText('Resized')
  await expect(editor.locator('.editor-title')).toContainText('Original 420 x 594 pt')
  await editor.getByTitle('Close').click()
  await expect(editor).toBeHidden()

  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Posterise selected pages' }).click()
  const posterDialog = page.getByRole('dialog', { name: 'Posterise selected pages' })
  await expect(posterDialog).toBeVisible()
  await expect(posterDialog.getByLabel('Orientation')).toHaveValue('landscape')
  await posterDialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(posterDialog).toBeHidden()

  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Resize selected pages' }).click()
  await resizeDialog.getByLabel('Paper size').selectOption('custom')
  await resizeDialog.getByLabel('Width (mm)').fill('100')
  await resizeDialog.getByLabel('Height (mm)').fill('150')
  await expect(resizeDialog).toContainText('100 x 150 mm')
  await resizeDialog.getByRole('button', { name: 'Resize', exact: true }).click()

  const customDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  const customPath = await (await customDownload).path()
  expect(customPath).not.toBeNull()
  if (!customPath) return
  const customPdf = await PDFDocument.load(await readFile(customPath))
  expect(Math.round(customPdf.getPage(0).getWidth())).toBe(283)
  expect(Math.round(customPdf.getPage(0).getHeight())).toBe(425)

  await page.getByRole('button', { name: /Tools/ }).click()
  await page.getByRole('menuitem', { name: 'Posterise selected pages' }).click()
  await expect(posterDialog).toBeVisible()
  await expect(posterDialog.getByLabel('Orientation')).toHaveValue('portrait')
  await posterDialog.getByLabel('Columns').fill('2')
  await posterDialog.getByLabel('Rows').fill('2')
  await posterDialog.getByLabel('Paper size').selectOption('a4')
  await posterDialog.getByRole('button', { name: 'Posterise', exact: true }).click()
  await expect(page.getByTestId('page-tile')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Deselect all (4)' })).toBeVisible()
  await expect(page.locator('.page-preview img')).toHaveCount(4)
  const posterPreviewSources = await page.locator('.page-preview img').evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src))
  expect(new Set(posterPreviewSources).size).toBeGreaterThan(1)

  const posterDownload = page.waitForEvent('download')
  await page.getByTitle('Download all pages').click()
  const posterPath = await (await posterDownload).path()
  expect(posterPath).not.toBeNull()
  if (!posterPath) return
  const posterPdf = await PDFDocument.load(await readFile(posterPath))
  expect(posterPdf.getPageCount()).toBe(4)
  expect(Math.round(posterPdf.getPage(0).getWidth())).toBe(595)
  expect(Math.round(posterPdf.getPage(0).getHeight())).toBe(842)
})

test('keeps the tools hover menu open while moving into it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Hover menu coverage is desktop-only')
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', {
    name: 'sample.pdf',
    mimeType: 'application/pdf',
    buffer: await samplePdf()
  })

  await expect(page.getByTestId('page-tile')).toHaveCount(2)
  await hideInspector(page)
  const toggle = page.getByRole('button', { name: /Tools/ })
  await toggle.hover()
  const toggleBox = await toggle.boundingBox()
  const menu = page.locator('.tools-menu')
  await expect(menu).toBeVisible()
  const menuBox = await menu.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(menuBox).not.toBeNull()
  if (!toggleBox || !menuBox) return

  await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height - 2)
  await page.mouse.move(menuBox.x + menuBox.width / 2, menuBox.y + 2, { steps: 8 })
  await expect(page.getByRole('menuitem', { name: 'Resize selected pages' })).toBeVisible()
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
  await expect(page.locator('.toolstrip')).not.toContainText('2 pages')

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

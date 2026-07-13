import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
const indexPath = path.join(dist, 'index.html')

function assert(condition, message) {
  if (!condition) {
    console.error(message)
    process.exit(1)
  }
}

assert(fs.existsSync(indexPath), 'dist/index.html is missing. Run npm run build first.')

const indexHtml = fs.readFileSync(indexPath, 'utf8')
const scriptMatch = indexHtml.match(/<script[^>]+type="module"[^>]+src="\/assets\/(index-[^"]+\.js)"/)
assert(scriptMatch, 'Could not find the initial Vite module script in dist/index.html.')

const initialChunk = path.join(dist, 'assets', scriptMatch[1])
assert(fs.existsSync(initialChunk), `Initial app chunk is missing: ${scriptMatch[1]}`)

const initialSize = fs.statSync(initialChunk).size
const maxInitialChunkBytes = 350 * 1024
assert(
  initialSize <= maxInitialChunkBytes,
  `Initial app chunk is ${(initialSize / 1024).toFixed(1)} KiB; expected <= ${maxInitialChunkBytes / 1024} KiB. Keep PDF parsing/rendering lazy.`
)

const initialSource = fs.readFileSync(initialChunk, 'utf8')
for (const eagerPdfToken of ['pdf.worker.min', 'GlobalWorkerOptions', 'getDocument(']) {
  assert(!initialSource.includes(eagerPdfToken), `Initial app chunk includes PDF.js token "${eagerPdfToken}".`)
}
for (const eagerDndToken of ['DndContext', 'PointerSensor', 'sortableKeyboardCoordinates', 'useSortable']) {
  assert(!initialSource.includes(eagerDndToken), `Initial app chunk includes drag-and-drop token "${eagerDndToken}".`)
}

const assetNames = fs.readdirSync(path.join(dist, 'assets'))
const lazyPdfChunk = assetNames.find((name) => /^pdf-[\w-]+\.js$/.test(name))
assert(lazyPdfChunk, 'Expected a lazy pdf-*.js chunk for PDF parsing/rendering.')

for (const lazyChunkPrefix of ['AboutModal-', 'RecentModal-', 'PageToolModal-', 'WorkspacePageGrid-', 'Inspector-', 'PageEditor-', 'PageThumbnail-', 'SplitMarkerTile-']) {
  assert(assetNames.some((name) => name.startsWith(lazyChunkPrefix) && name.endsWith('.js')), `Expected a lazy ${lazyChunkPrefix}*.js chunk.`)
}

const lazyPdfSize = fs.statSync(path.join(dist, 'assets', lazyPdfChunk)).size
assert(lazyPdfSize >= 500 * 1024, 'The PDF chunk is unexpectedly small; verify PDF.js/pdf-lib did not move elsewhere.')

console.log(`Performance verification passed. Initial app chunk: ${(initialSize / 1024).toFixed(1)} KiB; lazy PDF chunk: ${(lazyPdfSize / 1024).toFixed(1)} KiB.`)

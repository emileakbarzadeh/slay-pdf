import type { ExportSettings, SourceDocument, WorkspaceItem } from '../types'
import { isWorkspacePage } from '../types'
import { buildPdf, downloadBlob, ensurePdfFilename, hasSplitMarkers, splitPdfFilename, splitPdfGroups } from './export'
import { processPdf } from './processing'

type Options = {
  password?: string
  onJob?: (label: string, progress: number) => void
}

const waitForBrowserDownload = () => new Promise((resolve) => window.setTimeout(resolve, 150))

export async function downloadPdfExport(
  items: WorkspaceItem[],
  sources: SourceDocument[],
  settings: ExportSettings,
  options: Options = {}
) {
  const pageEntries = items.filter(isWorkspacePage)
  const groups = hasSplitMarkers(items) ? splitPdfGroups(items) : [pageEntries]
  if (!pageEntries.length) throw new Error('Add at least one page before exporting.')

  for (let index = 0; index < groups.length; index += 1) {
    const groupOffset = index / groups.length
    const groupScale = 1 / groups.length
    const composed = await buildPdf(groups[index], sources, settings, (progress) => {
      options.onJob?.('Building PDF', groupOffset + progress * groupScale * 0.52)
    })
    const processed = await processPdf(composed, { compression: settings.compression, password: options.password }, (progress, label) => {
      options.onJob?.(label, groupOffset + (0.52 + progress * 0.48) * groupScale)
    })
    downloadBlob(processed, groups.length > 1 ? splitPdfFilename(settings.filename, index) : ensurePdfFilename(settings.filename))
    if (groups.length > 1 && index < groups.length - 1) await waitForBrowserDownload()
  }
}

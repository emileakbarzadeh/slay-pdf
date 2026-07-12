export type CropBox = { top: number; right: number; bottom: number; left: number }

export type Point = { x: number; y: number }

export type PageOverlay =
  | { id: string; type: 'text'; x: number; y: number; width: number; height: number; text: string; color: string; fontSize: number }
  | { id: string; type: 'highlight'; x: number; y: number; width: number; height: number; color: string; opacity: number }
  | { id: string; type: 'rectangle'; x: number; y: number; width: number; height: number; color: string; lineWidth: number }
  | { id: string; type: 'redact'; x: number; y: number; width: number; height: number }
  | { id: string; type: 'ink'; points: Point[]; color: string; lineWidth: number }
  | { id: string; type: 'signature'; x: number; y: number; width: number; height: number; text: string }

export type SourceDocument = {
  id: string
  name: string
  blob: Blob
  size: number
  pageCount: number
  createdAt: number
  formFields?: FormField[]
}

export type FormField = {
  name: string
  type: 'text' | 'checkbox' | 'choice' | 'radio' | 'unsupported'
  value: string
  options?: string[]
}

export type WorkspacePage = {
  kind?: 'page'
  id: string
  sourceId: string
  sourcePageIndex: number
  width: number
  height: number
  rotation: 0 | 90 | 180 | 270
  crop: CropBox
  overlays: PageOverlay[]
}

export type WorkspaceSplitMarker = {
  id: string
  kind: 'split'
}

export type WorkspaceItem = WorkspacePage | WorkspaceSplitMarker

export function isWorkspacePage(item: WorkspaceItem): item is WorkspacePage {
  return item.kind !== 'split'
}

export type DocumentMetadata = {
  title: string
  author: string
  subject: string
  keywords: string
}

export type ExportSettings = {
  filename: string
  pageNumbers: boolean
  watermark: string
  watermarkOpacity: number
  flattenOverlays: boolean
  flattenForms: boolean
  compression: 'lossless' | 'screen' | 'ebook' | 'printer'
  metadata: DocumentMetadata
}

export type PersistedWorkspace = {
  id: 'active'
  sources: SourceDocument[]
  pages: WorkspaceItem[]
  settings: ExportSettings
  savedAt: number
}

export type JobState = {
  label: string
  progress: number
} | null

export const defaultExportSettings: ExportSettings = {
  filename: 'local-pdf.pdf',
  pageNumbers: false,
  watermark: '',
  watermarkOpacity: 0.18,
  flattenOverlays: true,
  flattenForms: true,
  compression: 'lossless',
  metadata: { title: '', author: '', subject: '', keywords: '' }
}

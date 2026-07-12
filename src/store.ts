import { create } from 'zustand'
import { clearWorkspace, loadWorkspace, saveWorkspace } from './lib/database'
import { importFile, uid } from './lib/pdf'
import type { ExportSettings, JobState, PageOverlay, SourceDocument, WorkspaceItem, WorkspacePage } from './types'
import { defaultExportSettings, isWorkspacePage } from './types'

type PageSnapshot = WorkspaceItem[]

type WorkspaceState = {
  hydrated: boolean
  sources: SourceDocument[]
  pages: WorkspaceItem[]
  selected: string[]
  settings: ExportSettings
  history: PageSnapshot[]
  future: PageSnapshot[]
  job: JobState
  error: string | null
  hydrate: () => Promise<void>
  importFiles: (files: File[]) => Promise<void>
  select: (id: string, additive?: boolean) => void
  selectMany: (ids: string[]) => void
  selectAll: () => void
  selectNone: () => void
  reorder: (activeId: string, overId: string) => void
  rotate: (degrees: 90 | -90) => void
  remove: () => void
  duplicate: () => void
  resizeSelected: (width: number, height: number) => void
  posterizeSelected: (columns: number, rows: number, width: number, height: number) => void
  addSplitMarker: () => void
  removeSplitMarker: (id: string) => void
  updatePage: (id: string, changes: Partial<WorkspacePage>) => void
  updateFormField: (sourceId: string, name: string, value: string) => void
  addOverlay: (pageId: string, overlay: PageOverlay) => void
  updateOverlay: (pageId: string, overlayId: string, changes: PageOverlay) => void
  removeOverlay: (pageId: string, overlayId: string) => void
  updateSettings: (changes: Partial<ExportSettings>) => void
  undo: () => void
  redo: () => void
  reset: () => Promise<void>
  setJob: (job: JobState) => void
  setError: (error: string | null) => void
}

const clonePages = (pages: WorkspaceItem[]) => structuredClone(pages)

function withHistory(state: WorkspaceState, pages: WorkspaceItem[]) {
  return { pages, history: [...state.history.slice(-39), clonePages(state.pages)], future: [] }
}

function titleFromFilename(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

let saveTimer: number | undefined
function scheduleSave() {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    const { sources, pages, settings, hydrated } = useWorkspace.getState()
    if (hydrated && (sources.length || pages.length)) {
      void saveWorkspace({ id: 'active', sources, pages, settings, savedAt: Date.now() }).catch(() => {
        useWorkspace.setState({ error: 'Autosave is unavailable. Your current work remains open in this tab.' })
      })
    }
  }, 450)
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  hydrated: false,
  sources: [],
  pages: [],
  selected: [],
  settings: defaultExportSettings,
  history: [],
  future: [],
  job: null,
  error: null,

  hydrate: async () => {
    try {
      const saved = await loadWorkspace()
      set(saved ? { sources: saved.sources, pages: saved.pages, settings: { ...defaultExportSettings, ...saved.settings }, hydrated: true } : { hydrated: true })
    } catch {
      set({ hydrated: true, error: 'Saved work could not be restored.' })
    }
  },

  importFiles: async (files) => {
    set({ job: { label: 'Importing files', progress: 0 }, error: null })
    try {
      const imported = []
      for (let index = 0; index < files.length; index += 1) {
        imported.push(await importFile(files[index]))
        set({ job: { label: `Importing ${files[index].name}`, progress: (index + 1) / files.length } })
      }
      const state = get()
      const pages = imported.flatMap((item) => item.pages)
      const firstSource = imported[0]?.source
      const shouldUseFirstSourceDefaults = firstSource && !state.sources.length && !state.pages.length
      const settings = shouldUseFirstSourceDefaults
        ? {
            ...state.settings,
            filename: state.settings.filename === defaultExportSettings.filename ? firstSource.name : state.settings.filename,
            metadata: {
              ...state.settings.metadata,
              title: state.settings.metadata.title || titleFromFilename(firstSource.name)
            }
          }
        : state.settings
      set({
        ...withHistory(state, [...state.pages, ...pages]),
        sources: [...state.sources, ...imported.map((item) => item.source)],
        selected: pages.map((page) => page.id),
        settings,
        job: null
      })
      scheduleSave()
    } catch (error) {
      set({ job: null, error: error instanceof Error ? error.message : 'Import failed.' })
    }
  },

  select: (id, additive = false) => set((state) => {
    if (!additive) return { selected: [id] }
    return { selected: state.selected.includes(id) ? state.selected.filter((value) => value !== id) : [...state.selected, id] }
  }),
  selectMany: (ids) => set({ selected: ids }),
  selectAll: () => set((state) => ({ selected: state.pages.filter(isWorkspacePage).map((page) => page.id) })),
  selectNone: () => set({ selected: [] }),

  reorder: (activeId, overId) => {
    const state = get()
    const from = state.pages.findIndex((page) => page.id === activeId)
    const to = state.pages.findIndex((page) => page.id === overId)
    if (from < 0 || to < 0 || from === to) return
    const pages = [...state.pages]
    const [moved] = pages.splice(from, 1)
    pages.splice(to, 0, moved)
    set(withHistory(state, pages))
    scheduleSave()
  },

  rotate: (degrees) => {
    const state = get()
    const selected = new Set(state.selected)
    const pages = state.pages.map((page) => isWorkspacePage(page) && selected.has(page.id)
      ? { ...page, rotation: ((page.rotation + degrees + 360) % 360) as WorkspacePage['rotation'] }
      : page)
    set(withHistory(state, pages))
    scheduleSave()
  },

  remove: () => {
    const state = get()
    const selected = new Set(state.selected)
    set({ ...withHistory(state, state.pages.filter((page) => !isWorkspacePage(page) || !selected.has(page.id))), selected: [] })
    scheduleSave()
  },

  duplicate: () => {
    const state = get()
    const selected = new Set(state.selected)
    const pages = state.pages.flatMap((page) => isWorkspacePage(page) && selected.has(page.id) ? [page, { ...structuredClone(page), id: uid('page') }] : [page])
    set(withHistory(state, pages))
    scheduleSave()
  },

  resizeSelected: (width, height) => {
    const state = get()
    const selected = new Set(state.selected)
    const pages = state.pages.map((page) => isWorkspacePage(page) && selected.has(page.id)
      ? { ...page, originalWidth: page.originalWidth ?? page.width, originalHeight: page.originalHeight ?? page.height, width, height }
      : page)
    set(withHistory(state, pages))
    scheduleSave()
  },

  posterizeSelected: (columns, rows, width, height) => {
    const state = get()
    const selected = new Set(state.selected)
    const nextSelected: string[] = []
    const pages = state.pages.flatMap((page) => {
      if (!isWorkspacePage(page) || !selected.has(page.id)) return [page]
      const visibleLeft = page.crop.left
      const visibleRight = 1 - page.crop.right
      const visibleTop = 1 - page.crop.top
      const visibleBottom = page.crop.bottom
      const tileWidth = (visibleRight - visibleLeft) / columns
      const tileHeight = (visibleTop - visibleBottom) / rows
      return Array.from({ length: rows * columns }, (_, index) => {
        const row = Math.floor(index / columns)
        const column = index % columns
        const left = visibleLeft + column * tileWidth
        const right = left + tileWidth
        const top = visibleTop - row * tileHeight
        const bottom = top - tileHeight
        const id = uid('page')
        nextSelected.push(id)
        return {
          ...structuredClone(page),
          id,
          width,
          height,
          crop: {
            left,
            right: 1 - right,
            top: 1 - top,
            bottom
          },
          overlays: []
        }
      })
    })
    set({ ...withHistory(state, pages), selected: nextSelected })
    scheduleSave()
  },

  addSplitMarker: () => {
    const state = get()
    const selected = new Set(state.selected)
    const selectedIndexes = state.pages.flatMap((item, index) => isWorkspacePage(item) && selected.has(item.id) ? [index] : [])
    const pageIndexes = state.pages.flatMap((item, index) => isWorkspacePage(item) ? [index] : [])
    const anchorIndex = selectedIndexes.length === 1 ? selectedIndexes[0] : pageIndexes[0]
    const insertAt = anchorIndex === undefined ? state.pages.length : anchorIndex + 1
    const pages = [...state.pages]
    pages.splice(insertAt, 0, { id: uid('split'), kind: 'split' })
    set(withHistory(state, pages))
    scheduleSave()
  },

  removeSplitMarker: (id) => {
    const state = get()
    set(withHistory(state, state.pages.filter((page) => page.id !== id)))
    scheduleSave()
  },

  updatePage: (id, changes) => {
    const state = get()
    set(withHistory(state, state.pages.map((page) => isWorkspacePage(page) && page.id === id ? { ...page, ...changes } : page)))
    scheduleSave()
  },

  updateFormField: (sourceId, name, value) => {
    set((state) => ({
      sources: state.sources.map((source) => source.id === sourceId
        ? { ...source, formFields: source.formFields?.map((field) => field.name === name ? { ...field, value } : field) }
        : source)
    }))
    scheduleSave()
  },

  addOverlay: (pageId, overlay) => {
    const state = get()
    set(withHistory(state, state.pages.map((page) => isWorkspacePage(page) && page.id === pageId ? { ...page, overlays: [...page.overlays, overlay] } : page)))
    scheduleSave()
  },

  updateOverlay: (pageId, overlayId, changes) => {
    const state = get()
    set(withHistory(state, state.pages.map((page) => isWorkspacePage(page) && page.id === pageId ? { ...page, overlays: page.overlays.map((item) => item.id === overlayId ? changes : item) } : page)))
    scheduleSave()
  },

  removeOverlay: (pageId, overlayId) => {
    const state = get()
    set(withHistory(state, state.pages.map((page) => isWorkspacePage(page) && page.id === pageId ? { ...page, overlays: page.overlays.filter((item) => item.id !== overlayId) } : page)))
    scheduleSave()
  },

  updateSettings: (changes) => {
    set((state) => ({ settings: { ...state.settings, ...changes } }))
    scheduleSave()
  },

  undo: () => {
    const state = get()
    const previous = state.history.at(-1)
    if (!previous) return
    set({ pages: clonePages(previous), history: state.history.slice(0, -1), future: [clonePages(state.pages), ...state.future].slice(0, 40), selected: [] })
    scheduleSave()
  },
  redo: () => {
    const state = get()
    const next = state.future[0]
    if (!next) return
    set({ pages: clonePages(next), history: [...state.history, clonePages(state.pages)].slice(-40), future: state.future.slice(1), selected: [] })
    scheduleSave()
  },

  reset: async () => {
    await clearWorkspace()
    set({ sources: [], pages: [], selected: [], settings: defaultExportSettings, history: [], future: [], error: null })
  },
  setJob: (job) => set({ job }),
  setError: (error) => set({ error })
}))

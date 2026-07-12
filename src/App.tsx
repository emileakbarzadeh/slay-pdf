import { useEffect, useRef, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CheckSquare, ChevronDown, Copy, Download, FilePlus2, Grid2X2, Github, History, Import, Menu, MousePointer2, PanelRightClose, PanelRightOpen, PencilLine, Redo2, RotateCcw, RotateCw, Ruler, Scissors, ShieldCheck, Trash2, Undo2, Wrench, X } from 'lucide-react'
import { PageEditor } from './components/PageEditor'
import { PageThumbnail } from './components/PageThumbnail'
import { Inspector } from './components/Inspector'
import { SplitMarkerTile } from './components/SplitMarkerTile'
import { useWorkspace } from './store'
import { isWorkspacePage } from './types'
import './styles.css'

const shortcutRows = [
  { keys: 'Cmd A', action: 'Select all pages' },
  { keys: 'Cmd Shift A', action: 'Deselect pages' },
  { keys: 'Cmd Z', action: 'Undo' },
  { keys: 'Cmd Shift Z', action: 'Redo' },
  { keys: 'Cmd O', action: 'Import files' },
  { keys: 'Cmd S', action: 'Download PDF' },
  { keys: 'Cmd D', action: 'Duplicate selected' },
  { keys: '[ / ]', action: 'Rotate selected' },
  { keys: 'Delete', action: 'Delete selected' },
  { keys: 'Esc', action: 'Clear selection' }
]

const licenseLinks = [
  { label: 'Slay PDF (AGPL-3.0)', href: 'https://github.com/emileakbarzadeh/slay-pdf' },
  { label: 'GhostPDL/Ghostscript WASM (AGPL-3.0-or-later)', href: 'https://github.com/okathira/ghostpdl-wasm' },
  { label: 'qpdf-wasm wrapper (ISC)', href: 'https://github.com/neslinesli93/qpdf-wasm' },
  { label: 'QPDF engine source', href: 'https://github.com/qpdf/qpdf' },
  { label: 'PDF.js (Apache-2.0)', href: 'https://mozilla.github.io/pdf.js/' },
  { label: 'pdf-lib (MIT)', href: 'https://pdf-lib.js.org/' },
  { label: 'Tesseract.js (Apache-2.0)', href: 'https://github.com/naptha/tesseract.js' }
]

const paperFormats = [
  { id: 'a5', label: 'A5', width: 419.53, height: 595.28 },
  { id: 'a4', label: 'A4', width: 595.28, height: 841.89 },
  { id: 'a3', label: 'A3', width: 841.89, height: 1190.55 },
  { id: 'letter', label: 'Letter', width: 612, height: 792 },
  { id: 'legal', label: 'Legal', width: 612, height: 1008 },
  { id: 'tabloid', label: 'Tabloid', width: 792, height: 1224 }
] as const

const MM_TO_POINTS = 72 / 25.4
type PaperFormatId = typeof paperFormats[number]['id']
type ResizeFormatId = PaperFormatId | 'custom'
type Orientation = 'portrait' | 'landscape'
type ToolModal = 'resize' | 'posterise'

function paperSize(formatId: PaperFormatId, orientation: Orientation) {
  const format = paperFormats.find((item) => item.id === formatId) ?? paperFormats[1]
  return orientation === 'portrait'
    ? { width: format.width, height: format.height, label: format.label }
    : { width: format.height, height: format.width, label: `${format.label} landscape` }
}

function customPaperSize(widthMm: number, heightMm: number) {
  return {
    width: Math.max(10, widthMm) * MM_TO_POINTS,
    height: Math.max(10, heightMm) * MM_TO_POINTS,
    label: 'Custom'
  }
}

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'))
}

export default function App() {
  const [editorPage, setEditorPage] = useState<string>()
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [mobileInspectorExpanded, setMobileInspectorExpanded] = useState(false)
  const [pageMenu, setPageMenu] = useState<{ pageId: string; pageNumber: number; x: number; y: number }>()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [toolModal, setToolModal] = useState<ToolModal>()
  const [resizeFormat, setResizeFormat] = useState<ResizeFormatId>('a4')
  const [resizeOrientation, setResizeOrientation] = useState<Orientation>('portrait')
  const [customResizeWidth, setCustomResizeWidth] = useState(210)
  const [customResizeHeight, setCustomResizeHeight] = useState(297)
  const [posterFormat, setPosterFormat] = useState<PaperFormatId>('a4')
  const [posterOrientation, setPosterOrientation] = useState<Orientation>('portrait')
  const [posterColumns, setPosterColumns] = useState(2)
  const [posterRows, setPosterRows] = useState(2)
  const [startupView, setStartupView] = useState<'loading' | 'recents' | 'workspace'>('loading')
  const input = useRef<HTMLInputElement>(null)
  const internalDrag = useRef(false)
  const selectionAnchor = useRef<string | undefined>(undefined)
  const state = useWorkspace()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { void state.hydrate() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!state.hydrated || startupView !== 'loading') return
    setStartupView(state.pages.some(isWorkspacePage) ? 'recents' : 'workspace')
  }, [state.hydrated, state.pages, startupView])
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (state.pages.length && state.job) event.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [state.job, state.pages.length])
  useEffect(() => {
    if (!pageMenu) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPageMenu(undefined)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [pageMenu])
  useEffect(() => {
    if (!aboutOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAboutOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [aboutOpen])

  const importFiles = (files: FileList | null) => {
    if (files?.length) void state.importFiles(Array.from(files))
    if (input.current) input.current.value = ''
  }
  const newPdf = () => {
    if (!state.pages.length || window.confirm('Clear all imported files and saved edits?')) void state.reset()
  }
  const startFreshWorkspace = () => {
    setEditorPage(undefined)
    setPageMenu(undefined)
    setStartupView('workspace')
    void state.reset()
  }
  const downloadAll = async () => {
    state.setError(null)
    state.setJob({ label: 'Building PDF', progress: 0 })
    try {
      const { downloadPdfExport } = await import('./lib/pdfDownloads')
      await downloadPdfExport(state.pages, state.sources, state.settings, { onJob: (label, progress) => state.setJob({ label, progress }) })
    } catch (error) {
      state.setError(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      state.setJob(null)
    }
  }
  const importDroppedFiles = (event: DragEvent) => {
    event.preventDefault()
    if (internalDrag.current) {
      internalDrag.current = false
      return
    }
    if (event.dataTransfer.types.includes('Files')) importFiles(event.dataTransfer.files)
  }
  const pageEntries = state.pages.filter(isWorkspacePage)
  const pageNumbers = new Map(pageEntries.map((page, index) => [page.id, index + 1]))
  const activePage = pageEntries.find((page) => page.id === editorPage)
  const activeSource = activePage && state.sources.find((source) => source.id === activePage.sourceId)
  const selectedPages = pageEntries.filter((page) => state.selected.includes(page.id))
  const allSelected = pageEntries.length > 0 && state.selected.length === pageEntries.length
  const menuPageSelected = pageMenu ? state.selected.includes(pageMenu.pageId) : false
  const selectAllLabel = `${allSelected ? 'Deselect all' : 'Select all'}${state.selected.length ? ` (${state.selected.length})` : ''}`
  const recentName = state.settings.filename.replace(/\.pdf$/i, '') || state.settings.metadata.title || 'Untitled PDF'
  const sourceLabel = `${state.sources.length} ${state.sources.length === 1 ? 'file' : 'files'}`
  const pageLabel = `${pageEntries.length} ${pageEntries.length === 1 ? 'page' : 'pages'}`
  const resizeSize = resizeFormat === 'custom' ? customPaperSize(customResizeWidth, customResizeHeight) : paperSize(resizeFormat, resizeOrientation)
  const posterSize = paperSize(posterFormat, posterOrientation)
  const applyResize = () => {
    state.resizeSelected(resizeSize.width, resizeSize.height)
    setToolModal(undefined)
  }
  const applyPosterise = () => {
    state.posterizeSelected(posterColumns, posterRows, posterSize.width, posterSize.height)
    setToolModal(undefined)
  }
  const openPosterise = () => {
    const firstSelected = selectedPages[0]
    if (firstSelected) setPosterOrientation(firstSelected.width > firstSelected.height ? 'landscape' : 'portrait')
    setToolModal('posterise')
  }
  const onDragEnd = ({ active, over }: DragEndEvent) => over && state.reorder(String(active.id), String(over.id))
  const clearSelection = () => {
    selectionAnchor.current = undefined
    state.selectNone()
  }
  const selectEveryPage = () => {
    selectionAnchor.current = pageEntries[0]?.id
    state.selectAll()
  }
  const toggleSelectAll = () => {
    if (allSelected) clearSelection()
    else selectEveryPage()
  }
  const selectPage = (pageId: string, event: MouseEvent<HTMLButtonElement>) => {
    const clickedIndex = pageEntries.findIndex((page) => page.id === pageId)
    if (event.shiftKey) {
      const fallbackAnchor = state.selected.find((id) => pageEntries.some((page) => page.id === id))
      const anchorId = selectionAnchor.current && pageEntries.some((page) => page.id === selectionAnchor.current) ? selectionAnchor.current : fallbackAnchor
      const anchorIndex = pageEntries.findIndex((page) => page.id === anchorId)
      if (anchorIndex >= 0 && clickedIndex >= 0) {
        const start = Math.min(anchorIndex, clickedIndex)
        const end = Math.max(anchorIndex, clickedIndex)
        state.selectMany(pageEntries.slice(start, end + 1).map((page) => page.id))
        return
      }
    }
    state.select(pageId, event.metaKey || event.ctrlKey)
    selectionAnchor.current = pageId
  }
  const openPageMenu = (event: MouseEvent, pageId: string, pageNumber: number, selected: boolean) => {
    event.preventDefault()
    event.stopPropagation()
    if (!selected) {
      state.select(pageId)
      selectionAnchor.current = pageId
    }
    setPageMenu({
      pageId,
      pageNumber,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 232)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 292))
    })
  }
  const runPageMenuAction = (action: () => void) => {
    action()
    setPageMenu(undefined)
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcutsAvailable = state.hydrated && startupView === 'workspace' && !editorPage && !aboutOpen
      if (shortcutsAvailable && (event.key === 'Meta' || event.metaKey)) setShortcutsOpen(true)
      if (!shortcutsAvailable || isEditableTarget(event.target)) return

      const command = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      if (event.key === 'Escape') {
        if (pageMenu) setPageMenu(undefined)
        else if (state.selected.length) clearSelection()
        setShortcutsOpen(false)
        return
      }
      if (command && key === 'a') {
        event.preventDefault()
        if (event.shiftKey) clearSelection()
        else selectEveryPage()
        return
      }
      if (command && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) state.redo()
        else state.undo()
        return
      }
      if (command && key === 'y') {
        event.preventDefault()
        state.redo()
        return
      }
      if (command && key === 'o') {
        event.preventDefault()
        input.current?.click()
        return
      }
      if (command && key === 's') {
        event.preventDefault()
        if (pageEntries.length && !state.job) void downloadAll()
        return
      }
      if (command && key === 'd') {
        event.preventDefault()
        if (state.selected.length) state.duplicate()
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && state.selected.length) {
        event.preventDefault()
        state.remove()
        selectionAnchor.current = undefined
        return
      }
      if ((event.key === '[' || event.code === 'BracketLeft') && state.selected.length) {
        event.preventDefault()
        state.rotate(-90)
        return
      }
      if ((event.key === ']' || event.code === 'BracketRight') && state.selected.length) {
        event.preventDefault()
        state.rotate(90)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Meta') setShortcutsOpen(false)
    }
    const hideShortcuts = () => setShortcutsOpen(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', hideShortcuts)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', hideShortcuts)
    }
  }, [aboutOpen, allSelected, editorPage, pageEntries, pageMenu, startupView, state])
  const aboutModal = aboutOpen && <div className="app-modal-backdrop" role="presentation" onMouseDown={() => setAboutOpen(false)}>
    <div className="app-modal about-modal" role="dialog" aria-modal="true" aria-label="About Slay PDF" onMouseDown={(event) => event.stopPropagation()}>
      <button className="icon-button app-modal-close" type="button" onClick={() => setAboutOpen(false)} aria-label="Close about"><X size={17} /></button>
      <div className="about-modal-header">
        <div className="brand-mark">S</div>
        <div>
          <h2>Slay PDF</h2>
          <p>Private. Local. Always.</p>
        </div>
      </div>
      <p>Slay PDF is a completely local PDF editor to split, merge, posterise, sign or edit any PDF.</p>
      <p>Super quick and no more random dodgy sites. Enterprise level security (since your data stays with you and is never sent over the internet)</p>
      <p>Your documents and edits stay in this browser. Passwords are never saved.</p>
      <details className="about-license-list">
        <summary>License links</summary>
        <div>
          {licenseLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
      </details>
      <div className="app-modal-actions">
        <a className="button secondary" href="https://github.com/emileakbarzadeh/slay-pdf" target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a>
        <button className="button primary" type="button" onClick={() => setAboutOpen(false)}>Done</button>
      </div>
    </div>
  </div>
  const recentModal = startupView === 'recents' && <div className="app-modal-backdrop recent-modal-backdrop" role="presentation">
    <section className="app-modal recent-modal" role="dialog" aria-modal="true" aria-labelledby="recent-title">
      <div className="recent-heading">
        <History size={24} />
        <div>
          <h2 id="recent-title">Recent PDFs</h2>
          <p>Continue your saved local workspace or start with a clean PDF.</p>
        </div>
      </div>
      <div className="recent-actions">
        <button className="recent-new" type="button" onClick={startFreshWorkspace}>
          <FilePlus2 size={22} />
          <span><strong>New PDF</strong><small>Clear the saved workspace</small></span>
        </button>
        <button className="recent-item" type="button" onClick={() => setStartupView('workspace')}>
          <span className="recent-file-icon">PDF</span>
          <span><strong>{recentName}</strong><small>{pageLabel} · {sourceLabel}</small></span>
          <b>Open</b>
        </button>
        <button className="recent-clear" type="button" onClick={startFreshWorkspace}>Clear recent</button>
      </div>
    </section>
  </div>
  const toolModalElement = toolModal && <div className="app-modal-backdrop" role="presentation" onMouseDown={() => setToolModal(undefined)}>
    {toolModal === 'resize'
      ? <form className="app-modal tool-modal" role="dialog" aria-modal="true" aria-label="Resize selected pages" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); applyResize() }}>
          <button className="icon-button app-modal-close" type="button" onClick={() => setToolModal(undefined)} aria-label="Close resize"><X size={17} /></button>
          <h2><Ruler size={18} /> Resize selected pages</h2>
          <div className="tool-modal-grid">
            <label>Paper size<select value={resizeFormat} onChange={(event) => setResizeFormat(event.target.value as ResizeFormatId)}>
              {paperFormats.map((format) => <option key={format.id} value={format.id}>{format.label}</option>)}
              <option value="custom">Custom</option>
            </select></label>
            {resizeFormat !== 'custom' && <label>Orientation<select value={resizeOrientation} onChange={(event) => setResizeOrientation(event.target.value as Orientation)}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select></label>}
            {resizeFormat === 'custom' && <>
              <label>Width (mm)<input type="number" min="10" max="5000" step="1" value={customResizeWidth} onChange={(event) => setCustomResizeWidth(Math.max(10, Number(event.target.value) || 10))} /></label>
              <label>Height (mm)<input type="number" min="10" max="5000" step="1" value={customResizeHeight} onChange={(event) => setCustomResizeHeight(Math.max(10, Number(event.target.value) || 10))} /></label>
            </>}
          </div>
          <p>{selectedPages.length} selected {selectedPages.length === 1 ? 'page' : 'pages'} · {resizeFormat === 'custom' ? `${customResizeWidth} x ${customResizeHeight} mm · ` : ''}{Math.round(resizeSize.width)} x {Math.round(resizeSize.height)} pt</p>
          <div className="app-modal-actions">
            <button className="button secondary" type="button" onClick={() => setToolModal(undefined)}>Cancel</button>
            <button className="button primary" type="submit" disabled={!selectedPages.length}>Resize</button>
          </div>
        </form>
      : <form className="app-modal tool-modal" role="dialog" aria-modal="true" aria-label="Posterise selected pages" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); applyPosterise() }}>
          <button className="icon-button app-modal-close" type="button" onClick={() => setToolModal(undefined)} aria-label="Close posterise"><X size={17} /></button>
          <h2><Grid2X2 size={18} /> Posterise selected pages</h2>
          <div className="tool-modal-grid">
            <label>Columns<input type="number" min="1" max="6" value={posterColumns} onChange={(event) => setPosterColumns(Math.max(1, Math.min(6, Number(event.target.value) || 1)))} /></label>
            <label>Rows<input type="number" min="1" max="6" value={posterRows} onChange={(event) => setPosterRows(Math.max(1, Math.min(6, Number(event.target.value) || 1)))} /></label>
            <label>Paper size<select value={posterFormat} onChange={(event) => setPosterFormat(event.target.value as PaperFormatId)}>
              {paperFormats.map((format) => <option key={format.id} value={format.id}>{format.label}</option>)}
            </select></label>
            <label>Orientation<select value={posterOrientation} onChange={(event) => setPosterOrientation(event.target.value as Orientation)}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select></label>
          </div>
          <p>{selectedPages.length} selected {selectedPages.length === 1 ? 'page' : 'pages'} · {posterColumns * posterRows} tiles per page · {Math.round(posterSize.width)} x {Math.round(posterSize.height)} pt</p>
          <div className="app-modal-actions">
            <button className="button secondary" type="button" onClick={() => setToolModal(undefined)}>Cancel</button>
            <button className="button primary" type="submit" disabled={!selectedPages.length}>Posterise</button>
          </div>
        </form>}
  </div>

  if (!state.hydrated || startupView === 'loading') return <main className="boot"><div className="brand-mark">S</div><p>Restoring local workspace…</p></main>

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <button className="brand-button" type="button" onClick={() => setAboutOpen(true)} aria-label="About Slay PDF">
          <div className="brand-mark">S</div>
          <div className="brand-copy"><strong>Slay PDF</strong><span><ShieldCheck size={12} /> Private. Local. Always.</span></div>
        </button>
        <button className="button new-pdf-button" type="button" onClick={newPdf}><FilePlus2 size={17} /> <span>New PDF</span></button>
      </div>
      <nav className="top-actions" aria-label="Workspace actions">
        <button className="icon-button mobile-menu" type="button" title="Menu"><Menu size={19} /></button>
        <button className="icon-button" type="button" onClick={state.undo} disabled={!state.history.length} title="Undo"><Undo2 size={18} /></button>
        <button className="icon-button" type="button" onClick={state.redo} disabled={!state.future.length} title="Redo"><Redo2 size={18} /></button>
        <span className="toolbar-divider" />
        <button className="button primary header-download" type="button" onClick={() => void downloadAll()} disabled={!pageEntries.length || Boolean(state.job)} title="Download all pages"><Download size={17} /> <span>Download</span></button>
        <button className="icon-button" type="button" onClick={() => setInspectorOpen((value) => !value)} title={inspectorOpen ? 'Hide inspector' : 'Show inspector'}>
          {inspectorOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
        </button>
      </nav>
      <input ref={input} hidden type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => importFiles(event.target.files)} />
    </header>

    {state.error && <div className="error-banner" role="alert"><span>{state.error}</span><button type="button" onClick={() => state.setError(null)} aria-label="Dismiss"><X size={17} /></button></div>}
    {state.job && <div className="job-bar"><span>{state.job.label}</span><div><i style={{ width: `${state.job.progress * 100}%` }} /></div><b>{Math.round(state.job.progress * 100)}%</b></div>}

    {pageEntries.length > 0 && <div className="toolstrip" role="toolbar" aria-label="Page tools">
      <button type="button" className="select-all" onClick={toggleSelectAll}>{selectAllLabel}</button>
      <button type="button" onClick={() => state.rotate(-90)} disabled={!state.selected.length} title="Rotate left"><RotateCcw size={17} /><span>Left</span></button>
      <button type="button" onClick={() => state.rotate(90)} disabled={!state.selected.length} title="Rotate right"><RotateCw size={17} /><span>Right</span></button>
      <button type="button" onClick={state.duplicate} disabled={!state.selected.length} title="Duplicate"><Copy size={17} /><span>Duplicate</span></button>
      <button type="button" className="danger" onClick={state.remove} disabled={!state.selected.length} title="Delete"><Trash2 size={17} /><span>Delete</span></button>
      <div className="toolstrip-tools">
        <button type="button" className="tools-toggle" aria-haspopup="menu"><Wrench size={17} /><span>Tools</span><ChevronDown size={14} /></button>
        <div className="tools-menu" role="menu" aria-label="Page tools menu">
          <button type="button" role="menuitem" disabled={!selectedPages.length} onClick={() => setToolModal('resize')}><Ruler size={16} /> Resize selected pages</button>
          <button type="button" role="menuitem" disabled={!selectedPages.length} onClick={openPosterise}><Grid2X2 size={16} /> Posterise selected pages</button>
        </div>
      </div>
    </div>}

    <div className={`workspace${inspectorOpen ? '' : ' inspector-closed'}`}>
      <main
        className="canvas-area"
        onDragOver={(event) => event.preventDefault()}
        onDragStartCapture={(event) => { if ((event.target as HTMLElement).closest('.page-tile, .split-marker-tile')) internalDrag.current = true }}
        onDragEndCapture={() => { internalDrag.current = false }}
        onDrop={importDroppedFiles}
        onClick={(event) => { if (event.target === event.currentTarget) clearSelection() }}
      >
        {!pageEntries.length ? <section className="empty-state">
          <button type="button" className="drop-zone" onClick={() => input.current?.click()}>
            <FilePlus2 size={32} />
            <strong>Drop PDFs or images here</strong>
            <span>Merge, arrange, annotate, redact, and export without uploading files.</span>
            <em><Import size={15} /> Choose files</em>
          </button>
          <div className="privacy-line"><ShieldCheck size={15} /> Processing and autosave stay on this device.</div>
        </section> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={state.pages.map((page) => page.id)}>
            <section className="page-grid" aria-label="Document pages" onClick={(event) => { if (event.target === event.currentTarget) clearSelection() }}>
              {state.pages.map((page) => isWorkspacePage(page)
                ? <PageThumbnail
                    key={page.id}
                    page={page}
                    source={state.sources.find((source) => source.id === page.sourceId)}
                    number={pageNumbers.get(page.id) ?? 1}
                    selected={state.selected.includes(page.id)}
                    onSelect={(event) => selectPage(page.id, event)}
                    onOpen={() => setEditorPage(page.id)}
                    onContextMenu={(event) => openPageMenu(event, page.id, pageNumbers.get(page.id) ?? 1, state.selected.includes(page.id))}
                  />
                : <SplitMarkerTile key={page.id} id={page.id} onRemove={() => state.removeSplitMarker(page.id)} />)}
              <div className="add-pages-tile">
                <button type="button" className="add-pages-main" onClick={() => input.current?.click()}><FilePlus2 size={24} /><span>Add pages</span></button>
                <div className="add-pages-actions">
                  <button type="button" className="add-pages-toggle" aria-haspopup="menu"><span>Add…</span><ChevronDown size={15} /></button>
                  <div className="add-pages-menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => input.current?.click()}><Import size={16} /> Add pages</button>
                    <button type="button" role="menuitem" onClick={state.addSplitMarker}><Scissors size={16} /> Split PDF marker</button>
                  </div>
                </div>
              </div>
            </section>
          </SortableContext>
        </DndContext>}
      </main>
      {inspectorOpen && <Inspector mobileExpanded={mobileInspectorExpanded} onToggleMobile={() => setMobileInspectorExpanded((value) => !value)} />}
    </div>

    {pageMenu && <div className="context-menu-layer" onMouseDown={() => setPageMenu(undefined)} onContextMenu={(event) => event.preventDefault()}>
      <div className="page-context-menu" role="menu" aria-label={`Page ${pageMenu.pageNumber} actions`} style={{ left: pageMenu.x, top: pageMenu.y }} onMouseDown={(event) => event.stopPropagation()}>
        <strong>Page {pageMenu.pageNumber}</strong>
        <button type="button" role="menuitem" onClick={() => runPageMenuAction(() => setEditorPage(pageMenu.pageId))}><PencilLine size={16} /> Edit page</button>
        <button type="button" role="menuitem" onClick={() => runPageMenuAction(() => state.select(pageMenu.pageId))}><MousePointer2 size={16} /> Select only this page</button>
        <button type="button" role="menuitem" disabled={!menuPageSelected} onClick={() => runPageMenuAction(() => state.select(pageMenu.pageId, true))}><CheckSquare size={16} /> Deselect page</button>
        <span className="context-menu-separator" />
        <button type="button" role="menuitem" onClick={() => runPageMenuAction(() => state.rotate(-90))}><RotateCcw size={16} /> Rotate left</button>
        <button type="button" role="menuitem" onClick={() => runPageMenuAction(() => state.rotate(90))}><RotateCw size={16} /> Rotate right</button>
        <button type="button" role="menuitem" onClick={() => runPageMenuAction(state.duplicate)}><Copy size={16} /> Duplicate</button>
        <button type="button" role="menuitem" className="danger" onClick={() => runPageMenuAction(state.remove)}><Trash2 size={16} /> Delete</button>
      </div>
    </div>}

    {activePage && activeSource && <PageEditor page={activePage} source={activeSource} onClose={() => setEditorPage(undefined)} />}

    {recentModal}
    {aboutModal}
    {toolModalElement}
    {shortcutsOpen && <aside className="shortcut-helper" aria-label="Keyboard shortcuts">
      <header><strong>Shortcuts</strong><span>Hold Cmd</span></header>
      <dl>
        {shortcutRows.map((row) => <div key={row.keys}><dt>{row.keys}</dt><dd>{row.action}</dd></div>)}
      </dl>
    </aside>}

    {pageEntries.length > 0 && <footer className="statusbar">
      <span>{state.sources.length} {state.sources.length === 1 ? 'file' : 'files'} · {pageEntries.length} pages</span>
    </footer>}
  </div>
}

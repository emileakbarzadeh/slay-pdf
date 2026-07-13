import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { CheckSquare, ChevronDown, Copy, Download, FilePlus2, Grid2X2, Import, Menu, MousePointer2, PanelRightClose, PanelRightOpen, PencilLine, Redo2, RotateCcw, RotateCw, Ruler, ShieldCheck, Trash2, Undo2, Wrench, X } from 'lucide-react'
import { useWorkspace } from './store'
import { isWorkspacePage } from './types'
import type { PageToolModalMode } from './components/PageToolModal'
import './styles.css'

const AboutModal = lazy(async () => ({ default: (await import('./components/AboutModal')).AboutModal }))
const Inspector = lazy(async () => ({ default: (await import('./components/Inspector')).Inspector }))
const PageToolModal = lazy(async () => ({ default: (await import('./components/PageToolModal')).PageToolModal }))
const PageEditor = lazy(async () => ({ default: (await import('./components/PageEditor')).PageEditor }))
const RecentModal = lazy(async () => ({ default: (await import('./components/RecentModal')).RecentModal }))
const WorkspacePageGrid = lazy(async () => ({ default: (await import('./components/WorkspacePageGrid')).WorkspacePageGrid }))

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
  const [toolModal, setToolModal] = useState<PageToolModalMode>()
  const [startupView, setStartupView] = useState<'loading' | 'recents' | 'workspace'>('loading')
  const input = useRef<HTMLInputElement>(null)
  const internalDrag = useRef(false)
  const selectionAnchor = useRef<string | undefined>(undefined)
  const state = useWorkspace()

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
  const activePage = pageEntries.find((page) => page.id === editorPage)
  const activeSource = activePage && state.sources.find((source) => source.id === activePage.sourceId)
  const selectedPages = pageEntries.filter((page) => state.selected.includes(page.id))
  const allSelected = pageEntries.length > 0 && state.selected.length === pageEntries.length
  const menuPageSelected = pageMenu ? state.selected.includes(pageMenu.pageId) : false
  const selectAllLabel = `${allSelected ? 'Deselect all' : 'Select all'}${state.selected.length ? ` (${state.selected.length})` : ''}`
  const recentName = state.settings.filename.replace(/\.pdf$/i, '') || state.settings.metadata.title || 'Untitled PDF'
  const sourceLabel = `${state.sources.length} ${state.sources.length === 1 ? 'file' : 'files'}`
  const pageLabel = `${pageEntries.length} ${pageEntries.length === 1 ? 'page' : 'pages'}`
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
          <button type="button" role="menuitem" disabled={!selectedPages.length} onClick={() => setToolModal('posterise')}><Grid2X2 size={16} /> Posterise selected pages</button>
        </div>
      </div>
    </div>}

    <div className={`workspace${inspectorOpen && pageEntries.length ? '' : ' inspector-closed'}`}>
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
        </section> : <Suspense fallback={null}>
          <WorkspacePageGrid
            pages={state.pages}
            sources={state.sources}
            selected={state.selected}
            onClearSelection={clearSelection}
            onSelectPage={selectPage}
            onOpenPage={setEditorPage}
            onOpenPageMenu={openPageMenu}
            onReorder={state.reorder}
            onRemoveSplitMarker={state.removeSplitMarker}
            onAddPages={() => input.current?.click()}
            onAddSplitMarker={state.addSplitMarker}
          />
        </Suspense>}
      </main>
      {inspectorOpen && pageEntries.length > 0 && <Suspense fallback={null}>
        <Inspector mobileExpanded={mobileInspectorExpanded} onToggleMobile={() => setMobileInspectorExpanded((value) => !value)} />
      </Suspense>}
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

    {activePage && activeSource && <Suspense fallback={null}>
      <PageEditor page={activePage} source={activeSource} onClose={() => setEditorPage(undefined)} />
    </Suspense>}

    {startupView === 'recents' && <Suspense fallback={null}>
      <RecentModal
        recentName={recentName}
        pageLabel={pageLabel}
        sourceLabel={sourceLabel}
        onStartFresh={startFreshWorkspace}
        onOpenWorkspace={() => setStartupView('workspace')}
      />
    </Suspense>}
    {aboutOpen && <Suspense fallback={null}><AboutModal onClose={() => setAboutOpen(false)} /></Suspense>}
    {toolModal && <Suspense fallback={null}><PageToolModal mode={toolModal} selectedPages={selectedPages} onClose={() => setToolModal(undefined)} /></Suspense>}
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

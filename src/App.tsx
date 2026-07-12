import { useEffect, useRef, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CheckSquare, ChevronDown, Copy, Download, FilePlus2, Github, History, Import, Menu, MousePointer2, PanelRightClose, PanelRightOpen, PencilLine, Redo2, RotateCcw, RotateCw, Scissors, ShieldCheck, Trash2, Undo2, X } from 'lucide-react'
import { PageEditor } from './components/PageEditor'
import { PageThumbnail } from './components/PageThumbnail'
import { Inspector } from './components/Inspector'
import { SplitMarkerTile } from './components/SplitMarkerTile'
import { downloadPdfExport } from './lib/pdfDownloads'
import { useWorkspace } from './store'
import { isWorkspacePage } from './types'
import './styles.css'

export default function App() {
  const [editorPage, setEditorPage] = useState<string>()
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [mobileInspectorExpanded, setMobileInspectorExpanded] = useState(false)
  const [pageMenu, setPageMenu] = useState<{ pageId: string; pageNumber: number; x: number; y: number }>()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [startupView, setStartupView] = useState<'loading' | 'recents' | 'workspace'>('loading')
  const input = useRef<HTMLInputElement>(null)
  const internalDrag = useRef(false)
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
  const onDragEnd = ({ active, over }: DragEndEvent) => over && state.reorder(String(active.id), String(over.id))
  const openPageMenu = (event: MouseEvent, pageId: string, pageNumber: number, selected: boolean) => {
    event.preventDefault()
    event.stopPropagation()
    if (!selected) state.select(pageId)
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
  const pageEntries = state.pages.filter(isWorkspacePage)
  const pageNumbers = new Map(pageEntries.map((page, index) => [page.id, index + 1]))
  const activePage = pageEntries.find((page) => page.id === editorPage)
  const activeSource = activePage && state.sources.find((source) => source.id === activePage.sourceId)
  const allSelected = pageEntries.length > 0 && state.selected.length === pageEntries.length
  const menuPageSelected = pageMenu ? state.selected.includes(pageMenu.pageId) : false
  const recentName = state.settings.filename.replace(/\.pdf$/i, '') || state.settings.metadata.title || 'Untitled PDF'
  const sourceLabel = `${state.sources.length} ${state.sources.length === 1 ? 'file' : 'files'}`
  const pageLabel = `${pageEntries.length} ${pageEntries.length === 1 ? 'page' : 'pages'}`
  const aboutModal = aboutOpen && <div className="app-modal-backdrop" role="presentation" onMouseDown={() => setAboutOpen(false)}>
    <div className="app-modal about-modal" role="dialog" aria-modal="true" aria-label="About Local PDF" onMouseDown={(event) => event.stopPropagation()}>
      <button className="icon-button app-modal-close" type="button" onClick={() => setAboutOpen(false)} aria-label="Close about"><X size={17} /></button>
      <div className="about-modal-header">
        <div className="brand-mark">L</div>
        <div>
          <h2>Local PDF</h2>
          <p>Private. Local. Always.</p>
        </div>
      </div>
      <p>Local PDF is a browser-based workspace for everyday PDF edits: merge files, reorder pages, split documents, export images or text, and make page-level annotations without sending files to a server.</p>
      <p>Your documents and edits stay in this browser. Passwords are never saved.</p>
      <div className="app-modal-actions">
        <a className="button secondary" href="https://github.com/emile/local-pdf" target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a>
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

  if (!state.hydrated || startupView === 'loading') return <main className="boot"><div className="brand-mark">L</div><p>Restoring local workspace…</p></main>

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <button className="brand-button" type="button" onClick={() => setAboutOpen(true)} aria-label="About Local PDF">
          <div className="brand-mark">L</div>
          <div className="brand-copy"><strong>Local PDF</strong><span><ShieldCheck size={12} /> Private. Local. Always.</span></div>
        </button>
        <button className="button new-pdf-button" type="button" onClick={newPdf}><FilePlus2 size={17} /> <span>New PDF</span></button>
      </div>
      <nav className="top-actions" aria-label="Workspace actions">
        <button className="icon-button mobile-menu" type="button" title="Menu"><Menu size={19} /></button>
        <button className="icon-button" type="button" onClick={state.undo} disabled={!state.history.length} title="Undo"><Undo2 size={18} /></button>
        <button className="icon-button" type="button" onClick={state.redo} disabled={!state.future.length} title="Redo"><Redo2 size={18} /></button>
        <span className="toolbar-divider" />
        <button className="button primary header-download" type="button" onClick={() => void downloadAll()} disabled={!pageEntries.length || Boolean(state.job)} title="Download all pages"><Download size={17} /> <span>Download</span></button>
        <button className="button" type="button" onClick={() => input.current?.click()}><Import size={17} /> <span>Import</span></button>
        <button className="icon-button" type="button" onClick={() => setInspectorOpen((value) => !value)} title={inspectorOpen ? 'Hide inspector' : 'Show inspector'}>
          {inspectorOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
        </button>
      </nav>
      <input ref={input} hidden type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => importFiles(event.target.files)} />
    </header>

    {state.error && <div className="error-banner" role="alert"><span>{state.error}</span><button type="button" onClick={() => state.setError(null)} aria-label="Dismiss"><X size={17} /></button></div>}
    {state.job && <div className="job-bar"><span>{state.job.label}</span><div><i style={{ width: `${state.job.progress * 100}%` }} /></div><b>{Math.round(state.job.progress * 100)}%</b></div>}

    {pageEntries.length > 0 && <div className="toolstrip" role="toolbar" aria-label="Page tools">
      <span>{state.selected.length ? `${state.selected.length} selected` : `${pageEntries.length} pages`}</span>
      <button type="button" onClick={() => state.rotate(-90)} disabled={!state.selected.length} title="Rotate left"><RotateCcw size={17} /><span>Left</span></button>
      <button type="button" onClick={() => state.rotate(90)} disabled={!state.selected.length} title="Rotate right"><RotateCw size={17} /><span>Right</span></button>
      <button type="button" onClick={state.duplicate} disabled={!state.selected.length} title="Duplicate"><Copy size={17} /><span>Duplicate</span></button>
      <button type="button" className="danger" onClick={state.remove} disabled={!state.selected.length} title="Delete"><Trash2 size={17} /><span>Delete</span></button>
      <button type="button" className="select-all" onClick={allSelected ? state.selectNone : state.selectAll}>{allSelected ? 'Deselect all' : 'Select all'}</button>
    </div>}

    <div className={`workspace${inspectorOpen ? '' : ' inspector-closed'}`}>
      <main
        className="canvas-area"
        onDragOver={(event) => event.preventDefault()}
        onDragStartCapture={(event) => { if ((event.target as HTMLElement).closest('.page-tile, .split-marker-tile')) internalDrag.current = true }}
        onDragEndCapture={() => { internalDrag.current = false }}
        onDrop={importDroppedFiles}
        onClick={(event) => { if (event.target === event.currentTarget) state.selectNone() }}
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
            <section className="page-grid" aria-label="Document pages" onClick={(event) => { if (event.target === event.currentTarget) state.selectNone() }}>
              {state.pages.map((page) => isWorkspacePage(page)
                ? <PageThumbnail
                    key={page.id}
                    page={page}
                    source={state.sources.find((source) => source.id === page.sourceId)}
                    number={pageNumbers.get(page.id) ?? 1}
                    selected={state.selected.includes(page.id)}
                    onSelect={(additive) => state.select(page.id, additive)}
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

    {pageEntries.length > 0 && <footer className="statusbar">
      <span>{state.sources.length} {state.sources.length === 1 ? 'file' : 'files'} · {pageEntries.length} pages</span>
    </footer>}
  </div>
}

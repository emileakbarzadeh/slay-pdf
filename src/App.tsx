import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Copy, Download, FilePlus2, Import, Menu, PanelRightClose, PanelRightOpen, Redo2, RotateCcw, RotateCw, ShieldCheck, Trash2, Undo2, X } from 'lucide-react'
import { PageEditor } from './components/PageEditor'
import { PageThumbnail } from './components/PageThumbnail'
import { Inspector } from './components/Inspector'
import { buildPdf, downloadBlob } from './lib/export'
import { processPdf } from './lib/processing'
import { useWorkspace } from './store'
import './styles.css'

export default function App() {
  const [editorPage, setEditorPage] = useState<string>()
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const input = useRef<HTMLInputElement>(null)
  const internalDrag = useRef(false)
  const state = useWorkspace()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { void state.hydrate() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (state.pages.length && state.job) event.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [state.job, state.pages.length])

  const importFiles = (files: FileList | null) => {
    if (files?.length) void state.importFiles(Array.from(files))
    if (input.current) input.current.value = ''
  }
  const newPdf = () => {
    if (!state.pages.length || window.confirm('Clear all imported files and saved edits?')) void state.reset()
  }
  const downloadAll = async () => {
    state.setError(null)
    state.setJob({ label: 'Building PDF', progress: 0 })
    try {
      const composed = await buildPdf(state.pages, state.sources, state.settings, (progress) => state.setJob({ label: 'Building PDF', progress }))
      const processed = await processPdf(composed, { compression: state.settings.compression }, (progress, label) => state.setJob({ label, progress }))
      downloadBlob(processed, state.settings.filename || 'local-pdf.pdf')
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
  const activePage = state.pages.find((page) => page.id === editorPage)
  const activeSource = activePage && state.sources.find((source) => source.id === activePage.sourceId)

  if (!state.hydrated) return <main className="boot"><div className="brand-mark">L</div><p>Restoring local workspace…</p></main>

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">L</div>
        <div><strong>Local PDF</strong><span><ShieldCheck size={12} /> Private. Local. Always.</span></div>
        <button className="button new-pdf-button" type="button" onClick={newPdf}><FilePlus2 size={17} /> <span>New PDF</span></button>
      </div>
      <nav className="top-actions" aria-label="Workspace actions">
        <button className="icon-button mobile-menu" type="button" title="Menu"><Menu size={19} /></button>
        <button className="icon-button" type="button" onClick={state.undo} disabled={!state.history.length} title="Undo"><Undo2 size={18} /></button>
        <button className="icon-button" type="button" onClick={state.redo} disabled={!state.future.length} title="Redo"><Redo2 size={18} /></button>
        <span className="toolbar-divider" />
        <button className="button primary header-download" type="button" onClick={() => void downloadAll()} disabled={!state.pages.length || Boolean(state.job)} title="Download all pages"><Download size={17} /> <span>Download</span></button>
        <button className="button" type="button" onClick={() => input.current?.click()}><Import size={17} /> <span>Import</span></button>
        <button className="icon-button" type="button" onClick={() => setInspectorOpen((value) => !value)} title={inspectorOpen ? 'Hide inspector' : 'Show inspector'}>
          {inspectorOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
        </button>
      </nav>
      <input ref={input} hidden type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => importFiles(event.target.files)} />
    </header>

    {state.error && <div className="error-banner" role="alert"><span>{state.error}</span><button type="button" onClick={() => state.setError(null)} aria-label="Dismiss"><X size={17} /></button></div>}
    {state.job && <div className="job-bar"><span>{state.job.label}</span><div><i style={{ width: `${state.job.progress * 100}%` }} /></div><b>{Math.round(state.job.progress * 100)}%</b></div>}

    {state.pages.length > 0 && <div className="toolstrip" role="toolbar" aria-label="Page tools">
      <span>{state.selected.length ? `${state.selected.length} selected` : `${state.pages.length} pages`}</span>
      <button type="button" onClick={() => state.rotate(-90)} disabled={!state.selected.length} title="Rotate left"><RotateCcw size={17} /><span>Left</span></button>
      <button type="button" onClick={() => state.rotate(90)} disabled={!state.selected.length} title="Rotate right"><RotateCw size={17} /><span>Right</span></button>
      <button type="button" onClick={state.duplicate} disabled={!state.selected.length} title="Duplicate"><Copy size={17} /><span>Duplicate</span></button>
      <button type="button" className="danger" onClick={state.remove} disabled={!state.selected.length} title="Delete"><Trash2 size={17} /><span>Delete</span></button>
      <button type="button" className="select-all" onClick={state.selectAll}>Select all</button>
    </div>}

    <div className={`workspace${inspectorOpen ? '' : ' inspector-closed'}`}>
      <main
        className="canvas-area"
        onDragOver={(event) => event.preventDefault()}
        onDragStartCapture={(event) => { if ((event.target as HTMLElement).closest('.page-tile')) internalDrag.current = true }}
        onDragEndCapture={() => { internalDrag.current = false }}
        onDrop={importDroppedFiles}
        onClick={(event) => { if (event.target === event.currentTarget) state.selectNone() }}
      >
        {!state.pages.length ? <section className="empty-state">
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
              {state.pages.map((page, index) => <PageThumbnail
                key={page.id}
                page={page}
                source={state.sources.find((source) => source.id === page.sourceId)}
                number={index + 1}
                selected={state.selected.includes(page.id)}
                onSelect={(additive) => state.select(page.id, additive)}
                onOpen={() => setEditorPage(page.id)}
              />)}
              <button type="button" className="add-pages-tile" onClick={() => input.current?.click()}><FilePlus2 size={24} /><span>Add pages</span></button>
            </section>
          </SortableContext>
        </DndContext>}
      </main>
      {inspectorOpen && <Inspector />}
    </div>

    {activePage && activeSource && <PageEditor page={activePage} source={activeSource} onClose={() => setEditorPage(undefined)} />}

    {state.pages.length > 0 && <footer className="statusbar">
      <span>{state.sources.length} {state.sources.length === 1 ? 'file' : 'files'} · {state.pages.length} pages</span>
      <button type="button" onClick={newPdf}>New workspace</button>
    </footer>}
  </div>
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Highlighter, MousePointer2, PenLine, RectangleHorizontal, Redo2, Save, Signature, Square, Trash2, Type, Undo2, X } from 'lucide-react'
import { renderPage, uid } from '../lib/pdf'
import { useWorkspace } from '../store'
import type { PageOverlay, Point, SourceDocument, WorkspacePage } from '../types'

type Tool = 'select' | 'text' | 'highlight' | 'rectangle' | 'redact' | 'ink' | 'signature'
type Props = { page: WorkspacePage; source: SourceDocument; onClose: () => void }

function OverlayView({ overlay }: { overlay: PageOverlay }) {
  if (overlay.type === 'ink') {
    const points = overlay.points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')
    return <svg className="overlay-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={overlay.color} strokeWidth={overlay.lineWidth / 3} vectorEffect="non-scaling-stroke" /></svg>
  }
  const style = { left: `${overlay.x * 100}%`, top: `${overlay.y * 100}%`, width: `${overlay.width * 100}%`, height: `${overlay.height * 100}%` }
  if (overlay.type === 'text') return <div className="overlay overlay-text" style={{ ...style, color: overlay.color, fontSize: overlay.fontSize }}>{overlay.text}</div>
  if (overlay.type === 'signature') return <div className="overlay overlay-signature" style={style}>{overlay.text}</div>
  if (overlay.type === 'redact') return <div className="overlay overlay-redact" style={style} />
  if (overlay.type === 'highlight') return <div className="overlay" style={{ ...style, background: overlay.color, opacity: overlay.opacity }} />
  return <div className="overlay" style={{ ...style, border: `${overlay.lineWidth}px solid ${overlay.color}` }} />
}

export function PageEditor({ page, source, onClose }: Props) {
  const [preview, setPreview] = useState<string>()
  const [tool, setTool] = useState<Tool>('select')
  const [draftStart, setDraftStart] = useState<Point>()
  const [inkPoints, setInkPoints] = useState<Point[]>([])
  const canvas = useRef<HTMLDivElement>(null)
  const addOverlay = useWorkspace((state) => state.addOverlay)
  const removeOverlay = useWorkspace((state) => state.removeOverlay)
  const undo = useWorkspace((state) => state.undo)
  const redo = useWorkspace((state) => state.redo)
  const history = useWorkspace((state) => state.history)
  const future = useWorkspace((state) => state.future)
  const currentPage = useWorkspace((state) => state.pages.find((item) => item.id === page.id) ?? page)
  const editorAspect = `${currentPage.width} / ${currentPage.height}`

  useEffect(() => { void renderPage(source, page.sourcePageIndex, 1.35).then(setPreview) }, [page.sourcePageIndex, source])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pointFromEvent = (event: React.PointerEvent) => {
    const bounds = canvas.current!.getBoundingClientRect()
    return { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) }
  }

  const start = (event: React.PointerEvent) => {
    if (tool === 'select') return
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = pointFromEvent(event)
    setDraftStart(point)
    if (tool === 'ink') setInkPoints([point])
  }

  const move = (event: React.PointerEvent) => {
    if (tool === 'ink' && draftStart) setInkPoints((points) => [...points, pointFromEvent(event)])
  }

  const end = (event: React.PointerEvent) => {
    if (!draftStart || tool === 'select') return
    const endPoint = pointFromEvent(event)
    const x = Math.min(draftStart.x, endPoint.x)
    const y = Math.min(draftStart.y, endPoint.y)
    const width = Math.max(0.03, Math.abs(endPoint.x - draftStart.x))
    const height = Math.max(0.025, Math.abs(endPoint.y - draftStart.y))
    let overlay: PageOverlay | undefined
    if (tool === 'ink' && inkPoints.length > 1) overlay = { id: uid('overlay'), type: 'ink', points: inkPoints, color: '#1b5d78', lineWidth: 2.5 }
    if (tool === 'text') {
      const text = window.prompt('Text to add')?.trim()
      if (text) overlay = { id: uid('overlay'), type: 'text', x, y, width, height, text, color: '#161918', fontSize: 15 }
    }
    if (tool === 'signature') {
      const text = window.prompt('Name for visual signature')?.trim()
      if (text) overlay = { id: uid('overlay'), type: 'signature', x, y, width, height, text }
    }
    if (tool === 'highlight') overlay = { id: uid('overlay'), type: 'highlight', x, y, width, height, color: '#f3d450', opacity: 0.42 }
    if (tool === 'rectangle') overlay = { id: uid('overlay'), type: 'rectangle', x, y, width, height, color: '#c43d31', lineWidth: 2 }
    if (tool === 'redact') overlay = { id: uid('overlay'), type: 'redact', x, y, width, height }
    if (overlay) addOverlay(page.id, overlay)
    setDraftStart(undefined)
    setInkPoints([])
  }

  const tools = useMemo(() => [
    { id: 'select' as const, label: 'Select', icon: MousePointer2 },
    { id: 'text' as const, label: 'Text', icon: Type },
    { id: 'highlight' as const, label: 'Highlight', icon: Highlighter },
    { id: 'rectangle' as const, label: 'Shape', icon: Square },
    { id: 'ink' as const, label: 'Draw', icon: PenLine },
    { id: 'redact' as const, label: 'Redact', icon: RectangleHorizontal },
    { id: 'signature' as const, label: 'Sign', icon: Signature }
  ], [])

  return (
    <div className="editor-backdrop" role="dialog" aria-modal="true" aria-label="Page editor">
      <header className="editor-header">
        <strong>Edit page</strong>
        <div className="editor-tools" role="toolbar" aria-label="Annotation tools">
          {tools.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={tool === id ? 'active' : ''} onClick={() => setTool(id)} title={label}><Icon size={17} /><span>{label}</span></button>)}
        </div>
        <div className="editor-actions">
          <button className="icon-button" type="button" onClick={undo} disabled={!history.length} title="Undo"><Undo2 size={18} /></button>
          <button className="icon-button" type="button" onClick={redo} disabled={!future.length} title="Redo"><Redo2 size={18} /></button>
          <button className="button primary" type="button" onClick={onClose}><Save size={16} /> Done</button>
          <button className="icon-button" type="button" onClick={onClose} title="Close"><X size={20} /></button>
        </div>
      </header>
      <main className={`editor-stage tool-${tool}`}>
        <div ref={canvas} className="editor-page" style={{ aspectRatio: editorAspect }} onPointerDown={start} onPointerMove={move} onPointerUp={end}>
          {preview ? <img src={preview} alt="Page being edited" /> : <span className="editor-loading">Rendering page…</span>}
          {currentPage.overlays.map((overlay) => (
            <button key={overlay.id} type="button" className="overlay-button" title="Select edit" onClick={(event) => {
              event.stopPropagation()
              if (tool === 'select' && window.confirm('Remove this edit?')) removeOverlay(page.id, overlay.id)
            }}><OverlayView overlay={overlay} /></button>
          ))}
          {tool === 'ink' && inkPoints.length > 1 && <OverlayView overlay={{ id: 'draft', type: 'ink', points: inkPoints, color: '#1b5d78', lineWidth: 2.5 }} />}
        </div>
      </main>
      <footer className="editor-footer"><Trash2 size={14} /> Choose an edit with the pointer tool to remove it. Redacted pages are securely flattened during export.</footer>
    </div>
  )
}

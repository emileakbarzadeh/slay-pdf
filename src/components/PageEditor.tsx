import { useEffect, useMemo, useRef, useState } from 'react'
import { Highlighter, Maximize2, MousePointer2, PenLine, RectangleHorizontal, Redo2, Save, Signature, Square, Trash2, Type, Undo2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { renderWorkspacePage, uid } from '../lib/pdf'
import { useWorkspace } from '../store'
import { isWorkspacePage, isWorkspacePageResized, originalPageSize, type PageOverlay, type Point, type SourceDocument, type WorkspacePage } from '../types'

type Tool = 'select' | 'text' | 'highlight' | 'rectangle' | 'redact' | 'ink' | 'signature'
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'
type Rect = { x: number; y: number; width: number; height: number }
type Props = { page: WorkspacePage; source: SourceDocument; onClose: () => void }
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const BASE_RENDER_SCALE = 2.4
const EDITOR_RENDER_QUALITY = 0.92

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function rectFromPoints(points: Point[]): Rect {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  const width = Math.max(0.025, Math.max(...xs) - x)
  const height = Math.max(0.025, Math.max(...ys) - y)
  return { x, y, width, height }
}

function overlayRect(overlay: PageOverlay): Rect {
  if (overlay.type === 'ink') {
    const bounds = rectFromPoints(overlay.points)
    const pad = 0.012
    const x = clamp(bounds.x - pad, 0, 1)
    const y = clamp(bounds.y - pad, 0, 1)
    return {
      x,
      y,
      width: clamp(bounds.width + pad * 2, 0.035, 1 - x),
      height: clamp(bounds.height + pad * 2, 0.03, 1 - y)
    }
  }
  return { x: overlay.x, y: overlay.y, width: overlay.width, height: overlay.height }
}

function normalizeRect(rect: Rect): Rect {
  const width = clamp(rect.width, 0.03, 1)
  const height = clamp(rect.height, 0.025, 1)
  return {
    x: clamp(rect.x, 0, 1 - width),
    y: clamp(rect.y, 0, 1 - height),
    width,
    height
  }
}

function resizeRect(rect: Rect, handle: ResizeHandle, delta: Point): Rect {
  if (handle === 'se') return normalizeRect({ ...rect, width: rect.width + delta.x, height: rect.height + delta.y })
  if (handle === 'sw') return normalizeRect({ x: rect.x + delta.x, y: rect.y, width: rect.width - delta.x, height: rect.height + delta.y })
  if (handle === 'ne') return normalizeRect({ x: rect.x, y: rect.y + delta.y, width: rect.width + delta.x, height: rect.height - delta.y })
  return normalizeRect({ x: rect.x + delta.x, y: rect.y + delta.y, width: rect.width - delta.x, height: rect.height - delta.y })
}

function overlayWithRect(overlay: PageOverlay, rect: Rect): PageOverlay {
  const next = normalizeRect(rect)
  if (overlay.type !== 'ink') return { ...overlay, ...next }
  const original = overlayRect(overlay)
  const points = overlay.points.map((point) => ({
    x: next.x + ((point.x - original.x) / original.width) * next.width,
    y: next.y + ((point.y - original.y) / original.height) * next.height
  }))
  return { ...overlay, points }
}

function OverlayView({ overlay, zoom }: { overlay: PageOverlay; zoom: number }) {
  if (overlay.type === 'ink') {
    const points = overlay.points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')
    return <svg className="overlay-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={overlay.color} strokeWidth={overlay.lineWidth / 3} /></svg>
  }
  const style = { left: `${overlay.x * 100}%`, top: `${overlay.y * 100}%`, width: `${overlay.width * 100}%`, height: `${overlay.height * 100}%` }
  if (overlay.type === 'text') return <div className="overlay overlay-text" style={{ ...style, color: overlay.color, fontSize: overlay.fontSize * zoom }}>{overlay.text}</div>
  if (overlay.type === 'signature') return <div className="overlay overlay-signature" style={{ ...style, fontSize: 26 * zoom }}>{overlay.text}</div>
  if (overlay.type === 'redact') return <div className="overlay overlay-redact" style={style} />
  if (overlay.type === 'highlight') return <div className="overlay" style={{ ...style, background: overlay.color, opacity: overlay.opacity }} />
  return <div className="overlay" style={{ ...style, border: `${overlay.lineWidth * zoom}px solid ${overlay.color}` }} />
}

export function PageEditor({ page, source, onClose }: Props) {
  const [preview, setPreview] = useState<string>()
  const [rendering, setRendering] = useState(false)
  const [tool, setTool] = useState<Tool>('select')
  const [zoom, setZoom] = useState(1)
  const [color, setColor] = useState('#EF476F')
  const [textSize, setTextSize] = useState(16)
  const [lineWidth, setLineWidth] = useState(2.5)
  const [highlightOpacity, setHighlightOpacity] = useState(0.42)
  const [draftStart, setDraftStart] = useState<Point>()
  const [inkPoints, setInkPoints] = useState<Point[]>([])
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>()
  const [textModal, setTextModal] = useState<{ tool: 'text' | 'signature'; rect: Rect; value: string }>()
  const [deleteOverlayId, setDeleteOverlayId] = useState<string>()
  const [interaction, setInteraction] = useState<{ id: string; mode: 'move' | 'resize'; handle?: ResizeHandle; start: Point; original: PageOverlay; live: PageOverlay }>()
  const interactionRef = useRef<typeof interaction>(undefined)
  const touchPointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ distance: number; zoom: number } | undefined>(undefined)
  const canvas = useRef<HTMLDivElement>(null)
  const addOverlay = useWorkspace((state) => state.addOverlay)
  const updateOverlay = useWorkspace((state) => state.updateOverlay)
  const removeOverlay = useWorkspace((state) => state.removeOverlay)
  const undo = useWorkspace((state) => state.undo)
  const redo = useWorkspace((state) => state.redo)
  const history = useWorkspace((state) => state.history)
  const future = useWorkspace((state) => state.future)
  const currentPage = useWorkspace((state) => state.pages.find((item): item is WorkspacePage => isWorkspacePage(item) && item.id === page.id) ?? page)
  const editorAspect = `${currentPage.width} / ${currentPage.height}`
  const basePageWidth = typeof window === 'undefined' ? 760 : Math.min(760, Math.max(320, window.innerWidth - 28))
  const pageWidth = Math.round(basePageWidth * zoom)
  const renderScale = Math.min(6, Math.max(BASE_RENDER_SCALE, zoom * 2.8))
  const selectedOverlay = currentPage.overlays.find((overlay) => overlay.id === selectedOverlayId)
  const deleteOverlay = currentPage.overlays.find((overlay) => overlay.id === deleteOverlayId)
  const resized = isWorkspacePageResized(currentPage)
  const originalSize = originalPageSize(currentPage)

  useEffect(() => {
    let active = true
    setRendering(true)
    void renderWorkspacePage(currentPage, source, renderScale, EDITOR_RENDER_QUALITY).then((value) => {
      if (active) setPreview(value)
    }).finally(() => {
      if (active) setRendering(false)
    })
    return () => { active = false }
  }, [currentPage, renderScale, source])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (textModal || deleteOverlayId) return
      if (event.key === 'Escape') {
        if (selectedOverlayId) setSelectedOverlayId(undefined)
        else onClose()
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '=') {
        event.preventDefault()
        setZoom((value) => clamp(value + 0.25, MIN_ZOOM, MAX_ZOOM))
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault()
        setZoom((value) => clamp(value - 0.25, MIN_ZOOM, MAX_ZOOM))
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedOverlayId) {
        event.preventDefault()
        setDeleteOverlayId(selectedOverlayId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteOverlayId, onClose, selectedOverlayId, textModal])

  const pointFromEvent = (event: { clientX: number; clientY: number }) => {
    const bounds = canvas.current!.getBoundingClientRect()
    return { x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1), y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1) }
  }

  useEffect(() => {
    if (!interaction) return
    interactionRef.current = interaction
    const move = (event: globalThis.PointerEvent) => {
      const point = pointFromEvent(event)
      const delta = { x: point.x - interaction.start.x, y: point.y - interaction.start.y }
      const originalRect = overlayRect(interaction.original)
      const rect = interaction.mode === 'move'
        ? normalizeRect({ ...originalRect, x: originalRect.x + delta.x, y: originalRect.y + delta.y })
        : resizeRect(originalRect, interaction.handle ?? 'se', delta)
      const next = { ...interaction, live: overlayWithRect(interaction.original, rect) }
      interactionRef.current = next
      setInteraction(next)
    }
    const up = () => {
      const finalInteraction = interactionRef.current ?? interaction
      updateOverlay(page.id, finalInteraction.id, finalInteraction.live)
      interactionRef.current = undefined
      setInteraction(undefined)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [interaction, page.id, updateOverlay])

  const start = (event: React.PointerEvent) => {
    if (pinchStart.current) return
    if (tool === 'select' || (event.target as HTMLElement).closest('.overlay-frame')) return
    const point = pointFromEvent(event)
    setSelectedOverlayId(undefined)
    setDraftStart(point)
    event.currentTarget.setPointerCapture(event.pointerId)
    if (tool === 'ink') setInkPoints([point])
  }

  const move = (event: React.PointerEvent) => {
    if (tool === 'ink' && draftStart) setInkPoints((points) => [...points, pointFromEvent(event)])
  }

  const end = (event: React.PointerEvent) => {
    if (!draftStart || tool === 'select') return
    const endPoint = pointFromEvent(event)
    const rect = normalizeRect({
      x: Math.min(draftStart.x, endPoint.x),
      y: Math.min(draftStart.y, endPoint.y),
      width: Math.abs(endPoint.x - draftStart.x),
      height: Math.abs(endPoint.y - draftStart.y)
    })
    let overlay: PageOverlay | undefined
    if (tool === 'ink' && inkPoints.length > 1) overlay = { id: uid('overlay'), type: 'ink', points: inkPoints, color, lineWidth }
    if (tool === 'text') setTextModal({ tool: 'text', rect, value: '' })
    if (tool === 'signature') setTextModal({ tool: 'signature', rect, value: '' })
    if (tool === 'highlight') overlay = { id: uid('overlay'), type: 'highlight', ...rect, color, opacity: highlightOpacity }
    if (tool === 'rectangle') overlay = { id: uid('overlay'), type: 'rectangle', ...rect, color, lineWidth }
    if (tool === 'redact') overlay = { id: uid('overlay'), type: 'redact', ...rect }
    if (overlay) {
      addOverlay(page.id, overlay)
      setSelectedOverlayId(overlay.id)
    }
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

  const changeZoom = (delta: number) => setZoom((value) => clamp(Number((value + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM))
  const scaleZoom = (scale: number) => setZoom((value) => clamp(Number((value * scale).toFixed(2)), MIN_ZOOM, MAX_ZOOM))
  const fitPage = () => setZoom(1)
  const selectTool = (nextTool: Tool) => {
    setTool(nextTool)
    if (nextTool === 'text') setColor('#24181d')
    if (nextTool === 'highlight') setColor('#f3d450')
    if (nextTool === 'rectangle') setColor('#EF476F')
    if (nextTool === 'ink') setColor('#EF476F')
  }
  const activeTool = tools.find((item) => item.id === tool)
  const submitTextModal = () => {
    if (!textModal?.value.trim()) return
    const overlay: PageOverlay = textModal.tool === 'text'
      ? { id: uid('overlay'), type: 'text', ...textModal.rect, text: textModal.value.trim(), color, fontSize: textSize }
      : { id: uid('overlay'), type: 'signature', ...textModal.rect, text: textModal.value.trim() }
    addOverlay(page.id, overlay)
    setSelectedOverlayId(overlay.id)
    setTextModal(undefined)
  }
  const confirmDelete = () => {
    if (!deleteOverlayId) return
    removeOverlay(page.id, deleteOverlayId)
    setSelectedOverlayId((value) => value === deleteOverlayId ? undefined : value)
    setDeleteOverlayId(undefined)
  }
  const pinchDistance = () => {
    const points = [...touchPointers.current.values()]
    if (points.length < 2) return 0
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
  }
  const onGesturePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== 'touch') return
    touchPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (touchPointers.current.size >= 2) {
      event.preventDefault()
      event.stopPropagation()
      setDraftStart(undefined)
      setInkPoints([])
      pinchStart.current = { distance: pinchDistance(), zoom }
    }
  }
  const onGesturePointerMove = (event: React.PointerEvent) => {
    if (event.pointerType !== 'touch' || !touchPointers.current.has(event.pointerId)) return
    touchPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pinchStart.current && touchPointers.current.size >= 2) {
      event.preventDefault()
      event.stopPropagation()
      const distance = pinchDistance()
      if (distance > 0 && pinchStart.current.distance > 0) setZoom(clamp(Number((pinchStart.current.zoom * (distance / pinchStart.current.distance)).toFixed(2)), MIN_ZOOM, MAX_ZOOM))
    }
  }
  const onGesturePointerEnd = (event: React.PointerEvent) => {
    if (event.pointerType !== 'touch') return
    touchPointers.current.delete(event.pointerId)
    if (touchPointers.current.size < 2) pinchStart.current = undefined
  }
  const onWheelZoom = (event: React.WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    scaleZoom(Math.exp(-event.deltaY / 360))
  }

  return (
    <div className="editor-backdrop" role="dialog" aria-modal="true" aria-label="Page editor">
      <header className="editor-header">
        <div className="editor-title">
          <strong>Edit page {resized && <span className="editor-resize-badge">Resized</span>}</strong>
          <span>{Math.round(currentPage.width)} x {Math.round(currentPage.height)} pt</span>
          {resized && <small>Original {Math.round(originalSize.width)} x {Math.round(originalSize.height)} pt</small>}
        </div>
        <div className="editor-zoom-bar" role="toolbar" aria-label="Zoom controls">
          <button className="icon-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= MIN_ZOOM} title="Zoom out"><ZoomOut size={18} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="icon-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= MAX_ZOOM} title="Zoom in"><ZoomIn size={18} /></button>
          <button className="button secondary" type="button" onClick={fitPage} title="Fit page"><Maximize2 size={16} /> Fit</button>
        </div>
        <div className="editor-actions">
          <button className="icon-button" type="button" onClick={undo} disabled={!history.length} title="Undo"><Undo2 size={18} /></button>
          <button className="icon-button" type="button" onClick={redo} disabled={!future.length} title="Redo"><Redo2 size={18} /></button>
          <button className="button primary" type="button" onClick={onClose}><Save size={16} /> Done</button>
          <button className="icon-button" type="button" onClick={onClose} title="Close"><X size={20} /></button>
        </div>
      </header>
      <div className="editor-workbench">
        <aside className="editor-tool-rail" aria-label="Annotation tools">
          {tools.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={tool === id ? 'active' : ''} onClick={() => selectTool(id)} title={label} aria-label={label}><Icon size={18} /><span>{label}</span></button>)}
        </aside>
        <main
          className={`editor-stage tool-${tool}`}
          onWheel={onWheelZoom}
          onPointerDownCapture={onGesturePointerDown}
          onPointerMoveCapture={onGesturePointerMove}
          onPointerUpCapture={onGesturePointerEnd}
          onPointerCancelCapture={onGesturePointerEnd}
        >
          <div className="editor-page-wrap">
            <div ref={canvas} className="editor-page" style={{ aspectRatio: editorAspect, width: pageWidth }} onPointerDown={start} onPointerMove={move} onPointerUp={end} onClick={() => tool === 'select' && setSelectedOverlayId(undefined)}>
              {preview ? <img src={preview} alt="Page being edited" /> : <span className="editor-loading">Rendering page...</span>}
              {rendering && preview && <span className="editor-rendering">Sharpening...</span>}
              {currentPage.overlays.map((overlay) => <OverlayView key={overlay.id} overlay={interaction?.id === overlay.id ? interaction.live : overlay} zoom={zoom} />)}
              {currentPage.overlays.map((overlay) => {
                const active = interaction?.id === overlay.id ? interaction.live : overlay
                const rect = overlayRect(active)
                const selected = selectedOverlayId === overlay.id
                return (
                  <div
                    key={`${overlay.id}-frame`}
                    className={`overlay-frame${selected ? ' selected' : ''}`}
                    data-testid="overlay-frame"
                    style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.width * 100}%`, height: `${rect.height * 100}%` }}
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedOverlayId(overlay.id)
                    }}
                    onPointerDown={(event) => {
                      if (tool !== 'select') return
                      event.stopPropagation()
                      setSelectedOverlayId(overlay.id)
                      setInteraction({ id: overlay.id, mode: 'move', start: pointFromEvent(event), original: overlay, live: overlay })
                    }}
                  >
                    {selected && (['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        className={`resize-handle ${handle}`}
                        data-testid={`resize-${handle}`}
                        aria-label={`Resize ${handle}`}
                        onPointerDown={(event) => {
                          event.stopPropagation()
                          setInteraction({ id: overlay.id, mode: 'resize', handle, start: pointFromEvent(event), original: overlay, live: overlay })
                        }}
                      />
                    ))}
                  </div>
                )
              })}
              {tool === 'ink' && inkPoints.length > 1 && <OverlayView overlay={{ id: 'draft', type: 'ink', points: inkPoints, color, lineWidth }} zoom={zoom} />}
            </div>
          </div>
        </main>
        <aside className="editor-side-panel">
          <section>
            <h3>{selectedOverlay ? `Selected ${selectedOverlay.type}` : activeTool?.label}</h3>
            {selectedOverlay && <button className="button secondary wide" type="button" onClick={() => setDeleteOverlayId(selectedOverlay.id)}><Trash2 size={16} /> Delete selected edit</button>}
            <div className="editor-setting-grid">
              <label>Color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} disabled={tool === 'redact' || tool === 'signature' || tool === 'select'} /></label>
              <label>Line<input type="range" min="1" max="8" step="0.5" value={lineWidth} onChange={(event) => setLineWidth(Number(event.target.value))} disabled={tool !== 'rectangle' && tool !== 'ink'} /></label>
              <label>Text<input type="number" min="8" max="48" value={textSize} onChange={(event) => setTextSize(Number(event.target.value))} disabled={tool !== 'text'} /></label>
              <label>Opacity<input type="range" min="0.1" max="0.8" step="0.05" value={highlightOpacity} onChange={(event) => setHighlightOpacity(Number(event.target.value))} disabled={tool !== 'highlight'} /></label>
            </div>
          </section>
          <section>
            <h3>Edits</h3>
            <div className="editor-edit-list">
              {currentPage.overlays.length ? currentPage.overlays.map((overlay, index) => (
                <div key={overlay.id} className={`editor-edit-row${selectedOverlayId === overlay.id ? ' selected' : ''}`}>
                  <button type="button" onClick={() => setSelectedOverlayId(overlay.id)}>{index + 1}. {overlay.type}</button>
                  <button className="icon-button" type="button" onClick={() => setDeleteOverlayId(overlay.id)} title="Remove edit" aria-label={`Remove ${overlay.type} edit`}><Trash2 size={15} /></button>
                </div>
              )) : <p>No edits</p>}
            </div>
          </section>
        </aside>
      </div>

      {textModal && <div className="editor-modal-backdrop" role="presentation">
        <form className="editor-modal" role="dialog" aria-modal="true" aria-label={textModal.tool === 'text' ? 'Add text' : 'Add signature'} onSubmit={(event) => { event.preventDefault(); submitTextModal() }}>
          <h2>{textModal.tool === 'text' ? 'Add text' : 'Add signature'}</h2>
          <label>{textModal.tool === 'text' ? 'Text' : 'Signature'}<input autoFocus value={textModal.value} onChange={(event) => setTextModal({ ...textModal, value: event.target.value })} /></label>
          <div className="editor-modal-actions">
            <button className="button secondary" type="button" onClick={() => setTextModal(undefined)}>Cancel</button>
            <button className="button primary" type="submit" disabled={!textModal.value.trim()}>{textModal.tool === 'text' ? 'Add text' : 'Add signature'}</button>
          </div>
        </form>
      </div>}

      {deleteOverlay && <div className="editor-modal-backdrop" role="presentation">
        <div className="editor-modal" role="dialog" aria-modal="true" aria-label="Delete edit">
          <h2>Delete edit?</h2>
          <p>This removes the selected {deleteOverlay.type} edit from the page.</p>
          <div className="editor-modal-actions">
            <button className="button secondary" type="button" onClick={() => setDeleteOverlayId(undefined)}>Cancel</button>
            <button className="button primary danger-action" type="button" onClick={confirmDelete}>Delete</button>
          </div>
        </div>
      </div>}
    </div>
  )
}

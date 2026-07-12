import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Maximize2, MessageSquareText, PencilLine, RotateCw } from 'lucide-react'
import { renderWorkspacePage } from '../lib/pdf'
import { isWorkspacePageResized, type SourceDocument, type WorkspacePage } from '../types'

type Props = {
  page: WorkspacePage
  source?: SourceDocument
  number: number
  selected: boolean
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void
  onOpen: () => void
  onContextMenu: (event: MouseEvent) => void
}

const THUMBNAIL_RENDER_SCALE = 0.72
const THUMBNAIL_RENDER_QUALITY = 0.9

export function PageThumbnail({ page, source, number, selected, onSelect, onOpen, onContextMenu }: Props) {
  const [preview, setPreview] = useState<string>()
  const [visible, setVisible] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const sortable = useSortable({ id: page.id })
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }
  const resized = isWorkspacePageResized(page)

  useEffect(() => {
    if (!root.current) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: '320px' })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    if (visible && source && !preview) {
      void renderWorkspacePage(page, source, THUMBNAIL_RENDER_SCALE, THUMBNAIL_RENDER_QUALITY).then((value) => active && setPreview(value)).catch(() => undefined)
    }
    return () => { active = false }
  }, [page, preview, source, visible])

  return (
    <div
      ref={(node) => { root.current = node; sortable.setNodeRef(node) }}
      style={style}
      className={`page-tile${selected ? ' selected' : ''}${sortable.isDragging ? ' dragging' : ''}`}
      data-testid="page-tile"
      onContextMenu={onContextMenu}
      {...sortable.attributes}
      {...sortable.listeners}
    >
      <button
        className="page-preview"
        type="button"
        onClick={onSelect}
        onDoubleClick={onOpen}
        aria-label={`Select page ${number}`}
        aria-pressed={selected}
        draggable={false}
      >
        {preview ? <img src={preview} alt="" draggable={false} style={{ transform: `rotate(${page.rotation}deg)` }} /> : <span className="page-skeleton" />}
        {page.overlays.length > 0 && <span className="edit-badge" title="Page has edits"><MessageSquareText size={13} /> {page.overlays.length}</span>}
        {resized && <span className="resize-badge" title="Page has been resized"><Maximize2 size={12} /> Resized</span>}
        {page.rotation !== 0 && <span className="rotation-badge"><RotateCw size={12} /> {page.rotation}°</span>}
      </button>
      <button
        className="page-edit-button icon-button"
        type="button"
        title="Edit page"
        aria-label={`Edit page ${number}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onOpen()
        }}
      >
        <PencilLine size={15} />
      </button>
      <div className="page-caption">
        <button className="drag-handle icon-button" type="button" title="Drag to reorder" aria-label={`Reorder page ${number}`}>
          <GripVertical size={16} />
        </button>
        <button type="button" className="page-number" onClick={onOpen}>Page {number}</button>
      </div>
    </div>
  )
}

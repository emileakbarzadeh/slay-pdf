import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MessageSquareText, RotateCw } from 'lucide-react'
import { renderPage } from '../lib/pdf'
import type { SourceDocument, WorkspacePage } from '../types'

type Props = {
  page: WorkspacePage
  source?: SourceDocument
  number: number
  selected: boolean
  onSelect: (additive: boolean) => void
  onOpen: () => void
}

export function PageThumbnail({ page, source, number, selected, onSelect, onOpen }: Props) {
  const [preview, setPreview] = useState<string>()
  const [visible, setVisible] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const sortable = useSortable({ id: page.id })
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }

  useEffect(() => {
    if (!root.current) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: '320px' })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    if (visible && source && !preview) {
      void renderPage(source, page.sourcePageIndex).then((value) => active && setPreview(value)).catch(() => undefined)
    }
    return () => { active = false }
  }, [page.sourcePageIndex, preview, source, visible])

  return (
    <div
      ref={(node) => { root.current = node; sortable.setNodeRef(node) }}
      style={style}
      className={`page-tile${selected ? ' selected' : ''}${sortable.isDragging ? ' dragging' : ''}`}
      data-testid="page-tile"
      {...sortable.attributes}
      {...sortable.listeners}
    >
      <button
        className="page-preview"
        type="button"
        onClick={(event) => onSelect(event.metaKey || event.ctrlKey || event.shiftKey)}
        onDoubleClick={onOpen}
        aria-label={`Select page ${number}`}
        aria-pressed={selected}
        draggable={false}
      >
        {preview ? <img src={preview} alt="" draggable={false} style={{ transform: `rotate(${page.rotation}deg)` }} /> : <span className="page-skeleton" />}
        {page.overlays.length > 0 && <span className="edit-badge" title="Page has edits"><MessageSquareText size={13} /> {page.overlays.length}</span>}
        {page.rotation !== 0 && <span className="rotation-badge"><RotateCw size={12} /> {page.rotation}°</span>}
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

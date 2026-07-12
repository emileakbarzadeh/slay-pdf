import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Scissors, X } from 'lucide-react'

type Props = {
  id: string
  onRemove: () => void
}

export function SplitMarkerTile({ id, onRemove }: Props) {
  const sortable = useSortable({ id })
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`split-marker-tile${sortable.isDragging ? ' dragging' : ''}`}
      data-testid="split-marker"
      {...sortable.attributes}
      {...sortable.listeners}
    >
      <div className="split-marker-panel" data-testid="split-marker-panel">
        <div className="split-marker-top">
          <button className="drag-handle icon-button" type="button" title="Drag split marker" aria-label="Reorder split marker">
            <GripVertical size={16} />
          </button>
          <span>Split point</span>
          <button className="icon-button" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onRemove} title="Remove split marker" aria-label="Remove split marker">
            <X size={16} />
          </button>
        </div>
        <div className="split-marker-body">
          <div className="split-marker-label"><Scissors size={16} /><strong>New PDF</strong></div>
        </div>
      </div>
    </div>
  )
}

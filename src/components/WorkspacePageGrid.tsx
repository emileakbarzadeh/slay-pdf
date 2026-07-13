import { Suspense, lazy, useMemo } from 'react'
import type { MouseEvent } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { ChevronDown, FilePlus2, Import, Scissors } from 'lucide-react'
import { isWorkspacePage, type SourceDocument, type WorkspaceItem } from '../types'

const PageThumbnail = lazy(async () => ({ default: (await import('./PageThumbnail')).PageThumbnail }))
const SplitMarkerTile = lazy(async () => ({ default: (await import('./SplitMarkerTile')).SplitMarkerTile }))

type Props = {
  pages: WorkspaceItem[]
  sources: SourceDocument[]
  selected: string[]
  onClearSelection: () => void
  onSelectPage: (pageId: string, event: MouseEvent<HTMLButtonElement>) => void
  onOpenPage: (pageId: string) => void
  onOpenPageMenu: (event: MouseEvent, pageId: string, pageNumber: number, selected: boolean) => void
  onReorder: (activeId: string, overId: string) => void
  onRemoveSplitMarker: (id: string) => void
  onAddPages: () => void
  onAddSplitMarker: () => void
}

export function WorkspacePageGrid({
  pages,
  sources,
  selected,
  onClearSelection,
  onSelectPage,
  onOpenPage,
  onOpenPageMenu,
  onReorder,
  onRemoveSplitMarker,
  onAddPages,
  onAddSplitMarker
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const pageEntries = useMemo(() => pages.filter(isWorkspacePage), [pages])
  const pageNumbers = useMemo(() => new Map(pageEntries.map((page, index) => [page.id, index + 1])), [pageEntries])

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over) onReorder(String(active.id), String(over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={pages.map((page) => page.id)}>
        <section className="page-grid" aria-label="Document pages" onClick={(event) => { if (event.target === event.currentTarget) onClearSelection() }}>
          {pages.map((page) => isWorkspacePage(page)
            ? <Suspense key={page.id} fallback={null}>
                <PageThumbnail
                  page={page}
                  source={sources.find((source) => source.id === page.sourceId)}
                  number={pageNumbers.get(page.id) ?? 1}
                  selected={selected.includes(page.id)}
                  onSelect={(event) => onSelectPage(page.id, event)}
                  onOpen={() => onOpenPage(page.id)}
                  onContextMenu={(event) => onOpenPageMenu(event, page.id, pageNumbers.get(page.id) ?? 1, selected.includes(page.id))}
                />
              </Suspense>
            : <Suspense key={page.id} fallback={null}>
                <SplitMarkerTile id={page.id} onRemove={() => onRemoveSplitMarker(page.id)} />
              </Suspense>)}
          <div className="add-pages-tile">
            <button type="button" className="add-pages-main" onClick={onAddPages}><FilePlus2 size={24} /><span>Add pages</span></button>
            <div className="add-pages-actions">
              <button type="button" className="add-pages-toggle" aria-haspopup="menu"><span>Add…</span><ChevronDown size={15} /></button>
              <div className="add-pages-menu" role="menu">
                <button type="button" role="menuitem" onClick={onAddPages}><Import size={16} /> Add pages</button>
                <button type="button" role="menuitem" onClick={onAddSplitMarker}><Scissors size={16} /> Split PDF marker</button>
              </div>
            </div>
          </div>
        </section>
      </SortableContext>
    </DndContext>
  )
}

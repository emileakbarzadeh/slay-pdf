import { useState } from 'react'
import { Grid2X2, Ruler, X } from 'lucide-react'
import { useWorkspace } from '../store'
import type { WorkspacePage } from '../types'

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

export type PageToolModalMode = 'resize' | 'posterise'

type Props = {
  mode: PageToolModalMode
  selectedPages: WorkspacePage[]
  onClose: () => void
}

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

export function PageToolModal({ mode, selectedPages, onClose }: Props) {
  const [resizeFormat, setResizeFormat] = useState<ResizeFormatId>('a4')
  const [resizeOrientation, setResizeOrientation] = useState<Orientation>('portrait')
  const [customResizeWidth, setCustomResizeWidth] = useState(210)
  const [customResizeHeight, setCustomResizeHeight] = useState(297)
  const [posterFormat, setPosterFormat] = useState<PaperFormatId>('a4')
  const [posterOrientation, setPosterOrientation] = useState<Orientation>(() => selectedPages[0]?.width > selectedPages[0]?.height ? 'landscape' : 'portrait')
  const [posterColumns, setPosterColumns] = useState(2)
  const [posterRows, setPosterRows] = useState(2)
  const resizeSelected = useWorkspace((state) => state.resizeSelected)
  const posterizeSelected = useWorkspace((state) => state.posterizeSelected)
  const resizeSize = resizeFormat === 'custom' ? customPaperSize(customResizeWidth, customResizeHeight) : paperSize(resizeFormat, resizeOrientation)
  const posterSize = paperSize(posterFormat, posterOrientation)

  const applyResize = () => {
    resizeSelected(resizeSize.width, resizeSize.height)
    onClose()
  }
  const applyPosterise = () => {
    posterizeSelected(posterColumns, posterRows, posterSize.width, posterSize.height)
    onClose()
  }

  return <div className="app-modal-backdrop" role="presentation" onMouseDown={onClose}>
    {mode === 'resize'
      ? <form className="app-modal tool-modal" role="dialog" aria-modal="true" aria-label="Resize selected pages" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); applyResize() }}>
          <button className="icon-button app-modal-close" type="button" onClick={onClose} aria-label="Close resize"><X size={17} /></button>
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
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="submit" disabled={!selectedPages.length}>Resize</button>
          </div>
        </form>
      : <form className="app-modal tool-modal" role="dialog" aria-modal="true" aria-label="Posterise selected pages" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); applyPosterise() }}>
          <button className="icon-button app-modal-close" type="button" onClick={onClose} aria-label="Close posterise"><X size={17} /></button>
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
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="submit" disabled={!selectedPages.length}>Posterise</button>
          </div>
        </form>}
  </div>
}

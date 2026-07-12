import { useState } from 'react'
import { Crop, Download, FileArchive, FileImage, FileText, HardDrive, Info, ListChecks, LockKeyhole, ScanText, Settings2, SlidersHorizontal } from 'lucide-react'
import { buildSearchablePdf, downloadBlob, ensurePdfFilename, exportImages, exportSplit, exportText } from '../lib/export'
import { getStorageEstimate } from '../lib/database'
import { downloadPdfExport } from '../lib/pdfDownloads'
import { processPdf } from '../lib/processing'
import { useWorkspace } from '../store'
import { isWorkspacePage, type CropBox } from '../types'

type Tab = 'export' | 'document'

type Props = {
  mobileExpanded: boolean
  onToggleMobile: () => void
}

export function Inspector({ mobileExpanded, onToggleMobile }: Props) {
  const [tab, setTab] = useState<Tab>('export')
  const [storage, setStorage] = useState<string>()
  const [protect, setProtect] = useState(false)
  const [password, setPassword] = useState('')
  const pages = useWorkspace((state) => state.pages)
  const sources = useWorkspace((state) => state.sources)
  const selected = useWorkspace((state) => state.selected)
  const settings = useWorkspace((state) => state.settings)
  const updateSettings = useWorkspace((state) => state.updateSettings)
  const updatePage = useWorkspace((state) => state.updatePage)
  const updateFormField = useWorkspace((state) => state.updateFormField)
  const setJob = useWorkspace((state) => state.setJob)
  const setError = useWorkspace((state) => state.setError)

  const pageEntries = pages.filter(isWorkspacePage)
  const selectedPages = pageEntries.filter((page) => selected.includes(page.id))
  const targetPages = selected.length ? selectedPages : pageEntries
  const targetItems = selected.length ? selectedPages : pages
  const selectedPage = selected.length === 1 ? pageEntries.find((page) => page.id === selected[0]) : undefined
  const formSources = sources.filter((source) => source.formFields?.length)
  const filenameInput = settings.filename.replace(/\.pdf$/i, '')
  const run = async (kind: 'pdf' | 'ocr' | 'split' | 'images' | 'text', scope: 'all' | 'selected' | 'auto' = 'auto') => {
    const pagesForExport = scope === 'all' ? pageEntries : scope === 'selected' ? selectedPages : targetPages
    const itemsForSplit = scope === 'all' ? pages : scope === 'selected' ? selectedPages : targetItems
    setError(null)
    setJob({ label: kind === 'ocr' ? 'Preparing OCR' : kind === 'pdf' ? 'Building PDF' : 'Preparing export', progress: 0 })
    try {
      const progress = (value: number) => setJob({ label: 'Preparing export', progress: value })
      if (kind === 'pdf' || kind === 'ocr') {
        if (protect && password.length < 6) throw new Error('Use at least 6 characters for the PDF password.')
        if (kind === 'pdf') {
          await downloadPdfExport(scope === 'all' ? pages : pagesForExport, sources, settings, {
            password: protect ? password : undefined,
            onJob: (label, value) => setJob({ label, progress: value })
          })
        } else {
          const composed = await buildSearchablePdf(pagesForExport, sources, settings, (value, label) => setJob({ label, progress: value }))
          const processed = await processPdf(composed, { compression: settings.compression, password: protect ? password : undefined }, (value, label) => setJob({ label, progress: value }))
          downloadBlob(processed, ensurePdfFilename(settings.filename))
        }
      }
      if (kind === 'split') downloadBlob(await exportSplit(itemsForSplit, sources, settings, progress), 'local-pdf-pages.zip')
      if (kind === 'images') downloadBlob(await exportImages(pagesForExport, sources, settings, progress), 'local-pdf-images.zip')
      if (kind === 'text') downloadBlob(await exportText(pagesForExport, sources, settings, progress), 'local-pdf-text.txt')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setJob(null)
    }
  }

  const inspectStorage = async () => {
    const estimate = await getStorageEstimate()
    if (!estimate) return setStorage('Storage estimate unavailable')
    const used = ((estimate.usage ?? 0) / 1024 / 1024).toFixed(1)
    const quota = ((estimate.quota ?? 0) / 1024 / 1024).toFixed(0)
    setStorage(`${used} MB of ${quota} MB used`)
  }

  const updateCrop = (edge: keyof CropBox, percent: number) => {
    if (!selectedPage) return
    const crop = { ...selectedPage.crop, [edge]: Math.max(0, Math.min(45, percent)) / 100 }
    if (crop.left + crop.right > 0.86) crop[edge] = selectedPage.crop[edge]
    if (crop.top + crop.bottom > 0.86) crop[edge] = selectedPage.crop[edge]
    updatePage(selectedPage.id, { crop })
  }

  return (
    <aside className={`inspector${mobileExpanded ? ' mobile-expanded' : ''}`}>
      <button className="drawer-handle" type="button" onClick={onToggleMobile} aria-expanded={mobileExpanded} aria-label={mobileExpanded ? 'Collapse export drawer' : 'Expand export drawer'}>
        <span />
      </button>
      <div className="segmented" role="tablist">
        <button className={tab === 'export' ? 'active' : ''} onClick={() => setTab('export')} role="tab"><Download size={15} /> Export</button>
        <button className={tab === 'document' ? 'active' : ''} onClick={() => setTab('document')} role="tab"><Settings2 size={15} /> Document</button>
      </div>

      {tab === 'export' ? <>
        <div className="inspector-section">
          <label>File name<input value={filenameInput} onChange={(event) => updateSettings({ filename: event.target.value.replace(/\.pdf$/i, '') })} /></label>
          <p className="selection-note">{selected.length ? `${selected.length} selected pages` : `All ${pageEntries.length} pages`}</p>
          <button className="button primary wide" type="button" disabled={!pageEntries.length} onClick={() => void run('pdf', 'all')}><Download size={17} /> Export all pages</button>
          <button className="button secondary wide" type="button" disabled={!selected.length} onClick={() => void run('pdf', 'selected')}><Download size={17} /> Export selected pages</button>
          <div className="download-section">
            <h3>Other downloads</h3>
            <div className="export-grid">
              <button type="button" onClick={() => void run('split')} disabled={!pageEntries.length}><FileArchive size={18} /><span>Separate pages</span></button>
              <button type="button" onClick={() => void run('images')} disabled={!pageEntries.length}><FileImage size={18} /><span>Page images</span></button>
              <button type="button" onClick={() => void run('text')} disabled={!pageEntries.length}><FileText size={18} /><span>Plain text</span></button>
            </div>
          </div>
          <button className="button wide" type="button" disabled={!pageEntries.length} onClick={() => void run('ocr')}><ScanText size={17} /> Searchable OCR PDF</button>
        </div>
        <div className="inspector-section advanced-tools">
          <h3>Advanced processing</h3>
          <label className="advanced-row"><SlidersHorizontal size={17} /><span>Compression</span><select value={settings.compression} onChange={(event) => updateSettings({ compression: event.target.value as typeof settings.compression })}>
            <option value="lossless">Lossless</option>
            <option value="printer">High quality</option>
            <option value="ebook">Balanced</option>
            <option value="screen">Smallest</option>
          </select></label>
          <label className="advanced-row toggle-row"><LockKeyhole size={17} /><span>Password protection</span><input type="checkbox" checked={protect} onChange={(event) => setProtect(event.target.checked)} /></label>
          {protect && <label className="password-field">Open password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>}
          <p className="engine-note"><ScanText size={14} /> Passwords are never saved.</p>
        </div>
      </> : <>
        <div className="inspector-section">
          <label>Title<input value={settings.metadata.title} onChange={(event) => updateSettings({ metadata: { ...settings.metadata, title: event.target.value } })} /></label>
          <label>Author<input value={settings.metadata.author} onChange={(event) => updateSettings({ metadata: { ...settings.metadata, author: event.target.value } })} /></label>
          <label>Subject<input value={settings.metadata.subject} onChange={(event) => updateSettings({ metadata: { ...settings.metadata, subject: event.target.value } })} /></label>
          <label>Keywords<input placeholder="invoice, archive" value={settings.metadata.keywords} onChange={(event) => updateSettings({ metadata: { ...settings.metadata, keywords: event.target.value } })} /></label>
        </div>
        <div className="inspector-section">
          <label>Watermark<input placeholder="DRAFT" value={settings.watermark} onChange={(event) => updateSettings({ watermark: event.target.value })} /></label>
          <label className="range-label">Opacity <span>{Math.round(settings.watermarkOpacity * 100)}%</span><input type="range" min="0.05" max="0.6" step="0.01" value={settings.watermarkOpacity} onChange={(event) => updateSettings({ watermarkOpacity: Number(event.target.value) })} /></label>
          <label className="check-label"><input type="checkbox" checked={settings.pageNumbers} onChange={(event) => updateSettings({ pageNumbers: event.target.checked })} /> Add page numbers</label>
        </div>
        {selectedPage && <div className="inspector-section crop-section">
          <h3><Crop size={14} /> Crop selected page</h3>
          {(['top', 'right', 'bottom', 'left'] as const).map((edge) => <label key={edge} className="range-label">{edge[0].toUpperCase() + edge.slice(1)} <span>{Math.round(selectedPage.crop[edge] * 100)}%</span><input type="range" min="0" max="45" step="1" value={Math.round(selectedPage.crop[edge] * 100)} onChange={(event) => updateCrop(edge, Number(event.target.value))} /></label>)}
          <button type="button" className="subtle-button" onClick={() => updatePage(selectedPage.id, { crop: { top: 0, right: 0, bottom: 0, left: 0 } })}>Reset crop</button>
        </div>}
        {formSources.length > 0 && <div className="inspector-section form-section">
          <h3><ListChecks size={14} /> Form fields</h3>
          <label className="check-label"><input type="checkbox" checked={settings.flattenForms} onChange={(event) => updateSettings({ flattenForms: event.target.checked })} /> Flatten on export</label>
          {formSources.map((source) => <div key={source.id} className="form-source">
            <strong>{source.name}</strong>
            {source.formFields?.map((field) => <label key={field.name}>{field.name}
              {field.type === 'checkbox'
                ? <input type="checkbox" checked={field.value === 'true'} onChange={(event) => updateFormField(source.id, field.name, String(event.target.checked))} />
                : field.options?.length
                  ? <select value={field.value} onChange={(event) => updateFormField(source.id, field.name, event.target.value)}><option value="">No selection</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  : field.type === 'unsupported'
                    ? <input value="Unsupported field" disabled />
                    : <input value={field.value} onChange={(event) => updateFormField(source.id, field.name, event.target.value)} />}
            </label>)}
          </div>)}
        </div>}
        <div className="inspector-section storage-section">
          <button type="button" className="subtle-button" onClick={() => void inspectStorage()}><HardDrive size={16} /> Check local storage</button>
          {storage && <small>{storage}</small>}
          <p><Info size={14} /> Files and edits stay in this browser.</p>
        </div>
      </>}
    </aside>
  )
}

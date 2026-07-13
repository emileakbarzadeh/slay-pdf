import { FilePlus2, History } from 'lucide-react'

type Props = {
  recentName: string
  pageLabel: string
  sourceLabel: string
  onStartFresh: () => void
  onOpenWorkspace: () => void
}

export function RecentModal({ recentName, pageLabel, sourceLabel, onStartFresh, onOpenWorkspace }: Props) {
  return <div className="app-modal-backdrop recent-modal-backdrop" role="presentation">
    <section className="app-modal recent-modal" role="dialog" aria-modal="true" aria-labelledby="recent-title">
      <div className="recent-heading">
        <History size={24} />
        <div>
          <h2 id="recent-title">Recent PDFs</h2>
          <p>Continue your saved local workspace or start with a clean PDF.</p>
        </div>
      </div>
      <div className="recent-actions">
        <button className="recent-new" type="button" onClick={onStartFresh}>
          <FilePlus2 size={22} />
          <span><strong>New PDF</strong><small>Clear the saved workspace</small></span>
        </button>
        <button className="recent-item" type="button" onClick={onOpenWorkspace}>
          <span className="recent-file-icon">PDF</span>
          <span><strong>{recentName}</strong><small>{pageLabel} · {sourceLabel}</small></span>
          <b>Open</b>
        </button>
        <button className="recent-clear" type="button" onClick={onStartFresh}>Clear recent</button>
      </div>
    </section>
  </div>
}

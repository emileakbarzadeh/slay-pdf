import { Github, X } from 'lucide-react'

const licenseLinks = [
  { label: 'Slay PDF (AGPL-3.0)', href: 'https://github.com/emileakbarzadeh/slay-pdf' },
  { label: 'GhostPDL/Ghostscript WASM (AGPL-3.0-or-later)', href: 'https://github.com/okathira/ghostpdl-wasm' },
  { label: 'qpdf-wasm wrapper (ISC)', href: 'https://github.com/neslinesli93/qpdf-wasm' },
  { label: 'QPDF engine source', href: 'https://github.com/qpdf/qpdf' },
  { label: 'PDF.js (Apache-2.0)', href: 'https://mozilla.github.io/pdf.js/' },
  { label: 'pdf-lib (MIT)', href: 'https://pdf-lib.js.org/' },
  { label: 'Tesseract.js (Apache-2.0)', href: 'https://github.com/naptha/tesseract.js' }
]

type Props = {
  onClose: () => void
}

export function AboutModal({ onClose }: Props) {
  return <div className="app-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <div className="app-modal about-modal" role="dialog" aria-modal="true" aria-label="About Slay PDF" onMouseDown={(event) => event.stopPropagation()}>
      <button className="icon-button app-modal-close" type="button" onClick={onClose} aria-label="Close about"><X size={17} /></button>
      <div className="about-modal-header">
        <div className="brand-mark">S</div>
        <div>
          <h2>Slay PDF</h2>
          <p>Private. Local. Always.</p>
        </div>
      </div>
      <p>Slay PDF is a completely local PDF editor to split, merge, posterise, sign or edit any PDF.</p>
      <p>Super quick and no more random dodgy sites. Enterprise level security (since your data stays with you and is never sent over the internet)</p>
      <p>Your documents and edits stay in this browser. Passwords are never saved.</p>
      <details className="about-license-list">
        <summary>License links</summary>
        <div>
          {licenseLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
      </details>
      <div className="app-modal-actions">
        <a className="button secondary" href="https://github.com/emileakbarzadeh/slay-pdf" target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a>
        <button className="button primary" type="button" onClick={onClose}>Done</button>
      </div>
    </div>
  </div>
}

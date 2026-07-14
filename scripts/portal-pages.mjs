export const site = 'https://slaypdf.com'

export const portalGroups = [
  {
    title: 'Shape the document',
    description: 'Build the right page order, dimensions and output before you share anything.',
    pages: [
      ['merge-pdf.html', 'Merge PDF', 'Bring several documents together and arrange the final page order.'],
      ['split-pdf.html', 'Split PDF', 'Place clean break points and export separate documents in one pass.'],
      ['delete-pdf-pages.html', 'Delete pages', 'Remove the pages that should never have made the final cut.'],
      ['organize-pdf-pages.html', 'Organize pages', 'Reorder, rotate and select pages from a visual workspace.'],
      ['crop-pdf.html', 'Crop PDF', 'Trim page edges without sending the document to a server.'],
      ['resize-pdf.html', 'Resize PDF', 'Fit pages to standard or custom sizes without stretching their content.'],
      ['rotate-pdf.html', 'Rotate PDF', 'Correct sideways scans and mixed page orientations.'],
      ['posterise-pdf.html', 'Posterise PDF', 'Tile one page across several sheets for large-format printing.'],
    ],
  },
  {
    title: 'Mark it up',
    description: 'Add the human layer: signatures, notes, redactions and useful page furniture.',
    pages: [
      ['sign-pdf.html', 'Sign PDF', 'Place signatures, initials and dates precisely on the page.'],
      ['annotate-pdf.html', 'Annotate PDF', 'Add text, drawings and highlights to a local document.'],
      ['redact-pdf.html', 'Redact PDF', 'Permanently cover sensitive content before export.'],
      ['watermark-pdf.html', 'Watermark PDF', 'Apply a clear status, ownership or review mark across pages.'],
      ['add-page-numbers-to-pdf.html', 'Add page numbers', 'Number a full document or a selected page range.'],
      ['fill-pdf-forms.html', 'Fill PDF forms', 'Complete form fields and flatten the finished copy.'],
    ],
  },
  {
    title: 'Convert and finish',
    description: 'Turn awkward source material into something compact, searchable and ready to use.',
    pages: [
      ['compress-pdf.html', 'Compress PDF', 'Reduce file size while keeping control over output quality.'],
      ['ocr-pdf.html', 'OCR PDF', 'Make English scans searchable directly in the browser.'],
      ['pdf-to-images.html', 'PDF to images', 'Export selected pages as crisp image files.'],
      ['images-to-pdf.html', 'Images to PDF', 'Combine JPG and PNG images into an ordered PDF.'],
      ['extract-pdf-text.html', 'Extract text', 'Pull readable text out of selected PDF pages.'],
      ['edit-scanned-pdf.html', 'Edit scanned PDF', 'OCR, clean and annotate documents that began on paper.'],
      ['flatten-pdf.html', 'Flatten PDF', 'Bake annotations and form appearances into a dependable final copy.'],
      ['password-protect-pdf.html', 'Protect PDF', 'Encrypt the exported document with a password.'],
    ],
  },
]

export const utilityPages = [
  ['tools.html', 'PDF tools'],
  ['search.html', 'Search PDF tools'],
  ['free-pdf-editor.html', 'Free local PDF editor'],
  ['adobe-acrobat-alternative.html', 'Adobe Acrobat alternative'],
  ['privacy.html', 'Privacy'],
  ['pdf-privacy-security.html', 'Security model'],
  ['sitemap.html', 'Sitemap'],
]

export const portalFiles = [
  ...utilityPages.map(([file]) => file),
  ...portalGroups.flatMap((group) => group.pages.map(([file]) => file)),
]

export const portalPaths = ['/', ...portalFiles.map((file) => `/${file}`)]

if (portalPaths.length !== 30) {
  throw new Error(`Expected exactly 30 canonical portal URLs, found ${portalPaths.length}`)
}

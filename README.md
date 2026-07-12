# Local PDF

Local PDF is a static, installable browser app for common PDF chores. It keeps files on the device and uses WebAssembly-backed engines for heavier processing.

## Features

- Import PDFs and PNG/JPEG/WebP images.
- Merge, split, reorder, duplicate, delete, rotate, crop, and export selected pages.
- Add text, highlights, rectangles, ink, visual signatures, watermarks, page numbers, metadata, and secure redactions.
- Export merged PDFs, split PDFs, page images, plain text, and searchable English OCR PDFs.
- Fill imported AcroForm text, checkbox, dropdown/list, and radio fields, with optional flattening on export.
- Compress with Ghostscript presets, optimize with qpdf, and optionally encrypt exports with AES-256 passwords.
- Autosave the active workspace in IndexedDB and run as a PWA after the first load.

## Local Development

Use Nix for the toolchain:

```sh
nix develop --command npm install
nix develop --command npm run dev -- --host 127.0.0.1
```

Run checks:

```sh
nix develop --command npm run test
nix develop --command npm run build
nix develop --command npm run test:e2e
```

The app is designed for GitHub Pages. The workflow in `.github/workflows/deploy.yml` builds the static bundle from Nix with `npm run build`.

## Privacy And Limits

PDF contents are processed in the browser. The app does not upload documents to a server. Browser storage, memory, and CPU are still the limiting factors, so imports are capped at 200 MB per file.

OCR currently bundles English language data. Adding more languages means adding their traineddata package and extending the OCR language controls.

## License

AGPL-3.0-only. Ghostscript is AGPL, so the app is licensed under AGPL as a whole.

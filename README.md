# Slay PDF

> [!WARNING]
> This project is entirely slopped. Enter at your own risk (that being said, it is entirely client side so hopefully has no vulnerabilities)

Slay PDF is a free local PDF editor and Adobe Acrobat alternative for everyday PDF editing. It keeps documents on your device, stores the active workspace in IndexedDB, and uses browser-side WebAssembly engines for heavier PDF operations.

Live app: https://slaypdf.com/

## What It Does

- Import PDFs plus PNG, JPEG, and WebP images.
- Merge, split, reorder, duplicate, delete, rotate, crop, resize, and posterise pages.
- Add text, highlights, rectangles, ink, visual signatures, watermarks, page numbers, metadata, and secure redactions.
- Fill imported AcroForm text, checkbox, dropdown/list, and radio fields, with optional flattening on export.
- Export merged PDFs, selected pages, separate pages, page images, plain text, and searchable English OCR PDFs.
- Compress with GhostPDL/Ghostscript, optimize with qpdf, and optionally encrypt exports with AES-256 passwords.
- Continue recent local workspaces after refresh or install the app as a PWA.

## Privacy Model

Slay PDF is designed to run as a static site. PDF contents are processed in the browser and are not uploaded to an application server.

The practical limits are still the user's browser, memory, CPU, and storage quota. Imports are capped at 200 MB per file, and OCR currently bundles English language data only.

## Development Shell

This repo ships a Nix flake with a default development shell for the project. It provides:

- Node.js 24 and npm.
- Git and `jq` for local project work.
- `nixpkgs-fmt` as the flake formatter.
- A local Playwright browser cache at `.cache/ms-playwright`.

Enter the shell:

```sh
nix develop
```

Or run commands without entering an interactive shell:

```sh
nix develop --command npm ci
nix develop --command npm run dev -- --host 127.0.0.1
```

For first-time Playwright setup, install the Chromium browser bundle into the project-local cache:

```sh
nix develop --command npx playwright install chromium
```

## Common Commands

Install dependencies:

```sh
nix develop --command npm ci
```

Start the dev server:

```sh
nix develop --command npm run dev -- --host 127.0.0.1
```

Run unit tests and the production build:

```sh
nix develop --command npm run check
```

Run the Playwright regression suite:

```sh
nix develop --command npm run test:e2e
```

Check the flake output shape and formatter:

```sh
nix flake check
nix fmt
```

## Deployment

The app builds to static files in `dist/` and is designed for GitHub Pages. The workflow in `.github/workflows/deploy.yml` installs Nix, runs `npm ci` inside the dev shell, builds with `npm run build`, and uploads the static bundle.

## License

Slay PDF is licensed under AGPL-3.0-only.

The app also uses AGPL-licensed GhostPDL/Ghostscript through `@okathira/ghostpdl-wasm`, so the project is licensed under AGPL as a whole. The About modal links to the app source and the major third-party PDF/OCR engines used at runtime.

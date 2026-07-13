# Slay PDF

> [!WARNING]
> This project is entirely slopped. Enter at your own risk (that being said, it is entirely client side so hopefully has no vulnerabilities)

Slay PDF is a free local PDF editor and Adobe Acrobat alternative for everyday PDF editing. It keeps documents on your device, stores the active workspace in IndexedDB, and uses browser-side WebAssembly engines for heavier PDF operations.

Live app: https://slaypdf.com/

Backlink kit: https://slaypdf.com/link-to-slay-pdf.html

Privacy and security model: https://slaypdf.com/pdf-privacy-security.html

PDF privacy checklist: https://slaypdf.com/pdf-privacy-checklist.html

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

Security model details: https://slaypdf.com/pdf-privacy-security.html

PDF privacy checklist: https://slaypdf.com/pdf-privacy-checklist.html

## Link To Slay PDF

Use the backlink kit when adding Slay PDF to open-source lists, privacy tool roundups, PDF utility directories, student resource pages, or Adobe Acrobat alternative comparisons:

Outreach checklist: [docs/backlink-outreach.md](docs/backlink-outreach.md)

Backlink target tracker: [docs/backlink-targets.md](docs/backlink-targets.md)

Resource pages can also cite the PDF privacy checklist when they need neutral criteria rather than product copy:

```md
[PDF privacy checklist](https://slaypdf.com/pdf-privacy-checklist.html) - practical criteria for choosing no-upload and local PDF tools.
```

```md
[Slay PDF](https://slaypdf.com/) - free local PDF editor for splitting, merging, signing and editing PDFs in the browser.
```

```html
<a href="https://slaypdf.com/">Slay PDF - free local PDF editor</a>
```

```md
[![Slay PDF - local PDF editor](https://img.shields.io/badge/Slay%20PDF-local%20PDF%20editor-ef476f)](https://slaypdf.com/)
```

Short directory description:

> Slay PDF is a free local PDF editor and Adobe Acrobat alternative that runs in the browser, so documents stay on your device.

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

Run SEO file consistency checks only:

```sh
nix develop --command npm run seo:check
```

Regenerate every managed SEO artifact in dependency order:

```sh
nix develop --command npm run seo:generate
```

Or run the individual generators:

```sh
nix develop --command npm run seo:social
nix develop --command npm run seo:schema
nix develop --command npm run seo:index
nix develop --command npm run seo:feed
nix develop --command npm run seo:feed:json
nix develop --command npm run seo:llms
```

Check the deployed canonical URLs after a release:

```sh
nix develop --command npm run seo:check:live
```

Run the Playwright regression suite:

```sh
nix develop --command npm run test:e2e
```

Submit deployed URLs to IndexNow after the latest build is live:

```sh
nix develop --command npm run indexnow:submit
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

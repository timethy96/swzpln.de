[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S3EEUDS)

# SWZPLN | opencityplans | plan-generator

## About

**swzpln.de** / **opencityplans.com** provides free, instant access to professional site plans (Schwarzplan / figure-ground plans) for everyone. Plans are generated entirely client-side using OpenStreetMap data. No data is sent to our servers. Privacy-first by design.

## Features

- **2D Export:** SVG, PDF, DXF (with scale selection for SVG/PDF)
- **3D Export:** IFC (BIM), OBJ (Wavefront), 3D-DXF
- **Layers:** Buildings, green areas, forests, water, farmland, roads, railways. All areas exported with SOLID hatches in DXF.
- **Elevation:** Contour lines (1m / 5m / 10m / 20m / 50m), 3D terrain mesh
- **3D Buildings:** Complex multi-part buildings generated from OSM height/levels data, including roof shapes and terrain-aware placement
- **i18n:** German (swzpln.de) and English (opencityplans.com)
- **Privacy:** All generation runs in Web Workers. No user data collected.

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env
# Add your Open Topo Data API key (https://www.opentopodata.org/)

# 2. Install dependencies
pnpm install

# 3. Start dev server
pnpm dev
```

## Docker

```bash
docker build -t swzpln .
docker run -p 3000:3000 --env-file .env swzpln
```

Health check at `GET /health`.

## Project Structure

```
src/
  lib/
    schwarzplan/          # Core plan generation (client-side)
      elevation/          # Elevation data, contours, terrain mesh
      exporters/          # DXF, SVG, PDF, IFC, OBJ, 3D-DXF
      geometry/           # Coordinates, bounds, building extrusion
      osm/                # Overpass API, OSM data conversion
      worker/             # Web Worker for non-blocking generation
      layers.ts           # Layer classification (building, water, etc.)
      roads.ts            # Road merging & processing
      types.ts            # Shared type definitions
    components/           # Svelte UI components
    server/               # Server-side (counter DB, rate limiting)
  routes/
    [[slug]]/             # Main map page (locale-aware)
    api/                  # REST endpoints
    health/               # Health check
    impressum/            # Legal page
    sitemap.xml/          # Dynamic sitemap
messages/                 # i18n source files (DE, EN)
static/                   # Public assets, robots.txt, llms.txt
```

## Tech Stack

**Frontend:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, shadcn-svelte (bits-ui), MapLibre GL JS (svelte-maplibre)

**Plan Generation (client-side):**

- [@tarikjabiri/dxf](https://github.com/tarikjabiri/dxf): DXF export
- [jsPDF](https://github.com/parallax/jsPDF): PDF export
- [earcut](https://github.com/mapbox/earcut): Polygon triangulation
- [polygon-clipping](https://github.com/mfogel/polygon-clipping): Boolean polygon operations
- [ml-conrec](https://github.com/mljs/conrec/): Contour line generation
- Custom IFC-SPF writer (IFC4X3_ADD2)
- Custom OBJ writer (Wavefront)

**Backend:** SvelteKit adapter-node, SQLite (sql.js) download counter, Paraglide.js i18n, CSP security headers

## API Endpoints

| Endpoint              | Method | Description           |
| --------------------- | ------ | --------------------- |
| `/health`             | GET    | Health check          |
| `/api/elevation`      | GET    | Elevation data proxy  |
| `/api/counter/record` | POST   | Record a download     |
| `/api/counter/total`  | GET    | Total download count  |
| `/api/counter/csv`    | GET    | Export counter as CSV |

## Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm test         # Run tests
pnpm lint         # Lint & format check
pnpm format       # Auto-format code
pnpm check        # Svelte type checking
```

## Roadmap

- **PostGIS backend:** Replace Overpass API with a self-hosted PostGIS instance for improved privacy, faster data downloads, and more reliable query performance independent of third-party infrastructure

## Credits

(c) Timo Bilhoefer

Supported by TAB Studio UG (haftungsbeschraenkt)

Published under **[GNU AFFERO GENERAL PUBLIC LICENSE v3](LICENSE)**

### Map Data

- Map Tiles: [CARTO](https://carto.com/)
- Overpass API: [overpass.private.coffee](https://overpass.private.coffee/) (Private.coffee)
- Map Data: [(c) OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Elevation: [Open Topo Data](https://www.opentopodata.org/) (Mapzen dataset)
- Search: [Photon](https://photon.komoot.io/) (Komoot)

### Libraries

[SvelteKit](https://kit.svelte.dev/) | [MapLibre GL](https://maplibre.org/) | [shadcn-svelte](https://www.shadcn-svelte.com/) | [Paraglide.js](https://inlang.com/m/gerre34r/paraglide-js) | [bits-ui](https://bits-ui.com/) | [@tarikjabiri/dxf](https://github.com/tarikjabiri/dxf) | [jsPDF](https://github.com/parallax/jsPDF) | [earcut](https://github.com/mapbox/earcut) | [polygon-clipping](https://github.com/mfogel/polygon-clipping) | [ml-conrec](https://github.com/mljs/conrec/)

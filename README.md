[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S3EEUDS)

# swzpln | opencityplans | plan - generator

## Abstract

The webapp swzpln.de / opencityplans.com provides uncomplicated and permanently free access to plan material for everyone. In addition to ground figure plans, thematic layers, such as forests or water bodies, can also be added to the plan. The map data is created instantly and can be downloaded in SVG, PDF and DXF formats.

The extensive database of openstreetmaps.org is used as the basis for the map material. This way, ground figure plans of places that are not in the general interest of the world can also be created. In this way, global justice in the archiving and documentation of city maps is also aimed for. The plans are created locally directly on the computer via TypeScript Web Workers, so no data is sent to swzpln.de / opencityplans.com. swzpln.de / opencityplans.com respects the privacy of the users and does not collect any personal data.

## Quick Start

1. Copy `.env.example` to `.env` and add your Open Topo Data API key
2. Install dependencies: `pnpm install`
3. Run dev server: `pnpm dev`

## Tech Stack

### Frontend

Built with **SvelteKit**, **TypeScript**, and **Tailwind CSS**. Uses shadcn-svelte for UI components.

### Map Generation

All schwarzplan generation happens **client-side** using TypeScript Web Workers. Core modules are in `src/lib/schwarzplan/`:
- OSM data fetching and parsing
- Elevation data and contour generation
- Export to DXF, SVG, PDF formats

## Credits

(c) Timo Bilhöfer aka timethy96

Published under GNU AFFERO GENERAL PUBLIC LICENSE v3

Thanks to Nicholas Coulange aka Vestibule for contributing the search functions as well as the positions saving functions.

**Libraries:**

[SvelteKit](https://kit.svelte.dev/) - MIT License

[shadcn-svelte](https://www.shadcn-svelte.com/) - MIT License

[MapLibre GL](https://maplibre.org/) - BSD-3-Clause License

[@tarikjabiri/dxf](https://github.com/tarikjabiri/dxf) - MIT License

[jsPDF](https://github.com/parallax/jsPDF) - MIT License

[ml-conrec](https://github.com/mljs/conrec/) - MIT License



**Map Data:**

Map Tiles: [CARTO](https://carto.com/) - Basemaps

Overpass API: [overpass.private.coffee](https://overpass.private.coffee/) - Operated by Private.coffee

Map Data: [(c) OpenStreetMap contributors](https://www.openstreetmap.org/copyright)

Elevation Data: [Open Topo Data API](https://www.opentopodata.org/) with Mapzen dataset
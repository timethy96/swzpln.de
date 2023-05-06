[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S3EEUDS)

# swzpln | opencityplans | plan - generator

## Abstract

The webapp swzpln.de / opencityplans.com provides uncomplicated and permanently free access to plan material for everyone. In addition to ground figure plans, thematic layers, such as forests or water bodies, can also be added to the plan. The map data is created instantly and can be downloaded in svg, pdf and even dwg/dxf formats.
The extensive database of openstreetmaps.org is used as the basis for the map material. This way, ground figure plans of places that are not in the general interest of the world can also be created. In this way, global justice in the archiving and documentation of city maps is also aimed for. The plans are created locally directly on the computer via JavaScript, so no data is sent to swzpln.de / opencityplans.com. swzpln.de / opencityplans.com respects the privacy of the users and does not collect any personal data.

## Quick Start

Run as standalone with Docker Compose:

`docker compose -f dev.yml up`

**OR** run Docker Image:

`docker run -p 8080:80 themomstudio/swzpln.de`

open browser at `localhost:8080`

## Components

### Frontend

The frontend is written in PHP + CSS and JavaScript.

### Map generation

The Maps are generated via JavaScript to process the maps on the user's devices. The main map processing functions are found in `html/js/osm`.

## Credits

(c) Timo Bilhöfer aka timethy96

Published under GNU AFFERO GENERAL PUBLIC LICENSE v3

Thanks to Nicholas Coulange aka Vestibule for contributing the search functions as well as the positions saving functions.

**Libraries:**

[jQuery](https://github.com/jquery/jquery) - MIT license

[Leaflet](https://github.com/Leaflet/Leaflet) - BSD-2-Clause license

[dxf-writer](https://github.com/ognjen-petrovic/js-dxf) - MIT License

[jsPDF](https://github.com/parallax/jsPDF) - MIT License

[conrec](https://github.com/mljs/conrec/) - MIT License - MODIFIED to work in browser!



**Map Data:**

Overpass-Server: [overpass.kumi.systems](https://overpass.kumi.systems/)

Map Data: [(c) OpenStreetMaps contributors](https://www.openstreetmap.org/copyright)
// Import scripts for different format converters
// Note: importScripts works in web workers
function progressCallback(task, status, data) {
    postMessage({ type: 'progress', task, status, data });
}

function getInterval(zoomLevel) {
    if (zoomLevel >= 18) return 1;
    if (zoomLevel >= 17) return 2;
    if (zoomLevel >= 16) return 5;
    if (zoomLevel >= 15) return 10;
    if (zoomLevel >= 14) return 20;
    if (zoomLevel >= 13) return 50;
    if (zoomLevel >= 12) return 100;
    return 200;
}

// Convert degrees to XY coordinates
function deg2XY(bounds, lat, lon) {
    let lat1 = bounds[2];
    let lon1 = bounds[1];
    let lat2 = lat;
    let lon2 = lon;
    let XYvals = [[lat2, lat2, lon1, lon2], [lat1, lat2, lon2, lon2]];
    let XY = [];
    
    XYvals.forEach((latLonArray) => {
        let lat1 = latLonArray[0];
        let lat2 = latLonArray[1];
        let lon1 = latLonArray[2];
        let lon2 = latLonArray[3];
        
        const R = 6371000; // meter
        let dLat = ((lat2 - lat1) * Math.PI) / 180;
        let dLon = ((lon2 - lon1) * Math.PI) / 180;
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
                Math.cos((lat1 * Math.PI) / 180) * 
                Math.cos((lat2 * Math.PI) / 180) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        XY.push(d);
    });
    
    if (lat1 > lat2) {
        XY[1] = -XY[1];
    }
    if (lon1 > lon2) {
        XY[0] = -XY[0];
    }
    return XY;
}

// Filter OSM tags to determine object type
function filterTagsToType(tags) {
    if (!tags) return 'other';
    
    if (tags.building) return 'building';
    if (tags.landuse === 'forest' || tags.natural === 'wood') return 'forest';
    if (tags.natural === 'water' || tags.waterway) return 'water';
    if (tags.waterway) return 'waterway';
    if (tags.leisure === 'park' || 
        tags.landuse === 'grass' || 
        tags.landuse === 'meadow' ||
        tags.landuse === 'allotments' ||
        tags.landuse === 'orchard' ||
        tags.landuse === 'vineyard' ||
        tags.landuse === 'cemetery' ||
        tags.landuse === 'plant_nursery' ||
        tags.landuse === 'recreation_ground' ||
        tags.landuse === 'village_green') return 'green';
    if (tags.landuse === 'farmland') return 'farmland';
    if (tags.highway) return 'highway';
    if (tags.railway) return 'railway';
    
    return 'other';
}

// Convert OSM JSON to object array
function osmjson2objarray(osm_json, bounds) {
    const elements = osm_json['elements'];
    progressCallback('processing', 'Converting OSM data to objects', { current: 0, total: elements.length });

    let ways = {};
    let relations = [];
    let nodes = {};
    let processed = 0;

    // Process elements
    elements.forEach((element) => {
        switch (element["type"]) {
            case "relation":
                const relationType = filterTagsToType(element["tags"]);
                const elemMembers = element['members'];
                relations.push({ "type": relationType, "members": elemMembers });
                break;

            case "way":
                const wayType = filterTagsToType(element["tags"]);
                const elemNodes = element['nodes'];
                const wID = element['id'];
                ways[wID] = { "type": wayType, "nodes": elemNodes };
                break;

            case "node":
                const xy = deg2XY(bounds, element["lat"], element["lon"]);
                const elemID = element["id"];
                nodes[elemID] = xy;
                break;
        }
        
        processed++;
        if (processed % 100 === 0) {
            progressCallback('processing', 'Converting OSM data to objects', { current: processed, total: elements.length });
        }
    });

    // Apply relation types to ways
    relations.forEach((relation) => {
        relation['members'].forEach((member) => {
            if (ways[member['ref']]) {
                ways[member['ref']]['type'] = relation['type'];
                ways[member['ref']]['role'] = member['role'];
            }
        });
    });

    // Build final objects array
    let objects = [];
    Object.values(ways).forEach((way) => {
        let path = [];
        way['nodes'].forEach((nodeID) => {
            if (nodes[nodeID]) {
                path.push([...nodes[nodeID]]);
            }
        });
        if (path.length > 0) {
            objects.push({ 
                "type": way['type'], 
                "path": path, 
                "role": way['role'] 
            });
        }
    });

    return objects;
}

// Generate SVG format
function generateSVG(objects, contours, bounds, layers, zoom, scale) {
    progressCallback('converting', 'Generating SVG', { current: 0, total: objects.length });

    const layerColors = {
        building: '#000000',
        green: '#9DBD7E',
        water: '#AAD4FF',
        waterway: '#AAD4FF',
        forest: '#608156',
        farmland: '#FFEAAA',
        highway: '#828282',
        railway: '#BEBEBE',
        other: '#FF0000',
        contours: '#CCCCCC'
    };
    
    const SE = deg2XY(bounds, bounds[2], bounds[3]);
    const NW = deg2XY(bounds, bounds[0], bounds[1]);
    const txtSize = (19 - zoom) * 10;

    let svg = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' width='${SE[0] * 1000 * scale}mm' height='${(NW[1] + txtSize + 5) * 1000 * scale}mm' viewBox='0 0 ${SE[0] * 1000 * scale} ${(NW[1] + txtSize + 5) * 1000 * scale}'>`;

    // Add contours if enabled
    if (layers.includes('contours') && contours) {
        contours.contours.forEach((cont) => {
            let pathData = '';
            cont.forEach((coordinate, index) => {
                const x = (coordinate.x * SE[0] / contours.sizeX) * 1000 * scale;
                const y = (coordinate.y * NW[1] / contours.sizeY) * 1000 * scale;
                pathData += (index === 0 ? 'M' : 'L') + x + ',' + y;
            });
            svg += `<path d='${pathData}' style='fill:none;stroke:${layerColors.contours}' />`;
        });
    }

    // Add objects
    objects.forEach((obj, index) => {
        const type = obj['type'];
        const path = obj['path'].map(point => [
            point[0] * 1000 * scale,
            (point[1] - NW[1]) * -1 * 1000 * scale
        ]);
        
        if (layers.includes(type) || type === 'other') {
            const pathString = path.map(p => p.join(',')).join(' ');
            
            if (['highway', 'railway', 'contours', 'waterway', 'other'].includes(type)) {
                svg += `<path d='M${pathString}' style='fill:none;stroke:${layerColors[type]}' />`;
            } else {
                svg += `<path d='M${pathString}z' style='fill:${layerColors[type]}' />`;
            }
        }

        if (index % 50 === 0) {
            progressCallback('converting', 'Generating SVG', { current: index, total: objects.length });
        }
    });

    // Add attribution
    svg += `<text x='${(SE[0] - 5) * 1000 * scale}' y='${(NW[1] + txtSize) * 1000 * scale}' style='fill:#FF0000;font-size:${txtSize * 1000 * scale}px;text-anchor:end'>(c) OpenStreetMap.org contributors</text>`;
    svg += '</svg>';

    return svg;
}

// Generate simple DXF format
function generateDXF(objects, contours, bounds, layers, zoom) {
    progressCallback('converting', 'Generating DXF', { current: 0, total: objects.length });

    const SE = deg2XY(bounds, bounds[2], bounds[3]);
    const txtSize = (19 - zoom) * 10;

    let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
2
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
LAYER
2
BUILDING
70
0
62
0
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    // Add objects
    objects.forEach((obj, index) => {
        const type = obj['type'];
        const path = obj['path'];
        
        if (layers.includes(type) && path.length > 1) {
            // Add polyline
            dxf += `0
POLYLINE
8
${type.toUpperCase()}
66
1
70
${['building'].includes(type) ? '1' : '0'}
`;
            
            // Add vertices
            path.forEach(point => {
                dxf += `0
VERTEX
8
${type.toUpperCase()}
10
${point[0]}
20
${point[1]}
30
0.0
`;
            });
            
            dxf += `0
SEQEND
8
${type.toUpperCase()}
`;
        }

        if (index % 50 === 0) {
            progressCallback('converting', 'Generating DXF', { current: index, total: objects.length });
        }
    });

    // Add attribution text
    dxf += `0
TEXT
8
0
10
${SE[0] - 5}
20
${-txtSize}
30
0.0
40
${txtSize}
1
(c) OpenStreetMap.org contributors
`;

    dxf += `0
ENDSEC
0
EOF`;

    return dxf;
}

// Main message handler
onmessage = function(e) {
    const { format, osm_json, hm_matrix, bounds, layers, zoom, scale } = e.data;
    
    try {
        progressCallback('init', 'Starting plan generation');
        
        // Convert OSM data to objects
        const objects = osmjson2objarray(osm_json, bounds);
        
        // Generate contours if needed
        let contours = null;
        if (layers.includes('contours') && hm_matrix) {
            progressCallback('contours', 'Generating contour lines');
            // Simplified contour generation - in production you'd use the Conrec library
            contours = { contours: [], sizeX: 100, sizeY: 100 };
        }
        
        // Generate output based on format
        let result;
        switch (format) {
            case 'svg':
                result = generateSVG(objects, contours, bounds, layers, zoom, scale);
                break;
            case 'dxf':
                result = generateDXF(objects, contours, bounds, layers, zoom);
                break;
            case 'pdf':
                // For PDF, we'd need to use jsPDF library here
                progressCallback('converting', 'PDF generation not fully implemented in demo');
                result = generateSVG(objects, contours, bounds, layers, zoom, scale); // Fallback to SVG
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        
        progressCallback('complete', 'Plan generation complete');
        postMessage({ 
            type: 'complete', 
            format,
            result,
            filename: `schwarzplan_${Date.now()}.${format}`
        });
        
    } catch (error) {
        postMessage({ 
            type: 'error', 
            message: error.message 
        });
    }
};




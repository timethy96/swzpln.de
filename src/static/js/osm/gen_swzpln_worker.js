// Import scripts for different format converters
// Note: importScripts works in web workers
importScripts('/js/conrec/conrec.js');

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
                // Handle geometry directly from Overpass API
                if (element.geometry) {
                    const path = element.geometry.map(coord => deg2XY(bounds, coord.lat, coord.lon));
                    if (path.length > 0) {
                        const wID = element['id'];
                        ways[wID] = { "type": wayType, "path": path };
                    }
                } else if (element.nodes) {
                    // Fallback for non-geometry format
                    const elemNodes = element['nodes'];
                    const wID = element['id'];
                    ways[wID] = { "type": wayType, "nodes": elemNodes };
                }
                break;

            case "node":
                if (element.lat && element.lon) {
                    const xy = deg2XY(bounds, element["lat"], element["lon"]);
                    const elemID = element["id"];
                    nodes[elemID] = xy;
                }
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
        if (way.path) {
            // Already has path from geometry
            objects.push({ 
                "type": way['type'], 
                "path": way.path, 
                "role": way['role'] 
            });
        } else if (way.nodes) {
            // Build path from nodes
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
        }
    });

    return objects;
}

// Generate contours using real Conrec library
function generateContours(hm_matrix, bounds, zoom) {
    if (!hm_matrix || !Array.isArray(hm_matrix) || hm_matrix.length === 0) {
        return null;
    }

    try {
        progressCallback('contours', 'Generating contour lines');
        
        // Validate hm_matrix
        const rowLength = hm_matrix[0].length;
        const isValid = hm_matrix.every(row => Array.isArray(row) && row.length === rowLength);
        
        if (!isValid) {
            console.error('Invalid hm_matrix: not all rows have the same length');
            return null;
        }

        // Create Conrec instance
        const conrecInstance = new Conrec(hm_matrix);
        const interval = getInterval(zoom);
        
        // Generate contours
        const result = conrecInstance.drawContour({
            interval: interval,
            contourDrawer: 'shape'
        });

        return {
            contours: result.contours,
            sizeX: result.sizeX,
            sizeY: result.sizeY
        };

    } catch (error) {
        console.error('Error generating contours:', error);
        return null;
    }
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

    let svg = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' width='${SE[0] * 1000 * scale}mm' height='${(Math.abs(NW[1]) + txtSize + 5) * 1000 * scale}mm' viewBox='0 0 ${SE[0] * 1000 * scale} ${(Math.abs(NW[1]) + txtSize + 5) * 1000 * scale}'>`;

    // Add white background
    svg += `<rect width='${SE[0] * 1000 * scale}' height='${(Math.abs(NW[1]) + txtSize + 5) * 1000 * scale}' fill='white'/>`;

    // Add contours if enabled
    if (layers.includes('contours') && contours && contours.contours) {
        contours.contours.forEach((cont) => {
            let pathData = '';
            cont.forEach((coordinate, index) => {
                const x = (coordinate.x * SE[0] / contours.sizeX) * 1000 * scale;
                const y = (coordinate.y * Math.abs(NW[1]) / contours.sizeY) * 1000 * scale;
                pathData += (index === 0 ? 'M' : 'L') + x + ',' + y;
            });
            if (pathData) {
                svg += `<path d='${pathData}' style='fill:none;stroke:${layerColors.contours};stroke-width:0.5' />`;
            }
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
            if (path.length < 2) return;
            
            const pathString = path.map(p => p.join(',')).join(' ');
            
            if (['highway', 'railway', 'contours', 'waterway', 'other'].includes(type)) {
                const strokeWidth = type === 'highway' ? 1.5 : (type === 'railway' ? 1 : 0.5);
                svg += `<path d='M${pathString}' style='fill:none;stroke:${layerColors[type]};stroke-width:${strokeWidth}' />`;
            } else {
                // Close polygon if it's not already closed
                const isClosed = path.length > 2 && 
                               Math.abs(path[0][0] - path[path.length - 1][0]) < 1 &&
                               Math.abs(path[0][1] - path[path.length - 1][1]) < 1;
                const closePath = isClosed ? 'z' : '';
                svg += `<path d='M${pathString}${closePath}' style='fill:${layerColors[type]};stroke:${layerColors[type]};stroke-width:0.5' />`;
            }
        }

        if (index % 50 === 0) {
            progressCallback('converting', 'Generating SVG', { current: index, total: objects.length });
        }
    });

    // Add attribution
    svg += `<text x='${(SE[0] - 5) * 1000 * scale}' y='${(Math.abs(NW[1]) + txtSize) * 1000 * scale}' style='fill:#FF0000;font-size:${txtSize * 1000 * scale}px;text-anchor:end;font-family:Arial,sans-serif'>(c) OpenStreetMap.org contributors</text>`;
    svg += '</svg>';

    return svg;
}

// Generate DXF format
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
${layers.length + 1}
`;

    // Create layers for each enabled type
    layers.forEach(layer => {
        const layerName = layer.toUpperCase();
        const colorCode = getLayerColor(layer);
        dxf += `0
LAYER
2
${layerName}
70
0
62
${colorCode}
6
CONTINUOUS
`;
    });

    dxf += `0
LAYER
2
TEXT
70
0
62
1
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

    // Add contours if enabled
    if (layers.includes('contours') && contours && contours.contours) {
        contours.contours.forEach((cont) => {
            if (cont.length > 1) {
                dxf += `0
POLYLINE
8
CONTOURS
66
1
70
0
`;
                cont.forEach(coordinate => {
                    const x = coordinate.x * SE[0] / contours.sizeX;
                    const y = coordinate.y * Math.abs(SE[1]) / contours.sizeY;
                    dxf += `0
VERTEX
8
CONTOURS
10
${x}
20
${y}
30
0.0
`;
                });
                dxf += `0
SEQEND
8
CONTOURS
`;
            }
        });
    }

    // Add objects
    objects.forEach((obj, index) => {
        const type = obj['type'];
        const path = obj['path'];
        
        if (layers.includes(type) && path.length > 1) {
            const layerName = type.toUpperCase();
            const isClosed = ['building'].includes(type) ? '1' : '0';
            
            dxf += `0
POLYLINE
8
${layerName}
66
1
70
${isClosed}
`;
            
            // Add vertices
            path.forEach(point => {
                dxf += `0
VERTEX
8
${layerName}
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
${layerName}
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
TEXT
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

// Get layer color for DXF
function getLayerColor(layer) {
    const colors = {
        building: 0,    // black
        green: 3,       // green
        water: 5,       // blue
        waterway: 5,    // blue
        forest: 3,      // green
        farmland: 2,    // yellow
        highway: 8,     // gray
        railway: 9,     // light gray
        contours: 8,    // gray
        other: 1        // red
    };
    return colors[layer] || 1;
}

// Generate PDF format (simplified - real PDF would need jsPDF library)
function generatePDF(objects, contours, bounds, layers, zoom, scale) {
    progressCallback('converting', 'Generating PDF (SVG fallback)', { current: 0, total: objects.length });
    
    // For now, return SVG data that can be converted to PDF on the client side
    // In a full implementation, you would import jsPDF here
    const svgData = generateSVG(objects, contours, bounds, layers, zoom, scale);
    
    return svgData;
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
            contours = generateContours(hm_matrix, bounds, zoom);
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
                result = generatePDF(objects, contours, bounds, layers, zoom, scale);
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
        console.error('Plan generation error:', error);
        postMessage({ 
            type: 'error', 
            message: error.message 
        });
    }
};




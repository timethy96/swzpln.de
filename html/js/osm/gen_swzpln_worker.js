//import { osmjson2dxf } from './osmjson2dxf.js?v=1.0.0-rc2-3'; //-> module webworkers not yet implemented in Firefox

function progressCallback(task, status){
    postMessage([task,status]);
}

function getInterval(zoomLevel) {
    let interval;
    if (zoomLevel >= 18) {
        interval = 1;
    } else if (zoomLevel >= 17) {
        interval = 2;
    } else if (zoomLevel >= 16) {
        interval = 5;
    } else if (zoomLevel >= 15) {
        interval = 10;
    } else if (zoomLevel >= 14) {
        interval = 20;
    } else if (zoomLevel >= 13) {
        interval = 50;
    } else if (zoomLevel >= 12) {
        interval = 100;
    } else {
        interval = 200;
    }
    return interval;
}

onmessage = function(e) {
    const [format, osm_json, hm_matrix, bounds, layers, zoom, scale] = e.data;
    let resultString;

    //generate contours
    let contours;
    if (layers.includes('contours')) {
        // load Conrec library if not loaded yet
        if (typeof Conrec === 'undefined') {
            importScripts('../conrec/conrec.js?v=1.0.0-rc2-3');
        }
        
        // Validate hm_matrix before using it
        if (Array.isArray(hm_matrix) && hm_matrix.length > 0 && Array.isArray(hm_matrix[0]) && hm_matrix[0].length > 0) {
            const rowLength = hm_matrix[0].length;
            const isValid = hm_matrix.every(row => Array.isArray(row) && row.length === rowLength);
            
            if (isValid) {
                try {
                    let conrecInstance = new Conrec(hm_matrix);
                    let interval = getInterval(zoom);
                    contours = conrecInstance.drawContour({interval:interval,contourDrawer:'shape'});
                    contours.sizeX = conrecInstance.columns - 1;
                    contours.sizeY = conrecInstance.rows - 1;
                } catch (error) {
                    console.error('Error creating Conrec instance:', error);
                    contours = null;
                }
            } else {
                console.error('Invalid hm_matrix: not all rows have the same length');
                contours = null;
            }
        } else {
            console.error('Invalid hm_matrix: must be a non-empty 2D array');
            contours = null;
        }
    } else {
        contours = null;
    }

    switch (format) {
        case "dxf":
            importScripts('./osmjson2dxf.js?v=1.0.0-rc2-3');
            resultString = osmjson2dxf(osm_json, contours, bounds, layers, zoom, progressCallback);
            break;
    
        case "svg":
            importScripts('./osmjson2svg.js?v=1.0.0-rc2-3');
            resultString = osmjson2svg(osm_json, contours, bounds, layers, zoom, scale, progressCallback);
            break;
    
        case "pdf":
            importScripts('./osmjson2pdf.js?v=1.0.0-rc2-3');
            resultString = osmjson2pdf(osm_json, contours, bounds, layers, zoom, scale, progressCallback);
            break;
    
        default:
            break;
    }

    postMessage(['result', resultString]);
}




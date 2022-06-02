//import { osmjson2dxf } from './osmjson2dxf.js'; //-> module webworkers not yet implemented in Firefox

function progressCallback(task, status){
    postMessage([task,status]);
}

onmessage = function(e) {
    const [format, osm_json, bounds, layers, zoom] = e.data;
    let resultString;

    switch (format) {
        case "dxf":
            importScripts('./osmjson2dxf.js');
            resultString = osmjson2dxf(osm_json, bounds, layers, zoom, progressCallback);
            break;
    
        case "svg":
            importScripts('./osmjson2svg.js');
            resultString = osmjson2svg(osm_json, bounds, layers, zoom, progressCallback);
            break;
    
        case "pdf":
            importScripts('./osmjson2pdf.js');
            resultString = osmjson2pdf(osm_json, bounds, layers, zoom, progressCallback);
            break;
    
        default:
            break;
    }

    postMessage(['result', resultString]);
}




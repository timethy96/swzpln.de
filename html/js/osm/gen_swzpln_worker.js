importScripts('./osmjson2dxf.js');
//import { osmjson2dxf } from './osmjson2dxf.js'; //-> module webworkers not yet implemented in Firefox

function progressCallback(task, status){
    postMessage([task,status]);
}

onmessage = function(e) {
    const [format, osm_json, bounds, layers, zoom] = e.data;
    
    switch (format) {
        case "dxf":
            let dxfString = osmjson2dxf(osm_json, bounds, layers, zoom, progressCallback);
            postMessage(['result', dxfString]);
            break;
    
        case "svg":
            osmjson2svg(osm_json, bounds);
            break;
    
        case "pdf":
            osmjson2pdf(osm_json, bounds);
            break;
    
        default:
            break;
    }
    
}




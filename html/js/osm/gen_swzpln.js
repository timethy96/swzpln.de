import { osm_dl } from './osm_dl.js?v=1.0.0-rc2-2';
import { hm_dl } from './hm_dl.js?v=1.0.0-rc2-2';

var swzplnWorker = new Worker('/js/osm/gen_swzpln_worker.js');

function download(filename, text, mime) {
    var blob = new Blob([text], {type:mime});
    let a = document.getElementById("dl_start");
    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = [mime, a.download, a.href].join(':');
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else{    
        a.click();
    }
    /* var element = document.getElementById("dl_start");
    element.setAttribute('href', `data:${mime};charset=utf-8,` + encodeURIComponent(text));
    element.setAttribute('target', '_self');
    element.setAttribute('download', filename);
    element.click(); */
}

function bounds2array(bounds) {
    let north = bounds._northEast.lat;
    let east = bounds._northEast.lng;
    let south = bounds._southWest.lat;
    let west = bounds._southWest.lng;
    while (Math.abs(east) > 180){
        east = (Math.abs(east)-360)*(Math.abs(east)/east);
    }
    while (Math.abs(west) > 180){
        west = (Math.abs(west)-360)*(Math.abs(west)/west);
    }
    return [north, west, south, east];
}

// trigger the counter
function countUp(){
    $.ajax({url: "/c?count=1"});
}

export function cancelGen() {
    
    swzplnWorker.terminate();
}

export function estimateOsmFilesize(zoom) {
    const zoom_factor = 19 - zoom;
    const est_fs = 1.1 * 100000 * 3 ** zoom_factor;
    return est_fs;
};

export async function genSwzpln(format, bounds, layers, zoom, scale, progressCallback) {
    bounds = bounds2array(bounds);
    const osm_json = await osm_dl(bounds, layers, progressCallback);
    let hm_matrix;
    if (layers.includes('contours')) {
        progressCallback(3);
        hm_matrix = await hm_dl(bounds, progressCallback);
    } else {
        hm_matrix = null;
    }
    swzplnWorker.postMessage([format, osm_json, hm_matrix, bounds, layers, zoom, scale]);

        swzplnWorker.onmessage = function (e) {
        if (e.data[0] == 'result') {
            let result = e.data[1];
            progressCallback(7);
            countUp();

            switch (format) {
                case 'dxf':
                    download('swzpln.dxf', result, 'application/dxf');
                    break;

                case 'svg':
                    download('swzpln.svg', result, 'image/svg+xml');
                    break;

                case 'pdf':
                    console.log(result);
                    let a = document.getElementById("dl_start");
                    a.download = 'swzpln.pdf';
                    a.href = result;
                    let mime = 'application/pdf';
                    a.dataset.downloadurl = [mime, a.download, a.href].join(':');
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                        window.navigator.msSaveOrOpenBlob(result, filename);
                    } else{    
                        a.click();
                    }
                    break;
                
                default:
                    break;
            }
        } else {
            progressCallback(e.data[0], e.data[1]);
        }
    }

}


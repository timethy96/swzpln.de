import { osm_dl } from './osm_dl.js'

var swzplnWorker = new Worker('/js/osm/gen_swzpln_worker.js', { type: "module" });

function download(filename, text, mime) {
    var element = document.getElementById("dl_start");
    element.setAttribute('href', `data:${mime};charset=utf-8,` + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.click();
}

function bounds2array(bounds) {
    let north = Object.values(Object.values(bounds)[0])[0];
    let east = Object.values(Object.values(bounds)[0])[1];
    let south = Object.values(Object.values(bounds)[1])[0];
    let west = Object.values(Object.values(bounds)[1])[1];
    return [north, west, south, east];
}

export function cancelGen() {
    
    swzplnWorker.terminate();
}

export function estimateOsmFilesize(zoom) {
    const zoom_factor = 19 - zoom;
    const est_fs = 1.01 * 100000 * 3 ** zoom_factor;
    return est_fs;
};

export async function genSwzpln(format, bounds, layers, zoom, progressCallback) {
    bounds = bounds2array(bounds);
    const osm_json = await osm_dl(bounds, layers, progressCallback);
    swzplnWorker.postMessage([format, osm_json, bounds, layers, zoom]);
    swzplnWorker.onmessage = function (e) {
        if (e.data[0] == 'result') {
            let result = e.data[1];
            progressCallback(7);
            switch (format) {
                case 'dxf':
                    download('swzpln.dxf', result, 'application/dxf');
                    break;

                default:
                    break;
            }
        } else {
            progressCallback(e.data[0], e.data[1]);
        }
    }

}


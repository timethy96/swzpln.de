import {osm_dl} from './osm_dl.js'

export function estimateOsmFilesize(zoom){
    const zoom_factor = 19 - zoom;
    const est_fs = 100000 * 3**zoom_factor;
    return est_fs;
};

export async function genSwzpln(format, bounds, layers, progressCallback){
    progressCallback(0);
    const osm_json = await osm_dl(bounds, layers, progressCallback);
    console.log(osm_json);
}
importScripts('./osmjson2objarray.js', './svg.min.js');
//import { osmjson2objarray, deg2XY } from './osmjson2objarray.js'; //-> module webworkers not yet implemented in Firefox

//export function osmjson2dxf(osm_json, bounds, layers, progressCallback) { //-> module webworkers not yet implemented in Firefox
function osmjson2svg(osm_json, bounds, layers, zoom, progressCallback) {

    let objects = osmjson2objarray(osm_json, bounds, progressCallback);

    progressCallback(5, ['svg', objects.length]);

    let layerColors = {
        building: '#000000',
        green: '#9DBD7E',
        water: '#AAD4FF',
        forest: '#608156',
        farmland: '#FFEAAA',
        highway: '#828282',
        railway: '#BEBEBE',
        other: '#FF0000',
        contours: 'none'
    }

    let SE = deg2XY(bounds, bounds[0], bounds[1]);
    let NW = deg2XY(bounds, bounds[2], bounds[3]);
    let txtSize = (19 - zoom) * 10;

    var Drawing = "<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' width='"+SE[0]+"' height='"+NW[1]+"'>"

    //Drawing.text("(c) OpenStreetMap.org contributors").font({anchor: 'right', size: txtSize});

    i=0;
    objects.forEach((obj) => {
        let type = obj['type'];
        let path = obj['path'];
        if (['highway','railway','contours'].includes(type)) {
            Drawing += "<polyline points='"+path.toString()+"' style='fill:none;stroke:"+layerColors[type]+"' />"
        } else {
            Drawing += "<polygon points='"+path.toString()+"' style='fill:"+layerColors[type]+"' />"
        }

        //callback
        i += 1
        if (i % 10 == 0){
            progressCallback(6,10);
        } 
    })
      
    Drawing += "</svg>"

    let svg = Drawing;

    return svg;

}
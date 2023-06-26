importScripts('./osmjson2objarray.js?v=1.0.0-rc2-2');
//import { osmjson2objarray, deg2XY } from './osmjson2objarray.js?v=1.0.0-rc2-2'; //-> module webworkers not yet implemented in Firefox

//export function osmjson2dxf(osm_json, bounds, layers, progressCallback) { //-> module webworkers not yet implemented in Firefox
function osmjson2svg(osm_json, contours, bounds, layers, zoom, scale, progressCallback) {

    let objects = osmjson2objarray(osm_json, bounds, progressCallback);

    progressCallback(5, ['svg', objects.length]);

    let layerColors = {
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
    }
    
    let SE = deg2XY(bounds, bounds[2], bounds[3]);
    let NW = deg2XY(bounds, bounds[0], bounds[1]);
    let txtSize = (19 - zoom) * 10;

    var Drawing = "<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' width='"+(SE[0]*1000*scale)+"mm' height='"+((NW[1]+txtSize+5)*1000*scale)+"mm' viewBox='0 0 "+(SE[0]*1000*scale)+" "+((NW[1]+txtSize+5)*1000*scale)+"'>"
    

    i=0;
    objects.forEach((obj) => {
        let type = obj['type'];
        let path = obj['path'];
        for (let c = 0; c < path.length; c++) {
            path[c][0] *= 1000 * scale;
            path[c][1] = (path[c][1] - NW[1]) * -1 * 1000 * scale; //svg has Y values from top to bottom (dxf:bottom-top) --> reverse Y values
        }
        
        if (['highway','railway','contours','waterway','other'].includes(type)) {
            Drawing += "<path d='M"+path.toString()+"' style='fill:none;stroke:"+layerColors[type]+"' />"
        } else {
            Drawing += "<path d='M"+path.slice(0,-1).toString()+"z' style='fill:"+layerColors[type]+"' />"
        }

        //callback
        i += 1
        if (i % 10 == 0){
            progressCallback(6,10);
        } 
    })

    //optionally generate contours
    if (layers.includes('contours')) {
        contours.contours.forEach((cont) => {
            let path = [];
            cont.forEach((coordinate) => {
                let x = (coordinate.x * SE[0] / contours.sizeX) * 1000 * scale;
                let y = (coordinate.y * NW[1] / contours.sizeY) * 1000 * scale;
                path.push([x,y]);
            })
            Drawing += "<path d='M"+path.toString()+"' style='fill:none;stroke:"+layerColors['contours']+"' />"
        })
    }
    
    Drawing += "<text x='"+(SE[0]*1000*scale)+"' y='"+((NW[1]+txtSize)*1000*scale)+"' text-anchor='end' style='font: "+(txtSize*1000*scale)+"px sans-serif;' fill='red'>(c) OpenStreetMap.org contributors</text>"

    Drawing += "</svg>"

    let svg = Drawing;

    return svg;

}
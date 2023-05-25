importScripts('./osmjson2objarray.js?v=1.0.0-rc2-1', '/js/osm/dxf.js?v=1.0.0-rc2-1');
//import { osmjson2objarray, deg2XY } from './osmjson2objarray.js?v=1.0.0-rc2-1'; //-> module webworkers not yet implemented in Firefox

//export function osmjson2dxf(osm_json, bounds, layers, progressCallback) { //-> module webworkers not yet implemented in Firefox
function osmjson2dxf(osm_json, contours, bounds, layers, zoom, progressCallback) {

    let objects = osmjson2objarray(osm_json, bounds, progressCallback);

    progressCallback(5, ['dxf', objects.length]);
    i=0;

    let txtXY = deg2XY(bounds, bounds[2], bounds[3]);
    let maxXY = deg2XY(bounds, bounds[0], bounds[3]);
    let txtSize = (19 - zoom) * 10

    var Drawing = require('Drawing');
    let d = new Drawing();
    d.setUnits('Meters');

   
    if (layers.includes('building')) {
        d.addLayer('building', 0, 'CONTINUOUS');
    }
    if (layers.includes('green')) {
        d.addLayer('green', 73, 'CONTINUOUS');
    }
    if (layers.includes('water')) {
        d.addLayer('water', 151, 'CONTINUOUS');
    }
    if (layers.includes('waterway')) {
        d.addLayer('waterway', 151, 'CONTINUOUS');
    }
    if (layers.includes('forest')) {
        d.addLayer('forest', 85, 'CONTINUOUS');
    }
    if (layers.includes('farmland')) {
        d.addLayer('farmland', 41, 'CONTINUOUS');
    }
    if (layers.includes('highway')) {
        d.addLayer('highway', 253, 'CONTINUOUS');
    }
    if (layers.includes('railway')) {
        d.addLayer('railway', 254, 'DASHED');
    }
    if (layers.includes('contours')) {
        d.addLayer('contours', 6, 'CONTINUOUS');
    }
    d.addLayer('other', 1, 'CONTINUOUS')
         
    //add OSM contribution text
        .setActiveLayer('other')
        .drawText(txtXY[0], txtXY[1] - txtSize, txtSize, 0, '(c) OpenStreetMap.org contributors', 'right', 'top');
    

    objects.forEach((obj) => {
        let type = obj['type'];
        let path = obj['path'];
        let closeLine = false;
        if (['building'].includes(type)) {
            closeLine = true;
        }
        if (layers.includes(type)) {
            d.setActiveLayer(type);
        } else {
            console.log(obj);
            d.setActiveLayer('other');
        }
        d.drawPolyline(path, closeLine);
        //callback
        i += 1
        if (i % 10 == 0){
            progressCallback(6,10);
        } 
    })
    
    //optionally generate contours
    if (layers.includes('contours')) {
        d.setActiveLayer('contours');
        contours.contours.forEach((cont) => {
            let path = [];
            cont.forEach((coordinate) => {
                let x = coordinate.x * maxXY[0] / contours.sizeX;
                let y = Math.abs((coordinate.y * maxXY[1] / contours.sizeY) - maxXY[1]);
                path.push([x,y]);
            })
            d.drawPolyline(path, false);
        })
    }

    let dxf = d.toDxfString();

    return dxf;

}
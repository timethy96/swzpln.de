importScripts('geojson2svg.min.js');

function getDataType(obj){
    if (obj.properties.leisure == "park" || ["allotments","meadow","orchard","vineyard","cemetery","grass","plant_nursery","recreation_ground","village_green"].includes(obj.properties.landuse) || obj.properties.surface == "grass") {
        //return "green";
        return "green";
    } else if (obj.properties.building) {
        //return "black";
        return "building";
    } else if (obj.properties.natural == "water") {
        //return "blue";
        return "water";
    } else if (obj.properties.natural == "wood" || obj.properties.landuse == "forest") {
        //return "olive";
        return "forest";
    } else if (obj.properties.landuse == "farmland") {
        //return "maroon";
        return "farmland";
    } else if (obj.properties.highway) {
        //return "gray";
        return "highway";
    } else if (obj.properties.railway) {
        //return "gray";
        return "railway";
    }
}

onmessage = function(e) {

    var [gjArray, mlonA, mlatA, mlonB, mlatB, widthMeters, heightMeters, thisID] = e.data;


    if (thisID == "svgButton" || thisID == "pdfButton"){
        var svgArray = geojson2svg({
            mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
            viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            attributes: [{
                property: 'class',
                value: 'building',
                type: 'static'
              },{
                property: 'properties.leisure',
                type: 'dynamic',
                key: 'class'
              },{
                property: 'properties.surface',
                type: 'dynamic',
                key: 'class'
              },{
                property: 'properties.landuse',
                type: 'dynamic',
                key: 'class'
              },{
                property: 'properties.natural',
                type: 'dynamic',
                key: 'class'
              },{
                property: 'properties.highway',
                type: 'dynamic',
              },{
                property: 'properties.highway',
                type: 'dynamic',
                key: 'class',
              },{
                property: 'properties.railway',
                type: 'dynamic',
              },{
                property: 'properties.railway',
                type: 'dynamic',
                key: 'class',
              },],
        }).convert(gjArray);
        var svg = svgArray.join('');
        if (thisID == "svgButton") {
            postMessage(["svg", svg]);
        } else if (thisID == "pdfButton") {
            postMessage(["pdf", svg]);
        }
        

    } else if (thisID == "dwgButton"){

        var svgPathArray = geojson2svg({
            mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
            viewportSize: {width: widthMeters, height: heightMeters},
            output: 'path',
        }).convert(gjArray);

        postMessage(["setLBar", 80, "DXF-Datei erstellen..."]);
        var svgPathArrayOutput = [];
        //var svgPathArrayL = [];
        svgPathArray.forEach(function(element, index) {
            var layer = getDataType(gjArray.features[index]);
            console.log(layer);
            var svgPathArrayL = [];
            if (element.charAt(0) == "M" && element.charAt(element.length-1) == "Z"){
                eSplit = element.split("M");
                if (eSplit.length == 2){
                    svgPathArrayL.push(element.replaceAll(" "," L"));
                } else if (eSplit.length > 2){
                    eSplit.forEach(splitElem => {
                        if (splitElem.length > 0){
                            if (splitElem.charAt(splitElem.length-1) == " "){
                                splitElem = splitElem.slice(0, -1);
                            }
                            if (splitElem.charAt(splitElem.length-1) != "Z"){
                                splitElem += "Z";
                            }
                            svgPathArrayL.push("M" + splitElem.replaceAll(" "," L"));
                        }
                    })
                }
                
            } else {
                svgPathArrayL.push(element);
            };
            if (svgPathArrayOutput[layer]){
                svgPathArrayOutput[layer].push(svgPathArrayL);
            } else {
                svgPathArrayOutput[layer] = svgPathArrayL;
            }
        });
        
        postMessage(["setLBar", 90, "DXF-Datei erstellen..."]);
        importScripts('browser.maker.js');
        var makerjs = require('makerjs');
        var modelDict = {'models':{}};
        Object.entries(svgPathArrayOutput).forEach(entry => {
            const [key, layer] = entry;
            if (modelDict.models[key]){
                modelDict.models[key].push(makerjs.importer.fromSVGPathData(layer));
            } else {
                modelDict.models[key] = makerjs.importer.fromSVGPathData(layer);
            }
            
            modelDict.models[key].layer = key;
        })
        console.log(modelDict);
        postMessage(["dxf", modelDict]);
        
    }

}
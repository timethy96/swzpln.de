importScripts('geojson2svg.min.js');

onmessage = function(e) {

    var [gjArray, mlonA, mlatA, mlonB, mlatB, widthMeters, heightMeters, thisID, dataType] = e.data;

    var color = "#000000";

    switch (dataType) {
        case "buildings":
            color = "#000000"
            break;
        
        case "green":
            color = "#00FF00"
            break;
    
        case "water":
            color = "#0000FF"
            break;

        default:
            break;
    }

    if (thisID == "svgButton" || thisID == "pdfButton"){
        var svgArray = geojson2svg({
            mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
            viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            attributes: {"class": dataType, "fill": color},
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
        var svgPathArrayL = [];
        svgPathArray.forEach(element => {
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
        });
        
        postMessage(["setLBar", 90, "DXF-Datei erstellen..."]);
        importScripts('browser.maker.js');
        var makerjs = require('makerjs');
        var modelDict = {'models':{}};
        var modelDict = makerjs.importer.fromSVGPathData(svgPathArrayL);
        postMessage(["dxf", modelDict]);
    }

}
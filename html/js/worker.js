importScripts('osmtogeojson.js', 'geojson2svg.min.js', 'reproject.js');

// makes the overpass request

function getOSMdata(overpassApi, latA, lonA, latB, lonB, _callback){
    var ajaxUrl = overpassApi + `/interpreter?data=[out:json];(way["building"](${latA},${lonA},${latB},${lonB});relation["building"](${latA},${lonA},${latB},${lonB}););out body;>;out skel qt;`;
    fetch(ajaxUrl)
        .then(
            function(response) {
            if (response.status !== 200) {
                postMessage(["err", "Fehler: " + response.status + "<br/>Bitte wende dich an swzpln@bilhoefer.de"]);
                return;
            }
        
            // Examine the text in the response
            response.json().then(function(data) {
                _callback(data);
            });
            }
        )
        .catch(function(error) {
            postMessage(["err", "Fehler: " + error + "<br/>Bitte wende dich an swzpln@bilhoefer.de"]);
        });
}

// -- main download function --

onmessage = function(e) {

    var [thisID,latA,lonA,latB,lonB,mlatA,mlonA,mlatB,mlonB,heightMeters,widthMeters,overpassApi] = e.data

    getOSMdata(overpassApi,latA,lonA,latB,lonB, function(osm){
        
        postMessage(["setLBar", 40, "OSMXML in GeoJSON konvertieren..."]);

        //convert osmxml to geojson for further processing 
        var gjson = osmtogeojson(osm);
        var mgjson = reproject(gjson);

        postMessage(["setLBar", 60, "GeoJSON in SVG konvertieren..."]);

        //button chooser
        if (thisID == "svgButton"){

            var svgArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            }).convert(mgjson);

            postMessage(["setLBar", 80, "SVG-Datei erstellen..."]);
            

            var svg = svgArray.join('');
            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters}mm" height="${heightMeters}mm" xmlns="http://www.w3.org/2000/svg">` + svg + '</svg>';
            
            postMessage(["setLBar", 100, "Download starten..."]);
            postMessage(["download", "svg", svgFile]);
            

        } else if (thisID == "dwgButton"){

            var svgPathArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters, height: heightMeters},
                output: 'path',
            }).convert(mgjson);

            postMessage(["setLBar", 80, "DXF-Datei erstellen..."]);

            svgPathArrayL = [];
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
            postMessage(["setLBar", 85, "DXF-Datei erstellen..."]);
            importScripts('browser.maker.js');
            var makerjs = require('makerjs');
            var modelDict = {'models':{}};
            var modelDict = makerjs.importer.fromSVGPathData(svgPathArrayL);
            postMessage(["setLBar", 90, "DXF-Datei erstellen..."]);
            var dxfString = makerjs.exporter.toDXF(modelDict, {"units":"meter","usePOLYLINE":true});
            
            postMessage(["setLBar", 100, "Download starten..."]);
            postMessage(["download", "dxf", dxfString]);

        } else if (thisID == "pdfButton"){
            

            var svgArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            }).convert(mgjson);

            postMessage(["setLBar", 80, "PDF-Datei erstellen..."]);
            

            var svg = svgArray.join('');
            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters * 3.7795}" height="${heightMeters * 3.7795}" xmlns="http://www.w3.org/2000/svg">` + svg + '</svg>';
            
            postMessage(["download", "pdf", svgFile, widthMeters, heightMeters]);

        };
        
    });
    
};
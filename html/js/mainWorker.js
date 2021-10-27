importScripts('subworkers.js', 'osmtogeojson.js', 'reproject.js');

// makes the overpass request

async function getOSMdata(overpassApi, latA, lonA, latB, lonB, dataArray, _callback){
    // ajax request as shown at https://javascript.info/fetch-progress
    var ajaxUrl = overpassApi + `/interpreter?data=[out:json][bbox:${latA},${lonA},${latB},${lonB}];(`;
    dataArray.forEach((dataType) => {
        switch (dataType) {
            case "buildings":
                ajaxUrl += 'nwr["building"];';
                break;
    
            case "green":
                ajaxUrl += 'nwr["leisure"="park"];';
                ajaxUrl += 'nwr["surface"="grass"];';
                ajaxUrl += 'nwr["landuse"="allotments"];';
                ajaxUrl += 'nwr["landuse"="meadow"];';
                ajaxUrl += 'nwr["landuse"="orchard"];';
                ajaxUrl += 'nwr["landuse"="vineyard"];';
                ajaxUrl += 'nwr["landuse"="cemetery"];';
                ajaxUrl += 'nwr["landuse"="grass"];';
                ajaxUrl += 'nwr["landuse"="plant_nursery"];';
                ajaxUrl += 'nwr["landuse"="recreation_ground"];';
                ajaxUrl += 'nwr["landuse"="village_green"];';
                break;
    
            case "water":
                ajaxUrl += 'nwr["natural"="water"];';
                break;
            
            case "forest":
                ajaxUrl += 'nwr["landuse"="forest"];';
                ajaxUrl += 'nwr["natural"="wood"];';
                break;

            case "farmland":
                ajaxUrl += 'nwr["landuse"="farmland"];';
                break;

            case "highways":
                ajaxUrl += 'nwr["highway"];';
                break;

            case "railway":
                ajaxUrl += 'nwr["railway"];';
                break;
        
            default:
                break;
        };
    });
    ajaxUrl += ');out body;>;out skel qt;';
    let response = await fetch(ajaxUrl);
    const reader = response.body.getReader();
    //const contentLength = +response.headers.get('Content-Length');
    let receivedLength = 0;
    let chunks = [];
    while(true) {
        const {done, value} = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        receivedLength += value.length;
        postMessage(["DLstat", receivedLength]);
    }
    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for(let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }
    let result = new TextDecoder("utf-8").decode(chunksAll);
    _callback(JSON.parse(result));
}

// define svg-layer colors
const style = `
<style>
    .water {
        fill: #42698c;
    }
    .park, .grass, .allotments, .meadow, .orchard, .vineyard, .cemetery, .grass, .plant_nursery, .recreation_ground, .village_green {
        fill: #61993b;
    }
    .wood, .forest {
        fill: #194d25;
    }
    .farmland {
        fill: #cdba88;
    }
    path[highway] {
        fill:none;
        stroke: darkgrey;
        stroke-width: 2px;
    }
    path[railway] {
        fill:none;
        stroke: grey;
        stroke-width: 1px;
    }
</style>
`


// -- main download function --


onmessage = function(e) {

    const [thisID,latA,lonA,latB,lonB,mlatA,mlonA,mlatB,mlonB,heightMeters,widthMeters,overpassApi, dataArray] = e.data

    getOSMdata(overpassApi,latA,lonA,latB,lonB,dataArray, function(osm){
        
        postMessage(["setLBar", 40, "OSMXML in GeoJSON konvertieren..."]);

        //convert osmxml to geojson for further processing 
        const gjson = osmtogeojson(osm);
        const mgjson = reproject(gjson);

        console.log(mgjson);

        var workersLen = Math.ceil(mgjson.features.length / 1000);
        if (workersLen > 8){
            var workersLen = 8;
        };
        var oneStep = Math.ceil(mgjson.features.length / workersLen);

        allWorkers = [];
        resultArray = [];

        for (var i=0; i < mgjson.features.length; i += oneStep){
            newDict = {"type":"FeatureCollection", "features":""};
            newDict.features = mgjson.features.slice(i,i+oneStep);
            var worker = new Worker('subWorker.js');
            worker.postMessage([newDict, mlonA, mlatA, mlonB, mlatB, widthMeters, heightMeters, thisID])
            allWorkers.push(worker);
        }

        postMessage(["setLBar", 60, "GeoJSON in SVG konvertieren..."]);


        allWorkers.forEach(workerR => {
            workerR.onmessage = function(f){
                if (f.data[0] == "setLBar"){
                    postMessage(["setLBar", f.data[1], f.data[2]]);
                } else {
                    resultArray.push(f.data[1]);
                    if (resultArray.length == workersLen){
                        if (f.data[0] == "svg") {
                            postMessage(["setLBar", 80, "SVG-Datei erstellen..."]);
                            var svg = resultArray.join("");
                            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters}mm" height="${heightMeters}mm" xmlns="http://www.w3.org/2000/svg">` + style + svg + '</svg>';
                            postMessage(["setLBar", 100, "Download starten..."]);
                            postMessage(["download", "svg", svgFile]);
                        } else if (f.data[0] == "dxf") {
                            importScripts('browser.maker.js');
                            var makerjs = require('makerjs');
                            var modelDict = {"models":{}};
                            var i = 0;
                            resultArray.forEach(element => {
                                modelDict["models"][i] = element;
                                i++;
                            });
                            postMessage(["setLBar", 95, "DXF-Datei erstellen..."]);
                            var dxfString = makerjs.exporter.toDXF(modelDict, {"units":"meter","usePOLYLINE":true});
                            postMessage(["setLBar", 100, "Download starten..."]);
                            postMessage(["download", "dxf", dxfString]);
                        } else if (f.data[0] == "pdf") {
                            var svg = resultArray.join('');
                            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters * 3.7795}" height="${heightMeters * 3.7795}" xmlns="http://www.w3.org/2000/svg">` + style + svg + '</svg>';
                            postMessage(["download", "pdf", svgFile, widthMeters, heightMeters]);
                        }
                    } 
                }
                
            }
            
        });
        
                

        
    });

            
    
    
};
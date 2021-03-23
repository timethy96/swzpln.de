// --- define Variables ---

var overpassApi = "https://overpass.kumi.systems/api/"

var map = L.map('map').setView([48.775,9.187], 12);

var tiles = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

var cError = false;

// --- define Leaflet Map ---

map.on('zoomend',function(){
    if (map.getZoom() < 11){
        $('#svgButton').addClass('greyedOut');
        $('#pdfButton').addClass('greyedOut');
    } else if (map.getZoom() >= 11) {
        $('#svgButton').removeClass('greyedOut');
        $('#pdfButton').removeClass('greyedOut');
    };
    if (map.getZoom() < 11) {
        $('#dwgButton').addClass('greyedOut');
    } else if (map.getZoom() >= 11) {
        $('#dwgButton').removeClass('greyedOut');
    };
})


// --- functions for the imprint ---

$("#openLegal").click(function(){
    $("#legal").css("top","0");
});

$("#closeLegal").click(function(){
    $("#legal").css("top","100vh");
});

$("#backlink").click(function(){
    $("#dllink").off("click");
    $("#processing").fadeOut();
    $("#finish").fadeOut(function(){
        setTimeout(function(){
            $("#map").fadeIn();
            $(".cButtons").fadeIn();
        }, 200);
    });
})



// --- converting functions ---

// throw error on converting

window.onerror = function (msg, url, lineNo, columnNo, error) {
    $("#statusStep").html("Fehler: " + msg + "<br/>Bitte wende dich an swzpln ø bilhoefer · de");
    cError = "Fehler: " + msg + "<br/>Bitte wende dich an swzpln ø bilhoefer · de";
    return false;
  }

// -- helper functions --

// convert degrees to meter

function degToMeter(lat1, lat2, lon1, lon2) {
    var R = 6371000; // meter
    var dLat = ((lat2-lat1) * Math.PI) / 180;
    var dLon = ((lon2-lon1) * Math.PI) / 180; 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

// convert geographic to web mercator projection

function geographic_to_web_mercator(y_lat, x_lon){
        num = x_lon * 0.017453292519943295;
        x = 6378137.0 * num;
        a = y_lat * 0.017453292519943295;
        x_mercator = x;
        y_mercator = 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
        return [y_mercator, x_mercator];
}

// serve any text as file (download)

function download(filename, text, mime) {
    var element = document.getElementById("dllink");
    element.setAttribute('href', `data:${mime};charset=utf-8,` + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.click();
}

// trigger the counter

function countUp(){
    $.ajax({url: "count.php?count=1"});
}

// makes the overpass request

function getOSMdata(latA, lonA, latB, lonB, _callback){
    var ajaxUrl = overpassApi + `/interpreter?data=(way["building"](${latA},${lonA},${latB},${lonB});relation["building"](${latA},${lonA},${latB},${lonB}););out body;>;out skel qt;`;
    $.ajax({
        url: ajaxUrl,
      })
        .fail(function(x, y, error){
            $("#statusStep").html("Fehler: " + error + "<br/>Bitte wende dich an swzpln@bilhoefer.de");
        })
        .done(function( data ) {
          _callback(data);
        });
}

// set the status on the loading bar
function setLBar(percent, string){
    //ensures, that the error persists
    if (!cError){
        // set Timeout for smooth animations
        setTimeout(function(){
            $("#sBar").css("width",`${percent}%`);
            $("#statusPercent").html(percent);
            $("#statusStep").html(string);
        },percent*20);
    } else {
        $("#sBar").css("width",`0%`);
            $("#statusPercent").html("XX");
            $("#statusStep").html("Fehler: " + msg + "<br/>Bitte wende dich an swzpln ø bilhoefer · de");
    }
}


// -- main download function --

$(".cButtons").click(function() {
    
    // trigger counter
    countUp();

    var thisID = this.id;

    //show the loading bar
    $("#map").fadeOut();
    $(".cButtons").fadeOut(function(){
        setTimeout(function(){
            $("#processing").fadeIn();
        }, 200);
    });
    
    setLBar(0,"Koordinaten berechenen...");

    //set all the needed vars
    var latB = map.getBounds().getNorth();
    var lonA = map.getBounds().getWest();
    var latA = map.getBounds().getSouth();
    var lonB = map.getBounds().getEast();
    var m1 = geographic_to_web_mercator(latA, lonA);
    var m2 = geographic_to_web_mercator(latB, lonB);
    var mlatA = m1[0];
    var mlonA = m1[1];
    var mlatB = m2[0];
    var mlonB = m2[1];
    var heightMeters = degToMeter(latA, latB, lonA, lonA); //same lon for height!
    var widthMeters = degToMeter(latA, latA, lonA, lonB); //same lat for width!

    setLBar(20,"Kartendaten herunterladen... (Dies kann bei großen Ausschnitten ein Weilchen dauern!)");

    getOSMdata(latA,lonA,latB,lonB, function(osm){
        
        setLBar(40,"OSMXML in GeoJSON konvertieren...")      

        //convert osmxml to geojson for further processing 
        var gjson = osmtogeojson(osm);
        var mgjson = reproject(gjson);

        setLBar(60,"GeoJSON in SVG konvertieren...");

        //button chooser
        if (thisID == "svgButton"){

            var svgArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            }).convert(mgjson);

            setLBar(80,"SVG-Datei erstellen...");

            var svg = svgArray.join('');
            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters}mm" height="${heightMeters}mm" xmlns="http://www.w3.org/2000/svg">` + svg + '</svg>';
            
            setLBar(100,"Download starten...");
            download('swzpln.de.svg', svgFile, "image/svg+xml");
            setTimeout(function(){
                $("#processing").fadeOut();
                $("#finish").fadeIn();
            }, 2000);
            

        } else if (thisID == "dwgButton"){

            var svgPathArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters, height: heightMeters},
                output: 'path',
            }).convert(mgjson);

            setLBar(80,"DXF-Datei erstellen...");

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
            var makerjs = require('makerjs');
            var modelDict = {'models':{}};
            var modelDict = makerjs.importer.fromSVGPathData(svgPathArrayL);
            var dxfString = makerjs.exporter.toDXF(modelDict, {"units":"meter","usePOLYLINE":true});
            
            setLBar(100,"Download starten...");
            download('swzpln.de.dxf', dxfString, "application/dxf");
            setTimeout(function(){
                $("#processing").fadeOut();
                $("#finish").fadeIn();
            }, 2000);

        } else if (thisID == "pdfButton"){
            
            const { jsPDF } = window.jspdf
            

            var svgArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            }).convert(mgjson);

            setLBar(80,"PDF-Datei erstellen...");
            

            var svg = svgArray.join('');
            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters * 3.7795}" height="${heightMeters * 3.7795}" xmlns="http://www.w3.org/2000/svg">` + svg + '</svg>';
            
            $("#tempsvg").html(svgFile);

            const svgElement = document.getElementById('tempsvg').firstElementChild;

            const svgwidth = widthMeters * 3.7795;
            const svgheight = heightMeters * 3.7795;
            const pdf = new jsPDF(svgwidth > svgheight ? 'l' : 'p', 'pt', [svgwidth, svgheight]);
            pdf.svg(svgElement, { svgwidth, svgheight }).then(() => {
                // save the created pdf
                setLBar(100,"Download starten...");
                pdf.save('swzpln.de.pdf');
                setTimeout(function(){
                    $("#processing").fadeOut(function(){
                        setTimeout(function(){
                            $("#finish").fadeIn(); 
                        }, 200);
                    });
                    var $dllink = $("#dllink");
                    $dllink.attr('href', 'javascript:');
                    $dllink.removeAttr('download');
                    $dllink.click(function(){
                        pdf.save('swzpln.de.pdf');
                    });
                }, 2000);
            })

            
            
        };
        
    });
    
});

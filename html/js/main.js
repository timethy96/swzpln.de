var overpassApi = "https://overpass.kumi.systems/api/"

var map = L.map('map').setView([48.775,9.187], 12);

var tiles = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);


window.onerror = function (msg, url, lineNo, columnNo, error) {
    $("#statusStep").html("Fehler: " + msg + "<br/>Bitte wende dich an swzpln ø bilhoefer · de");
    return false;
  }

map.on('zoomend',function(){
    if (map.getZoom() < 11){
        $('#svgButton').addClass('greyedOut');
        $('#pdfButton').addClass('greyedOut');
    } else if (map.getZoom() >= 11) {
        $('#svgButton').removeClass('greyedOut');
        $('#pdfButton').removeClass('greyedOut');
    };
    if (map.getZoom() < 15) {
        $('#dwgButton').addClass('greyedOut');
    } else if (map.getZoom() >= 15) {
        $('#dwgButton').removeClass('greyedOut');
    };
})

function degToMeter(lat1, lat2, lon1, lon2) {
    var R = 6371000; // meter
    var dLat = ((lat2-lat1) * Math.PI) / 180;
    var dLon = ((lon2-lon1) * Math.PI) / 180; 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

function geographic_to_web_mercator(y_lat, x_lon){
        num = x_lon * 0.017453292519943295;
        x = 6378137.0 * num;
        a = y_lat * 0.017453292519943295;
        x_mercator = x;
        y_mercator = 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
        return [y_mercator, x_mercator];
}

function download(filename, text) {
    var element = document.getElementById("dllink");
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.click();
}

function countUp(){
    $.ajax({url: "count.php?count=1"});
}

function getOSMdata(latA, lonA, latB, lonB, _callback){
    var ajaxUrl = overpassApi + `/interpreter?data=way["building"](${latA},${lonA},${latB},${lonB});out;>;out qt;`;
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

$(".cButtons").click(function() {
    
    countUp();
    var thisID = this.id;
    $("#map").fadeOut();
    $(".cButtons").fadeOut(function(){
        setTimeout(function(){
            $("#processing").fadeIn();
        }, 200);
    });
    

    $("#sBar").css("width","0%");
    $("#statusPercent").html("0");
    $("#statusStep").html("Koordinaten berechenen...");

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

    setTimeout(function(){
        $("#sBar").css("width","20%");
        $("#statusPercent").html("20");
        $("#statusStep").html("Kartendaten herunterladen... (Dies kann bei großen Ausschnitten ein Weilchen dauern!)");
    }, 1000);
    

    getOSMdata(latA,lonA,latB,lonB, function(osm){
        
        setTimeout(function(){
            $("#sBar").css("width","40%");
            $("#statusPercent").html("40");
            $("#statusStep").html("OSMXML in GeoJSON konvertieren...");
        }, 1200);
        
        

        var gjson = osmtogeojson(osm);
        var mgjson = reproject(gjson);
        if (thisID == "svgButton"){

            setTimeout(function(){
                $("#sBar").css("width","60%");
                $("#statusPercent").html("60");
                $("#statusStep").html("GeoJSON in SVG konvertieren...");
            }, 1600);
            

            var svgArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            }).convert(mgjson);

            setTimeout(function(){
                $("#sBar").css("width","80%");
                $("#statusPercent").html("80");
                $("#statusStep").html("SVG-Datei erstellen...");
            }, 1800);
            

            var svg = svgArray.join('');
            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters}mm" height="${heightMeters}mm" xmlns="http://www.w3.org/2000/svg">` + svg + '</svg>';
            

            setTimeout(function(){
                $("#sBar").css("width","100%");
                $("#statusPercent").html("100");
                $("#statusStep").html("Download starten...");
                download('swzpln.de.svg', svgFile);
                setTimeout(function(){
                    $("#processing").fadeOut();
                    $("#finish").fadeIn();
                }, 2000);
            }, 2000);
            

        } else if (thisID == "dwgButton"){

            setTimeout(function(){
                $("#sBar").css("width","60%");
                $("#statusPercent").html("60");
                $("#statusStep").html("GeoJSON in SVG konvertieren...");
            }, 1600);

            var svgPathArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters, height: heightMeters},
                output: 'path',
            }).convert(mgjson);

            setTimeout(function(){
                $("#sBar").css("width","80%");
                $("#statusPercent").html("80");
                $("#statusStep").html("DXF-Datei erstellen...");
            }, 1800);

            svgPathArrayL = [];
            svgPathArray.forEach(element => {
                svgPathArrayL.push(element.replace(/(?<=^M.*) (?=.*Z$)/gm," L"));
            });
            var makerjs = require('makerjs');
            var modelDict = {'models':{}};
            var modelDict = makerjs.importer.fromSVGPathData(svgPathArrayL);
            var dxfString = makerjs.exporter.toDXF(modelDict, {"units":"meter","usePOLYLINE":true});
            

            setTimeout(function(){
                $("#sBar").css("width","100%");
                $("#statusPercent").html("100");
                $("#statusStep").html("Download starten...");
                download('swzpln.de.dxf', dxfString);
                setTimeout(function(){
                    $("#processing").fadeOut();
                    $("#finish").fadeIn();
                }, 2000);
            }, 200);

        } else if (thisID == "pdfButton"){
            
            const { jsPDF } = window.jspdf

            setTimeout(function(){
                $("#sBar").css("width","60%");
                $("#statusPercent").html("60");
                $("#statusStep").html("GeoJSON in SVG konvertieren...");
            }, 1600);
            

            var svgArray = geojson2svg({
                mapExtent: {left: mlonA, bottom: mlatA, right: mlonB, top: mlatB},
                viewportSize: {width: widthMeters * 3.7795, height: heightMeters * 3.7795},
            }).convert(mgjson);

            setTimeout(function(){
                $("#sBar").css("width","80%");
                $("#statusPercent").html("80");
                $("#statusStep").html("PDF-Datei erstellen...");
            }, 1800);
            

            var svg = svgArray.join('');
            var svgFile = `<svg version="1.1" baseProfile="full" width="${widthMeters * 3.7795}" height="${heightMeters * 3.7795}" xmlns="http://www.w3.org/2000/svg">` + svg + '</svg>';
            
            $("#tempsvg").html(svgFile);

            const svgElement = document.getElementById('tempsvg').firstElementChild;

            const svgwidth = widthMeters * 3.7795;
            const svgheight = heightMeters * 3.7795;
            const pdf = new jsPDF(svgwidth > svgheight ? 'l' : 'p', 'pt', [svgwidth, svgheight]);
            pdf.svg(svgElement, { svgwidth, svgheight }).then(() => {
                // save the created pdf
                setTimeout(function(){
                    $("#sBar").css("width","100%");
                    $("#statusPercent").html("100");
                    $("#statusStep").html("Download starten...");
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
                }, 2000);
                
            })

            
            
        };
        
    });
    
});

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

// --- define Variables ---
var overpassApi = "https://overpass.kumi.systems/api/";

var cError = false;

const mainWorker = new Worker('js/mainWorker.js');

var msg = "";

// - init map & load last position -
var lastPos = Cookies.get('lastCenter');
if(lastPos) {
    lastPos = JSON.parse(lastPos);
    var lastCenter = [lastPos[0],lastPos[1]];
    var lastZoom = lastPos[2];
    var map = L.map('map').setView(lastCenter, lastZoom);
    if (lastZoom < 10){
        $('#svgButton').addClass('greyedOut');
        $('#pdfButton').addClass('greyedOut');
        $('#dwgButton').addClass('greyedOut');
    } else if (lastZoom >= 10) {
        $('#svgButton').removeClass('greyedOut');
        $('#pdfButton').removeClass('greyedOut');
        $('#dwgButton').removeClass('greyedOut');
    };
} else {
    var map = L.map('map').setView([48.775,9.187], 12);
}
var options = Cookies.get('options');
if(options) {
    options = JSON.parse(options);
    $.each( $('.layerCheckbox') , function(){
        if (options.includes($(this).attr('value'))){
            $(this).attr("checked", true);
        };
    });
};


var tiles = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// - save position cookie - 
function savePosCookie(){
    var curPos = map.getCenter();
    var curZoom = map.getZoom();
    window.Cookies.set('lastCenter', JSON.stringify([curPos.lat, curPos.lng, curZoom]), { sameSite:'strict' });
}
map.on('moveend',savePosCookie);
map.on('zoomend',savePosCookie);


// Search
var searchInput = $('#searchField');
$('#searchForm').on('submit', function(e) {
    e.preventDefault();
    var query = new URLSearchParams;
    query.append('q', searchInput.val());
    query.append('format', 'json');
    searchInput.val('');
    searchInput.attr('placeholder','Ort suchen...');
    $('#map').focus();
    fetch('https://nominatim.openstreetmap.org/search?' + query.toString())
        .then((res) => res.json())
        .then((json) => {
        if (json[0]){
            map.fitBounds([
                [json[0].boundingbox[0], json[0].boundingbox[2]],
                [json[0].boundingbox[1], json[0].boundingbox[3]],
            ]);
            if (map.getZoom() < 10){
                $('#svgButton').addClass('greyedOut');
                $('#pdfButton').addClass('greyedOut');
                $('#dwgButton').addClass('greyedOut');
            } else if (map.getZoom() >= 10) {
                $('#svgButton').removeClass('greyedOut');
                $('#pdfButton').removeClass('greyedOut');
                $('#dwgButton').removeClass('greyedOut');
            };
            savePosCookie();
        } else {
            searchInput.attr('placeholder','Ort nicht gefunden!');
        }
        
    });
});
// --- define Leaflet Map functions ---

map.on('zoomend',function(){
    if (map.getZoom() < 10){
        $('#svgButton').addClass('greyedOut');
        $('#pdfButton').addClass('greyedOut');
        $('#dwgButton').addClass('greyedOut');
    } else if (map.getZoom() >= 10) {
        $('#svgButton').removeClass('greyedOut');
        $('#pdfButton').removeClass('greyedOut');
        $('#dwgButton').removeClass('greyedOut');
    };
});



// --- functions for the imprint ---

$("#openLegal").click(function(){
    $("#legal").css("top","0");
});

$("#closeLegal").click(function(){
    $("#legal").css("top","100vh");
});

$(".backlinks").click(function(){
    $("#dllink").off("click");
    $("#processing").fadeOut();
    $("#finish").fadeOut(function(){
        setTimeout(function(){
            $("#mapCont").fadeIn();
            $(".cButtons").fadeIn();
            $("#searchForm").fadeIn();
            tiles.redraw();
        }, 200);
    });
})



// --- converting functions ---
// throw error on converting

window.onerror = function (msgi, url, lineNo, columnNo, error) {
    if (msgi != "TypeError: undefined is not a function (near '...[thisID,latA,lonA,latB,lonB,mlatA,mlonA,mlatB,mlonB,heightMeters,widthMeters,overpassApi]...')"){ // why? because this error happens everytime in safari and I think it has something to to with the way that the polyfill works... just ignore that error and it still works fine!
        msg = msgi
        $("#statusStep").html("Fehler: " + msg + "<br/>Bitte wende dich an swzpln ø bilhoefer · de");
        cError = "Fehler: " + msg + "<br/>Bitte wende dich an swzpln ø bilhoefer · de";
        return false;
    }
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
    $.ajax({url: "https://swzpln.de/counter?count=1"});
}


// set the status on the loading bar
function setLBar(percent, string){
    //ensures, that the error persists
    // set Timeout for smooth animations
    setTimeout(function(){
        if (!cError){
            $("#sBar").css("width",`${percent}%`);
            $("#statusPercent").html(percent);
            $("#statusStep").html(string);        
        } else {
            $("#sBar").css("width",`0%`);
            $("#statusPercent").html("XX");
            $("#statusStep").html("Fehler: " + msg + "<br/>Bitte wende dich an swzpln ø bilhoefer · de");
        }
    },percent*20);
}

//check which data is requested

function getReqData() {
    var dataArray = [];
    $.each( $('.layerCheckbox') , function(){
        if ($(this).is(':checked')){
            dataArray.push($(this).attr('value'));
        }
    });
    return dataArray;
}




// -- main download function --

$(".cButtons").click(function() {
    
    $('#options').removeClass('opened');
    $('#map').removeClass('withOptions');

    // trigger counter
    countUp();

    var thisID = this.id;

    //show the loading bar
    $("#mapCont").fadeOut();
    $("#searchForm").fadeOut();
    $(".cButtons").fadeOut(function(){
        setTimeout(function(){
            $("#processing").fadeIn();
        }, 200);
    });
    
    setLBar(0,"Koordinaten berechnen...");

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

    var dataArray = getReqData();
    mainWorker.postMessage([thisID,latA,lonA,latB,lonB,mlatA,mlonA,mlatB,mlonB,heightMeters,widthMeters,overpassApi,dataArray]);

});


mainWorker.onmessage = function(e) {
    if (e.data[0] == "setLBar"){
        setLBar(e.data[1],e.data[2]);
    } else if (e.data[0] == "DLstat") {
        var megabytes = (e.data[1] / 1048576).toPrecision(3);
        setLBar(20,`Kartendaten herunterladen... (${megabytes} MB heruntergeladen)`);
    } else if (e.data[0] == "download"){
        if (e.data[1] == "svg") {
            download('swzpln.de.svg', e.data[2], "image/svg+xml");
            setTimeout(function(){
                $("#processing").fadeOut();
                $("#finish").fadeIn();
            }, 2000);
        } else if (e.data[1] == "dxf") {
            download('swzpln.de.dxf', e.data[2], "application/dxf");
            setTimeout(function(){
                $("#processing").fadeOut();
                $("#finish").fadeIn();
            }, 2000);
        } else if (e.data[1] == "pdf") {
            const { jsPDF } = window.jspdf

            $("#tempsvg").html(e.data[2]);
            var widthMeters = e.data[3];
            var heightMeters = e.data[4];

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
        }
    } else if (e.data[0] == "err") {
        $("#statusStep").html(e.data[1]);
        cError = e.data[1];
    }
}

$(".layerCheckbox").click(function() {
    window.Cookies.set('options', JSON.stringify(getReqData()), { sameSite:'strict' });
});

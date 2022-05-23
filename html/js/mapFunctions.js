import { getCookie, setCookie } from "./jsCookie.js";

// - save position cookie - 
function savePosCookie() {
    var curPos = map.getCenter();
    var curZoom = map.getZoom();
    setCookie('lastCenter', JSON.stringify([curPos.lat, curPos.lng, curZoom]), 30);
}

// - init map & load last position -
export function initMap(elemID) {
    var lastPos = getCookie('lastCenter');
    if (lastPos) {
        lastPos = JSON.parse(lastPos);
        var lastCenter = [lastPos[0], lastPos[1]];
        var lastZoom = lastPos[2];
        var map = L.map(elemID).setView(lastCenter, lastZoom);
        if (lastZoom < 11) {
            $('#dl_b').addClass('inactive');
        } else if (lastZoom >= 11) {
            $('#dl_b').removeClass('inactive');
        };
    } else {
        var map = L.map(elemID).setView([48.775, 9.187], 12);
    }

    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);


    map.on('moveend', savePosCookie);
    map.on('zoomend', savePosCookie);

    map.on('zoomend', function () {
        if (map.getZoom() < 11) {
            $('#dl_b').addClass('inactive');
        } else if (map.getZoom() >= 11) {
            $('#dl_b').removeClass('inactive');
        };
    });
    return map
}

export function initSearch(searchForm) {
    if ($(searchForm).attr('data-searchstate') != 'init') {
        $(searchForm).attr('data-searchstate', 'init')
        var searchInput = $(searchForm).children('input');
        $(searchForm).on('submit', function (e) {
            e.preventDefault();
            var query = new URLSearchParams;
            query.append('q', searchInput.val());
            query.append('format', 'json');
            searchInput.val('');
            $('#map').focus();
            fetch('https://nominatim.openstreetmap.org/search?' + query.toString())
                .then((res) => res.json())
                .then((json) => {
                    if (json[0]) {
                        map.fitBounds([
                            [json[0].boundingbox[0], json[0].boundingbox[2]],
                            [json[0].boundingbox[1], json[0].boundingbox[3]],
                        ]);
                        if (map.getZoom() < 11) {
                            $('#dl_b').addClass('inactive');
                        } else if (map.getZoom() >= 11) {
                            $('#dl_b').removeClass('inactive');
                        };
                        savePosCookie();
                    } else {
                        searchInput.addClass('error');
                    }

                });
        });
    }

}
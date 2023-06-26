import { getCookie, setCookie } from "./jsCookie.js?v=1.0.0-rc2-2";

// - save position cookie - 
function savePosCookie() {
    let curPos = map.getCenter();
    let curZoom = map.getZoom();
    setCookie('lastCenter', JSON.stringify([curPos.lat, curPos.lng, curZoom]), 30);
}

// - calc contour lines interval on zoom -
function getInterval(zoomLevel) {
    let interval;
    if (zoomLevel >= 18) {
        interval = 1;
    } else if (zoomLevel >= 17) {
        interval = 2;
    } else if (zoomLevel >= 16) {
        interval = 5;
    } else if (zoomLevel >= 15) {
        interval = 10;
    } else if (zoomLevel >= 14) {
        interval = 20;
    } else if (zoomLevel >= 13) {
        interval = 50;
    } else if (zoomLevel >= 12) {
        interval = 100;
    } else {
        interval = 200;
    }
    return interval;
}

// - init map & load last position -
export function initMap(elemID, initCity = "") {
    let map = L.map(elemID);
    $('#map_p').hide();
    let lastPos = getCookie('lastCenter');
    if (lastPos && ! initCity) {
        lastPos = JSON.parse(lastPos);
        let lastCenter = [lastPos[0], lastPos[1]];
        let lastZoom = lastPos[2];
        map.setView(lastCenter, lastZoom);
        if (lastZoom < 11) {
            $('#dl_b').addClass('inactive');
        } else if (lastZoom >= 11) {
            $('#dl_b').removeClass('inactive');
        };        
    } else if (initCity){
        let query = new URLSearchParams;
        query.append('q', initCity);
        query.append('format', 'json');
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
                    map.setView([48.775, 9.187], 12);
                }
            })
    } else {
        map.setView([48.775, 9.187], 12);
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
        let interval = getInterval(map.getZoom());
        $('#cl_interval').html(interval);
    });

    map.on('zoomend', () => { $('#dl_b_c').removeClass('active'); });

    let interval = getInterval(map.getZoom());
    $('#cl_interval').html(interval);

    return map
}

export function initSearch(searchForm) {
    if ($(searchForm).attr('data-searchstate') != 'init') {
        let searchInput = $(searchForm).children('input');
        $(searchForm).on('submit', function (e) {
            e.preventDefault();
            let query = new URLSearchParams;
            query.append('q', searchInput.val());
            query.append('format', 'json');
            searchInput.val('');
            $('#map').focus();
            fetch('https://nominatim.openstreetmap.org/search?' + query.toString())
                .then((res) => res.json())
                .then((json) => {
                    if (json[0]) {
                        searchInput.removeClass('error');
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
                        $('header').removeClass('active');
                        $('header').addClass('inactive');
                    } else {
                        searchInput.addClass('error');
                    }

                });
        });
        $(searchForm).attr('data-searchstate', 'init')
        $('#search_b').removeClass('inactive');
    }

}
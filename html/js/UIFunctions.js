import {initMap, initSearch} from "./mapFunctions.js?v=1.0.0-rc2-2";
import { setCookie, getCookie } from "./jsCookie.js?v=1.0.0-rc2-2";
import { genSwzpln, estimateOsmFilesize, cancelGen } from "./osm/gen_swzpln.js?v=1.0.0-rc2-2";
import { progressBar } from './progressBar.js?v=1.0.0-rc2-2';
import { getScales } from './osm/getScales.js?v=1.0.0-rc2-2';

function getLayers(){
    let layers = [];
    $('#layers input:checked').each((index, layer) => {
        const layer_name = $(layer).attr('value');
        layers.push(layer_name);
    })
    return layers;
}

export function initUI() {
    //hide SEO Tags
    $('#menu_tags').hide();
    $('#menu_city').hide();
    let initCity = $('#menu_city').html();

    //check if privacy agreement was accepted
    if (getCookie('privacy_accepted') == 'true') {
        window.map = initMap('map', initCity);
        initSearch('#search_form'); //init search by passing search-form id
    } else {
        $('#map_p p').show();
        $('#map_p_b').show();
        $('#map_p_b').click(() => {
            setCookie('privacy_accepted', 'true', 30);
            // initialize the map view, by passing the ID of the map container to the function
            window.map = initMap('map', initCity);
            initSearch('#search_form'); //init search by passing search-form id
        })    
    }

    //open legal
    $('.open_privacy').click(() => {
        $("#legal").addClass('active');
        $("#legal").load("/legal/index.php");
    })
   
    //open search
    $('#search_b').click(() => {
        if ($('header').hasClass('active')){
            $('#search_form').submit();
        } else {
            $('header').removeClass('inactive');
            $('header').addClass('active');
            $('#search').focus();
            if ($('#logo').text() == "OPENCITYPLANS") {
                $('#logo').text("OCP");
            }
        }
    })

    //close search
    $('#search_exit_b').click(() => {
        $('header').removeClass('active');
        $('header').addClass('inactive');
        if ($('#logo').text() == "OCP") {
            $('#logo').text("OPENCITYPLANS");
        }
    })

    //open file-format chooser
    $('#dl_b').click(() => {
        $('#dl_b_c').toggleClass('active');
    })

    //run download
    function startDL(format,scale = null) {
        const bounds = map.getBounds();
        const layers = getLayers();
        const estTotalSize = estimateOsmFilesize(map.getZoom());
        const zoom = map.getZoom();
        progressBar(0, estTotalSize)
        genSwzpln(format,bounds,layers,zoom,scale,progressBar);
    }
    
    $('.dl_bs').click((event) => {
        let format = $(event.currentTarget).html().replaceAll(" ","").replaceAll("\n","");
        if (format == "dxf") {
            startDL(format);
        } else {
            const bounds = map.getBounds();
            let scales = getScales(bounds);
            $(scales).each((index, scale) => {
                $('.scale_opt')[index].innerHTML = scale.name;
                $('.scale_opt')[index].setAttribute('data-scale',scale.scale);
                $('.scale_opt')[index].setAttribute('data-format',format);
            })
            $('#dl_scale').addClass('active');
        }
    })
    $('.scale_opt').click((event) => {
        let scale = $(event.currentTarget).attr('data-scale');
        let format = $(event.currentTarget).attr('data-format');
        $('#dl_scale').removeClass('active');
        startDL(format, scale);
    });


    //save layers to cookies
    $("#layers > input").click(() => {
        var boolLayers = [];
        $('#layers > input').each((index, layer) => {
            var bool = $(layer).is(":checked");
            boolLayers[index] = bool
        })
        setCookie('layers',JSON.stringify(boolLayers),30);
    })

    //open menu
    var counterInt
    $('#burger_b').click(() => {
        $('#menu').addClass('active');
        $('body').removeClass('menu_inactive');
        $('body').addClass('menu_active');
        //init counter ajax
        $('#counter_no').load('/c/');
        counterInt = setInterval(() => {
            $('#counter_no').load('/c/');
        },500);
    })

    //close menu
    $('#burger_b_menu, #menu_shadow').click(() => {
        $('#menu').removeClass('active');
        $('body').addClass('menu_inactive');
        $('body').removeClass('menu_active');
        clearInterval(counterInt);
    })
    
    //menu links
    $(".menu_item").click((event) => {
        const id = $(event.currentTarget).attr("id");
        switch (id) {
            case "m_help":
                
                break;
            case "m_darkmode":
                const style = $("#colors").attr("href");
                if (style=="/css/colors.light.css"){
                    $("#colors").attr("href", "/css/colors.dark.css");
                    setCookie('darkmode','true',30);
                } else {
                    $("#colors").attr("href", "/css/colors.light.css");
                    setCookie('darkmode','false',30);
                }
                break;
            case "m_legal":
                $("#legal").addClass('active');
                $("#legal").load("/legal/index.php");
                $('#menu').removeClass('active');
                $('body').addClass('menu_inactive');
                $('body').removeClass('menu_active');
                break;

            default:
                break;
        }
    })

    //show shop if available
    var shopUrl = "https://shop.swzpln.de";
    /* $.ajax({
        type: "GET",
        url: shopUrl
    }).done(function (result) {
        console.log('shop show')
        $('#m_shop').show();
    });
    --> TODO: not working bc of CORS */

    //close dialogs
    $("#dialog_shadow").click(() => {
        $('.dialog.active.closable').removeClass('active');
    })

    //close dl dialog
    $("#dl_close").click(() => {
        $('#dl_progress').removeClass('active');
    })
    $("#dl_scales_close").click(() => {
        $('#dl_scale').removeClass('active');
    })

    $("#dl_cancel").click(() => {
        cancelGen();
        $('#dl_progress').removeClass('active');
    })

    //close err dialog
    $("#err_close").click(() => {
        $('#dl_err').removeClass('active');
    })

}

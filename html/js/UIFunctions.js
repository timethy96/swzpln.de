import { setCookie } from "./jsCookie.js";
import { genSwzpln, estimateOsmFilesize, cancelGen } from "./osm/gen_swzpln.js";
import { progressBar } from './progressBar.js'

function getLayers(){
    let layers = [];
    $('#layers input:checked').each((index, layer) => {
        const layer_name = $(layer).attr('value');
        layers.push(layer_name);
    })
    return layers;
}

export function initUI() {
    //open search
    $('#search_b').click(() => {
        if ($('header').hasClass('active')){
            $('#search_form').submit();
        } else {
            $('header').removeClass('inactive');
            $('header').addClass('active');
            $('#search').focus();
        }
    })

    //close search
    $('#search_exit_b').click(() => {
        $('header').removeClass('active');
        $('header').addClass('inactive');
    })

    //open file-format chooser
    $('#dl_b').click(() => {
        $('#dl_b_c').toggleClass('active');
    })
    map.on('zoomend', () => { $('#dl_b_c').removeClass('active'); });

    //run download
    $('.dl_bs').click((event) => {
        const format = $(event.currentTarget).html().replaceAll(" ","").replaceAll("\n","");
        const bounds = map.getBounds();
        const layers = getLayers();
        const estTotalSize = estimateOsmFilesize(map.getZoom());
        progressBar(0, estTotalSize)
        const zoom = map.getZoom();
        genSwzpln(format,bounds,layers,zoom,progressBar);
    })

    //open menu
    var counterInt
    $('#burger_b').click(() => {
        $('#menu').addClass('active');
        $('body').removeClass('menu_inactive');
        $('body').addClass('menu_active');
        //init counter ajax
        $('#counter_no').load('/counter');
        counterInt = setInterval(() => {
            $('#counter_no').load('/counter');
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
            case "m_lang":
                if ($('html').attr('lang') == 'en') {
                    setCookie('lang','de',30);
                    window.location.reload(true);
                } else {
                    setCookie('lang','en',30);
                    window.location.reload(true);
                }
                break;
            case "m_help":

                break;
            case "m_donate":
                window.location = $(event.currentTarget).attr("data-href");
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
            case "m_github":
                window.location = $(event.currentTarget).attr("data-href");
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

    //close dialogs
    $("#dialog_shadow").click(() => {
        $('.dialog.active.closable').removeClass('active');
    })

    //close dl dialog
    $("#dl_close").click(() => {
        $('#dl_progress').removeClass('active');
    })

    $("#dl_cancel").click(() => {
        cancelGen();
        $('#dl_progress').removeClass('active');
    })

}

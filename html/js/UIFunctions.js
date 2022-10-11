import { getCookie, setCookie } from "./jsCookie.js";
import { genSwzpln, estimateOsmFilesize, cancelGen } from "./osm/gen_swzpln.js";
import { progressBar } from './progressBar.js';
import { getScales } from './osm/getScales.js';

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
    function startDL(format,scale = null) {
        const bounds = map.getBounds();
        const layers = getLayers();
        const estTotalSize = estimateOsmFilesize(map.getZoom());
        const zoom = map.getZoom();
        progressBar(0, estTotalSize)
        genSwzpln(format,bounds,layers,zoom,scale,progressBar);
    }
    $('.dl_bs').click((event) => {
        const format = $(event.currentTarget).html().replaceAll(" ","").replaceAll("\n","");
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
        $('#counter_no').load('/counter');
        counterInt = setInterval(() => {
            $('#counter_no').load('/counter/');
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

    //close dialogs
    $("#dialog_shadow").click(() => {
        $('.dialog.active.closable').removeClass('active');
    })

    //close dl dialog
    $("#dl_close").click(() => {
        $('#dl_progress').removeClass('active');
        $('#dl_feedback').removeClass('active');
    })
    $("#dl_scales_close").click(() => {
        $('#dl_scale').removeClass('active');
    })

    $("#dl_cancel").click(() => {
        cancelGen();
        $('#dl_progress').removeClass('active');
    })

    //feedback functions
    //quick feedback
    $('.dl_feedback_quick_b').click((event) => {
        const feedback = parseInt($(event.currentTarget).attr("data-feedback"));
        $.post("/feedback/", {"type": "quick", "feedback": feedback}, (r) => {
            console.log(r);
            $('#dl_feedback_quick').removeClass('active');
            $('#dl_feedback_long').addClass('active');
            $('.dl_feedback_long_text').hide();
            $('#dl_status_text').hide();
            if (feedback) {
                $('#dl_feedback_long_good').show();
            } else {
                $('#dl_feedback_long_bad').show();
            }
            const darkmode = getCookie('darkmode')
            const theme = darkmode ? 'dark' : 'light';
            hcaptcha.render('long_feedback_hcaptcha', {
                sitekey: 'a264ee9e-a19b-44bd-9f11-4bcaae3f5fa3',
                theme: theme
            });
        });
    })
}

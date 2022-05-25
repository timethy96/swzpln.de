import { setCookie } from "./jsCookie.js";

export function initUI() {
    //open search
    $('#search_b').click(() => {
        $('header').removeClass('inactive');
        $('header').addClass('active');
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

    //open menu
    $('#burger_b').click(() => {
        $('#menu').addClass('active');
        $('body').removeClass('menu_inactive');
        $('body').addClass('menu_active');
    })

    //close menu
    $('#burger_b_menu, #menu_shadow').click(() => {
        $('#menu').removeClass('active');
        $('body').addClass('menu_inactive');
        $('body').removeClass('menu_active');
    })

    //menu links
    $(".menu_item").click((event) => {
        const id = $(event.currentTarget).attr("id");
        switch (id) {
            case "lang":

                break;
            case "help":

                break;
            case "donate":
                window.location = $(event.currentTarget).attr("data-href");
                break;
            case "darkmode":
                const style = $("#colors").attr("href");
                if (style=="/css/colors.light.css"){
                    $("#colors").attr("href", "/css/colors.dark.css");
                    setCookie('darkmode','true',30);
                } else {
                    $("#colors").attr("href", "/css/colors.light.css");
                    setCookie('darkmode','false',30);
                }
                break;
            case "github":
                window.location = $(event.currentTarget).attr("data-href");
                break;
            case "imprint":

                break;

            default:
                break;
        }
    })

}

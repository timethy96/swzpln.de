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
    map.on('zoomend', () => {$('#dl_b_c').removeClass('active');});

    //open menu
    $('#burger_b').click(() => {
        $('#menu').addClass('active');
        $('body').removeClass('menu_inactive');
        $('body').addClass('menu_active');
    })

    //close menu
    $('#burger_b_menu').click(() => {
        $('#menu').removeClass('active');
        $('body').addClass('menu_inactive');
        $('body').removeClass('menu_active');
    })
    
}

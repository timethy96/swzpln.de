var estTotalSize;
var totalObj;
var doneObj = 0;

//load string array for translations
let langArray;
const l = $('html').attr('lang');
$.get("/translations.json", (langResponse) => {
    langArray = langResponse;
})

function getStr(str){
    return langArray[str][l];
}

export async function progressBar(task, status){
    $('#dl_progress').addClass('active');
    switch (task) {
        case 0:
            $("#dl_status_text").html(getStr('init'));
            $("#dl_bar").addClass('stateless');
            $("#dl_bar").show();
            $("#dl_status_text").show();
            $("#dl_status_percent").show();
            $("#dl_cancel").addClass('active');
            $("#dl_start").removeClass('active');
            $("#dl_close").removeClass('active');
            $("#dl_status_percent").html('');
            estTotalSize = status;
            break;
        
        case 1:
            $("#dl_status_text").html(getStr('osm_dl'));
            $("#dl_bar").removeClass('stateless');
            var percent = Math.round(100 * status / estTotalSize);
            if (percent > 100) {percent = 100;};
            $("#dl_status_percent").html(percent+'%');
            $("#dl_bar div").css({"width": percent+"%"});
            break;
    
        case 3:
            totalObj = status;
            doneObj = 0;
            break;

        case 4:
            $("#dl_status_text").html(getStr('osm2obj'));  
            doneObj += status;
            var percent = Math.round(100 * doneObj / totalObj);
            if (percent > 100) {percent = 100;};
            $("#dl_status_percent").html(percent+'%');
            $("#dl_bar div").css({"width": percent+"%"});
            break;

        case 5:
            $("#dl_status_text").html(getStr('osm2file') + status[0]);
            totalObj = status[1];
            doneObj = 0;
            break;
        
        case 6:
            doneObj += status;
            var percent = Math.round(100 * doneObj / totalObj);
            if (percent > 100) {percent = 100;};
            $("#dl_status_percent").html(percent+'%');
            $("#dl_bar div").css({"width": percent+"%"});
            break;

        case 7:
            $("#dl_status_text").html(getStr('dl_done'));
            $("#dl_status_percent").html('100%');
            $("#dl_bar div").css({"width": "100%"});
            $("#dl_cancel").removeClass('active');
            $("#dl_start").addClass('active');
            $("#dl_close").addClass('active');
            $('#dl_bar').hide();
            $('#dl_status_percent').hide();
            $("#dl_feedback").addClass('active');
            $("#dl_feedback_quick").addClass('active');
            $("#dl_feedback_long").removeClass('active');
            $("#dl_feedback_end").removeClass('active');
            break;
            

        default:
            break;
    }
}
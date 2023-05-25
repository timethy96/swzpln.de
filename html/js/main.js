import {initUI} from "./UIFunctions.js?v=1.0.0-rc2-1";

// Error handling

window.onerror = function(message, source, lineno, colno, error) {
    $('#dl_err').addClass('active');
    $('#err_send').addClass('active');
    $('#err_close').addClass('active');
    let agent = navigator.userAgent;
    //let cLog = "["+message+", "+source+", "+lineno+", "+colno+", "+error+", "+agent+"]";
    let cLog = `
    <p>Message: ${message}</p>
    <p>Source: ${source}</p>
    <p>Line, Col: ${lineno}, ${colno}</p>
    <p>User-Agent: ${agent}</p>
    `;
    $("#err_log").html(cLog);
    
    let email1 = "error1";
    let email2 = "themom.studio";
    let subject = "Error report swzpln.de";
    let body = encodeURIComponent(cLog);

    let mailToLink = "mailto:swzpln" + email1 + "@" + email2 + "?subject=" + encodeURIComponent(subject) + "&body=" + body;

    $("#err_send").click(() => {
        window.location.href = mailToLink;
    })
}

initUI();
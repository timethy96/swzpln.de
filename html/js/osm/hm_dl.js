function constructUrl(bounds) {
    const base = "/php/getHeights.php?";
    const north = "north=" + bounds[2];
    const west = "&west=" + bounds[3];
    const south = "&south=" + bounds[0];
    const east = "&east=" + bounds[1];
    const url = base + north + west + south + east;
    return url;
}

export async function hm_dl(bounds, progressCallback){
    const ajaxUrl = constructUrl(bounds);
    //progressCallback(2); //TODO: Add new step to progress callback function for waitig for server response
    let response = await fetch(ajaxUrl);
    const reader = response.body.getReader();
    const contentLength = response.headers.get('Content-Length');
    let receivedLength = 0;
    let chunks = [];
    while(true) {
        const {done, value} = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        receivedLength += value.length;
        //progressCallback(1, receivedLength); //TODO: Add new step to progress callback function
    }
    //progressCallback(1, receivedLength); //TODO: Add new step to progress callback function
    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for(let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }
    let result = new TextDecoder("utf-8").decode(chunksAll); //TODO: parse text file and create matrix
    return JSON.parse(result); //return matrix
}
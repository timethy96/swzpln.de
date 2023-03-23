export async function hm_dl(bounds, progressCallback){
    const ajaxUrl = "https://portal.opentopography.org/API/globaldem?demtype=COP30&south=45.196&north=49&west=-122.66&east=-119.95&outputFormat=GTiff&API_Key=yourAPIkeyHere"; //TODO do I need to proxy the request over my server with CORS to not expose the api key??
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
        progressCallback(1, receivedLength); //TODO: Add new step to progress callback function
    }
    progressCallback(1, receivedLength); //TODO: Add new step to progress callback function
    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for(let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }
    let result = new TextDecoder("utf-8").decode(chunksAll); //TODO: parse text file and create matrix
    return JSON.parse(result); //return matrix
}
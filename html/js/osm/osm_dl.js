
let overpassApi = "https://overpass.private.coffee/api/";
const overpassApiFallback = "https://overpass-api.de/api/";


function constructUrl(bounds, layers) {
    const bbox = [bounds[2],bounds[1],bounds[0],bounds[3]].toString();
    let ajaxUrl = overpassApi + `/interpreter?data=[out:json][bbox:${bbox}];(`;
    layers.forEach((layer) => {
        switch (layer) {
            case "building":
                ajaxUrl += 'nwr["building"];';
                break;
    
            case "green":
                ajaxUrl += 'nwr["leisure"="park"];';
                //ajaxUrl += 'nwr["surface"="grass"];'; //highways with grass --> shown as highway
                ajaxUrl += 'nwr["landuse"="allotments"];';
                ajaxUrl += 'nwr["landuse"="meadow"];';
                ajaxUrl += 'nwr["landuse"="orchard"];';
                ajaxUrl += 'nwr["landuse"="vineyard"];';
                ajaxUrl += 'nwr["landuse"="cemetery"];';
                ajaxUrl += 'nwr["landuse"="grass"];';
                ajaxUrl += 'nwr["landuse"="plant_nursery"];';
                ajaxUrl += 'nwr["landuse"="recreation_ground"];';
                ajaxUrl += 'nwr["landuse"="village_green"];';
                break;
    
            case "water":
                ajaxUrl += 'nwr["natural"="water"];';
                ajaxUrl += 'nwr["waterway"];';
                layers.push('waterway');
                break;
            
            case "forest":
                ajaxUrl += 'nwr["landuse"="forest"];';
                ajaxUrl += 'nwr["natural"="wood"];';
                break;

            case "farmland":
                ajaxUrl += 'nwr["landuse"="farmland"];';
                break;

            case "highway":
                ajaxUrl += 'nwr["highway"];';
                break;

            case "railway":
                ajaxUrl += 'nwr["railway"="tram"];';
                ajaxUrl += 'nwr["railway"="subway"];';
                ajaxUrl += 'nwr["railway"="rail"];';
                ajaxUrl += 'nwr["railway"="preserved"];';
                ajaxUrl += 'nwr["railway"="narrow_gauge"];';
                ajaxUrl += 'nwr["railway"="monorail"];';
                ajaxUrl += 'nwr["railway"="miniature"];';
                ajaxUrl += 'nwr["railway"="light_rail"];';
                ajaxUrl += 'nwr["railway"="funicular"];';
                break;
        
            default:
                break;
        };
    });
    ajaxUrl += ');out body;>;out skel qt;';
    return ajaxUrl;
}

export async function osm_dl(bounds, layers, progressCallback) {
    // Check if overpass API is available and use fallback if not
    await new Promise((resolve) => {
        $.ajax({
            url: overpassApi.replace('api/',''),
            timeout: 5000, // Set a timeout (e.g., 5 seconds)
            success: function() {
                resolve();
            },
            error: function() {
                console.log("Overpass API not available. Using fallback.");
                overpassApi = overpassApiFallback;
                alert("The primary Overpass API is not available. Switching to a fallback API (overpass-api.de). Please note that you might experience slower downloads and may be subject to additional usage restrictions. More information on overpass-api.de");
                resolve();
            }
        });
    });

    const ajaxUrl = constructUrl(bounds, layers);
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
        progressCallback(1, receivedLength);
    }
    progressCallback(1, receivedLength);
    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for(let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }
    let result = new TextDecoder("utf-8").decode(chunksAll);
    progressCallback(2);
    return JSON.parse(result);
}

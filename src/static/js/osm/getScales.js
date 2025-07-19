function bounds2array(bounds) {
    let north = Object.values(Object.values(bounds)[0])[0];
    let east = Object.values(Object.values(bounds)[0])[1];
    let south = Object.values(Object.values(bounds)[1])[0];
    let west = Object.values(Object.values(bounds)[1])[1];
    return [north, west, south, east];
}

function deg2XY(bounds, lat, lon) {
    let lat1 = bounds[0];
    let lon1 = bounds[3];
    let lat2 = lat;
    let lon2 = lon;
    let XYvals = [[lat2,lat2,lon1,lon2],[lat1,lat2,lon2,lon2]];
    let XY = []
    XYvals.forEach((latLonArray) => {
        let lat1 = latLonArray[0];
        let lat2 = latLonArray[1];
        let lon1 = latLonArray[2];
        let lon2 = latLonArray[3];
        
        const R = 6371000; // meter
        let dLat = ((lat2-lat1) * Math.PI) / 180;
        let dLon = ((lon2-lon1) * Math.PI) / 180; 
        let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        let d = R * c;
        XY.push(d);
    })
    if (lat1 > lat2) {
        XY[1] = -XY[1];
    }
    if (lon1 > lon2) {
        XY[0] = -XY[0];
    }
    return XY;
}

const allScales = [
    {name:"1_1",scale:1},
    {name:"1_2",scale:0.5},
    {name:"1_5",scale:0.2},
    {name:"1_20",scale:0.05},
    {name:"1_50",scale:0.02},
    {name:"1_100",scale:0.01},
    {name:"1_200",scale:0.005},
    {name:"1_500",scale:0.002},
    {name:"1_1000",scale:0.001},
    {name:"1_2000",scale:0.0005},
    {name:"1_5000",scale:0.0002},
    {name:"1_10.000",scale:0.0001},
    {name:"1_20.000",scale:0.00005},
    {name:"1_50.000",scale:0.00002}
]

export function getScales(bounds) {
    var boundsArr = bounds2array(bounds);
    let SE = deg2XY(boundsArr, boundsArr[0], boundsArr[1]);
    let NW = deg2XY(boundsArr, boundsArr[2], boundsArr[3]);
    let scaleSuggestions = [];
    let i = 0;
    while(scaleSuggestions.length < 3 && i < 14){
        let Sscaled = Math.abs(SE[0] * allScales[i].scale);
        let Wscaled = Math.abs(SE[0] * allScales[i].scale);
        if (Sscaled < 5.08 && Wscaled < 5.08) {
            scaleSuggestions.push(allScales[i]);
        }
        i++;
    }
    return scaleSuggestions;
}


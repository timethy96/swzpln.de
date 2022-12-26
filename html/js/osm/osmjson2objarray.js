//export function deg2XY(bounds, lat, lon) { //-> module webworkers not yet implemented in Firefox
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

function haveCommon(val, tags) {
    return val.some(e => tags.includes(e));
}

var greenTags = ['park', 'grass', 'allotments', 'meadow', 'orchard', 'vineyard', 'cemetery', 'plant_nursery', 'recreation_ground', 'village_green']
var forestTags = ['forest', 'wood'];
var railwayTags = ['rail', 'tram', 'subway', 'narrow_gauge', 'monorail', 'light_rail', 'funicular']; // TODO: some ambigous tags are left out here!

function filterTagsToType(tagsObj) {
    if (tagsObj) {
        let keys = Object.keys(tagsObj);
        let values = Object.values(tagsObj);
        if (keys.includes('building')) {
            return 'building';
        } else if (keys.includes('highway')) {
            return 'highway';
        } else if (haveCommon(values, greenTags)) {
            return 'green';
        } else if (haveCommon(values, forestTags)) {
            return 'forest';
        } else if (haveCommon(values, railwayTags)) {
            return 'railway';
        } else if (values.includes('water')) {
            return 'water';
        } else if (keys.includes('waterway')) {
            return 'waterway';
        } else if (values.includes('farmland')) {
            return 'farmland';
        } else {
            console.log(values);
            return 'other';
        };
    } else {
        return 'other';
    }

}

//export function osmjson2objarray(osm_json, bounds, progressCallback) { //-> module webworkers not yet implemented in Firefox
function osmjson2objarray(osm_json, bounds, progressCallback) {

    const elements = osm_json['elements'];
    progressCallback(3, Object.values(elements).length * 2);

    //filter elements in types
    var ways = {};
    var relations = [];
    var nodes = {};

    var i = 0;

    elements.forEach((element) => {
        switch (element["type"]) {
            case "relation":
                var type = filterTagsToType(element["tags"]);
                var elemMembers = element['members'];
                relations.push({ "type": type, "members": elemMembers });
                break;

            case "way":
                var type = filterTagsToType(element["tags"]);
                var elemNodes = element['nodes'];
                var wID = element['id'];
                ways[wID] = { "type": type, "nodes": elemNodes };
                break;

            case "node":
                var bm = deg2XY(bounds, element["lat"], element["lon"])
                var elemID = element["id"];
                nodes[elemID] = bm;
                break;

            default:
                break;
        }
        //callback
        i += 1
        if (i % 10 == 0){
            progressCallback(4,10);
        } 
    });

    relations.forEach((relation) => {
        relation['members'].forEach((member) => {
            if (ways[member['ref']]){
                ways[member['ref']]['type'] = relation['type'];
                ways[member['ref']]['role'] = member['role'];
            };
        })
        //callback
        i += 1
        if (i % 10 == 0){
            progressCallback(4,10);
        } 
    })

    var objects = []
    Object.values(ways).forEach((way) => {
        var path = []
        way['nodes'].forEach((nodeID) => {
            path.push([...nodes[nodeID]]);
            //callback
            i += 1
            if (i % 10 == 0){
                progressCallback(4,10);
            }
        })
        objects.push({ "type": way['type'], "path": path, "role": way['role'] });
        //callback
        i += 1
        if (i % 10 == 0){
            progressCallback(4,10);
        }
    })

    var ways = null;
    var relations = null;
    var nodes = null;

    return objects;
}
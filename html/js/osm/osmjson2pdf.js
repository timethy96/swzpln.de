importScripts('./osmjson2objarray.js?v=1.0.0-rc2-1', './jspdf.umd.min.js?v=1.0.0-rc2-1');

function osmjson2pdf(osm_json, contours, bounds, layers, zoom, scale, progressCallback) {

    let objects = osmjson2objarray(osm_json, bounds, progressCallback);

    progressCallback(5, ['pdf', objects.length]);

    let layerColors = {
        building: '#000000',
        green: '#9DBD7E',
        water: '#AAD4FF',
        waterway: '#AAD4FF',
        forest: '#608156',
        farmland: '#FFEAAA',
        highway: '#828282',
        railway: '#BEBEBE',
        other: '#FF0000',
        contours: '#CCCCCC'
    }

    let SE = deg2XY(bounds, bounds[2], bounds[3]);
    let NW = deg2XY(bounds, bounds[0], bounds[1]);
    let txtSize = (19 - zoom) * 10;
    let o = (SE[0] > NW[1]) ? 'l' : 'p';

    const doc = new jspdf.jsPDF({
        orientation: o,
        unit: "mm",
        format: [(SE[0]*1000*scale), ((NW[1] + txtSize + 5)*1000*scale)]
    });

    //optionally generate contours
    if (layers.includes('contours')) {
        contours.contours.forEach((cont) => {
            let path = [];
            let i = 0;
            cont.forEach((coordinate) => {
                let x = (coordinate.x * SE[0] / contours.sizeX) * 1000 * scale;
                let y = (coordinate.y * NW[1] / contours.sizeY) * 1000 * scale;
                var operator = (i == 0) ? 'm' : 'l';
                path.push({op:operator,c:[x,y]});
                i += 1;
            })
            doc.setDrawColor(layerColors['contours'])
                .path(path)
                .stroke();
        })
    }

    i = 0;
    objects.forEach((obj) => {
        let type = obj['type'];
        let path = obj['path'];
        let pdfPath = []
        for (let c = 0; c < path.length; c++) {
            path[c][0] *= 1000 * scale; //pdf has mm values but osm-path is in meter
            path[c][1] = (path[c][1] - NW[1]) * -1 * 1000 * scale; // pdf has Y values from top to bottom (osm&dxf:bottom-top) --> reverse Y values
            var operator = (c == 0) ? 'm' : 'l';
            pdfPath.push({op:operator,c:path[c]});
        }

        if (['highway', 'railway', 'contours', 'waterway', 'other'].includes(type)) {
            doc.setDrawColor(layerColors[type])
                .path(pdfPath)
                .stroke();
                
        } else {
            pdfPath.slice(0, -1).push({op:'h'}); //delete redundant point & add close operator
            doc.setFillColor(layerColors[type])
                .path(pdfPath)
                .fill();
                
        }

        //callback
        i += 1
        if (i % 10 == 0) {
            progressCallback(6, 10);
        }
    })

    

    doc.setTextColor('#FF0000')
        .setFontSize(txtSize*1000*scale)
        .text("(c) OpenStreetMap.org contributors", (SE[0]-5)*1000*scale, (NW[1] + txtSize)*1000*scale, 'right');

    let blobUrl = doc.output('bloburl', 'swzpln.pdf')

    console.log(blobUrl);
    return blobUrl;
}
/*
 * Copyright (c) 2010,2013 Craig Campbell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Conrec is a contouring library
 *
 * @constructor
 * @param {Array} data - 2D array of height data
 */
function Conrec(data) {
    this.data = data;
    this.rows = data.length;
    this.columns = data[0].length;
}

/**
 * Draws contour lines
 *
 * @param {Object} options - Drawing options
 * @param {number} options.interval - Contour interval
 * @param {string} options.contourDrawer - Type of drawer ('shape' or 'basic')
 * @returns {Object} Contour data
 */
Conrec.prototype.drawContour = function(options) {
    var interval = options.interval || 10;
    var contourDrawer = options.contourDrawer || 'basic';
    
    // Find min and max values
    var min = Infinity;
    var max = -Infinity;
    
    for (var i = 0; i < this.rows; i++) {
        for (var j = 0; j < this.columns; j++) {
            if (this.data[i][j] < min) min = this.data[i][j];
            if (this.data[i][j] > max) max = this.data[i][j];
        }
    }
    
    // Generate contour levels
    var levels = [];
    var startLevel = Math.ceil(min / interval) * interval;
    for (var level = startLevel; level <= max; level += interval) {
        levels.push(level);
    }
    
    var contours = [];
    
    // Generate contours for each level
    for (var l = 0; l < levels.length; l++) {
        var level = levels[l];
        var segments = this.getContourSegments(level);
        
        if (segments.length > 0) {
            // Connect segments into continuous lines
            var lines = this.connectSegments(segments);
            contours = contours.concat(lines);
        }
    }
    
    return {
        contours: contours,
        sizeX: this.columns - 1,
        sizeY: this.rows - 1
    };
};

/**
 * Get contour segments for a specific level
 *
 * @param {number} level - Contour level
 * @returns {Array} Array of line segments
 */
Conrec.prototype.getContourSegments = function(level) {
    var segments = [];
    
    // Iterate through each grid cell
    for (var i = 0; i < this.rows - 1; i++) {
        for (var j = 0; j < this.columns - 1; j++) {
            var corners = [
                this.data[i][j],         // bottom-left
                this.data[i][j + 1],     // bottom-right
                this.data[i + 1][j + 1], // top-right
                this.data[i + 1][j]      // top-left
            ];
            
            var cellSegments = this.marchingSquares(corners, level, i, j);
            segments = segments.concat(cellSegments);
        }
    }
    
    return segments;
};

/**
 * Marching squares algorithm for a single cell
 *
 * @param {Array} corners - Height values at four corners
 * @param {number} level - Contour level
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @returns {Array} Line segments
 */
Conrec.prototype.marchingSquares = function(corners, level, row, col) {
    var segments = [];
    
    // Determine which corners are above/below the contour level
    var configuration = 0;
    if (corners[0] >= level) configuration |= 1;
    if (corners[1] >= level) configuration |= 2;
    if (corners[2] >= level) configuration |= 4;
    if (corners[3] >= level) configuration |= 8;
    
    // Linear interpolation to find intersection points
    var interpolate = function(val1, val2, pos1, pos2) {
        if (Math.abs(val2 - val1) < 1e-10) {
            return [(pos1[0] + pos2[0]) / 2, (pos1[1] + pos2[1]) / 2];
        }
        var ratio = (level - val1) / (val2 - val1);
        return [
            pos1[0] + ratio * (pos2[0] - pos1[0]),
            pos1[1] + ratio * (pos2[1] - pos1[1])
        ];
    };
    
    // Corner positions
    var positions = [
        [col, row],         // bottom-left
        [col + 1, row],     // bottom-right
        [col + 1, row + 1], // top-right
        [col, row + 1]      // top-left
    ];
    
    // Edge midpoints (for interpolation)
    var edges = {
        bottom: interpolate(corners[0], corners[1], positions[0], positions[1]),
        right:  interpolate(corners[1], corners[2], positions[1], positions[2]),
        top:    interpolate(corners[2], corners[3], positions[2], positions[3]),
        left:   interpolate(corners[3], corners[0], positions[3], positions[0])
    };
    
    // Marching squares lookup table
    switch (configuration) {
        case 1:  // bottom-left
            segments.push([edges.left, edges.bottom]);
            break;
        case 2:  // bottom-right
            segments.push([edges.bottom, edges.right]);
            break;
        case 3:  // bottom edge
            segments.push([edges.left, edges.right]);
            break;
        case 4:  // top-right
            segments.push([edges.right, edges.top]);
            break;
        case 5:  // left and right
            segments.push([edges.left, edges.bottom]);
            segments.push([edges.right, edges.top]);
            break;
        case 6:  // right edge
            segments.push([edges.bottom, edges.top]);
            break;
        case 7:  // not top-left
            segments.push([edges.left, edges.top]);
            break;
        case 8:  // top-left
            segments.push([edges.top, edges.left]);
            break;
        case 9:  // left edge
            segments.push([edges.bottom, edges.top]);
            break;
        case 10: // top and bottom
            segments.push([edges.bottom, edges.right]);
            segments.push([edges.top, edges.left]);
            break;
        case 11: // not top-right
            segments.push([edges.right, edges.top]);
            break;
        case 12: // top edge
            segments.push([edges.left, edges.right]);
            break;
        case 13: // not bottom-right
            segments.push([edges.bottom, edges.right]);
            break;
        case 14: // not bottom-left
            segments.push([edges.left, edges.bottom]);
            break;
        case 15: // all corners above
            // No contour line
            break;
    }
    
    return segments;
};

/**
 * Connect line segments into continuous contour lines
 *
 * @param {Array} segments - Array of line segments
 * @returns {Array} Array of connected contour lines
 */
Conrec.prototype.connectSegments = function(segments) {
    var lines = [];
    var used = new Array(segments.length).fill(false);
    
    for (var i = 0; i < segments.length; i++) {
        if (used[i]) continue;
        
        var line = [segments[i][0], segments[i][1]];
        used[i] = true;
        
        var connected = true;
        while (connected) {
            connected = false;
            
            for (var j = 0; j < segments.length; j++) {
                if (used[j]) continue;
                
                var seg = segments[j];
                var lastPoint = line[line.length - 1];
                var firstPoint = line[0];
                
                // Check if segment connects to end of current line
                if (this.pointsEqual(lastPoint, seg[0])) {
                    line.push(seg[1]);
                    used[j] = true;
                    connected = true;
                    break;
                } else if (this.pointsEqual(lastPoint, seg[1])) {
                    line.push(seg[0]);
                    used[j] = true;
                    connected = true;
                    break;
                }
                
                // Check if segment connects to beginning of current line
                if (this.pointsEqual(firstPoint, seg[0])) {
                    line.unshift(seg[1]);
                    used[j] = true;
                    connected = true;
                    break;
                } else if (this.pointsEqual(firstPoint, seg[1])) {
                    line.unshift(seg[0]);
                    used[j] = true;
                    connected = true;
                    break;
                }
            }
        }
        
        if (line.length > 1) {
            // Convert to required format
            var contourLine = line.map(function(point) {
                return { x: point[0], y: point[1] };
            });
            lines.push(contourLine);
        }
    }
    
    return lines;
};

/**
 * Check if two points are equal (within tolerance)
 *
 * @param {Array} p1 - First point [x, y]
 * @param {Array} p2 - Second point [x, y]
 * @returns {boolean} True if points are equal
 */
Conrec.prototype.pointsEqual = function(p1, p2) {
    var tolerance = 1e-10;
    return Math.abs(p1[0] - p2[0]) < tolerance && Math.abs(p1[1] - p2[1]) < tolerance;
};

// Export for use in web workers and modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Conrec;
}

// Global export for browser environments
if (typeof window !== 'undefined') {
    window.Conrec = Conrec;
}

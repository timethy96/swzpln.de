export class BasicContourDrawer {
  constructor(levels, swapAxes) {
    this.contour = new Array(levels.length);
    for (let i = 0; i < levels.length; i++) {
      this.contour[i] = {
        zValue: levels[i],
        lines: [],
      };
    }
    this.swapAxes = swapAxes;
  }

  drawContour(x1, y1, x2, y2, z, k) {
    if (!this.swapAxes) {
      this.contour[k].lines.push(y1, x1, y2, x2);
    } else {
      this.contour[k].lines.push(x1, y1, x2, y2);
    }
  }

  getContour() {
    return this.contour;
  }
}

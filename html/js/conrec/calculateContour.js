// https://github.com/jasondavies/conrec.js

// Changes have been done by MLJS team

/**
 * Copyright (c) 2010, Jason Davies.
 *
 * All rights reserved.  This code is based on Bradley White's Java version,
 * which is in turn based on Nicholas Yue's C++ version, which in turn is based
 * on Paul D. Bourke's original Fortran version.  See below for the respective
 * copyright notices.
 *
 * See http://local.wasp.uwa.edu.au/~pbourke/papers/conrec/ for the original
 * paper by Paul D. Bourke.
 *
 * The vector conversion code is based on http://apptree.net/conrec.htm by
 * Graham Cox.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Copyright (c) 1996-1997 Nicholas Yue
 *
 * This software is copyrighted by Nicholas Yue. This code is based on Paul D.
 * Bourke's CONREC.F routine.
 *
 * The authors hereby grant permission to use, copy, and distribute this
 * software and its documentation for any purpose, provided that existing
 * copyright notices are retained in all copies and that this notice is
 * included verbatim in any distributions. Additionally, the authors grant
 * permission to modify this software and its documentation for any purpose,
 * provided that such modifications are not distributed without the explicit
 * consent of the authors and that existing copyright notices are retained in
 * all copies. Some of the algorithms implemented by this software are
 * patented, observe all applicable patent law.
 *
 * IN NO EVENT SHALL THE AUTHORS OR DISTRIBUTORS BE LIABLE TO ANY PARTY FOR
 * DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT
 * OF THE USE OF THIS SOFTWARE, ITS DOCUMENTATION, OR ANY DERIVATIVES THEREOF,
 * EVEN IF THE AUTHORS HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * THE AUTHORS AND DISTRIBUTORS SPECIFICALLY DISCLAIM ANY WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.  THIS SOFTWARE IS
 * PROVIDED ON AN "AS IS" BASIS, AND THE AUTHORS AND DISTRIBUTORS HAVE NO
 * OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR
 * MODIFICATIONS.
 */

const EPSILON = Number.EPSILON;
const MINUSEPSILON = 0 - EPSILON;

/**
 * contour is a contouring subroutine for rectangularily spaced data
 *
 * It emits calls to a line drawing subroutine supplied by the user which
 * draws a contour map corresponding to real*4data on a randomly spaced
 * rectangular grid. The coordinates emitted are in the same units given in
 * the x() and y() arrays.
 *
 * Any number of contour levels may be specified but they must be in order of
 * increasing value.
 *
 * @private
 * @param {number[][]} matrix - matrix of data to contour
 *
 *             The following two, one dimensional arrays (x and y) contain
 *             the horizontal and vertical coordinates of each sample points.
 * @param {number[]} x  - data matrix column coordinates
 * @param {number[]} y  - data matrix row coordinates
 * @param {number[]} z  - contour levels in increasing order.
 * @param {object} contourDrawer object that implements contourDraw for drawing contour.  Defaults to a
 *                               custom "contour builder", which populates the
 *                               contours property.
 * @param {object} [options={}]
 * @param {number} [options.timeout] - maximum number of ms before returning from the function, default unlimited
 * @param {number} [options.ilb] - index bounds of data matrix
 * @param {number} [options.iub] - index bounds of data matrix
 * @param {number} [options.jlb] - index bounds of data matrix
 * @param {number} [options.jub] - index bounds of data matrix
 * @returns {boolean} - Whether contour generation had to stop early because it reached the timeout
 */
export function calculateContour(matrix, x, y, z, contourDrawer, options = {}) {
  const {
    timeout,
    ilb = 0,
    iub = matrix.length - 1,
    jlb = 0,
    jub = matrix[0].length - 1,
  } = options;
  const h = new Array(5);
  const sh = new Array(5);
  const xh = new Array(5);
  const yh = new Array(5);
  const nc = z.length;
  const z0 = z[0];
  const znc1 = z[nc - 1];

  const start = Date.now();

  /** private */
  function xsect(p1, p2) {
    return (h[p2] * xh[p1] - h[p1] * xh[p2]) / (h[p2] - h[p1]);
  }

  function ysect(p1, p2) {
    return (h[p2] * yh[p1] - h[p1] * yh[p2]) / (h[p2] - h[p1]);
  }

  let m1;
  let m2;
  let m3;
  let x1 = 0.0;
  let x2 = 0.0;
  let y1 = 0.0;
  let y2 = 0.0;

  // The indexing of im and jm should be noted as it has to start from zero
  // unlike the fortran counter part
  const im = [0, 1, 1, 0];
  const jm = [0, 0, 1, 1];
  // Note that castab is arranged differently from the FORTRAN code because
  // Fortran and C/C++ arrays are transposed of each other, in this case
  // it is more tricky as castab is in 3 dimensions
  const castab = [
    [
      [0, 0, 8],
      [0, 2, 5],
      [7, 6, 9],
    ],
    [
      [0, 3, 4],
      [1, 3, 1],
      [4, 3, 0],
    ],
    [
      [9, 6, 7],
      [5, 2, 0],
      [8, 0, 0],
    ],
  ];

  //  for (let j = jlb; j < jub; j++) {
  for (let j = jub - 1; j >= jlb; j--) {
    if (timeout && Date.now() - start > timeout) {
      // `timeout: contour generation could not finish in less than ${timeout}ms`
      return true;
    }
    for (let i = ilb; i < iub; i++) {
      let dij = matrix[i][j];
      let dij1 = matrix[i][j + 1];
      let di1j = matrix[i + 1][j];
      let di1j1 = matrix[i + 1][j + 1];
      let min1, min2, max1, max2;
      if (dij > dij1) {
        min1 = dij1;
        max1 = dij;
      } else {
        min1 = dij;
        max1 = dij1;
      }
      if (di1j > di1j1) {
        min2 = di1j1;
        max2 = di1j;
      } else {
        min2 = di1j;
        max2 = di1j1;
      }
      // let dmin = Math.min(min1, min2);
      // let dmax = Math.max(max1, max2);
      let dmin = min1 > min2 ? min2 : min1;
      let dmax = max1 > max2 ? max1 : max2;
      if (dmax >= z0 && dmin <= znc1) {
        for (let k = 0; k < nc; k++) {
          if (z[k] >= dmin && z[k] <= dmax) {
            for (let m = 4; m >= 0; m--) {
              if (m > 0) {
                // The indexing of im and jm should be noted as it has to
                // start from zero
                h[m] = matrix[i + im[m - 1]][j + jm[m - 1]] - z[k];
                xh[m] = x[i + im[m - 1]];
                yh[m] = y[j + jm[m - 1]];
              } else {
                h[0] = 0.25 * (h[1] + h[2] + h[3] + h[4]);
                xh[0] = 0.5 * (x[i] + x[i + 1]);
                yh[0] = 0.5 * (y[j] + y[j + 1]);
              }
              if (h[m] > EPSILON) {
                sh[m] = 1;
              } else if (h[m] < MINUSEPSILON) {
                sh[m] = -1;
              } else {
                sh[m] = 0;
              }
            }
            //
            // Note: at this stage the relative heights of the corners and the
            // centre are in the h array, and the corresponding coordinates are
            // in the xh and yh arrays. The centre of the box is indexed by 0
            // and the 4 corners by 1 to 4 as shown below.
            // Each triangle is then indexed by the parameter m, and the 3
            // vertices of each triangle are indexed by parameters m1,m2,and
            // m3.
            // It is assumed that the centre of the box is always vertex 2
            // though this isimportant only when all 3 vertices lie exactly on
            // the same contour level, in which case only the side of the box
            // is drawn.
            //
            //
            //      vertex 4 +-------------------+ vertex 3
            //               | \               / |
            //               |   \    m-3    /   |
            //               |     \       /     |
            //               |       \   /       |
            //               |  m=2    X   m=2   |       the centre is vertex 0
            //               |       /   \       |
            //               |     /       \     |
            //               |   /    m=1    \   |
            //               | /               \ |
            //      vertex 1 +-------------------+ vertex 2
            //
            //
            //
            //               Scan each triangle in the box
            //
            for (let m = 1; m <= 4; m++) {
              m1 = m;
              m2 = 0;
              if (m !== 4) {
                m3 = m + 1;
              } else {
                m3 = 1;
              }
              let caseValue = castab[sh[m1] + 1][sh[m2] + 1][sh[m3] + 1];
              if (caseValue !== 0) {
                switch (caseValue) {
                  case 1: // Line between vertices 1 and 2
                    x1 = xh[m1];
                    y1 = yh[m1];
                    x2 = xh[m2];
                    y2 = yh[m2];
                    break;
                  case 2: // Line between vertices 2 and 3
                    x1 = xh[m2];
                    y1 = yh[m2];
                    x2 = xh[m3];
                    y2 = yh[m3];
                    break;
                  case 3: // Line between vertices 3 and 1
                    x1 = xh[m3];
                    y1 = yh[m3];
                    x2 = xh[m1];
                    y2 = yh[m1];
                    break;
                  case 4: // Line between vertex 1 and side 2-3
                    x1 = xh[m1];
                    y1 = yh[m1];
                    x2 = xsect(m2, m3);
                    y2 = ysect(m2, m3);
                    break;
                  case 5: // Line between vertex 2 and side 3-1
                    x1 = xh[m2];
                    y1 = yh[m2];
                    x2 = xsect(m3, m1);
                    y2 = ysect(m3, m1);
                    break;
                  case 6: //  Line between vertex 3 and side 1-2
                    x1 = xh[m3];
                    y1 = yh[m3];
                    x2 = xsect(m1, m2);
                    y2 = ysect(m1, m2);
                    break;
                  case 7: // Line between sides 1-2 and 2-3
                    x1 = xsect(m1, m2);
                    y1 = ysect(m1, m2);
                    x2 = xsect(m2, m3);
                    y2 = ysect(m2, m3);
                    break;
                  case 8: // Line between sides 2-3 and 3-1
                    x1 = xsect(m2, m3);
                    y1 = ysect(m2, m3);
                    x2 = xsect(m3, m1);
                    y2 = ysect(m3, m1);
                    break;
                  case 9: // Line between sides 3-1 and 1-2
                    x1 = xsect(m3, m1);
                    y1 = ysect(m3, m1);
                    x2 = xsect(m1, m2);
                    y2 = ysect(m1, m2);
                    break;
                  default:
                    break;
                }
                // Put your processing code here and comment out the printf
                // printf("%f %f %f %f %f\n",x1,y1,x2,y2,z[k]);
                contourDrawer.drawContour(x1, y1, x2, y2, z[k], k);
              }
            }
          }
        }
      }
    }
  }
  return false;
}

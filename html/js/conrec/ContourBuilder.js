// Based on the code from https://github.com/jasondavies/conrec.js
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
// Based on the code from https://github.com/jasondavies/conrec.js
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
export class ContourBuilder {
  constructor(level) {
    this.level = level;
    this.s = null;
    this.count = 0;
  }
  removeSeq(list) {
    // if list is the first item, static ptr s is updated
    if (list.prev) {
      list.prev.next = list.next;
    } else {
      this.s = list.next;
    }
    if (list.next) {
      list.next.prev = list.prev;
    }
    --this.count;
  }
  addSegment(a, b) {
    let ss = this.s;
    let ma = null;
    let mb = null;
    let prependA = false;
    let prependB = false;
    while (ss) {
      if (ma === null) {
        // no match for a yet
        if (pointsEqual(a, ss.head.p)) {
          ma = ss;
          prependA = true;
        } else if (pointsEqual(a, ss.tail.p)) {
          ma = ss;
        }
      }
      if (mb === null) {
        // no match for b yet
        if (pointsEqual(b, ss.head.p)) {
          mb = ss;
          prependB = true;
        } else if (pointsEqual(b, ss.tail.p)) {
          mb = ss;
        }
      }
      // if we matched both no need to continue searching
      if (mb !== null && ma !== null) {
        break;
      } else {
        ss = ss.next;
      }
    }
    // c is the case selector based on which of ma and/or mb are set
    let c = (ma !== null ? 1 : 0) | (mb !== null ? 2 : 0);
    let pp;
    switch (c) {
      case 0: {
        // both unmatched, add as new sequence
        let aa = { p: a, prev: null };
        let bb = { p: b, next: null };
        aa.next = bb;
        bb.prev = aa;
        // create sequence element and push onto head of main list. The order
        // of items in this list is unimportant
        ma = { head: aa, tail: bb, next: this.s, prev: null, closed: false };
        if (this.s) {
          this.s.prev = ma;
        }
        this.s = ma;
        ++this.count; // not essential - tracks number of unmerged sequences
        break;
      }
      case 1: {
        // a matched, b did not - thus b extends sequence ma
        pp = { p: b };
        if (prependA) {
          pp.next = ma.head;
          pp.prev = null;
          ma.head.prev = pp;
          ma.head = pp;
        } else {
          pp.next = null;
          pp.prev = ma.tail;
          ma.tail.next = pp;
          ma.tail = pp;
        }
        break;
      }
      case 2: {
        // b matched, a did not - thus a extends sequence mb
        pp = { p: a };
        if (prependB) {
          pp.next = mb.head;
          pp.prev = null;
          mb.head.prev = pp;
          mb.head = pp;
        } else {
          pp.next = null;
          pp.prev = mb.tail;
          mb.tail.next = pp;
          mb.tail = pp;
        }
        break;
      }
      case 3: {
        // both matched, can merge sequences
        // if the sequences are the same, do nothing, as we are simply closing this path (could set a flag)
        if (ma === mb) {
          pp = { p: ma.tail.p, next: ma.head, prev: null };
          ma.head.prev = pp;
          ma.head = pp;
          ma.closed = true;
          break;
        }
        // there are 4 ways the sequence pair can be joined. The current setting of prependA and
        // prependB will tell us which type of join is needed. For head/head and tail/tail joins
        // one sequence needs to be reversed
        switch ((prependA ? 1 : 0) | (prependB ? 2 : 0)) {
          case 0: // tail-tail
            // reverse ma and append to mb
            reverseList(ma);
          // fall through to head/tail case
          case 1: // head-tail
            // ma is appended to mb and ma discarded
            mb.tail.next = ma.head;
            ma.head.prev = mb.tail;
            mb.tail = ma.tail;
            // discard ma sequence record
            this.removeSeq(ma);
            break;
          case 3: // head-head
            // reverse ma and append mb to it
            reverseList(ma);
          // fall through to tail/head case
          case 2: // tail-head
            // mb is appended to ma and mb is discarded
            ma.tail.next = mb.head;
            mb.head.prev = ma.tail;
            ma.tail = mb.tail;
            // discard mb sequence record
            this.removeSeq(mb);
            break;
          default:
            throw new Error('UNREACHABLE');
        }
        break;
      }
      default:
        throw new Error('UNREACHABLE');
    }
  }
}

function pointsEqual(a, b) {
  let x = a.x - b.x;
  let y = a.y - b.y;
  return x * x + y * y < Number.EPSILON;
}

function reverseList(list) {
  let pp = list.head;
  let temp;
  while (pp) {
    // swap prev/next pointers
    temp = pp.next;
    pp.next = pp.prev;
    pp.prev = temp;

    // continue through the list
    pp = temp;
  }

  // swap head/tail pointers
  temp = list.head;
  list.head = list.tail;
  list.tail = temp;
}

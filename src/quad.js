import utils from './utils.js';
import Rect from './rect.js';

class Quad {
  constructor(el, parent, dir, rect) {
    this.rect = rect;
    this.left = rect.left;
    this.top = rect.top;
    this.right = rect.right;
    this.bottom = rect.bottom;
    this.x = rect.left + ((rect.right - rect.left) / 2);
    this.y = rect.top + ((rect.bottom - rect.top) / 2);

    // UL == Upper-Left ... Lower-Left ...
    this.UL = null;
    this.UR = null;
    this.LL = null;
    this.LR = null;

    // the DOM element.
    this._el = el;
    this._parent = parent;
    this._dir = dir;
  }

  set el(value) {
    if (!this.isLeaf) {
      throw new Error('Only leaves can hold an element');
    }
    this._el = value;
  }

  get el() {
    return this._el;
  }

  get isLeaf() {
    return (this.UL === null && this.UR === null && 
            this.LL === null && this.LR === null);
  }

  get parent() {
    return this._parent;
  }

  getDirectionTo(x, y) {
    x = this.x - x;
    y = this.y - y;

    if (x > 0 && y > 0) {
      // UL quadrant
      if (y > x) return 'UP';
      else return 'LT';
    } else if (x <= 0 && y > 0) {
      // UR quadrant
      if (y > Math.abs(x)) return 'UP';
      else return 'RT';
    } else if (x > 0 && y <= 0) {
      // LL quadrant
      if (Math.abs(y) > x) return 'DN';
      else return 'LT';
    } else {
      // LR quadrant
      if (Math.abs(y) > Math.abs(x)) return 'DN';
      else return 'RT';
    }
  }

  getDistanceTo(x, y) {
    x = this.x - x;
    y = this.y -  y;
    x *= x;
    y *= y;
    return Math.sqrt(x + y);
  }

  getQuadName(x, y) {
    if (x < this.x) {
      if (y < this.y) {
        return 'UL';
      } else {
        return 'LL';
      }
    } else {
      if (y < this.y) {
        return 'UR';
      } else {
        return 'LR';
      }
    }
  }

  getQuadRect(dir) {
    if (dir === 'UL') {
      return new Rect(this.left, this.top, this.x, this.y);
    } else if (dir === 'LL') {
      return new Rect(this.left, this.y, this.x, this.bottom);
    } else if (dir === 'UR') {
      return new Rect(this.x, this.top, this.right, this.y);
    } else if (dir === 'LR') {
      return new Rect(this.x, this.y, this.right, this.bottom);
    } else {
      throw new Error('Invalid direction', dir);
    }
  }

  split() {
    const el = this.el;
    this.el = null;
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    const dir = this.getQuadName(x, y);
    const quad = new Quad(el, this, dir, this.getQuadRect(dir));
    this[dir] = quad
    return quad;
  }

  add(el) {
    if (!el) {
      throw new Error('Invalid element');
    }
    if (!el.getBoundingClientRect) {
      throw new Error(`Element ${el} has no bounding rectangle`);
    }
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);

    let parent = this;

    while (true) {
      const dir = parent.getQuadName(x, y);
      utils.debug('Checking', dir);

      if (parent[dir]) {
        if (parent[dir].isLeaf) {
          utils.debug('Parent exists, splitting....');
          parent[dir].split();
        }
        utils.debug('Continuing....');
        parent = parent[dir];
      } else {
        utils.debug('Found empty slot, placing')
        const quad = new Quad(el, parent, dir, parent.getQuadRect(dir))
        parent[dir] = quad;
        return quad;
      }
    }
  }

  draw(canvas) {

  }
}

export default Quad;

import utils from './utils.js';
import Quad from './quad.js';
import Rect from './rect.js';
import visualize from './visualize.js';

class QuadTree extends EventTarget {
  constructor(el, {visualize}) {
    super();
    this._visualize = visualize;

    this._elements = new Set();
    this._selected = null;
    this._canvas = null;

    const rect = el.getBoundingClientRect();
    this._root = new Quad(null, null, null, new Rect(rect.left, rect.top, rect.right, rect.bottom));
  }

  set visualize(value) {
    if (value) {
      this.draw();
    }
    this._visualize = value;
  }

  get visualize() {
    return this._visualize;
  }

  set selected(value) {
    this._selected = value;
    this.dispatchEvent(new CustomEvent('selected', { detail: value }));
  }

  get selected() {
    return this._selected;
  }

  get children() {
    const children = new Set([this._root]);

    children.forEach((curr) => {
      for (const dir of ['UL', 'UR', 'LL', 'LR']) {
        if (curr[dir]) {
          children.add(curr[dir]);
        }
      }
    });

    return new Array(...children);
  }

  add(el) {
    if (this._elements.has(el)) {
      utils.debug('Element in graph');
      return;
    }

    utils.debug('Adding element', el, 'to graph');
    this._elements.add(el);
    const quad = this._root.add(el);

    if (this.visualize) {
      this.draw();
    }

    if (!this.selected) {
      this.selected = quad.el;
    }
  }

  remove(el) {
    this._elements.delete(el);
  }

  _filterDirection(origin, dir) {
    const filtered = new Array();

    this.children.forEach((curr) => {
      if (!curr.isLeaf) return;
      if (curr.el === origin.el) return;
      if (curr.getDirectionTo(origin.x, origin.y) !== dir) return;
      filtered.push(curr);
    });

    return filtered;
  }

  move(dir) {
    if (!this.selected) {
      throw new Error('Nothing currently selected');
    }

    let searchDir;
    switch (dir) {
      case 'UP':
        searchDir = 'DN';
        break;

      case 'DN':
        searchDir = 'UP';
        break;

      case 'LT':
        searchDir = 'RT';
        break;

      case 'RT':
        searchDir = 'LT';
        break;
      }

      const selected = this.children.find(o => o.el === this.selected);
      const cantidates = this._filterDirection(selected, searchDir);
      const moveTo = cantidates.sort((a, b) => {
        return selected.getDistanceTo(a.x, a.y) - selected.getDistanceTo(b.x, b.y);
      })[0];

      if (moveTo) {
        this.selected = moveTo.el;
      }
  }

  undraw() {
    if (this._canvas) {
      document.body.removeChild(this._canvas);
      this._canvas = null;
    }
  }

  draw() {
    this.undraw();
    this._canvas = visualize(null, this);
  }
}

export default QuadTree;

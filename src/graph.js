import utils from './utils.js';
import Node from './node.js';
import Geom from './geom.js';
import visualize from './visualize.js';
import { DIRECTIONS } from './directions.js';

class Graph extends EventTarget {
  constructor(el, {visualize}) {
    super();
    this._el = el;
    this._root = null;
    this._elements = new Set();
    this._selected = null;
    this._visualize = visualize;
    this._canvas = null;
    this._updating = null;
  }

  set visualize(value) {
    if (value) {
      this.draw();
    } else {
      this.undraw();
    }
    this._visualize = value;
  }

  get visualize() {
    return this._visualize;
  }

  set selected(value) {
    this._selected = value;
    this.dispatchEvent(new CustomEvent('selected', { detail: value.el }));
  }

  get selected() {
    return this._selected;
  }

  _update() {
    for (const node1 of this._elements) {
      for (const dir of DIRECTIONS) {
        utils.debug('Finding', dir, 'neighbors for', node1.el);
        const closest = { node: null, geom: null };

        for (const node2 of this._elements) {
          if (node1 === node2) continue;
          // NOTE: for performance, you could pre-create geoms.
          const geom1 = new Geom(node1.el);
          const geom2 = new Geom(node2.el);

          if (geom1.directionTo(geom2) === dir) {
            if (!closest.node) {
              utils.debug('Found neighbor', node2.el);
              closest.node = node2;
              closest.geom = geom2;
            } else if (geom1.distanceTo(geom2) < geom1.distanceTo(closest.geom)) {
              utils.debug('Found better neighbor', closest.node.el);
              closest.node = node2;
              closest.geom = geom2;
            }
          }
        }

        node1[dir] = closest.node;
      }
    }

    if (this.visualize) this.draw();
  }

  update() {
    clearInterval(this._updating);
    this._updating = setTimeout(() => {
      this._update();
    }, 100);
  }

  add() {
    for (const el of arguments) {
      utils.debug('Adding', el);
      const node = new Node(el);
      this._elements.add(node);

      if (!this.selected) {
        utils.debug('Auto-selecting first node');
        this.selected = node;
      }
    }

    this.update();
  }

  remove(el) {
    let found = false;
    for (const node of this._elements) {
      if (node.el === el) {
        this._elements.delete(node);
        found = true;
        break;
      }
    }

    if (found) this.update();
  }

  select(el) {
    for (const node in this._elements) {
      if (node.el === el) {
        this.selected = node;
        return;
      }
    }
  }

  move(dir) {
    utils.debug('Moving', dir);
    const node = this.selected;
    if (!node) {
      utils.warning('Cannot move', dir, ', nothing selected');
      return;
    }

    const selection = node[dir];
    if (!selection) {
      utils.warning('Cannot move', dir, ', nothing in that direction');
      return;
    }

    this.selected = selection;
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

export default Graph;

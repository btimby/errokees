import { EventTarget } from "event-target-shim";
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
      if (!node1.el.isConnected) {
        utils.warn('Found dead node', node1);
        this._elements.remove(node1);
        continue;
      }

      node1.locate();
    }

    for (const node1 of this._elements) {
      for (const dir of DIRECTIONS) {
        utils.debug('Finding', dir, 'neighbors for', node1.el);
        const cantidates = [];
        for (const node2 of this._elements) {
          if (node1 === node2) continue;
          if (node1.geom.isInQuadrant(dir, node2.geom)) {
            cantidates.push(node2);
          }
        }
        let closest = null;

        utils.debug('Searching', cantidates.length, 'cantidates');
        for (const node2 of cantidates) {
          if (node1.geom.directionTo(node2.geom) === dir) {
            if (!closest) {
              utils.debug('Found neighbor', node2.el);
              closest = node2;
            } else if (node1.geom.distanceTo(node2.geom, dir) < node1.geom.distanceTo(closest.geom, dir)) {
              utils.debug('Found better neighbor', closest.el);
              closest = node2;
            }
          }
        }

        node1[dir] = closest;
      }
    }

    if (this.visualize) this.draw();
    this.dispatchEvent(new CustomEvent('updated'));
  }

  update() {
    clearInterval(this._updating);
    this._updating = setTimeout(() => {
      this._update();
    }, 100);
  }

  _add(el) {
    utils.debug('Adding', el);
    const node = new Node(el);
    this._elements.add(node);
  }

  add() {
    const first = arguments[0];
    for (const el of arguments) {
      this._add(el);
    }

    this.update();

    if (!this.selected && first) {
      utils.debug('Auto-selecting first node');
      this.selected = first;
    }
  }

  _remove(el) {
    utils.debug('Removing', el);
    for (const node of this._elements) {
      if (node.el === el) {
        this._elements.delete(node);
        return true;
      }
    }
  }

  remove() {
    let found = false;

    for (const el of arguments) {
      if (this._remove(el)) found = true;
    }

    if (found) this.update();
  }

  select(el) {
    utils.debug('Searching for node belonging to', el);

    for (const node of this._elements) {
      utils.debug('Checking', node.el);
      if (node.el === el) {
        utils.debug('Node found, selecting');
        this.selected = node;
        return;
      }
    }

    utils.debug('Node not found');
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

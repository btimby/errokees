import { DIRECTIONS } from './directions.js';
import Geom from './geom.js';
import utils from './utils.js';

class Node {
  constructor(el) {
    this.el = el;

    // edges
    this['left'] = null;
    this['right'] = null;
    this['up'] = null;
    this['down'] = null;

    // sub-graph
    this.subGraph = null;
    this.geom = null;
  }

  get children() {
    const children = new Set([this]);

    children.forEach((curr) => {
      for (let dir of DIRECTIONS) {
        if (curr[dir.name]) {
          children.add(curr[dir.name]);
        }
      }
    });

    return [...children];
  }

  locate() {
    // Return true if the location changed between calls.
    const geom = new Geom(this.el);
    if (this.geom !== geom) {
      this.geom = geom;
      return true;
    }

    return false;
  }
}

export default Node;

import { DIRECTIONS } from './directions.js';
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
}

export default Node;

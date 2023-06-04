import { Left, Right, Up, Down, ALL, INVERSE_NAMES } from './directions.js';
import Geom from './geom.js';
import utils from './utils.js';

class Node {
  constructor(el) {
    this.el = el;
    this.geom = new Geom(el);

    // edges
    this[Left.name] = null;
    this[Right.name] = null;
    this[Up.name] = null;
    this[Down.name] = null;

    // sub-graph
    this.subGraph = null;
  }

  get children() {
    const children = new Set([this]);

    children.forEach((curr) => {
      for (let dir of ALL) {
        if (curr[dir.name]) {
          children.add(curr[dir.name]);
        }
      }
    });

    return [...children];
  }

  directionTo(node) {
    for (let dir of ALL) {
      utils.debug('Checking direction', dir)

      if (dir.compare(this.geom, node.geom)) {
        return dir;
      }
    }
  }

  distanceTo(node) {
    return this.distanceTo1(node);
  }

  distanceTo1(node) {
    // Euclidean
    let x = this.geom.x - node.geom.x;
    let y = this.geom.y - node.geom.y;
    x *= x;
    y *= y;
    const d = Math.sqrt(x + y);
    utils.debug('distance1 =', d);
    return d;
  }

  distanceTo2(node) {
    // Driving
    let x = Math.abs(this.geom.x - node.geom.x);
    let y = Math.abs(this.geom.y - node.geom.y);
    let d = x + y;
    utils.debug('distance2 =', d);
    return d;
  }

  add(child) {
    const neighbors = {};

    // Find the closest neighbor in each direction. 
    for (let dir of ALL) {
      for (let node of this.children) {
        const closestNeighbor = neighbors[dir.name];

        if (node.directionTo(child) !== dir) {
          continue;
        }

        if (!closestNeighbor ||
            node.distanceTo(child) < closestNeighbor.distanceTo(child)) {
              neighbors[dir.name] = node;
        }
      }
    }

    if (Object.keys(neighbors).length == 0) {
      throw new Error('Cannot add node, no close neighbors');
    }

    Object.entries(neighbors).forEach(([dir_name, node]) => {
      const child_child = node[dir_name];

      if (child_child) {
        utils.debug('Inserting node between two nodes.');
        child[dir_name] = child_child;
        child_child[INVERSE_NAMES[dir_name]] = child;
      }

      utils.debug('Adding node')
      node[dir_name] = child;
      child[INVERSE_NAMES[dir_name]] = node;
    });
  }
}

export default Node;

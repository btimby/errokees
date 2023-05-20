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
    // TODO: be smarter, find the closest item in each direction.
    const nodes = [this, ...this.children];
    const closeParents = {};

    // Find the best cantidate 
    for (let dir of ALL) {
      for (let parent of nodes) {
        const closestParent = closeParents[dir.name];
        if (parent.directionTo(child) !== dir) {
          continue;
        }
        if (!closestParent ||
            parent.distanceTo(child) < closestParent.distanceTo(child)) {
              closeParents[dir.name] = parent;
        }
      }
    }

    let added = Object.keys(closeParents).length;
    Object.entries(closeParents).forEach(([dir_name, parent]) => {
      const child_child = parent[dir_name];

      if (child_child) {
        child[dir_name] = child_child;
        child_child[INVERSE_NAMES[dir_name]] = child;
      }

      parent[dir_name] = child;
      child[INVERSE_NAMES[dir_name]] = parent;
    });

    if (!added) {
      throw new Error('Did not add node');
    }
  }

  getNodeByElement(el) {
    for (let node in this.children) {
      if (node.geom.el === el) {
        return node;
      }
    }
    utils.warn('Cound not find element:', el);
  }

  deleteByElement(el) {
    const node = this.getNodeByElement(el);
    if (!node) return;

    // connect inverse edges
    for (let dir in ALL) {
      if (node[dir]) {
        node[dir][dir.inverse] = node[dir.inverse];
      }
    }
  }
}

function elementsToGraph(elements) {
  utils.debug('Building graph from', elements.length, 'elements');
  let root = new Node(elements[0]);

  for (let i = 1; i < elements.length; i++) {
    root.add(new Node(elements[i]));
  }

  return root;
}

export {
  elementsToGraph, Node,
};

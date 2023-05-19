import { Left, Right, Up, Down, ALL } from './directions.js';
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

  add(node) {
    // TODO: be smarter, find the closest item in each direction.
    let parent = this;

    while (true) {
      const dir = parent.directionTo(node);
      const child = parent[dir.name];

      if (child) {
        // something already this way.
        if (child.directionTo(node).name === dir.inverse) {
          // place between nodes.
          child[dir.inverse] = node;
          node[dir.name] = child;
          parent[dir.name] = node;
          node[dir.inverse] = parent;
          return parent;
        }

        // go further.
        parent = child;
        continue;
      }

      // nothing here, place the node.
      parent[dir.name] = node;
      node[dir.inverse] = parent;
      return parent;
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

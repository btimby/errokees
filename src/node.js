import { Left, Right, Up, Down } from './directions';
import { Geom } from './geom';
import utils from './utils';

const DIRECTIONS = [Left, Right, Up, Down];

class Node {
  constructor(el) {
    this.geom = new Geom(el);
    // edges
    this[Left] = null;
    this[Right] = null;
    this[Up] = null;
    this[Down] = null;
    // sub-graph
    this.subGraph = null;
  }

  get children() {
    const children = [];

    // recurse graph and return all nodes.
    for (let dir in DIRECTIONS) {
      const node = this[dir];
      if (node) {
        children.push(node);
        children.push(...node.children);
      }
    }

    utils.debug('Found', children.length, 'children');
    return children;
  }

  directionTo(node) {
    for (let dir in DIRECTIONS) {
      if (dir.compare(this.geom, node.geom)) {
        return dir;
      }
    }
  }

  add(node) {
    const dir = this.directionTo(node);
    const existing = this[dir.name];

    if (existing) {
      existing.add(node);
      return existing;
    }

    node[dir.inverse] = this;
    this[dir] = node;

    return this;
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
    for (let dir in DIRECTIONS) {
      if (node[dir]) {
        node[dir][dir.inverse] = node[dir.inverse];
      }
    }
  }
}

function elementsToGraph(elements) {
  let root = new Node(elements[0]);

  for (let i = 1; i < elements.length; i++) {
    root.add(new Node(elements[i]));
  }

  return root;
}

export {
  elementsToGraph, Node,
};

import utils from './utils.js';
import Node from './node.js';

class Graph {
  constructor() {
    this.root = null;
  }

  get children() {
    if (!this.root) {
      return [];
    }
  
    return this.root.children;
  }

  add() {
    utils.debug('Adding', arguments.length, 'elements to graph');

    for (let i = 0; i < arguments.length; i++) {
      const node = new Node(arguments[i]);

      if (!this.root) {
        this.root = node;
        utils.debug('Added root node');
      } else {
        this.root.add(node);
      }
    }
  }

  getNodeByElement(el) {
    if (!this.root) {
      utils.warn('Graph has no root');
      return;
    }

    for (let node in this.children) {
      if (node.geom.el === el) {
        return node;
      }
    }

    utils.warn('Cound not find element:', el);
  }

  deleteByElement(el) {
    const node = this.getNodeByElement(el);
    if (!node) {
      return;
    }

    // connect inverse edges
    for (let dir in ALL) {
      if (node[dir]) {
        node[dir][dir.inverse] = node[dir.inverse];
      }
    }
  }
}

export default Graph;

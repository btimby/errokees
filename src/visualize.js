import { DIRECTIONS } from './directions.js';
import Geom from './geom.js';
import utils from './utils.js';

function createCanvas(parent) {
  let container = parent, el;
  const canvas = document.createElement('canvas');

  if (!parent || parent === document.body)
  {
    el = parent = document.createElement('div');
    document.body.appendChild(parent);
    parent.style.pointerEvents = 'none';
    parent.style.position = "absolute";
    parent.style.left = "0px";
    parent.style.top = "0px";
    parent.style.width = "100%";
    parent.style.height = "100%";
    parent.style.zIndex = "100";
    container = document.body;
  } else {
    el = canvas;
  }

  canvas.style.width = container.scrollWidth+"px";
  canvas.style.height = container.scrollHeight+"px";
  canvas.width = container.scrollWidth;
  canvas.height = container.scrollHeight;
  canvas.style.overflow = 'visible';
  canvas.style.position = 'absolute';

  parent.appendChild(canvas);

  return [el, canvas];
}

function drawLine(context, x1, y1, x2, y2) {
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
}

function visualize(parent, graph) {
/*
  Visualizes the graph by overlaying a canvas element and drawing
  bounding boxes and lines for each element.
*/
  utils.info('Visualizing graph with', graph.children.length, 'nodes');
  const [el, canvas] = createCanvas(parent);
  const context = canvas.getContext('2d');

  for (let node of graph._elements) {
    utils.debug('Outlining node', node);
    const geom1 = new Geom(node.el);
    // context.beginPath();
    // context.strokeStyle = 'blue';
    // context.lineWidth = 1;
    // context.moveTo(geom1.rect.left, geom1.rect.top);
    // context.lineTo(geom1.rect.right, geom1.rect.top);
    // context.moveTo(geom1.rect.left, geom1.rect.top);
    // context.lineTo(geom1.rect.left, geom1.rect.bottom);
    // context.moveTo(geom1.rect.right, geom1.rect.top);
    // context.lineTo(geom1.rect.right, geom1.rect.bottom);
    // context.moveTo(geom1.rect.left, geom1.rect.bottom);
    // context.lineTo(geom1.rect.right, geom1.rect.bottom);
    // context.stroke();

    for (let dir of DIRECTIONS) {
      const dest = node[dir];
      if (dest) {
        const geom2 = new Geom(dest.el);
        utils.debug(`Drawing line from (${geom1.x},${geom1.y}) -> (${geom2.x},${geom2.y})`);
        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = 5;
        drawLine(context, geom1.x, geom1.y, geom2.x, geom2.y);
        context.stroke();
      }
    }
  }

  return el;
}

export default visualize;

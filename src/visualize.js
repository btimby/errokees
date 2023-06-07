import { ALL } from './directions.js';
import utils from './utils.js';

function createCanvas(parent) {
  let container = parent, el;
  const canvas = document.createElement('canvas');

  if (!parent || parent === document.body)
  {
    el = parent = document.createElement('div');
    document.body.appendChild(parent);
    parent.style.pointerEvents = 'none';
    parent.style.position="absolute";
    parent.style.left="0px";
    parent.style.top="0px";
    parent.style.width="100%";
    parent.style.height="100%";
    parent.style.zIndex="100";
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
  utils.info('Visualizing graph with', graph.children.size, 'nodes');
  const [el, canvas] = createCanvas(parent);
  const context = canvas.getContext('2d');

  for (let node of graph.children) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    drawLine(context, node.x, node.rect.top, node.x, node.rect.bottom);
    drawLine(context, node.rect.left, node.y, node.rect.right, node.y);
    context.stroke();
  }

  return el;
}

export default visualize;

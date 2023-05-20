import { ALL } from './directions.js';
import utils from './utils.js';

function createCanvas(parent) {
  let container = parent, el;
  const canvas = document.createElement('canvas');

  if (!parent || parent === document.body)
  {
    el = parent = document.createElement('div');
    document.body.appendChild(parent);
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

function visualize(parent, graph) {
  /*
  Visualizes the graph by overlaying a canvas element and drawing
  bounding boxes and lines for each element.
  */
  utils.info('Visualizing graph with', graph.children.length, 'nodes');
  const [el, canvas] = createCanvas(parent);
  const context = canvas.getContext('2d');

  for (let node of graph.children) {
    utils.debug('Outlining node');
    context.beginPath();
    context.strokeStyle = 'blue';
    context.lineWidth = 1;
    context.moveTo(node.geom.rect.left, node.geom.rect.top);
    context.lineTo(node.geom.rect.right, node.geom.rect.top);
    context.moveTo(node.geom.rect.left, node.geom.rect.top);
    context.lineTo(node.geom.rect.left, node.geom.rect.bottom);
    context.moveTo(node.geom.rect.right, node.geom.rect.top);
    context.lineTo(node.geom.rect.right, node.geom.rect.bottom);
    context.moveTo(node.geom.rect.left, node.geom.rect.bottom);
    context.lineTo(node.geom.rect.right, node.geom.rect.bottom);
    context.stroke();

    for (let dir of ALL) {
      const dest = node[dir.name];
      if (dest) {
        utils.debug(`Drawing line from (${node.geom.x},${node.geom.y}) -> (${dest.geom.x},${dest.geom.y})`);
        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.moveTo(node.geom.x, node.geom.y);
        context.lineTo(dest.geom.x, dest.geom.y);
        context.stroke();
      }
    }
  }

  return el;
}

export default visualize;

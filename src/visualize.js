import utils from './utils';

function visualize(graph) {
  /*
  Visualizes the graph by overlaying a canvas element and drawing
  bounding boxes and lines for each element.
  */
  const el = document.createElement('canvas');
  utils.info('Visualizing graph with', graph.children.length, 'nodes');

  return el;
}

export default visualize;

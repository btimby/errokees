/*
Errokees [ah-ro-ki:z]
*/
"use strict";
import '@babel/polyfill';
import utils from './utils.js';
import QuadTree from './quadtree.js';

const defaults = {
  scope: null,

  // keys...
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  activate: 'Enter',

  // css classes
  selectableClass: 'ek-selectable',
  selectedClass: 'ek-selected',
  containerClass: 'ek-container',

  // Define events.
  keyEventName: 'keydown',
  selectEvent: null,
  deselectEvent: null,
  activateEvent: null,

  // Scroll to item when selected?
  scroll: true,

  elementTypes: [
    'input', 'textarea', 'a', 'button', 'select',
  ],

  visualize: false,
}

class Errokees {
  constructor(options) {
    this.scope = options.scope || document.body;
    this.options = {
      ...defaults,
      ...options,
    };
    // Ensure this is a set.
    this.options.elementTypes = new Set(this.options.elementTypes);
    this.movements = {
      [this.options.up]: 'UP',
      [this.options.down]: 'DN',
      [this.options.left]: 'LT',
      [this.options.right]: 'RT',
    }
    /*
    Create an element that we will use for intersection observation.
    We only care about elements within this element.
    */

    this._graph = new QuadTree(this.scope, {visualize: this.options.visualize});
    this._graph.addEventListener('selected', this._onSelected.bind(this));

    // Watch for intersections with a rectangle 20% larger than the view port.
    this._intersectionHandler = this._onIntersection.bind(this);
    this._intObs = new IntersectionObserver(this._intersectionHandler, {
      rootMargin: '20%',
    });

    for (const el of this._getSelectableElements(this.scope)) {
      this._intObs.observe(el);
    }

    this._mutationHandler = this._onMutation.bind(this);
    this._mutObs = new MutationObserver(this._mutationHandler);
    this._mutObs.observe(this.scope, {
      subtree: true,
      childList: true,
    });

    this._selected = null;
    this._inputHandler = this._onInput.bind(this);
    this.scope.addEventListener(this.options.keyEventName, this._inputHandler);
  }

  set visualize(value) {
    this._graph.visualize = value;
  }

  _getSelectableElements(el) {
    const found = new Set();

    if (this.options.elementTypes.has(el.type) || (el.classList && el.classList.contains(this.options.selectableClass))) {
      found.add(el);
    }

    if (el.getElementsByClassName) {
      for (const childEl of el.getElementsByClassName(this.options.selectableClass)) {
        found.add(childEl);
      }
    }

    if (el.getElementsByTagName) {
      for (const type of this.options.elementTypes) {
        for (const childEl of el.getElementsByTagName(type)) {
          let dupe = false;

          for (const pel in found) {
            if (pel.contains(childEl)) {
              dupe = true;
            }
          }

          if (!dupe) {
            found.add(childEl);
            if (childEl.classList && !childEl.classList.contains(this.options.selectableClass)) {
              childEl.classList.add(this.options.selectableClass);
            }
          }
        }
      }
    }

    return found;
  }

  activate() {
    utils.debug('Activating', this._selected);
  }

  _onInput(ev) {
    const { key } = ev;
    const dir = this.movements[key];
    utils.debug('Received key', key, '->', dir);

    if (key === this.options.activate) {
      ev.returnValue = this.activate();
    } else if (dir) {
      this._graph.move(dir);
    }
  }

  _onSelected(ev) {
    const el = ev.detail;

    if (this._selected) {
      utils.debug('Deselecting', this._selected);
      this._selected.classList.remove(this.options.selectedClass);
    }

    if (el && !el.classList.contains(this.options.selectedClass)) {
      utils.debug('Selecting', el);
      el.classList.add(this.options.selectedClass);
    }

    this._selected = el;
  }

  _onIntersection(changes) {
    for (const change of changes) {
      // Add visible things to the graph.
      if (change.isIntersecting) {
        this._graph.add(change.target);
      } else {
        this._graph.remove(change.target);
      }
    }
  }

  _onMutation(changes) {
    utils.debug('Mutation observed...');

    changes.forEach(change => {
      change.addedNodes.forEach(el => {
        for (const sel of this._getSelectableElements(el)) {
          this._intObs.observe(sel);
        }
      });

      change.removedNodes.forEach(el => {
        for (const sel of this._getSelectableElements(el)) {
          this._intObs.unobserve(sel);
        }
      });
    });
  }
}

export default Errokees;

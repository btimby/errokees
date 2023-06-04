/*
Errokees [ah-ro-ki:z]
*/
"use strict";
import '@babel/polyfill';
import utils from './utils.js';
import Graph from './graph.js';
import { Left, Right, Up, Down } from './directions.js';
import visualize from './visualize.js';

const defaults = {
  // keys...
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  activate: 'Enter',

  // css classes
  selectableClass: 'errokees-selectable',
  selectedClass: 'errokees-selected',

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
}

function getElements(scope, options) {
  const elements = new Set();

  if (scope.getElementsByClassName) {
    for (let el of scope.getElementsByClassName(options.selectableClass)) {
      utils.debug('Found element by class', el);
      elements.add(el);
    }
  }

  if (scope.getElementsByTagName) {
    for (let type of options.elementTypes) {
      for (let el of scope.getElementsByTagName(type)) {
        let isDupe = false;

        for (let pel in elements) {
          if (pel.contains(el)) {
            isDupe = true;
            break;
          }
        }

        if (!isDupe) {
          utils.debug('Found element by type', el);
          elements.add(el);
        }
      }
    }
  }

  utils.debug('Found', elements.size, 'elements');
  return [...elements];
}

class Errokees {
  constructor(scope, options) {
    this.scope = scope || document.body;
    this.options = {
      ...defaults,
      ...options,
    };
    this.movements = {
      [this.options.up]: Up,
      [this.options.down]: Down,
      [this.options.left]: Left,
      [this.options.right]: Right,
    }
    this._selected = null;
    this._selectedType = null;
    this._graph = new Graph()
    this.add(...getElements(this.scope, this.options));

    // handle events.
    this._mObserver = null;
    this._inputHandler = this._onInput.bind(this);

    this._paused = true;
    this.resume();

    this._visualizeEl = null;
  }

  add() {
    this._graph.add(...arguments);
    if (!this.selected) {
      this.select(this._graph.root);
      this.updateVisualization();
    }
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    this._selected = value;
    this._selectedType = null;
  }

  get selectedType() {
    if (!this._selectedType && this._selected) {
      this._selectedType =  this._selected.el.tagName.toLowerCase();
      if (this._selectedType === 'input') {
        const inputType = this._selected.el.attributes['type'];
        if (inputType) {
          this._selectedType += `-${inputType.value}`;
        }
      }
    }

    return this._selectedType || null;
  }

  get selectable() {
    return this._selectable;
  }

  visualize() {
    this._visualizeEl = visualize(this.scope, this._graph);
  }

  deVisualize() {
    this._visualizeEl.remove();
    this._visualizeEl = null;
  }

  toggleVisualization() {
    if (this._visualizeEl) {
      this.deVisualize();
    } else {
      this.visualize();
    }
  }

  updateVisualization() {
    if (this._visualizeEl || (localStorage && localStorage.errokeesVisualize)) {
      if (this._visualizeEl) {
        this.deVisualize();
      }
      this.visualize();
    }
  }

  pause() {
    if (this._paused) {
      return;
    }
    this.scope.removeEventListener(this.options.keyEventName, this._inputHandler, true);
    this._mObserver.disconnect();
    this._mObserver = null;
    this._paused = true;
    utils.info('Paused')
  }

  resume() {
    if (!this._paused) {
      return;
    }
    this.scope.addEventListener(this.options.keyEventName, this._inputHandler, true);
    this._mObserver = new MutationObserver(this._onMutation.bind(this));
    // NOTE: perhaps watch attributes too, to watch for our class being toggled.
    this._mObserver.observe(this.scope, {
      subtree: true,
      childList: true,
    });
    this._paused = false;
    utils.info('Resumed')
  }

  destroy() {
    this.pause();
    this._selectable.clear();
  }

  select(node) {
    if (!node || !node.el) {
      utils.warn('Cannot select null element');
      return;
    }

    utils.info('Selecting entity:', node.el);

    if (this.selected) {
      // Deselect current entity.
      utils.deselect(this.selected.el, this.options);
    }

    // Select new entity.
    utils.select(node.el, this.options);
    this.selected = node;

    // Controls if event bubbles or not.
    return false;
  }

  _activate() {
    utils.info('Activating selected entity:', this.selected.el);

    utils.activateSelection(this.selected.el, this.options);

    // Controls if event bubbles or not.
    return this.selectedType === 'select';
  }

  _onInput(ev) {
    const { key } = ev;
    const dir = this.movements[key];
    utils.debug('Received key', key, '->', dir);

    if (key === this.options.activate) {
      ev.returnValue = this._activate();
    } else if (dir) {
      utils.debug('Moving', dir);
      // If left or right and text input is focused, only exit focus
      // when cursor is at beginning or end.
      const focused = utils.isFocused(this.selected);
      if (focused) {
        utils.debug('element is focused');
      }

      if (this.selectedType && this.selectedType.startsWith('input') && focused) {
        if (dir === Left && !utils.isCursorLeft(this.selected)) {
          return;
        } else if (dir === Right && !utils.isCursorRight(this.selected)) {
          return;
        }
      } else if (this.selectedType && this.selectedType === 'select' && focused) {
        if (dir === Up && !utils.isSelectedTop(this.selected)) {
          return;
        } else if (dir === Down && !utils.isSelectedBottom(this.selected)) {
          return;
        }
      }

      if (this.selected[dir.name]) {
        this.select(this.selected[dir.name])
        ev.returnValue = true;
      } else {
        // Prevents scrolling on arrow key.
        ev.returnValue = false;
      }
    } else if (ev.ctrlKey && ev.altKey) {
      this.toggleVisualization();
      this.scope.addEventListener('keyup', () => this.toggleVisualization(), { once: true });
    } else {
      utils.info('Unknown key:', key);
    }

    return ev.returnValue;
  }

  _onMutation(records) {
    utils.debug('Mutation occurred');

    records.forEach(record => {
      record.addedNodes.forEach(el => {
        if (el && el.classList && el.classList.contains(this.options.selectableClass)) {
          utils.info('Adding entity:', el, 'from mutation');
          this.add(el);
        }

        this.add(...getElements(el, this.options));
      });

      record.removedNodes.forEach(el => {
        if (el && el.classList && el.classList.contains(this.options.selectableClass)) {
          utils.info('Removing entity:', el, 'from mutation')
          this._graph.deleteByElement(el);
        }

        for (let cel in getElements(el, this.options)) {
          utils.info('Removing entity child:', cel, 'from mutation')
          this._graph.deleteByElement(cel);
        }
      });
    });
  }
}

export default Errokees;

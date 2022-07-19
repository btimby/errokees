/*
Errokees [ah-ro-ki:z]
*/
"use strict";
import '@babel/polyfill';
import utils from './utils';

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

  // origin (select item by default)
  origin: 'right',
  keyEventName: 'keydown',
  selectEvent: null,
  deselectEvent: null,
  activateEvent: null,
}

class Errokees {
  constructor(scope, options) {
    options = {
      ...defaults,
      ...options,
    };
    this.scope = scope || document;
    this.options = options;
    this.movements = {
      [options.up]: 'up',
      [options.down]: 'down',
      [options.left]: 'left',
      [options.right]: 'right',
    }
    this._selected = null;
    this._selectedType = null;
    this._selectable = new Set([...this.scope.getElementsByClassName(this.options.selectableClass)]);
    if (typeof options.origin === 'string') {
      this.moveSelection(options.origin);
    } else if (options.origin) {
      this.select(options.origin);
    }
    this._mObserver = null;
    this._inputHandler = this._onInput.bind(this);
    this._paused = true;
    this.resume();
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
      this._selectedType =  this._selected.tagName.toLowerCase();
      if (this._selectedType === 'input') {
        const inputType = this._selected.attributes['type'];
        if (inputType) {
          this._selectedType += `-${inputType.value}`;
        }
      }
    }

    return this._selectedType || '';
  }

  get selectable() {
    return this._selectable;
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

  moveSelection(dir) {
    utils.debug('Moving', dir);
    let origin;

    if (this.selected) {
      // Use location of selected item as origin.
      origin = this.selected.getBoundingClientRect();

    } else {
      // Nothing is currently selected, so use a viewport edge as origin.
      const vp = utils.getViewportDimensions();
      origin = { left: 0, right: 0, top: 0, bottom: 0};

      if (dir === 'up') {
        // Moving up from bottom edge.
        origin.right = vp.width;
        origin.top = origin.bottom = vp.height;
      } else if (dir === 'down') {
        // Moving down from top edge.
        origin.right = vp.width;
      } else if (dir === 'left') {
        // Moving left from right edge.
        origin.left = origin.right = vp.width;
        origin.bottom = vp.height;
      } else if (dir === 'right') {
        // Moving right from left edge.
        origin.bottom = vp.height;
      }
    }

    utils.debug(`origin.top=${origin.top}, origin.left=${origin.left}`);
    utils.debug(`origin.bottom=${origin.bottom}, origin.right=${origin.right}`);

    // Reach out and look for collisions.
    const toSelect = this._cast(origin, dir)
    if (toSelect) {
      // Selecting new element.
      this.select(toSelect);
    } else {
      utils.info('Nothing to select')
    }
  }

  _cast(origin, dir) {
    let best, dirFunc, bestFunc;

    utils.debug("Searching", this.selectable.size, "items");

    if (dir === 'up') {
      dirFunc = utils.above;
      bestFunc = utils.below;
    } else if (dir === 'down') {
      dirFunc = utils.below;
      bestFunc = utils.above;
    } else if (dir === 'left') {
      dirFunc = utils.left;
      bestFunc = utils.right;
    } else if (dir === 'right') {
      dirFunc = utils.right;
      bestFunc = utils.left;
    }
    
    this.selectable.forEach(selectable => {
      if (this.selected === selectable) {
        return;
      }
      const rect = selectable.getBoundingClientRect();
      const area = utils.overlap(origin, rect, dir);

      utils.debug(`area=${area}`);

      if (
            // Left or right should be between origin left & right.
            area &&
            // Must be above origin.
            dirFunc(rect, origin) &&
            // Is first match or better than current best.
            (!best || bestFunc(rect, best.rect))
        ) {
        utils.debug("Choosing best option");
        best = { selectable, rect, area };
      }
    });

    return best && best.selectable;
  }

  select(entity) {
    utils.info('Selecting entity:', entity);

    this.selected = utils.changeSelection(this.selected, entity, this.options);

    // Controls if event bubbles or not.
    return false;
  }

  _activate() {
    utils.info('Activating selected entity:', this.selected);

    utils.activateSelection(this.selected, this.options);

    // Controls if event bubbles or not.
    return this.selectedType === 'select';
  }

  _onInput(ev) {
    const { key } = ev;
    const dir = this.movements[key];

    if (key === this.options.activate) {
      ev.returnValue = this._activate();
    } else if (dir) {
      // If left or right and text input is focused, only exit focus
      // when cursor is at beginning or end.
      const focused = utils.isFocused(this.selected);
      if (focused) {
        utils.debug('element is focused');
      }

      if (this.selectedType.startsWith('input') && focused) {
        if (dir === 'left' && !utils.isCursorLeft(this.selected)) {
          return;
        } else if (dir === 'right' && !utils.isCursorRight(this.selected)) {
          return;
        }
      } else if (this.selectedType === 'select' && focused) {
        if (dir === 'up' && !utils.isSelectedTop(this.selected)) {
          return;
        } else if (dir === 'down' && !utils.isSelectedBottom(this.selected)) {
          return;
        }
      }

      // Prevents scrolling on arrow key.
      ev.returnValue = this.moveSelection(dir);
    } else {
      utils.info('Unknown key:', key);
    }

    return ev.returnValue;
  }

  _onMutation(records) {
    utils.debug('Mutation occurred');

    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node && node.classList && node.classList.contains(this.options.selectableClass)) {
          utils.info('Adding entity:', node, 'from mutation');
          this.selectable.add(node);
        } else {
          utils.info('Skipping entity:', node, 'from mutation');
        }
      });

      record.removedNodes.forEach(node => {
        if (node && node.classList && node.classList.contains(this.options.selectableClass)) {
          utils.info('Removing entity:', node, 'from mutation')
          this.selectable.delete(node);
        }
      });
    });
  }
}

export default Errokees;

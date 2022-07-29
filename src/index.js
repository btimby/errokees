/*
Errokees [ah-ro-ki:z]
*/
"use strict";
import '@babel/polyfill';
import utils from './utils.js';
import Box from './box.js';

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

  // Define events.
  keyEventName: 'keydown',
  selectEvent: null,
  deselectEvent: null,
  activateEvent: null,

  // Scroll to item when selected?
  scroll: true,
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
      // Use selected item as origin.
      origin = this.selected;

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
    origin = new Box(origin);
    let selectable = Array.from(this.selectable).map(o => new Box(o));

    if (origin.element) {
      selectable = selectable.filter(o => origin.element !== o.element);
    }
    utils.debug("Searching", selectable.length, "items");

    if (dir === 'up') {
      // Only things above origin:
      let above = selectable.filter(o => {
        return origin.vContains(o, true) && origin.isBelow(o, true);
      });
      utils.debug("Found", above.length, "items contained above")
      above.sort((a, b) => {
        return origin.vDistance(a) - origin.vDistance(b);
      });
      const best = above.length && above[0];
      if (best) {
        const bBox = new Box({
          top: best.bottom,
          left: best.left,
          right: best.right,
          bottom: origin.top,
          width: 0, height: 0,
        });
        const between = selectable.filter(o => bBox.hContains(o));
        utils.debug("Found", between.length, "items between closest item")
        between.sort((a, b) => origin.hDistance(a) - origin.hDistance(b));
        return (between.length) ? between[0].element : best.element;
      }

    } else if (dir === 'down') {
      let below = selectable.filter(o => {
        return origin.vContains(o, true) && origin.isAbove(o, true);
      });
      utils.debug("Found", below.length, "items contained below");
      below.sort((a, b) => {
        return origin.vDistance(a) - origin.vDistance(b);
      });
      const best = below.length && below[0];
      if (best) {
        const bBox = new Box({
          top: origin.bottom,
          left: best.left,
          right: best.right,
          bottom: best.top,
          width: 0, height: 0,
        });
        const between = selectable.filter(o => bBox.hContains(o));
        utils.debug("Found", between.length, "items between closest item")
        between.sort((a, b) => origin.hDistance(a) - origin.hDistance(b));
        return (between.length) ? between[0].element : best.element;
      }

    } else if (dir === 'left') {
      let left = selectable.filter(o => {
        return origin.hContains(o, true) && origin.isRightOf(o, true);
      });
      utils.debug("Found", left.length, "items contained to left");
      left.sort((a, b) => {
        return origin.hDistance(a) - origin.hDistance(b);
      });
      const best = left.length && left[0];
      if (best) {
        const bBox = new Box({
          top: best.top,
          left: best.right,
          right: origin.left,
          bottom: best.bottom,
          width: 0, height: 0,
        });
        const between = selectable.filter(o => {
          return bBox.vContains(o);
        });
        utils.debug("Found", between.length, "items between closest item")
        between.sort((a, b) => origin.vDistance(a) - origin.vDistance(b));
        return (between.length) ? between[0].element : best.element;
      }

    } else if (dir === 'right') {
      let right = selectable.filter(o => {
        return origin.hContains(o, true) && origin.isLeftOf(o, true);
      });
      utils.debug("Found", right.length, "items contained to right")
      right.sort((a, b) => {
        return origin.hDistance(a) - origin.hDistance(b);
      });
      const best = right.length && right[0];
      if (best) {
        const bBox = new Box({
          top: best.top,
          left: best.left,
          right: origin.right,
          bottom: best.bottom,
          width: 0, height: 0,
        });
        const between = selectable.filter(o => {
          return bBox.vContains(o);
        });
        utils.debug("Found", between.length, "items between closest item")
        between.sort((a, b) => origin.vDistance(a) - origin.vDistance(b));
        return (between.length) ? between[0].element : best.element;
      }

    }
  }

  select(entity) {
    utils.info('Selecting entity:', entity);

    if (this.selected) {
      // Deselect current entity.
      utils.deselect(this.selected, this.options);
    }

    // Select new entity.
    utils.select(entity, this.options);
    this.selected = entity;

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
        }
        if (node && node.getElementsByClassName) {
          [...node.getElementsByClassName(this.options.selectableClass)].forEach(child => {
            utils.info('Adding entity child:', child, 'from mutation')
            this.selectable.add(child);
          })
        }
      });

      record.removedNodes.forEach(node => {
        if (node && node.classList && node.classList.contains(this.options.selectableClass)) {
          utils.info('Removing entity:', node, 'from mutation')
          this.selectable.delete(node);
        }
        if (node && node.getElementsByClassName) {
          [...node.getElementsByClassName(this.options.selectableClass)].forEach(child => {
            utils.info('Removing entity child:', child, 'from mutation')
            this.selectable.delete(child);
          })
        }
      });
    });
  }
}

export default Errokees;

/*
Errokees [ah-ro-ki:z]
*/
"use strict";

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
  selectEventName: null,
  activateEventName: null,
}

function log(level, ...args) {
  if (!localStorage.logLevel || localStorage.logLevel < level) {
    return;
  }
  console.log('[errokees]', ...args);
}

function debug(...args) {
  log(3, ...args);
}

function info(...args) {
  log(2, ...args);
}

function error(...args) {
  log(1, ...args);
}

function overlap(A, B, dir) {
  // Basic collision detection. Check if B moving in given dir will impact A.
  let Aone, Atwo, Bone, Btwo;
  if (dir === 'left' || dir === 'right') {
    Aone = A.top;
    Atwo = A.bottom;
    Bone = B.top;
    Btwo = B.bottom;
  } else {
    Aone = A.left;
    Atwo = A.right;
    Bone = B.left;
    Btwo = B.right;
  }

  debug(`Aone=${Aone}, Atwo=${Atwo}, Bone=${Bone}, Btwo=${Btwo}`);

  // Check if B has corners within A's dimensions.
  const oneBetween = (Bone >= Aone && Bone <= Atwo);
  const twoBetween = (Btwo >= Aone && Btwo <= Atwo);
  // Check if B hits A's edge
  const contains = (Bone <= Aone && Btwo >= Atwo);

  debug(`oneBetween=${oneBetween}, twoBetween=${twoBetween}, contans=${contains}`);

  // Calculate number of overlapping pixels.
  if (oneBetween && twoBetween) {
    return Btwo - Aone;
  } else if (oneBetween) {
    return Atwo - Bone;
  } else if (twoBetween) {
    return Btwo - Aone;
  } else if (contains) {
    return Atwo - Aone;
  } else {
    return 0;
  }
}

function isFocused(el) {
  return document.activeElement === el;
}

function isCursorLeft(el) {
  return el.selectionStart === 0;
}

function isCursorRight(el) {
  return el.selectionStart === el.value.length;
}

function isSelectedTop(el) {
  const res = (el.selectedIndex === -1 || el.selectedIndex === 0);
  debug('selectedIndex', el.selectedIndex, 'isSelectedTop()', res);
  return res;
}

function isSelectedBottom(el) {
  const res = (el.selectedIndex === -1 || el.selectedIndex === el.options.length - 1);
  debug('selectedIndex', el.selectedIndex, 'isSelectedBottom()', res);
  return res;
}

function getViewportDimensions() {
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;

  return { width, height };
}

class Errokees {
  constructor(options) {
    options = {
      ...defaults,
      ...options,
    };
    this.options = options;
    this.movements = {
      [options.up]: 'up',
      [options.down]: 'down',
      [options.left]: 'left',
      [options.right]: 'right',
    }
    this._selected = null;
    this._selectedType = null;
    this._entities = [...document.getElementsByClassName(this.options.selectableClass)];
    if (options.origin) {
      this._moveSelection(options.origin);
    }
    this._handler = this._onInput.bind(this);
    document.addEventListener(this.options.keyEventName, this._handler, false);
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

  get entities() {
    return this._entities;
  }

  disable() {
    document.removeEventListener(this.options.eventName, this._handler, false);
    this._handler = null;
  }

  _moveSelection(dir) {
    debug('Moving', dir);
    let origin;

    if (this.selected) {
      // Use location of selected item as origin.
      origin = this.selected.getBoundingClientRect();

    } else {
      // Nothing is currently selected, so use a viewport edge as origin.
      const vp = getViewportDimensions();
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

    debug(`origin.top=${origin.top}, origin.left=${origin.left}`);
    debug(`origin.bottom=${origin.bottom}, origin.right=${origin.right}`);

    // Reach out and look for collisions.
    const toSelect = this._cast(origin, dir)
    if (toSelect) {
      // Selecting new element.
      this._select(toSelect);
    } else {
      info('Nothing to select')
    }
  }

  _cast(origin, dir) {
    let best;
    const entities = this.entities;

    debug("Searching", entities.length, "items");

    // TODO: DRY, consolidate.
    if (dir === 'up') {
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        if (this._selected === e) {
          continue;
        }
        const rect = e.getBoundingClientRect();
        const o = overlap(origin, rect, dir);

        debug(`i=${i}, o=${o}`);
        debug(`${rect.bottom} > ${origin.bottom}`);

        if (
              // Left or right should be between origin left & right.
              o &&
              // Must be above origin.
              (rect.bottom <= origin.bottom) &&
              // Is first match or better than current best.
              (!best || rect.bottom > best.rect.bottom)
          ) {
          debug("Choosing best option");
          best = { e, rect, o };
        }
      }

    } else if (dir === 'down') {
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        if (this._selected === e) {
          continue;
        }
        const rect = e.getBoundingClientRect();
        const o = overlap(origin, rect, dir);

        debug(`i=${i}, o=${o}`);
        debug(`${rect.top} < ${origin.top}`);

        if (
              // Left or right should be between origin left & right.
              o &&
              // Must be below origin.
              (rect.top >= origin.top) &&
              // Is first match or better than current best.
              (!best || rect.top < best.rect.top)
          ) {
          debug("Choosing best option");
          best = { e, rect, o };
        }
      }

    } else if (dir === 'left') {
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        if (this._selected === e) {
          continue;
        }
        const rect = e.getBoundingClientRect();
        const o = overlap(origin, rect, dir);

        debug(`i=${i}, o=${o}`);
        debug(`${rect.left} > ${origin.left}`);

        if (
              // Top or bottom should be between origin top & bottom.
              o &&
              // Must be left of origin.
              (rect.right <= origin.left) &&
              // Is first match or better than current best.
              (!best || rect.left > best.rect.left)
          ) {
          debug("Choosing best option");
          best = { e, rect, o };
        }
      }

    } else if (dir === 'right') {
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        if (this._selected === e) {
          continue;
        }
        const rect = e.getBoundingClientRect();
        const o = overlap(origin, rect, dir);

        debug(`i=${i}, o=${o}`);
        debug(`${rect.left} < ${origin.left}`);

        if (
              // Top or bottom should be between origin top & bottom.
              o &&
              // Must be right of origin.
              (rect.left >= origin.right) &&
              // Is first match or better than current best.
              (!best || rect.right < best.rect.right)
          ) {
          debug("Choosing best option");
          best = { e, rect, o };
        }
      }
    }

    return best && best.e;
  }

  _select(element) {
    const entities = this.entities;
    const mouseOverEvent = new MouseEvent('mouseover', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    const mouseOutEvent = new MouseEvent('mouseout', {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    // Deselect current element.
    if (this.selected) {
      if (this.selectedType.startsWith('input')) {
        this.selected.blur();
      }
      if (this.selectedType.startsWith('select')) {
        this.selected.blur();
      }
      this.selected.dispatchEvent(mouseOutEvent);
    }

    // Select new element.
    entities.forEach(ent => { ent.classList.remove(this.options.selectedClass) });
    element.classList.add(this.options.selectedClass);
    this.selected = element;
    this.selected.scrollIntoView({ block: 'center', inline: 'center' });
    this.selected.dispatchEvent(mouseOverEvent);
    if (this.options.selectEventName) {
      debug('Invoking user selection event');
      this.selected.dispatchEvent(new Event(this.options.selectEventName, {
        view: window,
        bubbles: true,
        cancelable: true,
      }));
    }

    // Controls if event bubbles or not.
    return false;
  }

  _activate() {
    debug('Activating selected item', this.selectedType);

    if (this.selectedType.startsWith('input')) {
      this.selected.focus();
    } else if (this.selectedType === 'select') {
      this.selected.focus();
      // Re-enable key nagivation.
      this.selected.addEventListener('change', this.selected.blur, { once: true });
    } else if (this.selectedType === 'a' || this.selectedType === 'button') {
      this.selected.click();
    } else {
      error('No special handling');
    }

    if (this.options.activateEventName) {
      debug('Invoking user activation event');
      this.selected.dispatchEvent(new Event(this.options.activateEventName, {
        view: window,
        bubbles: true,
        cancelable: true,
      }));
    }

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
      const focused = isFocused(this.selected);
      if (focused) {
        debug('element is focused');
      }

      if (this.selectedType.startsWith('input') && focused) {
        if (dir === 'left' && !isCursorLeft(this.selected)) {
          return;
        } else if (dir === 'right' && !isCursorRight(this.selected)) {
          return;
        }
      } else if (this.selectedType === 'select' && focused) {
        if (dir === 'up' && !isSelectedTop(this.selected)) {
          return;
        } else if (dir === 'down' && !isSelectedBottom(this.selected)) {
          return;
        }
      }

      // Prevents scrolling on arrow key.
      ev.returnValue = this._moveSelection(dir);
    }

    return ev.returnValue;
  }
}

export default Errokees;

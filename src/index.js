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
    this._selectable = new Set([...document.getElementsByClassName(this.options.selectableClass)]);
    this._mObserver = new MutationObserver(this._onMutation.bind(this));
    // NOTE: perhaps watch attributes too, to watch for our class being toggled.
    this._mObserver.observe(document, {
      subtree: true,
      childList: true,
    })
    if (options.origin) {
      this._moveSelection(options.origin);
    }
    this._inputHandler = this._onInput.bind(this);
    document.addEventListener(this.options.keyEventName, this._inputHandler, false);
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

  disable() {
    document.removeEventListener(this.options.eventName, this._inputHandler, false);
    this._mObserver.disconnect();
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

    debug("Searching", this.selectable.size, "items");

    // TODO: DRY, consolidate.
    if (dir === 'up') {
      this.selectable.forEach(selectable => {
        if (this.selected === selectable) {
          return;
        }
        const rect = selectable.getBoundingClientRect();
        const area = overlap(origin, rect, dir);

        debug(`area=${area}`);
        debug(`rect.bottom=${rect.bottom} <= origin.bottom=${origin.bottom}`);

        if (
              // Left or right should be between origin left & right.
              area &&
              // Must be above origin.
              (rect.bottom <= origin.bottom) &&
              // Is first match or better than current best.
              (!best || rect.bottom > best.rect.bottom)
          ) {
          debug("Choosing best option");
          best = { selectable, rect, area };
        }
      });

    } else if (dir === 'down') {
      this.selectable.forEach(selectable => {
        if (this.selected === selectable) {
          return;
        }
        const rect = selectable.getBoundingClientRect();
        const area = overlap(origin, rect, dir);

        debug(`area=${area}`);
        debug(`rect.top=${rect.top} >= origin.top=${origin.top}`);

        if (
              // Left or right should be between origin left & right.
              area &&
              // Must be below origin.
              (rect.top >= origin.top) &&
              // Is first match or better than current best.
              (!best || rect.top < best.rect.top)
          ) {
          debug("Choosing best option");
          best = { selectable, rect, area };
        }
      });

    } else if (dir === 'left') {
      this.selectable.forEach(selectable => {
        if (this.selected === selectable) {
          return;
        }
        const rect = selectable.getBoundingClientRect();
        const area = overlap(origin, rect, dir);

        debug(`area=${area}`);
        debug(`rect.left=${rect.left} <= origin.left=${origin.left}`);

        if (
              // Top or bottom should be between origin top & bottom.
              area &&
              // Must be left of origin.
              (rect.right <= origin.left) &&
              // Is first match or better than current best.
              (!best || rect.left > best.rect.left)
          ) {
          debug("Choosing best option");
          best = { selectable, rect, area };
        }
      });

    } else if (dir === 'right') {
      this.selectable.forEach(selectable => {
        if (this.selected === selectable) {
          return;
        }
        const rect = selectable.getBoundingClientRect();
        const area = overlap(origin, rect, dir);

        debug(`area=${area}`);
        debug(`rect.left=${rect.left} >= origin.right=${origin.right}`);

        if (
              // Top or bottom should be between origin top & bottom.
              area &&
              // Must be right of origin.
              (rect.left >= origin.right) &&
              // Is first match or better than current best.
              (!best || rect.right < best.rect.right)
          ) {
          debug("Choosing best option");
          best = { selectable, rect, area };
        }
      });
    }

    return best && best.selectable;
  }

  _select(element) {
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
    this.selectable.forEach(ent => { ent.classList.remove(this.options.selectedClass) });
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

  _onMutation(records) {
    records.forEach(record => {
      // console.log(record.addedNodes);
      record.addedNodes.forEach(node => {
        if (typeof node === Element && node.classList.contains(this.options.selectableClass)) {
          this.selectable.add(node);
        }
      });

      record.removedNodes.forEach(node => {
        if (typeof node === Element && node.classList.contains(this.options.selectableClass)) {
          this.selectable.delete(node);
        }
      });
    });
  }
}

export default Errokees;

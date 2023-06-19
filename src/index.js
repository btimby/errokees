/*
Errokees [ah-ro-ki:z]
*/
"use strict";

import '@babel/polyfill';
import utils from './utils.js';
import Graph from './graph.js';

const DEFAULTS = {
  // keys...
  keys: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    activate: 'Enter',
  },

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
  observerRoot: document.body,
  observerMargin: '200px;',
  mouse: false,
}

class Errokees {
  constructor(options) {
    this.scope = options.scope || document.body;
    this.options = {
      ...DEFAULTS,
      ...options,
    };
    this.options.elementTypes = new Set(this.options.elementTypes);
    this._keyMap = {
      [this.options.keys.up]: 'up',
      [this.options.keys.down]: 'down',
      [this.options.keys.left]: 'left',
      [this.options.keys.right]: 'right',
    }
    this._graph = new Graph(this.scope, {visualize: this.options.visualize});
    this._graph.addEventListener('selected', this._onSelected.bind(this));

    this._paused = true;
    this._scrolling = null;
    this._selected = null;
    this._mouseMoving = null;
    this._mutObs = null;
    this._intObs = null;
    this._mutationHandler = this._onMutation.bind(this);
    this._keyHandler = this._onKeyInput.bind(this);
    this._mouseHandler = this._onMouseInput.bind(this);
    this._scrollHandler = this._onScroll.bind(this);
    this._intersectionHandler = this._onIntersection.bind(this);
    this._mutObs = new MutationObserver(this._mutationHandler);
    this._mutObs.observe(this.scope, {
      subtree: true,
      childList: true,
    });
    this._intObs = new IntersectionObserver(this._intersectionHandler, {
      root: this.options.observerRoot,
      rootMargin: this.options.observerMargin,
    });

    for (const el of this._getSelectableElements(this.scope)) {
      this._intObs.observe(el);
    }
    this.resume();
  }

  pause() {
    if (this._paused) {
      return;
    }

    utils.info('Pausing event handlers');
    this.scope.removeEventListener(this.options.keyEventName, this._keyHandler);
    this.scope.removeEventListener('scrollend', this._scrollHandler);
    if (this.options.mouse) {
      this.scope.removeEventListener('mousemove', this._mouseHandler);
    }
    this._paused = true;
  }

  resume() {
    if (!this._paused) {
      return;
    }

    utils.info('Resuming event handlers');
    this.scope.addEventListener(this.options.keyEventName, this._keyHandler);
    this.scope.addEventListener('scrollend', this._scrollHandler);
    if (this.options.mouse) {
      this.scope.addEventListener('mousemove', this._mouseHandler);
    }
    this._paused = false;
  }

  set visualize(value) {
    this._graph.visualize = value;
  }

  get visualize() {
    return this._graph.visualize;
  }

  select(el) {
    this._graph.select(el);
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

  _activateElement(el) {
    utils.debug('Activating', el);
    const extra = utils.readDataEvent(el, 'activate');
    const elType = el.tagName.toLowerCase();
    let inputType;
    if (elType === 'input') {
      inputType = el.getAttribute('type');
    }
    utils.debug('elType:', elType);
  
    // special element handling.
    switch (elType) {
      case 'a':
      case 'button':
        utils.debug('Focusing & clicking', elType);
        //el.focus();
        el.click();
        break;
  
      case 'input':
        if (inputType in ['checkbox', 'radio']) {
          utils.debug('Checking', inputType);
          el.checked = !el.checked;
        }
        // fall through
      case 'textarea':
        utils.debug('Focusing', elType);
        el.focus();
        break;
  
      case 'select':
        utils.debug('Opening', elType);
        el.focus();
        // NOTE: setting this always triggers change (to blur).
        el.selectedIndex = -1;
        el.addEventListener('change', el.blur, { once: true });
        break;
    }
  
    if (extra) {
      utils.raiseEventIf(el, extra);
    } else {
      utils.warn('No special handling');
    }
  
    utils.raiseEventIf(el, this.options.activateEvent);
  }

  _deselectElement(el) {
    utils.debug('Deselecting', el);
    const elType = el.tagName.toLowerCase();
    utils.readDataClasses(el, 'select').forEach(cls => el.classList.remove(cls));
    if (this.options.selectedClass) {
      el.classList.remove(this.options.selectedClass);
    }
    utils.raiseEventIf(el, this.options.deselectEvent);
    utils.raiseEventIf(el, utils.readDataEvent(el, 'deselect'))
    if (elType === 'input' || elType === 'select') {
      el.blur();
    }
  }

  _selectElement(el) {
    utils.debug('Selecting', el);
    const scroll = el.getAttribute('data-ek-scroll');
    utils.readDataClasses(el, 'select').forEach(cls => el.classList.add(cls));
    if (this.options.selectedClass) {
      el.classList.add(this.options.selectedClass);
    }
    if (scroll || this.options.scroll) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
    utils.raiseEventIf(el, this.options.selectEvent);
    utils.raiseEventIf(el, utils.readDataEvent(el, 'select'))
  }

  _onMouseInput(ev) {
  /*
  Simulate keyboard arrow keys using "mouse" movement. This is useful on
  TV browsers.
  */
    let key;

    utils.debug('Mouse event:', ev, 'screen=', window.innerWidth, window.innerHeight);
    if (ev.movementX > 0) {
      key = this.options.keys.right;
    } else if (ev.movementX < 0) {
      key = this.options.keys.left;
    } else if (ev.movementY > 0) {
      key = this.options.keys.down;
    } else if (ev.movementY < 0) {
      key = this.options.keys.up;
    } else if (ev.clientX === 0) {
      key = this.options.keys.left;
    } else if (ev.clientY === 0) {
      key = this.options.keys.up;
    } else if (ev.clientX === window.innerWidth - 1) {
      key = this.options.keys.right;
    } else if (ev.clientY === window.innerHeight - 1) {
      key = this.options.keys.down;
    } else {
      return;
    }

    ev.preventDefault();
    clearTimeout(this._mouseMoving);
    this._mouseMoving = setTimeout(() => {
      const mEv = document.createEvent('HTMLEvents');
      mEv.initEvent('keydown', true, true);
      mEv.key = key;
      this._onKeyInput(mEv);
    }, 200);
  }

  _onKeyInput(ev) {
    const { key } = ev;
    const dir = this._keyMap[key];
    utils.debug('Received key', key, '->', dir);

    if (key === this.options.keys.activate) {
      ev.returnValue = this._activateElement(this._selected);
    } else if (dir) {
      this._graph.move(dir);
      ev.returnValue = false;
    }
  }

  _onSelected(ev) {
    const el = ev.detail;

    if (this._selected) {
      this._deselectElement(this._selected);
    }

    if (el && !el.classList.contains(this.options.selectedClass)) {
      this._selectElement(el);
    }

    this._selected = el;
  }

  _onIntersection(changes) {
    for (const change of changes) {
      utils.debug(change);
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

  _onScroll() {
    this._graph.update();
  }
}

export default Errokees;

const LOG_LEVELS = {
  'error': 0,
  'warn': 1,
  'info': 2,
  'debug': 3,
};

function _shouldLog(level) {
  return (localStorage.errokeesLogLevel && localStorage.errokeesLogLevel >= level);
}

function debug(...args) {
  if (!_shouldLog(3)) return;
  console.log('[errokees]', ...args);
}

function info(...args) {
  if (!_shouldLog(2)) return;
  console.info('[errokees]', ...args);
}

function warn(...args) {
  if (!_shouldLog(1)) return;
  console.warn('[errokees]', ...args);
}

function error(...args) {
  console.error('[errokees]', ...args);
}

function setLogLevel(level) {
  if (typeof level === 'string') {
    let newLevel = level.toLowerCase();
    newLevel = LOG_LEVELS[newLevel];
    if (!newLevel) {
      throw new Error(`Invalid log level string: ${level}`);
    }
    level = newLevel;
  } else if (level < 0 || level > 3) {
    throw new Error(`Invalid numeric log level: ${level}`);
  }

  localStorage.errokeesLogLevel = level;
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

function raiseEventIf(el, eventOptions) {
  if (!el || !eventOptions) {
    return;
  }

  const { name, recurse, target } = eventOptions;
  info('Invoking user event:', name, 'on', el);

  const event = new Event(name, {
    view: window,
    bubbles: false,
    cancelable: true,
  });

  if (recurse) {
    [...el.children].forEach(ch => raiseEventIf(ch, eventOptions));
  }

  const raiseOn = (!target) ? [el] : el.querySelectorAll(target);
  raiseOn.forEach(o => o.dispatchEvent(event));
}

function readDataEvent(el, prefix) {
  const eventName = el.getAttribute(`data-ek-${prefix}-event-name`);
  const eventRecurse = el.getAttribute(`data-ek-${prefix}-event-recurse`);
  const eventTarget = el.getAttribute(`data-ek-${prefix}-event-target`);
  if (!eventName) {
    return;
  }
  return {
    name: eventName,
    recurse: (eventRecurse),
    target: eventTarget,
  }
}

function readDataClasses(el, prefix) {
  const classes = [];
  const eventClasses = el.getAttribute(`data-ek-${prefix}-class`);
  if (eventClasses) {
    eventClasses.split(' ').forEach(o => classes.push(o));
  }
  return classes;
}

function deselect(el, options) {
  const elType = el.tagName.toLowerCase();
  readDataClasses(el, 'select').forEach(cls => el.classList.remove(cls));
  if (options.selectedClass) {
    el.classList.remove(options.selectedClass);
  }
  raiseEventIf(el, options.deselectEvent);
  raiseEventIf(el, readDataEvent(el, 'deselect'))
  if (elType === 'input' || elType === 'select') {
    el.blur();
  }
}

function select(el, options) {
  const scroll = el.getAttribute('data-ek-scroll');
  readDataClasses(el, 'select').forEach(cls => el.classList.add(cls));
  if (options.selectedClass) {
    el.classList.add(options.selectedClass);
  }
  if (scroll || options.scroll) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
  raiseEventIf(el, options.selectEvent);
  raiseEventIf(el, readDataEvent(el, 'select'))
}

function activateSelection(el, options) {
  const extra = readDataEvent(el, 'activate');
  const elType = el.tagName.toLowerCase();
  debug('elType:', elType);

  const input = el.querySelector('a,button,input');
  const select = el.querySelector('select');

  if (input) {
    debug('focusing', input.tagName);
    input.focus();
  } else if (select) {
    debug('focusing select');
    select.focus();
    el.addEventListener('change', el.blur, { once: true });
  }

  if (extra) {
    raiseEventIf(el, extra);
  } else {
    warn('No special handling');
  }

  raiseEventIf(el, options.activateEvent);
}

export default {
  debug, info, warn, error, setLogLevel, isFocused, isCursorLeft, isCursorRight,
  isSelectedTop, isSelectedBottom, getViewportDimensions, raiseEventIf, select,
  deselect, activateSelection,
};

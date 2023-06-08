const LOG_LEVELS = {
  'ERROR': 0,
  'WARN': 1,
  'INFO': 2,
  'DEBUG': 3,
};

function _shouldLog(level) {
  return (localStorage.errokeesLogLevel &&
          localStorage.errokeesLogLevel >= level);
}

function debug(...args) {
  if (!_shouldLog(LOG_LEVELS.DEBUG)) return;
  console.log('[errokees]', ...args);
}

function info(...args) {
  if (!_shouldLog(LOG_LEVELS.INFO)) return;
  console.info('[errokees]', ...args);
}

function warn(...args) {
  if (!_shouldLog(LOG_LEVELS.WARN)) return;
  console.warn('[errokees]', ...args);
}

function warning(...args) {
  return warn(...args);
}

function error(...args) {
  console.error('[errokees]', ...args);
}

function setLogLevel(level) {
  if (typeof level === 'string') {
    let newLevel = level.toUpperCase();
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

export default {
  debug, info, warn, warning, error, setLogLevel, isFocused, isCursorLeft,
  isCursorRight, isSelectedTop, isSelectedBottom, getViewportDimensions,
  raiseEventIf, readDataClasses, readDataEvent,
};

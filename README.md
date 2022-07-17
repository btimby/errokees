# errokees
Errokees `[ah-ro-ki:z]` - Arrow key navigation and selection in browser.

This library exists because I needed to get the browser embedded into LG TV apps to allow easy navigation via remote. The remote emits arrow keys for navigation as well as &lt;enter&gt; key when OK is pressed.

With this library, you can assign a class to each HTML element you wish to allow the user to interact with. Further you can define a style that is assigned when an item is selected (navigated to).

When &lt;enter&gt; / OK is pressed, an item is "activated" meaning that the normal action is performed. Links and buttons are clicked. Input fields are focused and select lists are activated.

You can also provide custom events to be emitted when an item is selected or activated.

## demo

To use the demo, run `make demo`. Use your arrow keys and &lt;enter&gt; key to navigate and select a collection of elements.

The demo uses the webpack development server, so you can hack on the code easily and test your changes in the demo.

## usage

Usage is dead simple:

```javascript

let ek = new Errokees();

// If for some reason you want to shut down the library:
ek.disable();

// The ek object is now useless.
delete ek
```

You can pass an options object, and override any of the defaults.

```javascript
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
```

See the `demo/` directory for an example of usage.

## development

A Makefile is used for all common actions. Simply do `make build` or `make clean` etc.

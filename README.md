# Hysteresis nav

[![Build Status](https://travis-ci.org/mjbp/storm-hysteresis-nav.svg?branch=master)](https://travis-ci.org/mjbp/storm-hysteresis-nav)
[![codecov.io](http://codecov.io/github/mjbp/storm-hysteresis-nav/coverage.svg?branch=master)](http://codecov.io/github/mjbp/storm-hysteresis-nav?branch=master)
[![npm version](https://badge.fury.io/js/storm-hysteresis-nav.svg)](https://badge.fury.io/js/storm-hysteresis-nav)

Cursor-predicting hover menu

## Example
[https://mjbp.github.io/storm-hysteresis-nav](https://mjbp.github.io/storm-hysteresis-nav)
    

## Usage
HTML
```

```

JS
```
npm i -S storm-hysteresis-nav
```
either using es6 import
```
import HysteresisMenu from 'storm-hysteresis-nav';

HysteresisMenu.init('.js-nav');
```
aynchronous browser loading (use the .standalone version in the /dist folder)
```
import Load from 'storm-load';

Load('/content/js/async/storm-hysteresis-nav.standalone.js')
    .then(() => {
        StormHysteresisMenu.init('.js-nav');
    });
```

## Options
```
    {
        delay: 400,
        animationDelay: 160,
        itemSelector: '.js-hysteresis-nav-item',
        animatingClassName: 'is--animating',
        activeClassName: 'is--active',
        hoverClass: '',
        tolerance: 75,
        callback: null
    }
```

## Tests
```
npm run test
```

## Browser support
This is module has both es6 and es5 distributions. The es6 version should be used in a workflow that transpiles.

This module depends upon Object.assign, element.classList, and Promises, available in all evergreen browsers. ie9+ is supported with polyfills, ie8+ will work with even more polyfills for Array functions and eventListeners.

## Dependencies
None

## License
MIT

## Credit
Inspiring by https://github.com/kamens/jQuery-menu-aim
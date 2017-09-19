(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _stormHysteresisNav = require('./libs/storm-hysteresis-nav');

var _stormHysteresisNav2 = _interopRequireDefault(_stormHysteresisNav);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var onDOMContentLoadedTasks = [function () {
  _stormHysteresisNav2.default.init('.js-nav');
}];

if ('addEventListener' in window) window.addEventListener('DOMContentLoaded', function () {
  onDOMContentLoadedTasks.forEach(function (fn) {
    return fn();
  });
});

},{"./libs/storm-hysteresis-nav":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * @name storm-hysteresis-nav: Cursor-predicting hover menu
 * @version 0.1.1: Tue, 19 Sep 2017 11:45:27 GMT
 * @author stormid
 * @license MIT
 */
var defaults = {
  delay: 400,
  animationDelay: 160,
  itemSelector: '.js-hysteresis-nav-item',
  animatingClassName: 'is--animating',
  activeClassName: 'is--active',
  hoverClass: '',
  tolerance: 75,
  callback: null
},
    CONSTANTS = {
  MOUSE_LOCS_TRACKED: 3
};

var mouseLocations = [],
    timeoutId = false,
    lastDelayLoc = false;

var StormHysteresisMenu = {
  init: function init() {
    this.items = [].slice.call(this.node.querySelectorAll(this.settings.itemSelector));
    this.links = this.items.reduce(function (acc, curr) {
      if (curr.firstElementChild.hasAttribute('aria-haspopup')) acc.push(curr.firstElementChild);
      return acc;
    }, []);
    this.initListeners();
    this.boundHandleTab = this.handleTab.bind(this);
    this.activeRow = false;
    return this;
  },
  initListeners: function initListeners() {
    var _this = this;

    this.items.forEach(function (item, i) {
      return item.addEventListener('mouseenter', _this.handleMouseEnter.bind(_this, i));
    });
    this.links.forEach(function (item, i) {
      return item.addEventListener('focus', function () {
        window.setTimeout(function () {
          _this.activeRow !== false && _this.setInactive(_this.activeRow);
          _this.setActive(i);
        }, 0);
      });
    });
    this.node.addEventListener('mouseleave', this.handleMouseLeaveNav.bind(this));
    this.links.forEach(function (item, i) {
      return item.addEventListener('blur', _this.handleBlur.bind(_this, i));
    });
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  },
  handleTab: function handleTab() {
    if (!this.items[this.activeRow].contains(document.activeElement)) {
      this.setInactive(this.activeRow);
      document.removeEventListener('focusin', this.boundHandleTab);
    }
  },
  handleBlur: function handleBlur(i) {
    var _this2 = this;

    window.setTimeout(function () {
      if (!_this2.items[i].contains(document.activeElement)) _this2.setInactive(i);else document.addEventListener('focusin', _this2.boundHandleTab);
    }, 0);
  },
  handleMouseEnter: function handleMouseEnter(i) {
    if (timeoutId) clearTimeout(timeoutId);
    this.possiblyActivate(i);
  },
  handleMouseLeaveNav: function handleMouseLeaveNav() {
    if (timeoutId) clearTimeout(timeoutId);

    this.activeRow !== false && this.setInactive(this.activeRow);
    this.activeRow = false;
  },
  handleMouseMove: function handleMouseMove(e) {
    mouseLocations.push({ x: e.pageX, y: e.pageY });

    if (mouseLocations.length > CONSTANTS.MOUSE_LOCS_TRACKED) mouseLocations.shift();
  },
  possiblyActivate: function possiblyActivate(i) {
    var _this3 = this;

    var delay = this.activationDelay();

    if (delay) {
      timeoutId = setTimeout(function () {
        return _this3.possiblyActivate(i);
      }, delay);
    } else {
      this.setActive(i);
    }
  },
  activationDelay: function activationDelay() {
    if (this.activeRow === false) return 0;

    var offset = this.node.getBoundingClientRect(),
        upperLeft = {
      x: offset.left,
      y: offset.top - this.settings.tolerance
    },
        upperRight = {
      x: offset.left + this.node.offsetWidth,
      y: upperLeft.y
    },
        lowerLeft = {
      x: offset.left,
      y: offset.top + this.node.offsetHeight + this.settings.tolerance
    },
        lowerRight = {
      x: offset.left + this.node.offsetWidth,
      y: lowerLeft.y
    },
        loc = mouseLocations[mouseLocations.length - 1],
        prevLoc = mouseLocations[0];

    if (!loc) return 0;
    if (!prevLoc) prevLoc = loc;
    if (prevLoc.x < offset.left || prevLoc.x > lowerRight.x || prevLoc.y < offset.top || prevLoc.y > lowerRight.y) {
      // If the previous mouse location was outside of the entire
      // menu's bounds, immediately activate.
      return 0;
    }
    if (lastDelayLoc && loc.x == lastDelayLoc.x && loc.y == lastDelayLoc.y) {
      // If the mouse hasn't moved since the last time we checked
      // for activation status, immediately activate.
      return 0;
    }

    // Detect if the user is moving towards the currently activated
    // submenu.
    //
    // If the mouse is heading relatively clearly towards
    // the submenu's content, we should wait and give the user more
    // time before activating a new row. If the mouse is heading
    // elsewhere, we can immediately activate a new row.
    //
    // We detect this by calculating the slope formed between the
    // current mouse location and the upper/lower right points of
    // the menu. We do the same for the previous mouse location.
    // If the current mouse location's slopes are
    // increasing/decreasing appropriately compared to the
    // previous's, we know the user is moving toward the submenu.
    //
    // Note that since the y-axis increases as the cursor moves
    // down the screen, we are looking for the slope between the
    // cursor and the upper right corner to decrease over time, not
    // increase (somewhat counterintuitively).

    // Our expectations for decreasing or increasing slope values
    // depends on which direction the submenu opens relative to the
    // main menu. By default, if the menu opens on the right, we
    // expect the slope between the cursor and the upper right
    // corner to decrease over time, as explained above. If the
    // submenu opens in a different direction, we change our slope
    // expectations.
    var slope = function slope(a, b) {
      return (b.y - a.y) / (b.x - a.x);
    },
        decreasingCorner = lowerRight,
        increasingCorner = lowerLeft,
        decreasingSlope = slope(loc, decreasingCorner),
        increasingSlope = slope(loc, increasingCorner),
        prevDecreasingSlope = slope(prevLoc, decreasingCorner),
        prevIncreasingSlope = slope(prevLoc, increasingCorner);

    if (decreasingSlope < prevDecreasingSlope && increasingSlope > prevIncreasingSlope) {
      // Mouse is moving from previous location towards the
      // currently activated submenu. Delay before activating a
      // new menu row, because user may be moving into submenu.
      lastDelayLoc = loc;
      return this.settings.delay;
    }

    lastDelayLoc = false;
    return 0;
  },
  setActive: function setActive(i) {
    if (this.activeRow === i) return;
    this.activeRow !== false && this.setInactive(this.activeRow);
    this.items[i].classList.add(this.settings.activeClassName);
    this.links[i] && this.links[i].setAttribute('aria-expanded', 'true');
    this.activeRow = i;
  },
  setInactive: function setInactive(i) {
    var _this4 = this;

    this.activeRow = false;
    this.items[i].classList.add(this.settings.animatingClassName);
    window.setTimeout(function () {
      _this4.items[i].classList.remove(_this4.settings.activeClassName);
      _this4.items[i].classList.remove(_this4.settings.animatingClassName);
      _this4.links[i] && _this4.links[i].setAttribute('aria-expanded', 'false');
    }, this.settings.animationDelay);
  }
};

var init = function init(sel, opts) {
  var els = [].slice.call(document.querySelectorAll(sel));

  if (!document.querySelector(sel)) throw new Error('Hysteresis navigation cannot be initialised, no element found');

  return els.map(function (el) {
    return Object.assign(Object.create(StormHysteresisMenu), {
      node: el,
      settings: Object.assign({}, defaults, opts)
    }).init();
  });
};

exports.default = { init: init };

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL3NyYy9hcHAuanMiLCJleGFtcGxlL3NyYy9saWJzL3N0b3JtLWh5c3RlcmVzaXMtbmF2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7Ozs7Ozs7QUFFQSxJQUFNLDJCQUEyQixZQUFNLEFBQ3RDOytCQUFBLEFBQWMsS0FBZCxBQUFtQixBQUNuQjtBQUZELEFBQWdDLENBQUE7O0FBSWhDLElBQUcsc0JBQUgsQUFBeUIsZUFBUSxBQUFPLGlCQUFQLEFBQXdCLG9CQUFvQixZQUFNLEFBQUU7MEJBQUEsQUFBd0IsUUFBUSxVQUFBLEFBQUMsSUFBRDtXQUFBLEFBQVE7QUFBeEMsQUFBZ0Q7QUFBcEcsQ0FBQTs7Ozs7Ozs7QUNOakM7Ozs7OztBQU1BLElBQU07U0FBVyxBQUNGLEFBQ1A7a0JBRlMsQUFFTyxBQUNoQjtnQkFIUyxBQUdLLEFBQ2Q7c0JBSlMsQUFJVyxBQUNwQjttQkFMUyxBQUtRLEFBQ2pCO2NBTlMsQUFNRyxBQUNaO2FBUFMsQUFPRSxBQUNYO1lBUlIsQUFBaUIsQUFRQztBQVJELEFBQ1Q7SUFTSjtzQkFWSixBQVVnQixBQUNZO0FBRFosQUFDUjs7QUFHUixJQUFJLGlCQUFKLEFBQXFCO0lBQ2pCLFlBREosQUFDZ0I7SUFDWixlQUZKLEFBRW1COztBQUVuQixJQUFNO0FBQXNCLHdCQUNwQixBQUNOO1NBQUEsQUFBSyxRQUFRLEdBQUEsQUFBRyxNQUFILEFBQVMsS0FBSyxLQUFBLEFBQUssS0FBTCxBQUFVLGlCQUFpQixLQUFBLEFBQUssU0FBM0QsQUFBYSxBQUFjLEFBQXlDLEFBQ3BFO1NBQUEsQUFBSyxhQUFRLEFBQUssTUFBTCxBQUFXLE9BQU8sVUFBQSxBQUFDLEtBQUQsQUFBTSxNQUFTLEFBQzdDO1VBQUcsS0FBQSxBQUFLLGtCQUFMLEFBQXVCLGFBQTFCLEFBQUcsQUFBb0Msa0JBQWtCLElBQUEsQUFBSSxLQUFLLEtBQVQsQUFB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QU0sQUFBVSxBQUVsRDs7YUFBTyxBQUFJLElBQUksVUFBQSxBQUFDLElBQU8sQUFDdEI7a0JBQU8sQUFBTyxPQUFPLE9BQUEsQUFBTyxPQUFyQixBQUFjLEFBQWM7WUFBc0IsQUFDbEQsQUFDTjtnQkFBVSxPQUFBLEFBQU8sT0FBUCxBQUFjLElBQWQsQUFBa0IsVUFGdEIsQUFBa0QsQUFFOUMsQUFBNEI7QUFGa0IsQUFDeEQsS0FETSxFQUFQLEFBQU8sQUFHSixBQUNIO0FBTEQsQUFBTyxBQU1QLEdBTk87QUFMUjs7a0JBYWUsRUFBRSxNLEFBQUYiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IEh5c3RlcmVzaXNOYXYgZnJvbSAnLi9saWJzL3N0b3JtLWh5c3RlcmVzaXMtbmF2JztcblxuY29uc3Qgb25ET01Db250ZW50TG9hZGVkVGFza3MgPSBbKCkgPT4ge1xuXHRIeXN0ZXJlc2lzTmF2LmluaXQoJy5qcy1uYXYnKTtcbn1dO1xuICAgIFxuaWYoJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdykgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7IG9uRE9NQ29udGVudExvYWRlZFRhc2tzLmZvckVhY2goKGZuKSA9PiBmbigpKTsgfSk7IiwiLyoqXG4gKiBAbmFtZSBzdG9ybS1oeXN0ZXJlc2lzLW5hdjogQ3Vyc29yLXByZWRpY3RpbmcgaG92ZXIgbWVudVxuICogQHZlcnNpb24gMC4xLjE6IFR1ZSwgMTkgU2VwIDIwMTcgMTE6NDU6MjcgR01UXG4gKiBAYXV0aG9yIHN0b3JtaWRcbiAqIEBsaWNlbnNlIE1JVFxuICovXG5jb25zdCBkZWZhdWx0cyA9IHtcbiAgICAgICAgZGVsYXk6IDQwMCxcbiAgICAgICAgYW5pbWF0aW9uRGVsYXk6IDE2MCxcbiAgICAgICAgaXRlbVNlbGVjdG9yOiAnLmpzLWh5c3RlcmVzaXMtbmF2LWl0ZW0nLFxuICAgICAgICBhbmltYXRpbmdDbGFzc05hbWU6ICdpcy0tYW5pbWF0aW5nJyxcbiAgICAgICAgYWN0aXZlQ2xhc3NOYW1lOiAnaXMtLWFjdGl2ZScsXG4gICAgICAgIGhvdmVyQ2xhc3M6ICcnLFxuICAgICAgICB0b2xlcmFuY2U6IDc1LFxuICAgICAgICBjYWxsYmFjazogbnVsbFxuICAgIH0sXG4gICAgQ09OU1RBTlRTID0ge1xuICAgICAgICBNT1VTRV9MT0NTX1RSQUNLRUQ6IDNcbiAgICB9O1xuXG5sZXQgbW91c2VMb2NhdGlvbnMgPSBbXSxcbiAgICB0aW1lb3V0SWQgPSBmYWxzZSxcbiAgICBsYXN0RGVsYXlMb2MgPSBmYWxzZTtcblxuY29uc3QgU3Rvcm1IeXN0ZXJlc2lzTWVudSA9IHtcblx0aW5pdCgpIHtcblx0XHR0aGlzLml0ZW1zID0gW10uc2xpY2UuY2FsbCh0aGlzLm5vZGUucXVlcnlTZWxlY3RvckFsbCh0aGlzLnNldHRpbmdzLml0ZW1TZWxlY3RvcikpO1xuXHRcdHRoaXMubGlua3MgPSB0aGlzLml0ZW1zLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG5cdFx0XHRpZihjdXJyLmZpcnN0RWxlbWVudENoaWxkLmhhc0F0dHJpYnV0ZSgnYXJpYS1oYXNwb3B1cCcpKSBhY2MucHVzaChjdXJyLmZpcnN0RWxlbWVudENoaWxkKTtcblx0XHRcdHJldHVybiBhY2M7XG5cdFx0fSwgW10pO1xuXHRcdHRoaXMuaW5pdExpc3RlbmVycygpO1xuXHRcdHRoaXMuYm91bmRIYW5kbGVUYWIgPSB0aGlzLmhhbmRsZVRhYi5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuYWN0aXZlUm93ID0gZmFsc2U7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdGluaXRMaXN0ZW5lcnMoKXtcblx0XHR0aGlzLml0ZW1zLmZvckVhY2goKGl0ZW0sIGkpID0+IGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIHRoaXMuaGFuZGxlTW91c2VFbnRlci5iaW5kKHRoaXMsIGkpKSk7XG5cdFx0dGhpcy5saW5rcy5mb3JFYWNoKChpdGVtLCBpKSA9PiBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xuXHRcdFx0d2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmFjdGl2ZVJvdyAhPT0gZmFsc2UgJiYgdGhpcy5zZXRJbmFjdGl2ZSh0aGlzLmFjdGl2ZVJvdyk7XG5cdFx0XHRcdHRoaXMuc2V0QWN0aXZlKGkpO1xuXHRcdFx0fSwgMCk7XG5cdFx0fSkpO1xuXHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5oYW5kbGVNb3VzZUxlYXZlTmF2LmJpbmQodGhpcykpO1xuXHRcdHRoaXMubGlua3MuZm9yRWFjaCgoaXRlbSwgaSkgPT4gaXRlbS5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5oYW5kbGVCbHVyLmJpbmQodGhpcywgaSkpKTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcblx0fSxcblx0aGFuZGxlVGFiKCl7XG5cdFx0aWYoIXRoaXMuaXRlbXNbdGhpcy5hY3RpdmVSb3ddLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpKSB7XG5cdFx0XHR0aGlzLnNldEluYWN0aXZlKHRoaXMuYWN0aXZlUm93KTtcblx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzaW4nLCB0aGlzLmJvdW5kSGFuZGxlVGFiKTtcblx0XHR9XG5cdH0sXG5cdGhhbmRsZUJsdXIoaSl7XG5cdFx0d2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYoIXRoaXMuaXRlbXNbaV0uY29udGFpbnMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkpIHRoaXMuc2V0SW5hY3RpdmUoaSk7XG5cdFx0XHRlbHNlIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzaW4nLCB0aGlzLmJvdW5kSGFuZGxlVGFiKTtcblx0XHR9LCAwKTtcblx0fSxcblx0aGFuZGxlTW91c2VFbnRlcihpKXtcblx0XHRpZiAodGltZW91dElkKSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcblx0XHR0aGlzLnBvc3NpYmx5QWN0aXZhdGUoaSk7XG5cdH0sXG5cdGhhbmRsZU1vdXNlTGVhdmVOYXYoKXtcblx0XHRpZiAodGltZW91dElkKSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcblxuXHRcdHRoaXMuYWN0aXZlUm93ICE9PSBmYWxzZSAmJiB0aGlzLnNldEluYWN0aXZlKHRoaXMuYWN0aXZlUm93KTtcblx0XHR0aGlzLmFjdGl2ZVJvdyA9IGZhbHNlO1xuXHR9LFxuXHRoYW5kbGVNb3VzZU1vdmUoZSl7XG5cdFx0bW91c2VMb2NhdGlvbnMucHVzaCh7eDogZS5wYWdlWCwgeTogZS5wYWdlWX0pO1xuXG5cdFx0aWYgKG1vdXNlTG9jYXRpb25zLmxlbmd0aCA+IENPTlNUQU5UUy5NT1VTRV9MT0NTX1RSQUNLRUQpIG1vdXNlTG9jYXRpb25zLnNoaWZ0KCk7XG5cdH0sXG5cdHBvc3NpYmx5QWN0aXZhdGUoaSl7XG5cdFx0bGV0IGRlbGF5ID0gdGhpcy5hY3RpdmF0aW9uRGVsYXkoKTtcblxuXHRcdGlmIChkZWxheSkge1xuXHRcdFx0dGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnBvc3NpYmx5QWN0aXZhdGUoaSksIGRlbGF5KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zZXRBY3RpdmUoaSk7XG5cdFx0fVxuXHR9LFxuICAgIGFjdGl2YXRpb25EZWxheSgpe1xuICAgICAgICBpZiAodGhpcy5hY3RpdmVSb3cgPT09IGZhbHNlKSByZXR1cm4gMDtcblxuICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICAgICAgdXBwZXJMZWZ0ID0ge1xuICAgICAgICAgICAgICAgIHg6IG9mZnNldC5sZWZ0LFxuICAgICAgICAgICAgICAgIHk6IG9mZnNldC50b3AgLSB0aGlzLnNldHRpbmdzLnRvbGVyYW5jZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwcGVyUmlnaHQgPSB7XG4gICAgICAgICAgICAgICAgeDogb2Zmc2V0LmxlZnQgKyB0aGlzLm5vZGUub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICAgICAgeTogdXBwZXJMZWZ0LnlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb3dlckxlZnQgPSB7XG4gICAgICAgICAgICAgICAgeDogb2Zmc2V0LmxlZnQsXG4gICAgICAgICAgICAgICAgeTogb2Zmc2V0LnRvcCArIHRoaXMubm9kZS5vZmZzZXRIZWlnaHQgKyB0aGlzLnNldHRpbmdzLnRvbGVyYW5jZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvd2VyUmlnaHQgPSB7XG4gICAgICAgICAgICAgICAgeDogb2Zmc2V0LmxlZnQgKyB0aGlzLm5vZGUub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICAgICAgeTogbG93ZXJMZWZ0LnlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2MgPSBtb3VzZUxvY2F0aW9uc1ttb3VzZUxvY2F0aW9ucy5sZW5ndGggLSAxXSxcbiAgICAgICAgICAgIHByZXZMb2MgPSBtb3VzZUxvY2F0aW9uc1swXTtcblxuICAgICAgICAgICAgaWYgKCFsb2MpIHJldHVybiAwO1xuICAgICAgICAgICAgaWYgKCFwcmV2TG9jKSBwcmV2TG9jID0gbG9jO1xuICAgICAgICAgICAgaWYgKHByZXZMb2MueCA8IG9mZnNldC5sZWZ0IHx8IHByZXZMb2MueCA+IGxvd2VyUmlnaHQueCB8fCBwcmV2TG9jLnkgPCBvZmZzZXQudG9wIHx8IHByZXZMb2MueSA+IGxvd2VyUmlnaHQueSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBwcmV2aW91cyBtb3VzZSBsb2NhdGlvbiB3YXMgb3V0c2lkZSBvZiB0aGUgZW50aXJlXG4gICAgICAgICAgICAgICAgLy8gbWVudSdzIGJvdW5kcywgaW1tZWRpYXRlbHkgYWN0aXZhdGUuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobGFzdERlbGF5TG9jICYmIGxvYy54ID09IGxhc3REZWxheUxvYy54ICYmIGxvYy55ID09IGxhc3REZWxheUxvYy55KSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG1vdXNlIGhhc24ndCBtb3ZlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHdlIGNoZWNrZWRcbiAgICAgICAgICAgICAgICAvLyBmb3IgYWN0aXZhdGlvbiBzdGF0dXMsIGltbWVkaWF0ZWx5IGFjdGl2YXRlLlxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIHVzZXIgaXMgbW92aW5nIHRvd2FyZHMgdGhlIGN1cnJlbnRseSBhY3RpdmF0ZWRcbiAgICAgICAgICAgIC8vIHN1Ym1lbnUuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gSWYgdGhlIG1vdXNlIGlzIGhlYWRpbmcgcmVsYXRpdmVseSBjbGVhcmx5IHRvd2FyZHNcbiAgICAgICAgICAgIC8vIHRoZSBzdWJtZW51J3MgY29udGVudCwgd2Ugc2hvdWxkIHdhaXQgYW5kIGdpdmUgdGhlIHVzZXIgbW9yZVxuICAgICAgICAgICAgLy8gdGltZSBiZWZvcmUgYWN0aXZhdGluZyBhIG5ldyByb3cuIElmIHRoZSBtb3VzZSBpcyBoZWFkaW5nXG4gICAgICAgICAgICAvLyBlbHNld2hlcmUsIHdlIGNhbiBpbW1lZGlhdGVseSBhY3RpdmF0ZSBhIG5ldyByb3cuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV2UgZGV0ZWN0IHRoaXMgYnkgY2FsY3VsYXRpbmcgdGhlIHNsb3BlIGZvcm1lZCBiZXR3ZWVuIHRoZVxuICAgICAgICAgICAgLy8gY3VycmVudCBtb3VzZSBsb2NhdGlvbiBhbmQgdGhlIHVwcGVyL2xvd2VyIHJpZ2h0IHBvaW50cyBvZlxuICAgICAgICAgICAgLy8gdGhlIG1lbnUuIFdlIGRvIHRoZSBzYW1lIGZvciB0aGUgcHJldmlvdXMgbW91c2UgbG9jYXRpb24uXG4gICAgICAgICAgICAvLyBJZiB0aGUgY3VycmVudCBtb3VzZSBsb2NhdGlvbidzIHNsb3BlcyBhcmVcbiAgICAgICAgICAgIC8vIGluY3JlYXNpbmcvZGVjcmVhc2luZyBhcHByb3ByaWF0ZWx5IGNvbXBhcmVkIHRvIHRoZVxuICAgICAgICAgICAgLy8gcHJldmlvdXMncywgd2Uga25vdyB0aGUgdXNlciBpcyBtb3ZpbmcgdG93YXJkIHRoZSBzdWJtZW51LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBzaW5jZSB0aGUgeS1heGlzIGluY3JlYXNlcyBhcyB0aGUgY3Vyc29yIG1vdmVzXG4gICAgICAgICAgICAvLyBkb3duIHRoZSBzY3JlZW4sIHdlIGFyZSBsb29raW5nIGZvciB0aGUgc2xvcGUgYmV0d2VlbiB0aGVcbiAgICAgICAgICAgIC8vIGN1cnNvciBhbmQgdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciB0byBkZWNyZWFzZSBvdmVyIHRpbWUsIG5vdFxuICAgICAgICAgICAgLy8gaW5jcmVhc2UgKHNvbWV3aGF0IGNvdW50ZXJpbnR1aXRpdmVseSkuXG5cbiAgICAgICAgICAgIC8vIE91ciBleHBlY3RhdGlvbnMgZm9yIGRlY3JlYXNpbmcgb3IgaW5jcmVhc2luZyBzbG9wZSB2YWx1ZXNcbiAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gd2hpY2ggZGlyZWN0aW9uIHRoZSBzdWJtZW51IG9wZW5zIHJlbGF0aXZlIHRvIHRoZVxuICAgICAgICAgICAgLy8gbWFpbiBtZW51LiBCeSBkZWZhdWx0LCBpZiB0aGUgbWVudSBvcGVucyBvbiB0aGUgcmlnaHQsIHdlXG4gICAgICAgICAgICAvLyBleHBlY3QgdGhlIHNsb3BlIGJldHdlZW4gdGhlIGN1cnNvciBhbmQgdGhlIHVwcGVyIHJpZ2h0XG4gICAgICAgICAgICAvLyBjb3JuZXIgdG8gZGVjcmVhc2Ugb3ZlciB0aW1lLCBhcyBleHBsYWluZWQgYWJvdmUuIElmIHRoZVxuICAgICAgICAgICAgLy8gc3VibWVudSBvcGVucyBpbiBhIGRpZmZlcmVudCBkaXJlY3Rpb24sIHdlIGNoYW5nZSBvdXIgc2xvcGVcbiAgICAgICAgICAgIC8vIGV4cGVjdGF0aW9ucy5cbiAgICAgICAgICAgIGxldCBzbG9wZSA9IChhLCBiKSA9PiAoYi55IC0gYS55KSAvIChiLnggLSBhLngpLFxuICAgICAgICAgICAgICAgIGRlY3JlYXNpbmdDb3JuZXIgPSBsb3dlclJpZ2h0LFxuICAgICAgICAgICAgICAgIGluY3JlYXNpbmdDb3JuZXIgPSBsb3dlckxlZnQsXG4gICAgICAgICAgICAgICAgZGVjcmVhc2luZ1Nsb3BlID0gc2xvcGUobG9jLCBkZWNyZWFzaW5nQ29ybmVyKSxcbiAgICAgICAgICAgICAgICBpbmNyZWFzaW5nU2xvcGUgPSBzbG9wZShsb2MsIGluY3JlYXNpbmdDb3JuZXIpLFxuICAgICAgICAgICAgICAgIHByZXZEZWNyZWFzaW5nU2xvcGUgPSBzbG9wZShwcmV2TG9jLCBkZWNyZWFzaW5nQ29ybmVyKSxcbiAgICAgICAgICAgICAgICBwcmV2SW5jcmVhc2luZ1Nsb3BlID0gc2xvcGUocHJldkxvYywgaW5jcmVhc2luZ0Nvcm5lcik7XG5cbiAgICAgICAgICAgIGlmIChkZWNyZWFzaW5nU2xvcGUgPCBwcmV2RGVjcmVhc2luZ1Nsb3BlICYmIGluY3JlYXNpbmdTbG9wZSA+IHByZXZJbmNyZWFzaW5nU2xvcGUpIHtcbiAgICAgICAgICAgICAgICAvLyBNb3VzZSBpcyBtb3ZpbmcgZnJvbSBwcmV2aW91cyBsb2NhdGlvbiB0b3dhcmRzIHRoZVxuICAgICAgICAgICAgICAgIC8vIGN1cnJlbnRseSBhY3RpdmF0ZWQgc3VibWVudS4gRGVsYXkgYmVmb3JlIGFjdGl2YXRpbmcgYVxuICAgICAgICAgICAgICAgIC8vIG5ldyBtZW51IHJvdywgYmVjYXVzZSB1c2VyIG1heSBiZSBtb3ZpbmcgaW50byBzdWJtZW51LlxuICAgICAgICAgICAgICAgIGxhc3REZWxheUxvYyA9IGxvYztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5kZWxheTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGFzdERlbGF5TG9jID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gMDtcblxuICAgIH0sXG5cdHNldEFjdGl2ZShpKXtcblx0XHRpZih0aGlzLmFjdGl2ZVJvdyA9PT0gaSkgcmV0dXJuO1xuXHRcdHRoaXMuYWN0aXZlUm93ICE9PSBmYWxzZSAmJiB0aGlzLnNldEluYWN0aXZlKHRoaXMuYWN0aXZlUm93KTtcblx0XHR0aGlzLml0ZW1zW2ldLmNsYXNzTGlzdC5hZGQodGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzc05hbWUpO1xuXHRcdHRoaXMubGlua3NbaV0gJiYgdGhpcy5saW5rc1tpXS5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuXHRcdHRoaXMuYWN0aXZlUm93ID0gaTtcblx0fSxcblx0c2V0SW5hY3RpdmUoaSl7XG5cdFx0dGhpcy5hY3RpdmVSb3cgPSBmYWxzZTtcblx0XHR0aGlzLml0ZW1zW2ldLmNsYXNzTGlzdC5hZGQodGhpcy5zZXR0aW5ncy5hbmltYXRpbmdDbGFzc05hbWUpO1xuXHRcdHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdHRoaXMuaXRlbXNbaV0uY2xhc3NMaXN0LnJlbW92ZSh0aGlzLnNldHRpbmdzLmFjdGl2ZUNsYXNzTmFtZSk7XG5cdFx0XHR0aGlzLml0ZW1zW2ldLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5zZXR0aW5ncy5hbmltYXRpbmdDbGFzc05hbWUpO1xuXHRcdFx0dGhpcy5saW5rc1tpXSAmJiB0aGlzLmxpbmtzW2ldLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuXHRcdH0sIHRoaXMuc2V0dGluZ3MuYW5pbWF0aW9uRGVsYXkpO1xuXHR9XG59O1xuXG5jb25zdCBpbml0ID0gKHNlbCwgb3B0cykgPT4ge1xuXHRsZXQgZWxzID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbCkpO1xuXG5cdGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWwpKSB0aHJvdyBuZXcgRXJyb3IoJ0h5c3RlcmVzaXMgbmF2aWdhdGlvbiBjYW5ub3QgYmUgaW5pdGlhbGlzZWQsIG5vIGVsZW1lbnQgZm91bmQnKTtcbiAgICBcblx0cmV0dXJuIGVscy5tYXAoKGVsKSA9PiB7XG5cdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShTdG9ybUh5c3RlcmVzaXNNZW51KSwge1xuXHRcdFx0bm9kZTogZWwsXG5cdFx0XHRzZXR0aW5nczogT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdHMpXG5cdFx0fSkuaW5pdCgpO1xuXHR9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHsgaW5pdCB9OyJdfQ==

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
 * @version 0.1.0: Tue, 11 Apr 2017 14:23:10 GMT
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
        this.initListeners();
        this.activeRow = false;
        return this;
    },
    initListeners: function initListeners() {
        var _this = this;

        this.items.forEach(function (item, i) {
            return item.addEventListener('mouseenter', _this.handleMouseEnter.bind(_this, i));
        });
        this.node.addEventListener('mouseleave', this.handleMouseLeaveNav.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    },
    handleMouseEnter: function handleMouseEnter(i) {
        if (timeoutId) clearTimeout(timeoutId);
        this.possiblyActivate(i);
    },
    handleMouseLeaveNav: function handleMouseLeaveNav() {
        if (timeoutId) clearTimeout(timeoutId);

        // If exitMenu is supplied and returns true, deactivate the
        // currently active row on menu exit.
        this.activeRow !== false && this.setInactive(this.activeRow);
        this.activeRow = false;
    },
    handleMouseMove: function handleMouseMove(e) {
        mouseLocations.push({ x: e.pageX, y: e.pageY });

        if (mouseLocations.length > CONSTANTS.MOUSE_LOCS_TRACKED) mouseLocations.shift();
    },
    possiblyActivate: function possiblyActivate(i) {
        var _this2 = this;

        var delay = this.activationDelay();

        if (delay) {
            timeoutId = setTimeout(function () {
                return _this2.possiblyActivate(i);
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
        this.activeRow = i;
    },
    setInactive: function setInactive(i) {
        var _this3 = this;

        this.activeRow = false;
        this.items[i].classList.add(this.settings.animatingClassName);
        window.setTimeout(function () {
            _this3.items[i].classList.remove(_this3.settings.activeClassName);
            _this3.items[i].classList.remove(_this3.settings.animatingClassName);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL3NyYy9hcHAuanMiLCJleGFtcGxlL3NyYy9saWJzL3N0b3JtLWh5c3RlcmVzaXMtbmF2LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7Ozs7Ozs7QUFFQSxJQUFNLDJCQUEyQixZQUFNLEFBQ3RDOytCQUFBLEFBQWMsS0FBZCxBQUFtQixBQUNuQjtBQUZELEFBQWdDLENBQUE7O0FBSWhDLElBQUcsc0JBQUgsQUFBeUIsZUFBUSxBQUFPLGlCQUFQLEFBQXdCLG9CQUFvQixZQUFNLEFBQUU7MEJBQUEsQUFBd0IsUUFBUSxVQUFBLEFBQUMsSUFBRDtXQUFBLEFBQVE7QUFBeEMsQUFBZ0Q7QUFBcEcsQ0FBQTs7Ozs7Ozs7QUNOakM7Ozs7OztBQU1BLElBQU07V0FBVyxBQUNGLEFBQ1A7b0JBRlMsQUFFTyxBQUNoQjtrQkFIUyxBQUdLLEFBQ2Q7d0JBSlMsQUFJVyxBQUNwQjtxQkFMUyxBQUtRLEFBQ2pCO2dCQU5TLEFBTUcsQUFDWjtlQVBTLEFBT0UsQUFDWDtjQVJSLEFBQWlCLEFBUUM7QUFSRCxBQUNUO0lBU0o7d0JBVkosQUFVZ0IsQUFDWTtBQURaLEFBQ1I7O0FBR1IsSUFBSSxpQkFBSixBQUFxQjtJQUNqQixZQURKLEFBQ2dCO0lBQ1osZUFGSixBQUVtQjs7QUFFbkIsSUFBTTtBQUFzQiwwQkFDcEIsQUFDQTthQUFBLEFBQUssUUFBUSxHQUFBLEFBQUcsTUFBSCxBQUFTLEtBQUssS0FBQSxBQUFLLEtBQUwsQUFBVSxpQkFBaUIsS0FBQSxBQUFLLFNBQTNELEFBQWEsQUFBYyxBQUF5QyxBQUNwRTthQUFBLEFBQUssQUFDTDthQUFBLEFBQUssWUFBTCxBQUFpQixBQUN2QjtlQUFBLEFBQU8sQUFDUDtBQU4wQixBQU94QjtBQVB3Qiw0Q0FPVDtvQkFDWDs7YUFBQSxBQUFLLE1BQUwsQUFBVyxRQUFRLFVBQUEsQUFBQyxNQUFELEFBQU8sR0FBUDttQkFBYSxLQUFBLEFBQUssaUJBQUwsQUFBc0IsY0FBYyxNQUFBLEFBQUssaUJBQUwsQUFBc0IsWUFBdkUsQUFBYSxBQUFvQyxBQUFpQztBQUFyRyxBQUNBO2FBQUEsQUFBSyxLQUFMLEFBQVUsaUJBQVYsQUFBMkIsY0FBYyxLQUFBLEFBQUssb0JBQUwsQUFBeUIsS0FBbEUsQUFBeUMsQUFBOEIsQUFDdkU7aUJBQUEsQUFBUyxpQkFBVCxBQUEwQixhQUFhLEtBQUEsQUFBSyxnQkFBTCxBQUFxQixLQUE1RCxBQUF1QyxBQUEwQixBQUNwRTtBQVh1QixBQVl4QjtBQVp3QixnREFBQSxBQVlQLEdBQUUsQUFDZjtZQUFBLEFBQUksV0FBVyxhQUFBLEFBQWEsQUFDNUI7YUFBQSxBQUFLLGlCQUFMLEFBQXNCLEFBQ3pCO0FBZnVCLEFBZ0J4QjtBQWhCd0Isd0RBZ0JILEFBQ2pCO1lBQUEsQUFBSSxXQUFXLGFBQUEsQUFBYSxBQUU1Qjs7QUFDQTtBQUNBO2FBQUEsQUFBSyxjQUFMLEFBQW1CLFNBQVMsS0FBQSxBQUFLLFlBQVksS0FBN0MsQUFBNEIsQUFBc0IsQUFDbEQ7YUFBQSxBQUFLLFlBQUwsQUFBaUIsQUFDcEI7QUF2QnVCLEFBd0J4QjtBQXhCd0IsOENBQUEsQUF3QlIsR0FBRSxBQUNkO3VCQUFBLEFBQWUsS0FBSyxFQUFDLEdBQUcsRUFBSixBQUFNLE9BQU8sR0FBRyxFQUFwQyxBQUFvQixBQUFrQixBQUV0Qzs7WUFBSSxlQUFBLEFBQWUsU0FBUyxVQUE1QixBQUFzQyxvQkFBb0IsZUFBQSxBQUFlLEFBQzVFO0FBNUJ1QixBQTZCeEI7QUE3QndCLGdEQUFBLEFBNkJQLEdBQUU7cUJBQ2Y7O1lBQUksUUFBUSxLQUFaLEFBQVksQUFBSyxBQUVqQjs7WUFBQSxBQUFJLE9BQU8sQUFDUDttQ0FBdUIsWUFBQTt1QkFBTSxPQUFBLEFBQUssaUJBQVgsQUFBTSxBQUFzQjtBQUF2QyxhQUFBLEVBQVosQUFBWSxBQUEyQyxBQUMxRDtBQUZELGVBRU8sQUFDSDtpQkFBQSxBQUFLLFVBQUwsQUFBZSxBQUNsQjtBQUNKO0FBckN1QixBQXNDeEI7QUF0Q3dCLGdEQXNDUCxBQUNiO1lBQUksS0FBQSxBQUFLLGNBQVQsQUFBdUIsT0FBTyxPQUFBLEFBQU8sQUFFckM7O1lBQUksU0FBUyxLQUFBLEFBQUssS0FBbEIsQUFBYSxBQUFVO1lBQ25CO2VBQ08sT0FESyxBQUNFLEFBQ1Y7ZUFBRyxPQUFBLEFBQU8sTUFBTSxLQUFBLEFBQUssU0FIN0IsQUFDZ0IsQUFFc0I7QUFGdEIsQUFDUjtZQUdKO2VBQ08sT0FBQSxBQUFPLE9BQU8sS0FBQSxBQUFLLEtBRGIsQUFDa0IsQUFDM0I7ZUFBRyxVQVBYLEFBS2lCLEFBRUk7QUFGSixBQUNUO1lBR0o7ZUFDTyxPQURLLEFBQ0UsQUFDVjtlQUFHLE9BQUEsQUFBTyxNQUFNLEtBQUEsQUFBSyxLQUFsQixBQUF1QixlQUFlLEtBQUEsQUFBSyxTQVh0RCxBQVNnQixBQUUrQztBQUYvQyxBQUNSO1lBR0o7ZUFDTyxPQUFBLEFBQU8sT0FBTyxLQUFBLEFBQUssS0FEYixBQUNrQixBQUMzQjtlQUFHLFVBZlgsQUFhaUIsQUFFSTtBQUZKLEFBQ1Q7WUFHSixNQUFNLGVBQWUsZUFBQSxBQUFlLFNBakJ4QyxBQWlCVSxBQUF1QztZQUM3QyxVQUFVLGVBbEJkLEFBa0JjLEFBQWUsQUFFekI7O1lBQUksQ0FBSixBQUFLLEtBQUssT0FBQSxBQUFPLEFBQ2pCO1lBQUksQ0FBSixBQUFLLFNBQVMsVUFBQSxBQUFVLEFBQ3hCO1lBQUksUUFBQSxBQUFRLElBQUksT0FBWixBQUFtQixRQUFRLFFBQUEsQUFBUSxJQUFJLFdBQXZDLEFBQWtELEtBQUssUUFBQSxBQUFRLElBQUksT0FBbkUsQUFBMEUsT0FBTyxRQUFBLEFBQVEsSUFBSSxXQUFqRyxBQUE0RyxHQUFHLEFBQzNHO0FBQ0E7QUFDQTttQkFBQSxBQUFPLEFBQ1Y7QUFDRDtZQUFJLGdCQUFnQixJQUFBLEFBQUksS0FBSyxhQUF6QixBQUFzQyxLQUFLLElBQUEsQUFBSSxLQUFLLGFBQXhELEFBQXFFLEdBQUcsQUFDcEU7QUFDQTtBQUNBO21CQUFBLEFBQU8sQUFDVjtBQUVEOztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBOztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO1lBQUksUUFBUSxTQUFSLEFBQVEsTUFBQSxBQUFDLEdBQUQsQUFBSSxHQUFKO21CQUFVLENBQUMsRUFBQSxBQUFFLElBQUksRUFBUCxBQUFTLE1BQU0sRUFBQSxBQUFFLElBQUksRUFBL0IsQUFBVSxBQUF1QjtBQUE3QztZQUNJLG1CQURKLEFBQ3VCO1lBQ25CLG1CQUZKLEFBRXVCO1lBQ25CLGtCQUFrQixNQUFBLEFBQU0sS0FINUIsQUFHc0IsQUFBVztZQUM3QixrQkFBa0IsTUFBQSxBQUFNLEtBSjVCLEFBSXNCLEFBQVc7WUFDN0Isc0JBQXNCLE1BQUEsQUFBTSxTQUxoQyxBQUswQixBQUFlO1lBQ3JDLHNCQUFzQixNQUFBLEFBQU0sU0FOaEMsQUFNMEIsQUFBZSxBQUV6Qzs7WUFBSSxrQkFBQSxBQUFrQix1QkFBdUIsa0JBQTdDLEFBQStELHFCQUFxQixBQUNoRjtBQUNBO0FBQ0E7QUFDQTsyQkFBQSxBQUFlLEFBQ2Y7bUJBQU8sS0FBQSxBQUFLLFNBQVosQUFBcUIsQUFDeEI7QUFFRDs7dUJBQUEsQUFBZSxBQUNmO2VBQUEsQUFBTyxBQUVkO0FBeEh1QixBQXlIeEI7QUF6SHdCLGtDQUFBLEFBeUhkLEdBQUUsQUFDUjtZQUFHLEtBQUEsQUFBSyxjQUFSLEFBQXNCLEdBQUcsQUFDekI7YUFBQSxBQUFLLGNBQUwsQUFBbUIsU0FBUyxLQUFBLEFBQUssWUFBWSxLQUE3QyxBQUE0QixBQUFzQixBQUNsRDthQUFBLEFBQUssTUFBTCxBQUFXLEdBQVgsQUFBYyxVQUFkLEFBQXdCLElBQUksS0FBQSxBQUFLLFNBQWpDLEFBQTBDLEFBQzFDO2FBQUEsQUFBSyxZQUFMLEFBQWlCLEFBQ3BCO0FBOUh1QixBQStIeEI7QUEvSHdCLHNDQUFBLEFBK0haLEdBQUU7cUJBQ1Y7O2FBQUEsQUFBSyxZQUFMLEFBQWlCLEFBQ2pCO2FBQUEsQUFBSyxNQUFMLEFBQVcsR0FBWCxBQUFjLFVBQWQsQUFBd0IsSUFBSSxLQUFBLEFBQUssU0FBakMsQUFBMEMsQUFDMUM7ZUFBQSxBQUFPLFdBQVcsWUFBTSxBQUNwQjttQkFBQSxBQUFLLE1BQUwsQUFBVyxHQUFYLEFBQWMsVUFBZCxBQUF3QixPQUFPLE9BQUEsQUFBSyxTQUFwQyxBQUE2QyxBQUM3QzttQkFBQSxBQUFLLE1BQUwsQUFBVyxHQUFYLEFBQWMsVUFBZCxBQUF3QixPQUFPLE9BQUEsQUFBSyxTQUFwQyxBQUE2QyxBQUNoRDtBQUhELFdBR0csS0FBQSxBQUFLLFNBSFIsQUFHaUIsQUFDcEI7QUF0SUwsQUFBNEI7QUFBQSxBQUMzQjs7QUF3SUQsSUFBTSxPQUFPLFNBQVAsQUFBTyxLQUFBLEFBQUMsS0FBRCxBQUFNLE1BQVMsQUFDM0I7UUFBSSxNQUFNLEdBQUEsQUFBRyxNQUFILEFBQVMsS0FBSyxTQUFBLEFBQVMsaUJBQWpDLEFBQVUsQUFBYyxBQUEwQixBQUVsRDs7UUFBSSxDQUFDLFNBQUEsQUFBUyxjQUFkLEFBQUssQUFBdUIsTUFBTSxNQUFNLElBQUEsQUFBSSxNQUFWLEFBQU0sQUFBVSxBQUVsRDs7ZUFBTyxBQUFJLElBQUksVUFBQSxBQUFDLElBQU8sQUFDdEI7c0JBQU8sQUFBTyxPQUFPLE9BQUEsQUFBTyxPQUFyQixBQUFjLEFBQWM7a0JBQXNCLEFBQ2xELEFBQ047c0JBQVUsT0FBQSxBQUFPLE9BQVAsQUFBYyxJQUFkLEFBQWtCLFVBRnRCLEFBQWtELEFBRTlDLEFBQTRCO0FBRmtCLEFBQ3hELFNBRE0sRUFBUCxBQUFPLEFBR0osQUFDSDtBQUxELEFBQU8sQUFNUCxLQU5PO0FBTFI7O2tCQWFlLEVBQUUsTSxBQUFGIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBIeXN0ZXJlc2lzTmF2IGZyb20gJy4vbGlicy9zdG9ybS1oeXN0ZXJlc2lzLW5hdic7XG5cbmNvbnN0IG9uRE9NQ29udGVudExvYWRlZFRhc2tzID0gWygpID0+IHtcblx0SHlzdGVyZXNpc05hdi5pbml0KCcuanMtbmF2Jyk7XG59XTtcbiAgICBcbmlmKCdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cpIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4geyBvbkRPTUNvbnRlbnRMb2FkZWRUYXNrcy5mb3JFYWNoKChmbikgPT4gZm4oKSk7IH0pOyIsIi8qKlxuICogQG5hbWUgc3Rvcm0taHlzdGVyZXNpcy1uYXY6IEN1cnNvci1wcmVkaWN0aW5nIGhvdmVyIG1lbnVcbiAqIEB2ZXJzaW9uIDAuMS4wOiBUdWUsIDExIEFwciAyMDE3IDE0OjIzOjEwIEdNVFxuICogQGF1dGhvciBzdG9ybWlkXG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgICAgIGRlbGF5OiA0MDAsXG4gICAgICAgIGFuaW1hdGlvbkRlbGF5OiAxNjAsXG4gICAgICAgIGl0ZW1TZWxlY3RvcjogJy5qcy1oeXN0ZXJlc2lzLW5hdi1pdGVtJyxcbiAgICAgICAgYW5pbWF0aW5nQ2xhc3NOYW1lOiAnaXMtLWFuaW1hdGluZycsXG4gICAgICAgIGFjdGl2ZUNsYXNzTmFtZTogJ2lzLS1hY3RpdmUnLFxuICAgICAgICBob3ZlckNsYXNzOiAnJyxcbiAgICAgICAgdG9sZXJhbmNlOiA3NSxcbiAgICAgICAgY2FsbGJhY2s6IG51bGxcbiAgICB9LFxuICAgIENPTlNUQU5UUyA9IHtcbiAgICAgICAgTU9VU0VfTE9DU19UUkFDS0VEOiAzXG4gICAgfTtcblxubGV0IG1vdXNlTG9jYXRpb25zID0gW10sXG4gICAgdGltZW91dElkID0gZmFsc2UsXG4gICAgbGFzdERlbGF5TG9jID0gZmFsc2U7XG5cbmNvbnN0IFN0b3JtSHlzdGVyZXNpc01lbnUgPSB7XG5cdGluaXQoKSB7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXS5zbGljZS5jYWxsKHRoaXMubm9kZS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuc2V0dGluZ3MuaXRlbVNlbGVjdG9yKSk7XG4gICAgICAgIHRoaXMuaW5pdExpc3RlbmVycygpO1xuICAgICAgICB0aGlzLmFjdGl2ZVJvdyA9IGZhbHNlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuICAgIGluaXRMaXN0ZW5lcnMoKXtcbiAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBpKSA9PiBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCB0aGlzLmhhbmRsZU1vdXNlRW50ZXIuYmluZCh0aGlzLCBpKSkpO1xuICAgICAgICB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuaGFuZGxlTW91c2VMZWF2ZU5hdi5iaW5kKHRoaXMpKVxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuICAgIGhhbmRsZU1vdXNlRW50ZXIoaSl7XG4gICAgICAgIGlmICh0aW1lb3V0SWQpIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICB0aGlzLnBvc3NpYmx5QWN0aXZhdGUoaSk7XG4gICAgfSxcbiAgICBoYW5kbGVNb3VzZUxlYXZlTmF2KCl7XG4gICAgICAgIGlmICh0aW1lb3V0SWQpIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXG4gICAgICAgIC8vIElmIGV4aXRNZW51IGlzIHN1cHBsaWVkIGFuZCByZXR1cm5zIHRydWUsIGRlYWN0aXZhdGUgdGhlXG4gICAgICAgIC8vIGN1cnJlbnRseSBhY3RpdmUgcm93IG9uIG1lbnUgZXhpdC5cbiAgICAgICAgdGhpcy5hY3RpdmVSb3cgIT09IGZhbHNlICYmIHRoaXMuc2V0SW5hY3RpdmUodGhpcy5hY3RpdmVSb3cpO1xuICAgICAgICB0aGlzLmFjdGl2ZVJvdyA9IGZhbHNlO1xuICAgIH0sXG4gICAgaGFuZGxlTW91c2VNb3ZlKGUpe1xuICAgICAgICBtb3VzZUxvY2F0aW9ucy5wdXNoKHt4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZfSk7XG5cbiAgICAgICAgaWYgKG1vdXNlTG9jYXRpb25zLmxlbmd0aCA+IENPTlNUQU5UUy5NT1VTRV9MT0NTX1RSQUNLRUQpIG1vdXNlTG9jYXRpb25zLnNoaWZ0KCk7XG4gICAgfSxcbiAgICBwb3NzaWJseUFjdGl2YXRlKGkpe1xuICAgICAgICBsZXQgZGVsYXkgPSB0aGlzLmFjdGl2YXRpb25EZWxheSgpO1xuXG4gICAgICAgIGlmIChkZWxheSkge1xuICAgICAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnBvc3NpYmx5QWN0aXZhdGUoaSksIGRlbGF5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QWN0aXZlKGkpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhY3RpdmF0aW9uRGVsYXkoKXtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlUm93ID09PSBmYWxzZSkgcmV0dXJuIDA7XG5cbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgICAgIHVwcGVyTGVmdCA9IHtcbiAgICAgICAgICAgICAgICB4OiBvZmZzZXQubGVmdCxcbiAgICAgICAgICAgICAgICB5OiBvZmZzZXQudG9wIC0gdGhpcy5zZXR0aW5ncy50b2xlcmFuY2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cHBlclJpZ2h0ID0ge1xuICAgICAgICAgICAgICAgIHg6IG9mZnNldC5sZWZ0ICsgdGhpcy5ub2RlLm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgICAgIHk6IHVwcGVyTGVmdC55XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG93ZXJMZWZ0ID0ge1xuICAgICAgICAgICAgICAgIHg6IG9mZnNldC5sZWZ0LFxuICAgICAgICAgICAgICAgIHk6IG9mZnNldC50b3AgKyB0aGlzLm5vZGUub2Zmc2V0SGVpZ2h0ICsgdGhpcy5zZXR0aW5ncy50b2xlcmFuY2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb3dlclJpZ2h0ID0ge1xuICAgICAgICAgICAgICAgIHg6IG9mZnNldC5sZWZ0ICsgdGhpcy5ub2RlLm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgICAgIHk6IGxvd2VyTGVmdC55XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9jID0gbW91c2VMb2NhdGlvbnNbbW91c2VMb2NhdGlvbnMubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgICBwcmV2TG9jID0gbW91c2VMb2NhdGlvbnNbMF07XG5cbiAgICAgICAgICAgIGlmICghbG9jKSByZXR1cm4gMDtcbiAgICAgICAgICAgIGlmICghcHJldkxvYykgcHJldkxvYyA9IGxvYztcbiAgICAgICAgICAgIGlmIChwcmV2TG9jLnggPCBvZmZzZXQubGVmdCB8fCBwcmV2TG9jLnggPiBsb3dlclJpZ2h0LnggfHwgcHJldkxvYy55IDwgb2Zmc2V0LnRvcCB8fCBwcmV2TG9jLnkgPiBsb3dlclJpZ2h0LnkpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcHJldmlvdXMgbW91c2UgbG9jYXRpb24gd2FzIG91dHNpZGUgb2YgdGhlIGVudGlyZVxuICAgICAgICAgICAgICAgIC8vIG1lbnUncyBib3VuZHMsIGltbWVkaWF0ZWx5IGFjdGl2YXRlLlxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxhc3REZWxheUxvYyAmJiBsb2MueCA9PSBsYXN0RGVsYXlMb2MueCAmJiBsb2MueSA9PSBsYXN0RGVsYXlMb2MueSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBtb3VzZSBoYXNuJ3QgbW92ZWQgc2luY2UgdGhlIGxhc3QgdGltZSB3ZSBjaGVja2VkXG4gICAgICAgICAgICAgICAgLy8gZm9yIGFjdGl2YXRpb24gc3RhdHVzLCBpbW1lZGlhdGVseSBhY3RpdmF0ZS5cbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGV0ZWN0IGlmIHRoZSB1c2VyIGlzIG1vdmluZyB0b3dhcmRzIHRoZSBjdXJyZW50bHkgYWN0aXZhdGVkXG4gICAgICAgICAgICAvLyBzdWJtZW51LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIElmIHRoZSBtb3VzZSBpcyBoZWFkaW5nIHJlbGF0aXZlbHkgY2xlYXJseSB0b3dhcmRzXG4gICAgICAgICAgICAvLyB0aGUgc3VibWVudSdzIGNvbnRlbnQsIHdlIHNob3VsZCB3YWl0IGFuZCBnaXZlIHRoZSB1c2VyIG1vcmVcbiAgICAgICAgICAgIC8vIHRpbWUgYmVmb3JlIGFjdGl2YXRpbmcgYSBuZXcgcm93LiBJZiB0aGUgbW91c2UgaXMgaGVhZGluZ1xuICAgICAgICAgICAgLy8gZWxzZXdoZXJlLCB3ZSBjYW4gaW1tZWRpYXRlbHkgYWN0aXZhdGUgYSBuZXcgcm93LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFdlIGRldGVjdCB0aGlzIGJ5IGNhbGN1bGF0aW5nIHRoZSBzbG9wZSBmb3JtZWQgYmV0d2VlbiB0aGVcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgbW91c2UgbG9jYXRpb24gYW5kIHRoZSB1cHBlci9sb3dlciByaWdodCBwb2ludHMgb2ZcbiAgICAgICAgICAgIC8vIHRoZSBtZW51LiBXZSBkbyB0aGUgc2FtZSBmb3IgdGhlIHByZXZpb3VzIG1vdXNlIGxvY2F0aW9uLlxuICAgICAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgbW91c2UgbG9jYXRpb24ncyBzbG9wZXMgYXJlXG4gICAgICAgICAgICAvLyBpbmNyZWFzaW5nL2RlY3JlYXNpbmcgYXBwcm9wcmlhdGVseSBjb21wYXJlZCB0byB0aGVcbiAgICAgICAgICAgIC8vIHByZXZpb3VzJ3MsIHdlIGtub3cgdGhlIHVzZXIgaXMgbW92aW5nIHRvd2FyZCB0aGUgc3VibWVudS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBOb3RlIHRoYXQgc2luY2UgdGhlIHktYXhpcyBpbmNyZWFzZXMgYXMgdGhlIGN1cnNvciBtb3Zlc1xuICAgICAgICAgICAgLy8gZG93biB0aGUgc2NyZWVuLCB3ZSBhcmUgbG9va2luZyBmb3IgdGhlIHNsb3BlIGJldHdlZW4gdGhlXG4gICAgICAgICAgICAvLyBjdXJzb3IgYW5kIHRoZSB1cHBlciByaWdodCBjb3JuZXIgdG8gZGVjcmVhc2Ugb3ZlciB0aW1lLCBub3RcbiAgICAgICAgICAgIC8vIGluY3JlYXNlIChzb21ld2hhdCBjb3VudGVyaW50dWl0aXZlbHkpLlxuXG4gICAgICAgICAgICAvLyBPdXIgZXhwZWN0YXRpb25zIGZvciBkZWNyZWFzaW5nIG9yIGluY3JlYXNpbmcgc2xvcGUgdmFsdWVzXG4gICAgICAgICAgICAvLyBkZXBlbmRzIG9uIHdoaWNoIGRpcmVjdGlvbiB0aGUgc3VibWVudSBvcGVucyByZWxhdGl2ZSB0byB0aGVcbiAgICAgICAgICAgIC8vIG1haW4gbWVudS4gQnkgZGVmYXVsdCwgaWYgdGhlIG1lbnUgb3BlbnMgb24gdGhlIHJpZ2h0LCB3ZVxuICAgICAgICAgICAgLy8gZXhwZWN0IHRoZSBzbG9wZSBiZXR3ZWVuIHRoZSBjdXJzb3IgYW5kIHRoZSB1cHBlciByaWdodFxuICAgICAgICAgICAgLy8gY29ybmVyIHRvIGRlY3JlYXNlIG92ZXIgdGltZSwgYXMgZXhwbGFpbmVkIGFib3ZlLiBJZiB0aGVcbiAgICAgICAgICAgIC8vIHN1Ym1lbnUgb3BlbnMgaW4gYSBkaWZmZXJlbnQgZGlyZWN0aW9uLCB3ZSBjaGFuZ2Ugb3VyIHNsb3BlXG4gICAgICAgICAgICAvLyBleHBlY3RhdGlvbnMuXG4gICAgICAgICAgICBsZXQgc2xvcGUgPSAoYSwgYikgPT4gKGIueSAtIGEueSkgLyAoYi54IC0gYS54KSxcbiAgICAgICAgICAgICAgICBkZWNyZWFzaW5nQ29ybmVyID0gbG93ZXJSaWdodCxcbiAgICAgICAgICAgICAgICBpbmNyZWFzaW5nQ29ybmVyID0gbG93ZXJMZWZ0LFxuICAgICAgICAgICAgICAgIGRlY3JlYXNpbmdTbG9wZSA9IHNsb3BlKGxvYywgZGVjcmVhc2luZ0Nvcm5lciksXG4gICAgICAgICAgICAgICAgaW5jcmVhc2luZ1Nsb3BlID0gc2xvcGUobG9jLCBpbmNyZWFzaW5nQ29ybmVyKSxcbiAgICAgICAgICAgICAgICBwcmV2RGVjcmVhc2luZ1Nsb3BlID0gc2xvcGUocHJldkxvYywgZGVjcmVhc2luZ0Nvcm5lciksXG4gICAgICAgICAgICAgICAgcHJldkluY3JlYXNpbmdTbG9wZSA9IHNsb3BlKHByZXZMb2MsIGluY3JlYXNpbmdDb3JuZXIpO1xuXG4gICAgICAgICAgICBpZiAoZGVjcmVhc2luZ1Nsb3BlIDwgcHJldkRlY3JlYXNpbmdTbG9wZSAmJiBpbmNyZWFzaW5nU2xvcGUgPiBwcmV2SW5jcmVhc2luZ1Nsb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gTW91c2UgaXMgbW92aW5nIGZyb20gcHJldmlvdXMgbG9jYXRpb24gdG93YXJkcyB0aGVcbiAgICAgICAgICAgICAgICAvLyBjdXJyZW50bHkgYWN0aXZhdGVkIHN1Ym1lbnUuIERlbGF5IGJlZm9yZSBhY3RpdmF0aW5nIGFcbiAgICAgICAgICAgICAgICAvLyBuZXcgbWVudSByb3csIGJlY2F1c2UgdXNlciBtYXkgYmUgbW92aW5nIGludG8gc3VibWVudS5cbiAgICAgICAgICAgICAgICBsYXN0RGVsYXlMb2MgPSBsb2M7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuZGVsYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxhc3REZWxheUxvYyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIDA7XG5cbiAgICB9LFxuICAgIHNldEFjdGl2ZShpKXtcbiAgICAgICAgaWYodGhpcy5hY3RpdmVSb3cgPT09IGkpIHJldHVybjtcbiAgICAgICAgdGhpcy5hY3RpdmVSb3cgIT09IGZhbHNlICYmIHRoaXMuc2V0SW5hY3RpdmUodGhpcy5hY3RpdmVSb3cpO1xuICAgICAgICB0aGlzLml0ZW1zW2ldLmNsYXNzTGlzdC5hZGQodGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzc05hbWUpO1xuICAgICAgICB0aGlzLmFjdGl2ZVJvdyA9IGk7XG4gICAgfSxcbiAgICBzZXRJbmFjdGl2ZShpKXtcbiAgICAgICAgdGhpcy5hY3RpdmVSb3cgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pdGVtc1tpXS5jbGFzc0xpc3QuYWRkKHRoaXMuc2V0dGluZ3MuYW5pbWF0aW5nQ2xhc3NOYW1lKTtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pdGVtc1tpXS5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgIHRoaXMuaXRlbXNbaV0uY2xhc3NMaXN0LnJlbW92ZSh0aGlzLnNldHRpbmdzLmFuaW1hdGluZ0NsYXNzTmFtZSk7XG4gICAgICAgIH0sIHRoaXMuc2V0dGluZ3MuYW5pbWF0aW9uRGVsYXkpO1xuICAgIH1cbn07XG5cbmNvbnN0IGluaXQgPSAoc2VsLCBvcHRzKSA9PiB7XG5cdGxldCBlbHMgPSBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsKSk7XG5cblx0aWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbCkpIHRocm93IG5ldyBFcnJvcignSHlzdGVyZXNpcyBuYXZpZ2F0aW9uIGNhbm5vdCBiZSBpbml0aWFsaXNlZCwgbm8gZWxlbWVudCBmb3VuZCcpO1xuICAgIFxuXHRyZXR1cm4gZWxzLm1hcCgoZWwpID0+IHtcblx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKFN0b3JtSHlzdGVyZXNpc01lbnUpLCB7XG5cdFx0XHRub2RlOiBlbCxcblx0XHRcdHNldHRpbmdzOiBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0cywgb3B0cylcblx0XHR9KS5pbml0KCk7XG5cdH0pO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgeyBpbml0IH07Il19

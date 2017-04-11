/**
 * @name storm-hysteresis-nav: Cursor-predicting hover menu
 * @version 0.1.0: Tue, 11 Apr 2017 14:23:10 GMT
 * @author stormid
 * @license MIT
 */
(function(root, factory) {
   var mod = {
       exports: {}
   };
   if (typeof exports !== 'undefined'){
       mod.exports = exports
       factory(mod.exports)
       module.exports = mod.exports.default
   } else {
       factory(mod.exports);
       root.StormHysteresisNav = mod.exports.default
   }

}(this, function(exports) {
   'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
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

exports.default = { init: init };;
}));
/* global exports, require, window, global, console, module */
"use strict";
/**
 * Vitest Setup File for Services Feature
 *
 * Imports custom matchers from @testing-library/jest-dom
 * for enhanced assertions in component tests.
 *
 * Includes comprehensive mocks for:
 * - window.matchMedia (JSDOM compatibility)
 * - IntersectionObserver (for virtualization)
 * - ResizeObserver (for responsive components)
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("@testing-library/jest-dom/vitest");
// Mock window.matchMedia (not available in JSDOM)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: function (query) { return ({
        matches: false,
        media: query,
        onchange: null,
        addListener: function () { }, // deprecated
        removeListener: function () { }, // deprecated
        addEventListener: function () { },
        removeEventListener: function () { },
        dispatchEvent: function () { return true; },
    }); },
});
// Mock IntersectionObserver (not available in JSDOM)
var MockIntersectionObserver = /** @class */ (function () {
    function MockIntersectionObserver(callback, options) {
        this.callback = callback;
        this.options = options;
        this.root = null;
        this.rootMargin = '';
        this.thresholds = [];
    }
    MockIntersectionObserver.prototype.observe = function () { };
    MockIntersectionObserver.prototype.unobserve = function () { };
    MockIntersectionObserver.prototype.disconnect = function () { };
    MockIntersectionObserver.prototype.takeRecords = function () {
        return [];
    };
    return MockIntersectionObserver;
}());
global.IntersectionObserver = MockIntersectionObserver;
// Mock ResizeObserver (not available in JSDOM)
var MockResizeObserver = /** @class */ (function () {
    function MockResizeObserver(callback) {
        this.callback = callback;
    }
    MockResizeObserver.prototype.observe = function () { };
    MockResizeObserver.prototype.unobserve = function () { };
    MockResizeObserver.prototype.disconnect = function () { };
    return MockResizeObserver;
}());
global.ResizeObserver = MockResizeObserver;
// Suppress console warnings from libraries during tests
var originalConsoleWarn = console.warn;
var originalConsoleError = console.error;
console.warn = function () {
    var _a, _b;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var msg = ((_b = (_a = args[0]) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || '';
    // Suppress Zustand devtools warning
    if (msg.includes('devtools middleware'))
        return;
    // Suppress Apollo Client connectToDevTools deprecation
    if (msg.includes('connectToDevTools'))
        return;
    // Suppress i18next warnings
    if (msg.includes('i18next'))
        return;
    originalConsoleWarn.apply(console, args);
};
console.error = function () {
    var _a, _b;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var msg = ((_b = (_a = args[0]) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || '';
    // Suppress invariant errors during tests
    if (msg.includes('invariant'))
        return;
    originalConsoleError.apply(console, args);
};

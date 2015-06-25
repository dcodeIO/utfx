/*
 Copyright 2014 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
//? UTFX_STANDALONE = true;

/**
 * @license utfx (c) 2014 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/utfx for details
 */
(function(global, factory) {

    /* AMD */ if (typeof define === 'function' && define['amd'])
        define(factory);
    /* CommonJS */ else if (typeof require === "function" && typeof module === 'object' && module && module['exports'])
        module['exports'] = factory();
    /* Global */ else
        (global["dcodeIO"] = global["dcodeIO"] || {})["utfx"] = factory();

})(this, function() {
    "use strict";

    if (!Array.isArray)
        Array.isArray = function (v) {
            return Object.prototype.toString.call(v) === "[object Array]";
        };

    //? include("utfx.js");

    /**
     * String.fromCharCode reference for compile time renaming.
     * @type {!function(...[number]):string}
     * @inner
     */
    var stringFromCharCode = String.fromCharCode;

    /**
     * Creates a source function for an array.
     * @param {!Array.<number>} a Array to read from
     * @returns {!function():number|null} Source function returning the next value respectively `null` if there are no
     *  more values left.
     * @throws {TypeError} If the argument is invalid
     //? if (UTFX_STANDALONE)
     * @expose
     */
    utfx.arraySource = function(a) {
        if (!Array.isArray(a))
            throw TypeError("Illegal argument: "+(typeof a));
        var i=0; return function() {
            return i >= a.length ? null : a[i++];
        };
    };

    /**
     * Creates a destination function for an array.
     * @param {!Array.<number>} a Array to write to
     * @returns {!function(number)} Destination function successively called with the next value.
     * @throws {TypeError} If the argument is invalid
     //? if (UTFX_STANDALONE)
     * @expose
     */
    utfx.arrayDestination = function(a) {
        if (!Array.isArray(a))
            throw TypeError("Illegal argument: "+(typeof a));
        return Array.prototype.push.bind(a);
    };

    /**
     * Creates a source function for a string.
     * @param {string} s String to read from
     * @returns {!function():number|null} Source function returning the next char code respectively `null` if there are
     *  no more characters left.
     * @throws {TypeError} If the argument is invalid
     //? if (UTFX_STANDALONE)
     * @expose
     */
    utfx.stringSource = function(s) {
        if (typeof s !== 'string')
            throw TypeError("Illegal argument: "+(typeof s));
        var i=0; return function() {
            return i >= s.length ? null : s.charCodeAt(i++);
        };
    };

    /**
     * Creates a destination function for a string.
     * @returns {function(number=):undefined|string} Destination function successively called with the next char code.
     *  Returns the final string when called without arguments.
     //? if (UTFX_STANDALONE)
     * @expose
     */
    utfx.stringDestination = function() {
        var cs = [], ps = []; return function() {
            if (arguments.length === 0)
                return ps.join('')+stringFromCharCode.apply(String, cs);
            if (cs.length + arguments.length > 1024)
                ps.push(stringFromCharCode.apply(String, cs)),
                    cs.length = 0;
            Array.prototype.push.apply(cs, arguments);
        };
    };

    /**
     * Asserts an UTF16 char code.
     * @param {number} c UTF16 char code
     * @returns {number} Valid char code
     * @throws {TypeError} If the char code is invalid
     * @throws {RangeError} If the char code is out of range
     //? if (UTFX_STANDALONE)
     * @expose
     */
    utfx.assertCharCode = function(c) {
        if (typeof c !== 'number' || c !== c)
            throw TypeError("Illegal char code: "+(typeof c));
        if (c < 0 || c > 0xFFFF)
            throw RangeError("Illegal char code: "+c);
        return c;
    };

    /**
     * Asserts an UTF8 code point.
     * @param {number} cp UTF8 code point
     * @returns {number} Valid code point
     * @throws {TypeError} If the code point is invalid
     * @throws {RangeError} If the code point is out of range
     //? if (UTFX_STANDALONE)
     * @expose
     */
    utfx.assertCodePoint = function(cp) {
        if (typeof cp !== 'number' || cp !== cp)
            throw TypeError("Illegal code point: "+(typeof cp));
        if (cp < 0 || cp > utfx.MAX_CODEPOINT)
            throw RangeError("Illegal code point: "+cp);
        return cp;
    };

    /**
     * A polyfill for `String.fromCodePoint`.
     * @param {...number} var_args Code points
     * @returns {string} JavaScript string
     * @throws {TypeError} If arguments are invalid or a code point is invalid
     * @throws {RangeError} If a code point is out of range
     * @expose
     */
    utfx.fromCodePoint = function(var_args) {
        var sd, i=0, cps=arguments, k=cps.length;
        utfx.UTF8toUTF16(function() {
            return i < k ? utfx.assertCodePoint(cps[i++]) : null;
        }, sd = utfx.stringDestination());
        return sd();
    };

    /**
     * A polyfill for `String#codePointAt`.
     * @param {string} s JavaScript string
     * @param {number} i Index
     * @returns {number|undefined} Code point or `undefined` if `i` is out of range
     * @throws {TypeError} If arguments are invalid
     * @expose
     */
    utfx.codePointAt = function(s, i) {
        if ((typeof s !== 'string' && !(s && s instanceof String)) || typeof i !== 'number')
            throw TypeError("Illegal arguments: "+(typeof s)+", "+(typeof i));
        var k, cp;
        if (i < 0 || i >= (k=s.length))
            return;
        utfx.UTF16toUTF8(function() {
            return typeof cp === 'undefined' && i < k ? s.charCodeAt(i++) : null;
        }, function(icp) {
            cp = icp;
        });
        return cp;
    };

    /**
     * Installs utfx as a polyfill for `String.fromCodePoint` and `String#codePointAt` if not implemented.
     * @param {boolean=} override Overrides an existing implementation if `true`, defaults to `false`
     * @returns {!Object.<string,*>} utfx namespace
     * @expose
     */
    utfx.polyfill = function(override) {
        if (!String['fromCodePoint'] || override)
            String['fromCodePoint'] = utfx.fromCodePoint;
        if (!String.prototype['codePointAt'] || override)
            String.prototype['codePointAt'] = function(i) { return utfx.codePointAt(this, i); };
        return utfx;
    };

    return utfx;

});

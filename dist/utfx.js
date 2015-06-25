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

    /**
     * utfx namespace.
     * @exports utfx
     * @type {!Object.<string,*>}
     */
    var utfx = {};

    /**
     * Maximum valid code point.
     * @type {number}
     * @const
     * @expose
     */
    utfx.MAX_CODEPOINT = 0x10FFFF;

    /**
     * Encodes UTF8 code points to UTF8 bytes.
     * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
     * @expose
     */
    utfx.encodeUTF8 = function(src, dst) {
        var cp = null;
        if (typeof src === 'number')
            cp = src,
            src = function() { return null; };
        while (cp !== null || (cp = src()) !== null) {
            if (cp < 0x80)
                dst(cp&0x7F);
            else if (cp < 0x800)
                dst(((cp>>6)&0x1F)|0xC0),
                dst((cp&0x3F)|0x80);
            else if (cp < 0x10000)
                dst(((cp>>12)&0x0F)|0xE0),
                dst(((cp>>6)&0x3F)|0x80),
                dst((cp&0x3F)|0x80);
            else
                dst(((cp>>18)&0x07)|0xF0),
                dst(((cp>>12)&0x3F)|0x80),
                dst(((cp>>6)&0x3F)|0x80),
                dst((cp&0x3F)|0x80);
            cp = null;
        }
    };

    /**
     * Decodes UTF8 bytes to UTF8 code points.
     * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
     *  remaining bytes.
     * @expose
     */
    utfx.decodeUTF8 = function(src, dst) {
        var a, b, c, d, fail = function(b) {
            b = b.slice(0, b.indexOf(null));
            var err = Error(b.toString());
            err.name = "TruncatedError";
            err['bytes'] = b;
            throw err;
        };
        while ((a = src()) !== null) {
            if ((a&0x80) === 0)
                dst(a);
            else if ((a&0xE0) === 0xC0)
                ((b = src()) === null) && fail([a, b]),
                dst(((a&0x1F)<<6) | (b&0x3F));
            else if ((a&0xF0) === 0xE0)
                ((b=src()) === null || (c=src()) === null) && fail([a, b, c]),
                dst(((a&0x0F)<<12) | ((b&0x3F)<<6) | (c&0x3F));
            else if ((a&0xF8) === 0xF0)
                ((b=src()) === null || (c=src()) === null || (d=src()) === null) && fail([a, b, c ,d]),
                dst(((a&0x07)<<18) | ((b&0x3F)<<12) | ((c&0x3F)<<6) | (d&0x3F));
            else throw RangeError("Illegal starting byte: "+a);
        }
    };

    /**
     * Converts UTF16 characters to UTF8 code points.
     * @param {!function():number|null} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @param {!function(number)} dst Code points destination as a function successively called with each converted code
     *  point.
     * @expose
     */
    utfx.UTF16toUTF8 = function(src, dst) {
        var c1, c2 = null;
        while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
                break;
            if (c1 >= 0xD800 && c1 <= 0xDFFF) {
                if ((c2 = src()) !== null) {
                    if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
                        dst((c1-0xD800)*0x400+c2-0xDC00+0x10000);
                        c2 = null; continue;
                    }
                }
            }
            dst(c1);
        }
        if (c2 !== null) dst(c2);
    };

    /**
     * Converts UTF8 code points to UTF16 characters.
     * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {RangeError} If a code point is out of range
     * @expose
     */
    utfx.UTF8toUTF16 = function(src, dst) {
        var cp = null;
        if (typeof src === 'number')
            cp = src, src = function() { return null; };
        while (cp !== null || (cp = src()) !== null) {
            if (cp <= 0xFFFF)
                dst(cp);
            else
                cp -= 0x10000,
                dst((cp>>10)+0xD800),
                dst((cp%0x400)+0xDC00);
            cp = null;
        }
    };

    /**
     * Converts and encodes UTF16 characters to UTF8 bytes.
     * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
     *  if there are no more characters left.
     * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
     * @expose
     */
    utfx.encodeUTF16toUTF8 = function(src, dst) {
        utfx.UTF16toUTF8(src, function(cp) {
            utfx.encodeUTF8(cp, dst);
        });
    };

    /**
     * Decodes and converts UTF8 bytes to UTF16 characters.
     * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
     * @expose
     */
    utfx.decodeUTF8toUTF16 = function(src, dst) {
        utfx.decodeUTF8(src, function(cp) {
            utfx.UTF8toUTF16(cp, dst);
        });
    };

    /**
     * Calculates the byte length of an UTF8 code point.
     * @param {number} cp UTF8 code point
     * @returns {number} Byte length
     * @expose
     */
    utfx.calculateCodePoint = function(cp) {
        return (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
    };

    /**
     * Calculates the number of UTF8 bytes required to store UTF8 code points.
     * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
     *  `null` if there are no more code points left.
     * @returns {number} The number of UTF8 bytes required
     * @expose
     */
    utfx.calculateUTF8 = function(src) {
        var cp, l=0;
        while ((cp = src()) !== null)
            l += (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
        return l;
    };

    /**
     * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
     * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
     * @expose
     */
    utfx.calculateUTF16asUTF8 = function(src) {
        var n=0, l=0;
        utfx.UTF16toUTF8(src, function(cp) {
            ++n; l += (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
        });
        return [n,l];
    };

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

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
(function(global, String) {
    "use strict";

    if (!Array.isArray) {
        Array.isArray = function (v) {
            return Object.prototype.toString.call(v) === "[object Array]";
        };
    }

    /**
     * String.fromCharCode reference for compile time renaming.
     * @type {function(...[number]):string}
     * @inner
     */
    var stringFromCharCode = String.fromCharCode;

    /**
     * utfx namespace.
     * @exports utfx
     * @type {!Object.<string,*>}
     */
    var utfx = {};

    /**
     * A source function always returning `null`.
     * @returns {null}
     * @inner
     */
    function nullSource() {
        return null;
    }

    /**
     * A noop function doing nothing.
     * @inner
     */
    function noop() {}

    /**
     * Constructs a new TruncatedError.
     * @class An error indicating a truncated source. Contains the remaining bytes as an array in its `bytes` property.
     * @param {!Array.<number>} b Remaining bytes
     * @extends Error
     * @constructor
     * @expose
     */
    utfx.TruncatedError = function(b) {
        if (!(this instanceof utfx.TruncatedError))
            return new utfx.TruncatedError(b);
        Error.call(this);
        this.name = "TruncatedError";
        this.message = b.join(', ');

        /**
         * Remaining bytes.
         * @type {!Array.<number>}
         * @expose
         */
        this.bytes = b;
    };

    // Extends Error
    utfx.TruncatedError.prototype = new Error();

    /**
     * Encodes UTF8 code points to an arbitrary output destination of UTF8 bytes.
     * @param {(function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {function(number)} dst Bytes destination as a function successively called with the next byte
     * @param {boolean=} noAssert Set to `true` to skip argument and range assertions, defaults to `false`
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a code point is invalid in UTF8
     * @expose
     */
    utfx.encodeUTF8 = function(src, dst, noAssert) {
        var cp = null, t;
        if (typeof src === 'number')
            cp = src,
            src = nullSource;
        if (!noAssert) {
            if (typeof src !== 'function' || typeof dst !== 'function')
                throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
            t = function(cp) {
                if (cp < 0 || cp > 0x10FFFF)
                    throw RangeError("Illegal code point: "+cp);
            };
        } else t = noop;
        while (cp !== null || (cp = src()) !== null) {
            t(cp);
            if (cp < 0x80)
                dst(cp&0x7F1);
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
     * Decodes an arbitrary input source of UTF8 bytes to UTF8 code points.
     * @param {(function():number|null)} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {function(number)} dst Code points destination as a function successively called with each decoded code point.
     * @param {boolean=} noAssert Set to `true` to skip argument assertions, defaults to `false`
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {utfx.TruncatedError} If the last sequence is truncated. Has an array property `bytes` holding the
     *  remaining bytes.
     * @expose
     */
    utfx.decodeUTF8 = function(src, dst, noAssert) {
        if (!noAssert && (typeof src !== 'function' || typeof dst !== 'function'))
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
        var a, b, c, d, t = function(b) {
            throw utfx.TruncatedError(b.slice(0, b.indexOf(null)));
        };
        while ((a = src()) !== null) {
            if ((a&0x80) === 0)
                dst(a);
            else if ((a&0xE0) === 0xC0)
                ((b = src()) === null) && t([a, b]),
                dst(((a&0x1F)<<6) | (b&0x3F));
            else if ((a&0xF0) === 0xE0)
                ((b=src()) === null || (c=src()) === null) && t([a, b, c]),
                dst(((a&0x0F)<<12) | ((b&0x3F)<<6) | (c&0x3F));
            else if ((a&0xF8) === 0xF0)
                ((b=src()) === null || (c=src()) === null || (d=src()) === null) && t([a, b, c ,d]),
                dst(((a&0x07)<<18) | ((b&0x3F)<<12) | ((c&0x3F)<<6) | (d&0x3F));
            else throw RangeError("Illegal starting byte: "+a);
        }
    };

    /**
     * Converts an arbitrary input source of UTF16 characters to an arbitrary output destination of UTF8 code points.
     * @param {(function():number|null)} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @param {function(number)} dst Code points destination as a function successively called with each converted code
     *  point.
     * @param {boolean=} noAssert Set to `true` to skip argument and range assertions, defaults to `false`
     * @throws {TypeError} If arguments are invalid or a char code is invalid
     * @throws {RangeError} If a char code is out of range
     * @expose
     */
    utfx.UTF16toUTF8 = function(src, dst, noAssert) {
        var t;
        if (!noAssert) {
            if (typeof src !== 'function' || typeof dst !== 'function')
                throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
            t = function(c) {
                if (typeof c !== 'number' || c !== c)
                    throw TypeError("Illegal char code: "+c);
                if (c < 0 || c > 0xFFFF)
                    throw RangeError("Illegal char code: "+c1);
            };
        } else t = noop;
        var c1, c2 = null;
        while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
                break;
            t(c1); if (c1 >= 0xD800 && c1 <= 0xDFFF) {
                if ((c2 = src()) !== null) {
                    t(c2); if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
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
     * Converts an arbitrary input source of UTF8 code points to an arbitrary output destination of UTF16 characters.
     * @param {(function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {function(number)} dst Characters destination as a function successively called with each converted char code.
     * @param {boolean=} noAssert Set to `true` to skip argument and range assertions, defaults to `false`
     * @throws {TypeError} If arguments are invalid or a code point is invalid
     * @throws {RangeError} If a code point is out of range
     * @expose
     */
    utfx.UTF8toUTF16 = function(src, dst, noAssert) {
        var cp = null, t;
        if (typeof src === 'number')
            cp = src,
            src = nullSource;
        if (!noAssert) {
            if (typeof src !== 'function' || typeof dst !== 'function')
                throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
            t = function(cp) {
                if (typeof cp !== 'number' || cp !== cp)
                    throw TypeError("Illegal code point: "+cp);
                if (cp < 0 || cp > 0x10FFFF)
                    throw RangeError("Illegal code point: "+cp);
            };
        } else t = noop;
        while (cp !== null || (cp = src()) !== null) {
            t(cp);
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
     * Converts and encodes an arbitrary input source of UTF16 characters to an arbitrary output destination of UTF8
     *  bytes.
     * @param {function():number|null} src Characters source as a function returning the next char code respectively `null`
     *  if there are no more characters left.
     * @param {function(number)} dst Bytes destination as a function successively called with the next byte.
     * @param {boolean=} noAssert Set to `true` to skip argument and range assertions, defaults to `false`
     * @throws {TypeError} If arguments are invalid or a char code is invalid
     * @throws {RangeError} If a char code is out of range
     * @expose
     */
    utfx.encodeUTF16toUTF8 = function(src, dst, noAssert) {
        if (!noAssert && typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
        utfx.UTF16toUTF8(src, function(cp) {
            utfx.encodeUTF8(cp, dst, noAssert);
        }, noAssert);
    };

    /**
     * Decodes and converts an arbitrary input source of UTF8 bytes to an arbitrary output destination of UTF16
     *  characters.
     * @param {function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {function(number)} dst Characters destination as a function successively called with each converted char code.
     * @param {boolean=} noAssert Set to `true` to skip argument and range assertions, defaults to `false`
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {utfx.TruncatedError} If the last sequence is truncated. Has an array property `bytes` holding the
     *  remaining bytes.
     * @expose
     */
    utfx.decodeUTF8toUTF16 = function(src, dst, noAssert) {
        if (typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
        utfx.decodeUTF8(src, function(cp) {
            utfx.UTF8toUTF16(cp, dst, noAssert);
        }, noAssert);
    };

    /**
     * Calculates the byte length of an UTF8 code point.
     * @param {number} cp UTF8 code point
     * @returns {number}
     * @throws {RangeError} If the code point is out of range
     * @inner
     */
    function calculateCodePoint(cp) {
        return (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
    }

    /**
     * Validates an UTF8 code point.
     * @param {number} cp UTF8 code point
     * @throws {TypeError} If the code point is invalid
     * @throws {RangeError} If the code point is out of range
     * @inner
     */
    function validateCodePoint(cp) {
        if (typeof cp !== 'number' || cp !== cp)
            throw TypeError("Illegal code point: "+cp);
        if (cp < 0 || cp > 0x10FFFF)
            throw RangeError("Illegal code point: "+cp);
    }

    /**
     * Calculates the number of UTF8 bytes required to store an arbitrary input source of UTF8 code points.
     * @param {(function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {boolean=} noAssert Set to `true` to skip argument assertions, defaults to `false`
     * @returns {number} The number of UTF8 bytes required
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a code point is out of range
     * @expose
     */
    utfx.calculateUTF8 = function(src, noAssert) {
        if (typeof src === 'number')
            return calculateCodePoint(src);
        var t;
        if (!noAssert) {
            if (!noAssert && typeof src !== 'function')
                throw TypeError("Illegal arguments: "+(typeof arguments[0]));
            t = validateCodePoint;
        } else t = noop;
        var cp, l=0;
        while ((cp = src()) !== null)
            t(cp), l += calculateCodePoint(cp);
        return l;
    };

    /**
     * Calculates the number of UTF8 code points respectively UTF8 bytes required to store an arbitrary input source of
     *  UTF16 char codes.
     * @param {(function():number|null)} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @param {boolean=} noAssert Set to `true` to skip argument and range assertions, defaults to `false`
     * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If an intermediate code point is out of range
     * @expose
     */
    utfx.calculateUTF16asUTF8 = function(src, noAssert) {
        var n=0, l=0;
        utfx.UTF16toUTF8(src, function(cp) {
            ++n; l += calculateCodePoint(cp);
        }, noAssert);
        return [n,l];
    };

    /**
     * Creates a source function for an array.
     * @param {!Array.<number>} a Array to read from
     * @param {boolean=} noAssert Set to `true` to skip argument assertions, defaults to `false`
     * @returns {function():number|null} Source function returning the next value respectively `null` if there are no
     *  more values left.
     * @throws {TypeError} If the argument is invalid
     * @expose
     */
    utfx.arraySource = function(a, noAssert) {
        if (!noAssert && !Array.isArray(a))
            throw TypeError("Illegal argument: "+(typeof a));
        var i=0; return function() {
            return i >= a.length ? null : a[i++];
        };
    };

    /**
     * Creates a destination function for an array.
     * @param {!Array.<number>} a Array to write to
     * @param {boolean=} noAssert Set to `true` to skip argument assertions, defaults to `false`
     * @returns {function(number)} Destination function successively called with the next value.
     * @throws {TypeError} If the argument is invalid
     * @expose
     */
    utfx.arrayDestination = function(a, noAssert) {
        if (!noAssert && !Array.isArray(a))
            throw TypeError("Illegal argument: "+(typeof a));
        return Array.prototype.push.bind(a);
    };

    /**
     * Creates a source function for a string.
     * @param {string} s String to read from
     * @param {boolean=} noAssert Set to `true` to skip argument assertions, defaults to `false`
     * @returns {function():number|null} Source function returning the next char code respectively `null` if there are
     *  no more characters left.
     * @throws {TypeError} If the argument is invalid
     * @expose
     */
    utfx.stringSource = function(s, noAssert) {
        if (!noAssert && typeof s !== 'string')
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
     * A polyfill for `String.fromCodePoint`.
     * @param {...number} var_args Code points
     * @returns {string} JavaScript string
     * @throws {TypeError} If arguments are invalid or a code point is invalid
     * @throws {RangeError} If a code point is out of range
     * @expose
     */
    utfx.fromCodePoint = function(var_args) {
        var sd; utfx.UTF8toUTF16(utfx.arraySource(Array.prototype.slice.apply(arguments)), sd = utfx.stringDestination());
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

    if (typeof module === 'object' && module && module['exports']) {
        module['exports'] = utfx;
    } else if (typeof define === 'function' && define['amd']) {
        define(utfx);
    } else {
        if (!global['dcodeIO']) global['dcodeIO'] = {};
        global['dcodeIO']['utfx'] = utfx;
    }

})(this, String);

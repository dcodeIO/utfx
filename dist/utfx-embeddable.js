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
var utfx = (function() {
    "use strict";

    /**
     * utfx namespace.
     * @inner
     * @type {!Object.<string,*>}
     */
    var utfx = {};

    /**
     * String.fromCharCode reference for compile time renaming.
     * @type {function(...[number]):string}
     * @inner
     */
    var stringFromCharCode = String.fromCharCode;

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
     * @returns {number} Number of UTF8 bytes required
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a code point is out of range
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
        var cp, n=0;
        while ((cp = src()) !== null)
            t(cp), n += calculateCodePoint(cp);
        return n;
    };

    /**
     * Calculates the number of UTF8 bytes required to store an arbitrary input source of UTF16 characters when
     *  converted to UTF8 code points.
     * @param {(function():number|null) | !Array.<number> | string} src Characters source, either as a function
     *  returning the next char code respectively `null` if there are no more characters left, an array of char codes or
     *  a standard JavaScript string.
     * @param {boolean=} noAssert Set to `true` to skip argument and range assertions, defaults to `false`
     * @returns {number} Number of UTF8 bytes required
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If an intermediate code point is out of range
     */
    utfx.calculateUTF16asUTF8 = function(src, noAssert) {
        var n=0;
        utfx.UTF16toUTF8(src, function(cp) {
            n += calculateCodePoint(cp);
        }, noAssert);
        return n;
    };

    return utfx;
})();

/**
 * utfx (c) 2014 Daniel Wirtz <dcode@dcode.io>
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
     * Encodes UTF8 code points to UTF8 bytes.
     * @param {(function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {function(number)} dst Bytes destination as a function successively called with the next byte
     * @throws {TypeError} If arguments are invalid
     */
    utfx.encodeUTF8 = function(src, dst) {
        var cp = null;
        if (typeof src === 'number')
            cp = src,
            src = function() { return null; };
        if (typeof src !== 'function' || typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
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
     * @param {(function():number|null)} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {function(number)} dst Code points destination as a function successively called with each decoded code point.
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
     *  remaining bytes.
     */
    utfx.decodeUTF8 = function(src, dst) {
        if (typeof src !== 'function' || typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
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
     * @param {(function():number|null)} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @param {function(number)} dst Code points destination as a function successively called with each converted code
     *  point.
     * @throws {TypeError} If arguments are invalid
     */
    utfx.UTF16toUTF8 = function(src, dst) {
        if (typeof src !== 'function' || typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
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
     * @param {(function():number|null) | number} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left or a single numeric code point.
     * @param {function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {TypeError} If arguments are invalid or a code point is invalid
     * @throws {RangeError} If a code point is out of range
     */
    utfx.UTF8toUTF16 = function(src, dst) {
        var cp = null;
        if (typeof src === 'number')
            cp = src,
            src = function() { return null; };
        if (typeof src !== 'function' || typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
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
     * @param {function():number|null} src Characters source as a function returning the next char code respectively `null`
     *  if there are no more characters left.
     * @param {function(number)} dst Bytes destination as a function successively called with the next byte.
     * @throws {TypeError} If arguments are invalid
     */
    utfx.encodeUTF16toUTF8 = function(src, dst) {
        if (typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
        utfx.UTF16toUTF8(src, function(cp) {
            utfx.encodeUTF8(cp, dst);
        });
    };

    /**
     * Decodes and converts UTF8 bytes to UTF16 characters.
     * @param {function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
     *  are no more bytes left.
     * @param {function(number)} dst Characters destination as a function successively called with each converted char code.
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a starting byte is invalid in UTF8
     * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
     */
    utfx.decodeUTF8toUTF16 = function(src, dst) {
        if (typeof dst !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
        utfx.decodeUTF8(src, function(cp) {
            utfx.UTF8toUTF16(cp, dst);
        });
    };

    /**
     * Asserts a byte value.
     * @param {number} b 8bit byte value
     * @returns {number} Valid byte value
     * @throws {TypeError} If the byte value is invalid
     * @throws {RangeError} If the byte value is out of range
     * @expose
     */
    utfx.assertByte = function(b) {
        if (typeof b !== 'number' || b !== b)
            throw TypeError("Illegal byte: "+(typeof b));
        if (b < -128 || b > 255)
            throw RangeError("Illegal byte: "+b);
        return b;
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
        if (cp < 0 || cp > 0x10FFFF)
            throw RangeError("Illegal code point: "+cp);
        return cp;
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
     * @param {(function():number|null)} src Code points source, either as a function returning the next code point
     *  respectively `null` if there are no more code points left.
     * @returns {number} The number of UTF8 bytes required
     * @throws {TypeError} If arguments are invalid
     * @throws {RangeError} If a code point is out of range
     */
    utfx.calculateUTF8 = function(src) {
        if (typeof src !== 'function')
            throw TypeError("Illegal arguments: "+(typeof arguments[0]));
        var cp, l=0;
        while ((cp = src()) !== null)
            l += utfx.calculateCodePoint(cp);
        return l;
    };

    /**
     * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
     * @param {(function():number|null)} src Characters source as a function returning the next char code respectively
     *  `null` if there are no more characters left.
     * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
     * @throws {TypeError} If arguments are invalid
     */
    utfx.calculateUTF16asUTF8 = function(src) {
        var n=0, l=0;
        utfx.UTF16toUTF8(src, function(cp) {
            ++n; l += utfx.calculateCodePoint(cp);
        });
        return [n,l];
    };


    return utfx;
})();

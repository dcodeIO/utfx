/**
 * @license utfx (c) 2014 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/utfx for details
 */

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
var stringFromCharCode = String.fromCharCode; // Usually shortened at compile time [...]

/**
 * Converts an array to a source function.
 * @param {!Array.<number>} arr Array
 * @returns {function():number|null} Source
 * @inner
 */
function arraySource(arr) {
    var i=0; return function() {
        return i >= arr.length ? null : arr[i++];
    };
}

/**
 * Converts an array to a destination function.
 * @param {!Array.<number>} arr Array
 * @returns {function(number)}
 * @inner
 */
function arrayDestination(arr) {
    return Array.prototype.push.bind(arr);
}

/**
 * Converts a standard JavaScript string of UTF16 characters to a source function.
 * @param {string} str String
 * @returns {function():number|null} Source
 * @inner
 */
function stringSource(str) {
    var i=0; return function() {
        return i >= str.length ? null : str.charCodeAt(i++);
    };
}

/**
 * Creates a destination function for a standard JavaScript string.
 * @returns {function(number)} Destination
 * @inner
 */
function stringDestination() {
    var cs = [], dst = Array.prototype.push.bind(cs);
    dst['_cs'] = cs;
    return dst;
}

/**
 * A source function always returning `null`.
 * @returns {null}
 * @inner
 */
function nullSource() {
    return null;
}

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
 * @param {(function():number|null) | !Array.<number> | number} src Code points source, either as a function
 *  returning the next code point respectively `null` if there are no more code points left, an array of code points
 *  or a single numeric code point.
 * @param {function(number) | Array.<number> | undefined} dst Bytes destination, either as a function successively
 *  called with the next byte, an array to be filled with the encoded bytes or omitted to make this function return
 *  a binary string.
 * @returns {undefined|string} A binary string if `dst` has been omitted, otherwise `undefined`
 * @throws {TypeError} If arguments are invalid
 * @throws {RangeError} If a code point is invalid in UTF8
 */
utfx.encodeUTF8 = function(src, dst) {
    var cp = null;
    if (typeof src === 'number')
        cp = src,
        src = nullSource;
    else if (Array.isArray(src))
        src = arraySource(src);
    if (typeof dst === 'undefined')
        dst = stringDestination();
    else if (Array.isArray(dst))
        dst = arrayDestination(dst);
    if (typeof src !== 'function' || typeof dst !== 'function')
        throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
    while (cp !== null || (cp = src()) !== null) {
        if (cp < 0 || cp > 0x10FFFF)
            throw RangeError("Illegal code point: "+cp);
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
    if (Array.isArray(dst['_cs']))
        return stringFromCharCode.apply(String, dst['_cs']);
};

/**
 * Decodes an arbitrary input source of UTF8 bytes to UTF8 code points.
 * @param {(function():number|null) | !Array.<number> | string} src Bytes source, either as a function returning the
 *  next byte respectively `null` if there are no more bytes left, an array of bytes or a binary string.
 * @param {function(number) | !Array.<number>} dst Code points destination, either as a function successively called
 *  with each decoded code point or an array to be filled with the decoded code points.
 * @throws {TypeError} If arguments are invalid
 * @throws {RangeError} If a starting byte is invalid in UTF8
 * @throws {utfx.TruncatedError} If the last sequence is truncated. Has an array property `bytes` holding the
 *  remaining bytes.
 */
utfx.decodeUTF8 = function(src, dst) {
    if (typeof src === 'string')
        src = stringSource(src);
    else if (Array.isArray(src))
        src = arraySource(src);
    if (Array.isArray(dst))
        dst = arrayDestination(dst);
    if (typeof src !== 'function' || typeof dst !== 'function')
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
 * @param {(function():number|null) | !Array.<number> | string} src Characters source, either as a function
 *  returning the next char code respectively `null` if there are no more characters left, an array of char codes or
 *  a standard JavaScript string.
 * @param {function(number) | Array.<number>} dst Code points destination, either as a function successively called
 *  with each converted code point or an array to be filled with the converted code points.
 * @throws {TypeError} If arguments are invalid or a char code is invalid
 * @throws {RangeError} If a char code is out of range
 */
utfx.UTF16toUTF8 = function(src, dst) {
    if (typeof src === 'string')
        src = stringSource(src);
    else if (Array.isArray(src))
        src = arraySource(src);
    if (Array.isArray(dst))
        dst = arrayDestination(dst);
    if (typeof src !== 'function' || typeof dst !== 'function')
        throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
    var c1, c2 = null, t = function(c) {
        if (typeof c !== 'number' || c !== c)
            throw TypeError("Illegal char code: "+c);
        if (c < 0 || c > 0xFFFF)
            throw RangeError("Illegal char code: "+c1);
    };
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
 * @param {(function():number|null) | !Array.<number> | number} src Code points source, either as a function
 *  returning the next code point respectively `null` if there are no more code points left, an array of code points
 *  or a single numeric code point.
 * @param {function(number) | !Array.<number> | undefined} dst Characters destination, either as a function
 *  successively called with each converted char code, an array to be filled with the converted char codes or
 *  omitted to make this function return a standard JavaScript string.
 * @returns {undefined|string} A standard JavaScript string if `dst` has been omitted, otherwise `undefined`
 * @throws {TypeError} If arguments are invalid or a code point is invalid
 * @throws {RangeError} If a code point is out of range
 */
utfx.UTF8toUTF16 = function(src, dst) {
    var cp = null;
    if (typeof src === 'number')
        cp = src,
        src = nullSource;
    else if (Array.isArray(src))
        src = arraySource(src);
    if (typeof dst === 'undefined')
        dst = stringDestination();
    else if (Array.isArray(dst))
        dst = arrayDestination(dst);
    if (typeof src !== 'function' || typeof dst !== 'function')
        throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
    while (cp !== null || (cp = src()) !== null) {
        if (typeof cp !== 'number' || cp !== cp)
            throw TypeError("Illegal code point: "+cp);
        if (cp < 0 || cp > 0x10FFFF)
            throw RangeError("Illegal code point: "+cp);
        if (cp <= 0xFFFF)
            dst(cp);
        else
            cp -= 0x10000,
            dst((cp>>10)+0xD800),
            dst((cp%0x400)+0xDC00);
        cp = null;
    }
    if (Array.isArray(dst['_cs']))
        return stringFromCharCode.apply(String, dst['_cs']);
};

/**
 * Converts and encodes an arbitrary input source of UTF16 characters to an arbitrary output destination of UTF8
 *  bytes.
 * @param {(function():number|null) | !Array.<number> | string} src Characters source, either as a function
 *  returning the next char code respectively `null` if there are no more characters left, an array of char codes or
 *  a standard JavaScript string.
 * @param {function(number) | Array.<number> | undefined} dst Bytes destination, either as a function successively
 *  called with the next byte, an array to be filled with the encoded bytes or omitted to make this function return
 *  a binary string.
 * @returns {undefined|string} A binary string if `dst` has been omitted, otherwise `undefined`
 * @throws {TypeError} If arguments are invalid or a char code is invalid
 * @throws {RangeError} If a char code is out of range
 */
utfx.encodeUTF16toUTF8 = function(src, dst) {
    if (typeof dst === 'undefined')
        dst = stringDestination();
    else if (Array.isArray(dst))
        dst = arrayDestination(dst);
    else if (typeof dst !== 'function')
        throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
    utfx.UTF16toUTF8(src, function(cp) {
        utfx.encodeUTF8(cp, dst);
    });
    if (Array.isArray(dst['_cs']))
        return stringFromCharCode.apply(String, dst['_cs']);
};

/**
 * Decodes and converts an arbitrary input source of UTF8 bytes to an arbitrary output destination of UTF16
 *  characters.
 * @param {(function():number|null) | !Array.<number> | string} src Bytes source, either as a function returning the
 *  next byte respectively `null` if there are no more bytes left, an array of bytes or a binary string.
 * @param {function(number) | !Array.<number> | undefined} dst Characters destination, either as a function
 *  successively called with each converted char code, an array to be filled with the converted char codes or
 *  omitted to make this function return a standard JavaScript string.
 * @returns {undefined|string} A standard JavaScript string if `dst` has been omitted, otherwise `undefined`
 * @throws {TypeError} If arguments are invalid
 * @throws {RangeError} If a starting byte is invalid in UTF8
 * @throws {utfx.TruncatedError} If the last sequence is truncated. Has an array property `bytes` holding the
 *  remaining bytes.
 */
utfx.decodeUTF8toUTF16 = function(src, dst) {
    if (typeof dst === 'undefined')
        dst = stringDestination();
    else if (Array.isArray(dst))
        dst = arrayDestination(dst);
    else if (typeof dst !== 'function')
        throw TypeError("Illegal arguments: "+(typeof arguments[0])+", "+(typeof arguments[1]));
    utfx.decodeUTF8(src, function(cp) {
        utfx.UTF8toUTF16(cp, dst);
    });
    if (Array.isArray(dst['_cs']))
        return stringFromCharCode.apply(String, dst['_cs']);
};

/**
 * Calculates the byte length of an UTF8 code point.
 * @param {number} cp UTF8 code point
 * @returns {number}
 * @throws {RangeError} If the code point is out of range
 * @inner
 */
function calculateCodePoint(cp) { // Usually shortened at compile time
    if (cp < 0 || cp > 0x10FFFF)
        throw RangeError("Illegal code point: "+cp);
    return (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
}

/**
 * Calculates the number of UTF8 bytes required to store an arbitrary input source of UTF8 code points.
 * @param {(function():number|null) | !Array.<number> | number} src Code points source, either as a function returning
 *  the next code point respectively `null` if there are no more code points left, an array of code points or a single
 *  numeric code point.
 * @returns {number} Number of UTF8 bytes required
 * @throws {TypeError} If arguments are invalid
 * @throws {RangeError} If a code point is out of range
 */
utfx.calculateUTF8 = function(src) {
    if (typeof src === 'number')
        return calculateCodePoint(src);
    if (Array.isArray(src))
        src = arraySource(src);
    if (typeof src !== 'function')
        throw TypeError("Illegal arguments: "+(typeof arguments[0]));
    var cp, n=0;
    while ((cp = src()) !== null)
        n += calculateCodePoint(cp);
    return n;
};

/**
 * Calculates the number of UTF8 bytes required to store an arbitrary input source of UTF16 characters when
 *  converted to UTF8 code points.
 * @param {(function():number|null) | !Array.<number> | string} src Characters source, either as a function
 *  returning the next char code respectively `null` if there are no more characters left, an array of char codes or
 *  a standard JavaScript string.
 * @returns {number} Number of UTF8 bytes required
 * @throws {TypeError} If arguments are invalid
 * @throws {RangeError} If an intermediate code point is out of range
 */
utfx.calculateUTF16asUTF8 = function(src) {
    var n=0;
    utfx.UTF16toUTF8(src, function(cp) {
        n += calculateCodePoint(cp);
    });
    return n;
};

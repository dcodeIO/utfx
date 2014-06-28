var utfx = require(__dirname+"/../dist/utfx.min.js"),
    test = require("testjs");

// Test string as standard string, char codes, code points, bytes and binary string
var string = "ä☺𠜎️☁️",
    charcodes = string.split('').map(function(s) { return s.charCodeAt(0); }),
    codepoints = [0xE4, 0x263A, 0x2070E, 0xfe0f, 0x2601, 0xfe0f],
    bytes = [
        0xC3, 0xA4,
        0xE2, 0x98, 0xBA,
        0xF0, 0xA0, 0x9C, 0x8E, /* variation selector: */ 0xEF, 0xB8, 0x8F,
        0xE2, 0x98, 0x81, /* vs: */ 0xEF, 0xB8, 0x8F
    ],
    binarystring = String.fromCharCode.apply(String, bytes);

var arraySource = utfx.arraySource,
    arrayDestination = utfx.arrayDestination,
    stringSource = utfx.stringSource,
    stringDestination = utfx.stringDestination;

var suite = {
    
    MAX_CODEPOINT: function(test) {
        test.strictEqual(utfx.MAX_CODEPOINT, 0x10FFFF);
        test.done();
    },

    encodeUTF8: function(test) {
        // Array source and destination (implicitly tests function)
        var out = []; utfx.encodeUTF8(
            arraySource(codepoints),
            arrayDestination(out)
        );
        test.deepEqual(out, bytes);
        // Binary string destination
        var sd; utfx.encodeUTF8(
            arraySource(codepoints),
            sd = stringDestination()
        );
        test.strictEqual(sd(), binarystring);
        test.done();
    },

    decodeUTF8: function(test) {
        // Array source and destination (implicitly tests function)
        var out = []; utfx.decodeUTF8(
            arraySource(bytes),
            arrayDestination(out)
        );
        test.deepEqual(out, codepoints);
        // Binary string source
        out = []; utfx.decodeUTF8(
            stringSource(binarystring),
            arrayDestination(out)
        );
        test.deepEqual(out, codepoints);
        // Truncated
        out = [];
        var thrown = false;
        try {
            utfx.decodeUTF8(
                arraySource(bytes.slice(0, bytes.length-4)),
                arrayDestination(out)
            );
        } catch (e) {
            thrown = true;
            test.strictEqual(e.name, "TruncatedError");
            var b = bytes.slice(bytes.length-6, bytes.length-4);
            test.strictEqual(e.message, b.toString());
            test.deepEqual(e.bytes, b);
        }
        test.ok(thrown);
        test.done();
    },

    UTF16toUTF8: function(test) {
        // Array source and destination (implicitly tests function)
        var out = []; utfx.UTF16toUTF8(
            arraySource(charcodes),
            arrayDestination(out)
        );
        test.deepEqual(out, codepoints);
        // String source
        out = []; utfx.UTF16toUTF8(
            stringSource(string),
            arrayDestination(out)
        );
        test.deepEqual(out, codepoints);
        test.done();
    },

    UTF8toUTF16: function(test) {
        // Array source and destination (implicitly tests function)
        var out = []; utfx.UTF8toUTF16(
            arraySource(codepoints),
            arrayDestination(out)
        );
        test.deepEqual(out, charcodes);
        // String destination
        var sd; utfx.UTF8toUTF16(
            arraySource(codepoints),
            sd = stringDestination()
        );
        test.strictEqual(sd(), string);
        test.done();
    },

    encodeUTF16toUTF8: function(test) {
        // Array source and destination (implicitly tests function)
        var out = []; utfx.encodeUTF16toUTF8(
            arraySource(charcodes),
            arrayDestination(out)
        );
        test.deepEqual(out, bytes);
        // String source and destination
        var sd; utfx.encodeUTF16toUTF8(
            stringSource(string),
            sd = stringDestination()
        );
        test.strictEqual(sd(), binarystring);
        test.done();
    },
    
    decodeUTF8toUTF16: function(test) {
        // Array source and destination (implicitly tests function)
        var out = []; utfx.decodeUTF8toUTF16(
            arraySource(bytes),
            arrayDestination(out)
        );
        test.deepEqual(out, charcodes);
        // String destination
        var sd; utfx.decodeUTF8toUTF16(
            arraySource(bytes),
            sd = stringDestination()
        );
        test.strictEqual(sd(), string);
        test.done();
    },

    calculateUTF8: function(test) {
        var n = utfx.calculateUTF8(
            arraySource(codepoints)
        );
        test.strictEqual(n, bytes.length);
        test.done();
    },

    calculateUTF16asUTF8: function(test) {
        // Array source (implicitly tests function)
        var n = utfx.calculateUTF16asUTF8(
            arraySource(charcodes)
        );
        test.strictEqual(n[0], codepoints.length);
        test.strictEqual(n[1], bytes.length);
        // String source
        n = utfx.calculateUTF16asUTF8(
            stringSource(string)
        );
        test.strictEqual(n[0], codepoints.length);
        test.strictEqual(n[1], bytes.length);
        test.done();
    },
    
    "assertCharCode": function(test) {
        test.strictEqual(utfx.assertCharCode(0), 0);
        test.strictEqual(utfx.assertCharCode(0xFFFF), 0xFFFF);
        test.throws(function() {
            utfx.assertCharCode("a");
        }, TypeError);
        test.throws(function() {
            utfx.assertCharCode(NaN);
        }, TypeError);
        test.throws(function() {
            utfx.assertCharCode(-1);
        }, RangeError);
        test.throws(function() {
            utfx.assertCharCode(0xFFFF+1);
        }, RangeError);
        test.done();
    },
    
    "assertCodePoint": function(test) {
        test.strictEqual(utfx.assertCodePoint(0), 0);
        test.strictEqual(utfx.assertCodePoint(utfx.MAX_CODEPOINT), utfx.MAX_CODEPOINT);
        test.throws(function() {
            utfx.assertCodePoint("a");
        }, TypeError);
        test.throws(function() {
            utfx.assertCodePoint(NaN);
        }, TypeError);
        test.throws(function() {
            utfx.assertCodePoint(-1);
        }, RangeError);
        test.throws(function() {
            utfx.assertCodePoint(utfx.MAX_CODEPOINT+1);
        }, RangeError);
        test.done();
    },

    "fromCodePoint": function(test) {
        test.strictEqual(utfx.fromCodePoint.apply(null, codepoints), string);
        test.done();
    },

    "codePointAt": function(test) {
        test.strictEqual(utfx.codePointAt(string, 2), codepoints[2]);
        test.done();
    },

    "polyfill": function(test) {
        var codePointAt = String.prototype.codePointAt;
        utfx.polyfill(true);
        test.strictEqual(utfx.fromCodePoint, String.fromCodePoint);
        test.notStrictEqual(codePointAt, String.prototype.codePointAt);
        test.strictEqual(String.fromCodePoint.apply(null, codepoints), string);
        test.strictEqual(string.codePointAt(2), codepoints[2]);
        test.done();
    }
};

test.run(suite);
module.exports = suite;

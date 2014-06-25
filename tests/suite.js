var utfx = require(__dirname+"/../index.js");

// Test string as standard string, char codes, code points, bytes and binary string
var string = "ä☺𠜎️☁️",
    charcodes = string.split('').map(function(s) { return s.charCodeAt(0); }),
    codepoints = [0xE4, 0x263A, 0x2070E, 0xfe0f, 0x2601, 0xfe0f],
    bytes = [
        0xC3, 0xA4,
        0xE2, 0x98, 0xBA,
        0xF0, 0xA0, 0x9C, 0x8E, /* variation selector: */ 0xEF, 0xB8, 0x8F,
        0xE2, 0x98, 0x81, /* vs: */ 0xEF, 0xB8, 0x8F,
    ],
    binarystring = String.fromCharCode.apply(String, bytes);

module.exports = {
    
    UTF16toUTF8: function(test) {
        // Array source and destination (implicitly tests function)
        var out = [];
        utfx.UTF16toUTF8(charcodes, out);
        test.deepEqual(out, codepoints);
        // String source
        out = [];
        utfx.UTF16toUTF8(string, out);
        test.deepEqual(out, codepoints);
        test.done();
    },
    
    UTF8toUTF16: function(test) {
        // Array source and destination (implicitly tests function)
        var out = [];
        utfx.UTF8toUTF16(codepoints, out);
        test.deepEqual(out, charcodes);
        // String destination (omitted dst, returns)
        test.strictEqual(utfx.UTF8toUTF16(codepoints), string);
        test.done();
    },
    
    calculateUTF8: function(test) {
        test.strictEqual(utfx.calculateUTF8(codepoints), bytes.length);
        test.done();
    },
    
    calculateUTF16asUTF8: function(test) {
        // Array source (implicitly tests function)
        test.strictEqual(utfx.calculateUTF16asUTF8(charcodes), bytes.length);
        // String source
        test.strictEqual(utfx.calculateUTF16asUTF8(string), bytes.length);
        test.done();
    },
    
    encodeUTF8: function(test) {
        // Array source and destination (implicitly tests function)
        var out = [];
        utfx.encodeUTF8(codepoints, out);
        test.deepEqual(out, bytes);
        // Binary string destination
        test.strictEqual(utfx.encodeUTF8(codepoints), binarystring);
        test.done();
    },
    
    decodeUTF8: function(test) {
        // Array source and destination (implicitly tests function)
        var out = [];
        utfx.decodeUTF8(bytes, out);
        test.deepEqual(out, codepoints);
        // Binary string source
        out = [];
        utfx.decodeUTF8(binarystring, out);
        test.deepEqual(out, codepoints);
        // Truncated
        out = []
        var thrown = false;
        try {
            utfx.decodeUTF8(bytes.slice(0, bytes.length-4), out);
        } catch (e) {
            thrown = true;
            test.ok(e instanceof utfx.TruncatedError);
            test.deepEqual(e.bytes, bytes.slice(bytes.length-6, bytes.length-4));
        }
        test.ok(thrown);
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

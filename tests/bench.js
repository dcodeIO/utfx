var utfx = require("../index.js"),
    utf8 = require("utf8"),
    prettyHrTime = require("pretty-hrtime");

var bench = {};
var impls = ["node", "utfx", "utf8", "binary"];
var str = "Hello world! ä☺𠜎️☁ Hello world! ä☺𠜎️☁ Hello world! ä☺𠜎️☁";

var encodeUTF16toUTF8_Buffer = new Buffer(Buffer.byteLength(str));
var encodeUTF16toUTF8_Array  = new Uint8Array(encodeUTF16toUTF8_Buffer.length);

bench["encodeUTF16toUTF8"] = function(type, n) {
    n = n || 1000000;
    switch (type) {
        case "node":
            for (var i=0; i<n; ++i)
                encodeUTF16toUTF8_Buffer.write(str, "utf8");
            break;
        case "utfx":
            for (var i=0, j; i<n; ++i)
                j = 0,
                utfx.encodeUTF16toUTF8(utfx.stringSource(str), function(b) {
                    encodeUTF16toUTF8_Array[j++] = b;
                });
            break;
        case "utf8":
            for (var i=0; i<n; ++i)
                utf8.encode(str);
            break;
        case "binary":
        	for (var i=0; i<n; ++i)
        		unescape(encodeURIComponent(str));
        	break;
        default:
            throw Error("illegal type");
    }
    return n;
};

bench["calculateUTF16asUTF8"] = function(type, n) {
    n = n || 100000;
    switch (type) {
        case "node":
            for (var i=0; i<n; ++i)
                Buffer.byteLength(str);
            break;
        case "utfx":
            for (var i=0; i<n; ++i)
                utfx.calculateUTF16asUTF8(utfx.stringSource(str));
            break;
        case "utf8":
        	for (var i=0; i<n; ++i)
            	utf8.encode(str).length;
            break;
        case "binary":
            for (var i=0; i<n; ++i)
                unescape(encodeURIComponent(str)).length;
            break;
        default:
            throw Error("illegal type");
    }
    return n;
}

Object.keys(bench).forEach(function(key) {
    var func = bench[key];
    console.log(key);

    impls.forEach(function(impl) {
        var diff, n;
        var start = process.hrtime();
        try {
            n = func(impl);
            diff = process.hrtime(start);
            console.log("- "+impl+": "+prettyHrTime(diff)+" (n="+n+")");
        } catch (err) {
            console.log("- "+impl+": "+err.message);
        }
    });
    console.log();
});
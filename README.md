![utfx - A compact library to encode, decode and convert UTF8 / UTF16 in JavaScript.](https://raw.github.com/dcodeIO/utfx/master/utfx.png)
====
**utfx** is a compact library to encode, decode and convert UTF8 / UTF16 in JavaScript using arbitrary sources and
destinations through the use of successively called functions, basically eliminating [memory overhead](https://github.com/dcodeIO/utfx/wiki#faq).

The standalone library is also capable of using binary strings and arrays (with the usual overhead) and provides
polyfills for `String.fromCodePoint` and `String#codePointAt`.

API
---

### encodeUTF8(src, dst)

Encodes UTF8 code points to UTF8 bytes.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null) &#124; number* | Code points source, either as a function returning the next code point respectively `null` if there are no more code points left or a single numeric code point. 
| dst             | *function(number)* | Bytes destination as a function successively called with the next byte 

### decodeUTF8(src, dst)

Decodes UTF8 bytes to UTF8 code points.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null)* | Bytes source as a function returning the next byte respectively `null` if there are no more bytes left. 
| dst             | *function(number)* | Code points destination as a function successively called with each decoded code point. 
| **@throws**     | *RangeError*    | If a starting byte is invalid in UTF8 
| **@throws**     | *Error*         | If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes. 

### UTF16toUTF8(src, dst)

Converts UTF16 characters to UTF8 code points.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null)* | Characters source as a function returning the next char code respectively `null` if there are no more characters left. 
| dst             | *function(number)* | Code points destination as a function successively called with each converted code point. 

### UTF8toUTF16(src, dst)

Converts UTF8 code points to UTF16 characters.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null) &#124; number* | Code points source, either as a function returning the next code point respectively `null` if there are no more code points left or a single numeric code point. 
| dst             | *function(number)* | Characters destination as a function successively called with each converted char code. 
| **@throws**     | *RangeError*    | If a code point is out of range 

### encodeUTF16toUTF8(src, dst)

Converts and encodes UTF16 characters to UTF8 bytes.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null)* | Characters source as a function returning the next char code respectively `null` if there are no more characters left. 
| dst             | *function(number)* | Bytes destination as a function successively called with the next byte. 

### decodeUTF8toUTF16(src, dst)

Decodes and converts UTF8 bytes to UTF16 characters.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null)* | Bytes source as a function returning the next byte respectively `null` if there are no more bytes left. 
| dst             | *function(number)* | Characters destination as a function successively called with each converted char code. 
| **@throws**     | *RangeError*    | If a starting byte is invalid in UTF8 
| **@throws**     | *Error*         | If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes. 

### assertByte(b)

Asserts a byte value.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| b               | *number*        | 8bit byte value 
| **@returns**    | *number*        | Valid byte value 
| **@throws**     | *TypeError*     | If the byte value is invalid 
| **@throws**     | *RangeError*    | If the byte value is out of range 

### assertCharCode(c)

Asserts an UTF16 char code.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| c               | *number*        | UTF16 char code 
| **@returns**    | *number*        | Valid char code 
| **@throws**     | *TypeError*     | If the char code is invalid 
| **@throws**     | *RangeError*    | If the char code is out of range 

### assertCodePoint(cp)

Asserts an UTF8 code point.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| cp              | *number*        | UTF8 code point 
| **@returns**    | *number*        | Valid code point 
| **@throws**     | *TypeError*     | If the code point is invalid 
| **@throws**     | *RangeError*    | If the code point is out of range 

### calculateCodePoint(cp)

Calculates the byte length of an UTF8 code point.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| cp              | *number*        | UTF8 code point 
| **@returns**    | *number*        | Byte length 

### calculateUTF8(src)

Calculates the number of UTF8 bytes required to store UTF8 code points.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null)* | Code points source as a function returning the next code point respectively `null` if there are no more code points left. 
| **@returns**    | *number*        | The number of UTF8 bytes required 

### calculateUTF16asUTF8(src)

Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| src             | *function():(number &#124; null)* | Characters source as a function returning the next char code respectively `null` if there are no more characters left. 
| **@returns**    | *!Array.&lt;number&gt;* | The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1. 

### arraySource(a)

Creates a source function for an array.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| a               | *!Array.&lt;number&gt;* | Array to read from 
| **@returns**    | *function():(number &#124; null)* | Source function returning the next value respectively `null` if there are no more values left. 
| **@throws**     | *TypeError*     | If the argument is invalid 

### arrayDestination(a)

Creates a destination function for an array.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| a               | *!Array.&lt;number&gt;* | Array to write to 
| **@returns**    | *function(number)* | Destination function successively called with the next value. 
| **@throws**     | *TypeError*     | If the argument is invalid 

### stringSource(s)

Creates a source function for a string.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| s               | *string*        | String to read from 
| **@returns**    | *function():(number &#124; null)* | Source function returning the next char code respectively `null` if there are no more characters left. 
| **@throws**     | *TypeError*     | If the argument is invalid 

### stringDestination()

Creates a destination function for a string.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| **@returns**    | *function(number=):(undefined &#124; string)* | Destination function successively called with the next char code. Returns the final string when called without arguments. 

### fromCodePoint(var_args)

A polyfill for `String.fromCodePoint`.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| var_args        | *...number*     | Code points 
| **@returns**    | *string*        | JavaScript string 
| **@throws**     | *TypeError*     | If arguments are invalid or a code point is invalid 
| **@throws**     | *RangeError*    | If a code point is out of range 

### codePointAt(s, i)

A polyfill for `String#codePointAt`.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| s               | *string*        | JavaScript string 
| i               | *number*        | Index 
| **@returns**    | *number &#124; undefined* | Code point or `undefined` if `i` is out of range 
| **@throws**     | *TypeError*     | If arguments are invalid 

### polyfill(override=)

Installs utfx as a polyfill for `String.fromCodePoint` and `String#codePointAt` if not implemented.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| override        | *boolean*       | Overrides an existing implementation if `true`, defaults to `false` 
| **@returns**    | *!Object.&lt;string,*&gt;* | utfx namespace 

Usage
-----
* **node.js**: `npm install utfx`   
   
   ```js
   var utfx = require("utfx");
   ...
   ```

* **Browser**: `<script src="/path/to/utfx.min.js"></script>`   
   
   ```js
   var utfx = dcodeIO.utfx;
   ...
   ```
   
* **Require.js/AMD**   
   
   ```js
   require.config({
       "paths": {
           "utfx": "/path/to/utfx.min.js"
       }
   });
   require(["utfx"], function(utfx) {
       ...
   }
   ```

Downloads
---------
* [Distributions](https://github.com/dcodeIO/utfx/tree/master/dist)

FAQ and examples
----------------
* [Wiki](https://github.com/dcodeIO/utfx/wiki)

License
-------
Apache License, Version 2.0

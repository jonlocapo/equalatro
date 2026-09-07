"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.util = (function () {
function mulberry32(seed) {
var a = seed >>> 0;
return function () {
a |= 0; a = (a + 0x6D2B79F5) | 0;
var t = Math.imul(a ^ (a >>> 15), 1 | a);
t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
}
function hashStr(s) {
var h = 2166136261;
for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
return h >>> 0;
}
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function choice(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function shuffle(rng, arr) {
var a = arr.slice();
for (var i = a.length - 1; i > 0; i--) {
var j = Math.floor(rng() * (i + 1));
var t = a[i]; a[i] = a[j]; a[j] = t;
}
return a;
}
function fmtTime(ms) {
if (!isFinite(ms) || ms < 0) { ms = 0; }
var m = Math.floor(ms / 60000);
var s = Math.floor((ms % 60000) / 1000);
var r = Math.floor(ms % 1000);
var ss = (s < 10 ? "0" : "") + s;
var rr = (r < 100 ? (r < 10 ? "00" : "0") : "") + r;
return m + ":" + ss + "." + rr;
}
function ordinal(n) {
if (n === 1) { return "1st"; }
if (n === 2) { return "2nd"; }
if (n === 3) { return "3rd"; }
return n + "th";
}
return {
mulberry32: mulberry32,
hashStr: hashStr,
clamp: clamp,
lerp: lerp,
choice: choice,
shuffle: shuffle,
fmtTime: fmtTime,
ordinal: ordinal
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.util; }

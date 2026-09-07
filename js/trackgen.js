"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.trackgen = (function () {
function U() { return EQ.util; }
var PRE = ["Cinder", "Moss", "Turbo", "Pebble", "Neon", "Dusty", "Fable", "Gloom", "Honey", "Iron", "Juniper", "Comet"];
var POST = ["Dunes", "Pass", "Ring", "Meadows", "Depths", "Heights", "Mile", "Garden", "Works", "Shore", "Ruins", "Dash"];
function genTrack(seedStr, circuit) {
var util = U();
var rng = util.mulberry32(util.hashStr(seedStr + ":c" + circuit));
var count = Math.min(260, 130 + circuit * 12);
var segLen = 40;
var laps = circuit <= 2 ? 2 : 3;
var curve = [];
var hill = [];
for (var i = 0; i < count; i++) { curve.push(0); hill.push(0); }
var maxCurve = Math.min(3, 1.2 + circuit * 0.18);
var nCorners = 4 + Math.min(10, circuit);
for (var c = 0; c < nCorners; c++) {
var at = Math.floor(rng() * count);
var len = 15 + Math.floor(rng() * 26);
var dir = rng() < 0.5 ? -1 : 1;
var mag = (0.5 + rng() * 0.5) * maxCurve * dir;
for (var k = 0; k < len; k++) {
var idx = (at + k) % count;
var t = k / len;
var env = Math.sin(t * Math.PI);
curve[idx] += mag * env;
}
}
for (var b = 0; b < count; b++) {
curve[b] += Math.sin((b / count) * Math.PI * 4 + circuit) * 0.35;
curve[b] = util.clamp(curve[b], -3.4, 3.4);
}
var maxHill = Math.min(30, 8 + circuit * 2);
var nHills = 3 + Math.min(6, circuit);
for (var h = 0; h < nHills; h++) {
var hat = Math.floor(rng() * count);
var hlen = 20 + Math.floor(rng() * 30);
var hmag = (0.4 + rng() * 0.6) * maxHill * (rng() < 0.5 ? -1 : 1);
for (var m = 0; m < hlen; m++) {
var hidx = (hat + m) % count;
var ht = m / hlen;
hill[hidx] += hmag * Math.sin(ht * Math.PI);
}
}
var LANES = [-0.6, 0, 0.6];
var segs = [];
for (var s = 0; s < count; s++) {
segs.push({ curve: curve[s], y: hill[s], hz: 0, hzLane: 0, coin: 0, coinLane: 0, pad: 0, side: Math.floor(rng() * 6) });
}
var nHaz = Math.min(40, 4 + circuit * 3);
var placed = 0;
var guard = 0;
while (placed < nHaz && guard < 400) {
guard++;
var hi = 10 + Math.floor(rng() * (count - 10));
if (segs[hi].hz !== 0 || segs[hi].pad !== 0) { continue; }
var htype = 1;
if (circuit >= 3 && rng() < Math.min(0.5, 0.15 + circuit * 0.05)) { htype = 2; }
segs[hi].hz = htype;
segs[hi].hzLane = LANES[Math.floor(rng() * 3)];
placed++;
}
var nCoins = 40;
var cp = 0;
guard = 0;
while (cp < nCoins && guard < 600) {
guard++;
var ci = 10 + Math.floor(rng() * (count - 14));
var cl = LANES[Math.floor(rng() * 3)];
var run = 3 + Math.floor(rng() * 3);
for (var q = 0; q < run && cp < nCoins; q++) {
var qi = (ci + q) % count;
if (segs[qi].hz === 0 && segs[qi].coin === 0) { segs[qi].coin = 1; segs[qi].coinLane = cl; cp++; }
}
}
var nPads = 3 + Math.min(4, Math.floor(circuit / 2));
var pp = 0;
guard = 0;
while (pp < nPads && guard < 300) {
guard++;
var pi = 10 + Math.floor(rng() * (count - 10));
if (segs[pi].hz !== 0 || segs[pi].pad !== 0) { continue; }
segs[pi].pad = 1;
pp++;
}
var name = PRE[Math.floor(rng() * PRE.length)] + " " + POST[Math.floor(rng() * POST.length)] + " " + circuit;
return { name: name, laps: laps, segLen: segLen, count: count, length: count * segLen, segs: segs, circuit: circuit };
}
function segAt(track, dist) {
var d = ((dist % track.length) + track.length) % track.length;
var idx = Math.floor(d / track.segLen) % track.count;
return { seg: track.segs[idx], idx: idx };
}
function avgAbsCurve(track) {
var t = 0;
for (var i = 0; i < track.count; i++) { t += Math.abs(track.segs[i].curve); }
return t / track.count;
}
function hazardCount(track) {
var n = 0;
for (var i = 0; i < track.count; i++) { if (track.segs[i].hz !== 0) { n++; } }
return n;
}
return { genTrack: genTrack, segAt: segAt, avgAbsCurve: avgAbsCurve, hazardCount: hazardCount };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.trackgen; }

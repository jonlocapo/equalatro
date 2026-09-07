"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
if (!EQ.util && typeof require !== "undefined") { EQ.util = require("./util.js"); }
EQ.trackgen = (function () {
function U() { return EQ.util; }
var PRE = ["Cinder", "Moss", "Turbo", "Pebble", "Neon", "Dusty", "Fable", "Gloom", "Honey", "Iron", "Juniper", "Comet"];
var POST = ["Dunes", "Pass", "Ring", "Meadows", "Depths", "Heights", "Mile", "Garden", "Works", "Shore", "Ruins", "Dash"];
var EVENTS = ["meteor", "frenzy", "cache", "oilrain", "fog", "gold"];
function buildPiece(rng, util, count, curveMag, hillMag, chaos, circuit, hzMul) {
var curve = [];
var hill = [];
for (var i = 0; i < count; i++) { curve.push(0); hill.push(0); }
var nCorners = 4 + Math.min(12, circuit + chaos);
for (var c = 0; c < nCorners; c++) {
var at = Math.floor(rng() * count);
var len = 15 + Math.floor(rng() * 26);
var dir = rng() < 0.5 ? -1 : 1;
var mag = (0.5 + rng() * 0.5) * curveMag * dir;
for (var k = 0; k < len; k++) {
var idx = (at + k) % count;
curve[idx] += mag * Math.sin((k / len) * Math.PI);
}
}
for (var b = 0; b < count; b++) {
curve[b] += Math.sin((b / count) * Math.PI * 4 + circuit) * 0.35;
curve[b] = util.clamp(curve[b], -3.4, 3.4);
}
var nHills = 3 + Math.min(8, circuit + chaos);
for (var h = 0; h < nHills; h++) {
var hat = Math.floor(rng() * count);
var hlen = 20 + Math.floor(rng() * 30);
var hmag = (0.4 + rng() * 0.6) * hillMag * (rng() < 0.5 ? -1 : 1);
for (var m = 0; m < hlen; m++) {
hill[(hat + m) % count] += hmag * Math.sin((m / hlen) * Math.PI);
}
}
var LANES = [-0.6, 0, 0.6];
var segs = [];
for (var s = 0; s < count; s++) {
segs.push({ curve: curve[s], y: hill[s], hz: 0, hzLane: 0, coin: 0, coinLane: 0, pad: 0, wcell: 0, side: Math.floor(rng() * 6) });
}
var nHaz = Math.min(60, Math.round((4 + circuit * 3) * (1 + chaos * 0.22) * (hzMul || 1)));
var placed = 0;
var guard = 0;
while (placed < nHaz && guard < 600) {
guard++;
var hi = 5 + Math.floor(rng() * (count - 5));
if (segs[hi].hz !== 0 || segs[hi].pad !== 0) { continue; }
var htype = 1;
if (circuit >= 3 && rng() < Math.min(0.6, 0.15 + (circuit + chaos) * 0.05)) { htype = 2; }
segs[hi].hz = htype;
segs[hi].hzLane = LANES[Math.floor(rng() * 3)];
placed++;
}
var nCoins = 30;
var cp = 0;
guard = 0;
while (cp < nCoins && guard < 500) {
guard++;
var ci = 5 + Math.floor(rng() * (count - 9));
var cl = LANES[Math.floor(rng() * 3)];
var run = 3 + Math.floor(rng() * 3);
for (var q = 0; q < run && cp < nCoins; q++) {
var qi = (ci + q) % count;
if (segs[qi].hz === 0 && segs[qi].coin === 0) { segs[qi].coin = 1; segs[qi].coinLane = cl; cp++; }
}
}
var nPads = 2 + Math.min(5, Math.floor((circuit + chaos) / 2));
var pp = 0;
guard = 0;
while (pp < nPads && guard < 200) {
guard++;
var pi = 5 + Math.floor(rng() * (count - 5));
if (segs[pi].hz !== 0 || segs[pi].pad !== 0) { continue; }
segs[pi].pad = 1;
pp++;
}
var nW = Math.max(1, Math.floor(count / 45));
for (var w = 0; w < nW; w++) {
var wi = 5 + Math.floor(rng() * (count - 5));
segs[wi].wcell = 1;
}
return segs;
}
function genTrack(seedStr, circuit, opts) {
opts = opts || {};
var chaos = opts.chaos || 0;
var util = U();
var rng = util.mulberry32(util.hashStr(seedStr + ":c" + circuit));
var count = Math.min(280, 130 + circuit * 12 + (opts.sizeBonus || 0));
var segLen = 40;
var laps = opts.laps || (circuit <= 2 ? 2 : 3);
var maxCurve = Math.min(3.2, 1.2 + (circuit + chaos) * 0.18);
var maxHill = Math.min(32, 8 + (circuit + chaos) * 2);
var segs = buildPiece(rng, util, count, maxCurve, maxHill, chaos, circuit, 1);
var name = PRE[Math.floor(rng() * PRE.length)] + " " + POST[Math.floor(rng() * POST.length)] + " " + circuit;
return { name: name, laps: laps, segLen: segLen, count: count, length: count * segLen, segs: segs, circuit: circuit };
}
function genTour(seedStr) {
var util = U();
var rng = util.mulberry32(util.hashStr(seedStr + ":tour"));
var segLen = 40;
var segCounts = [60, 66, 72, 78, 84, 90, 96, 102, 108];
var cuts = [2, 2, 2, 3, 3, 3, 2, 2];
var racers = [25, 23, 21, 19, 16, 13, 10, 8, 6];
var segs = [];
var checkpoints = [];
var dist = 0;
var events = {};
for (var i = 0; i < 9; i++) {
var chaos = Math.floor(i / 2);
var piece = buildPiece(rng, util, segCounts[i], Math.min(3.2, 1.3 + i * 0.2), Math.min(30, 8 + i * 2.5), chaos, 1 + i, 1);
for (var s = 0; s < piece.length; s++) { segs.push(piece[s]); }
dist += piece.length * segLen;
var ev = null;
if ((i + 1) % 3 === 0) {
if (i === 8) { ev = "storm"; }
else { ev = EVENTS[Math.floor(rng() * EVENTS.length)]; }
events[i] = ev;
}
checkpoints.push({ dist: dist, racers: racers[i], cut: cuts[i] || 0, event: ev, seg: i });
}
var name = PRE[Math.floor(rng() * PRE.length)] + " " + POST[Math.floor(rng() * POST.length)] + " Tour";
return { name: name, laps: 1, segLen: segLen, count: segs.length, length: dist, segs: segs, checkpoints: checkpoints, events: events, circuit: 1 };
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
return { genTrack: genTrack, genTour: genTour, segAt: segAt, avgAbsCurve: avgAbsCurve, hazardCount: hazardCount };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.trackgen; }

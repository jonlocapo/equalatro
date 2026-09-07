"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.render = (function () {
var SEG = 40;
var ROAD = 55;
var CAMD = 0.84;
var CAMH = 115;
var DRAW = 150;
var PALS = [
{ sky: ["#3a86ff", "#9ad8ff"], sun: "#fff3b0", road: "#5a5a6e", roadOff: "#525264", grass: "#3fa34d", grassOff: "#399245", rumble: "#f4f1de", rumbleOff: "#e63946", lane: "#f4f1de" },
{ sky: ["#5a189a", "#ff5a3c"], sun: "#ffd23f", road: "#4a4a5e", roadOff: "#434355", grass: "#2d6a4f", grassOff: "#265c43", rumble: "#f4f1de", rumbleOff: "#22223b", lane: "#ffe08a" },
{ sky: ["#0b0e1a", "#22223b"], sun: "#e0e0e0", road: "#3d3d52", roadOff: "#37374a", grass: "#1b4332", grassOff: "#173a2b", rumble: "#e0e0e0", rumbleOff: "#e63946", lane: "#9ad8ff" },
{ sky: ["#ff5a3c", "#ffd23f"], sun: "#fff3b0", road: "#5a5a6e", roadOff: "#525264", grass: "#588157", grassOff: "#4e734e", rumble: "#f4f1de", rumbleOff: "#e63946", lane: "#ffffff" }
];
function createView(cv) {
return { cv: cv, ctx: cv.getContext("2d"), W: cv.width, H: cv.height, camY: 0, camX: 0, bgOff: 0, snap: true };
}
function poly(ctx, x1, y1, x2, y2, x3, y3, x4, y4, c) {
ctx.fillStyle = c;
ctx.beginPath();
ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
ctx.closePath(); ctx.fill();
}
function drawRace(view, st, look, t, dt) {
var ctx = view.ctx;
var W = view.W; var H = view.H;
var track = st.track;
var count = track.count;
var segs = track.segs;
var pal = PALS[(look.palette || 0) % PALS.length];
var human = st.karts[0];
for (var h = 1; h < st.karts.length; h++) { if (st.karts[h].human) { human = st.karts[h]; } }
var baseDist = Math.max(0, human.dist);
var baseIdx = Math.floor(baseDist / SEG) % count;
var basePct = (baseDist % SEG) / SEG;
var yA = segs[baseIdx].y;
var yB = segs[(baseIdx + 1) % count].y;
var targetCamY = yA + (yB - yA) * basePct + CAMH;
var targetCamX = human.lane * ROAD;
if (view.snap || !view.camY) { view.camY = targetCamY; view.camX = targetCamX; view.snap = false; }
else {
var k = Math.min(1, dt * 4);
view.camY += (targetCamY - view.camY) * k;
view.camX += (targetCamX - view.camX) * Math.min(1, dt * 6);
}
view.bgOff += segs[baseIdx].curve * human.speed * dt * 0.02;
var grd = ctx.createLinearGradient(0, 0, 0, H);
grd.addColorStop(0, pal.sky[0]); grd.addColorStop(1, pal.sky[1]);
ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = pal.sun;
ctx.fillRect(W * 0.68 - (view.bgOff * 20 % (W * 2)), H * 0.12, 46, 46);
ctx.fillStyle = "rgba(0,0,0,0.25)";
for (var m = 0; m < 3; m++) {
var moff = (view.bgOff * (30 + m * 20)) % (W * 1.5);
for (var r = 0; r < 4; r++) {
var mx = ((r * 340 - moff) % (W + 300) + (W + 300)) % (W + 300) - 150;
var mh = 40 + ((r * 37 + m * 53) % 60);
ctx.fillRect(mx, H * 0.5 - mh, 160, mh);
}
}
var SPR = EQ.sprites;
var drawn = [];
var x = 0;
var dx = -(segs[baseIdx].curve * basePct);
var maxY = H;
for (var n = 0; n < DRAW; n++) {
var idx = (baseIdx + n) % count;
var idx2 = (baseIdx + n + 1) % count;
var seg = segs[idx];
var seg2 = segs[idx2];
var z1 = n * SEG + SEG - basePct * SEG;
var z2 = z1 + SEG;
if (z1 < 1) { z1 = 1; }
var s1 = CAMD / z1;
var s2 = CAMD / z2;
var sx1 = W / 2 + s1 * (x - view.camX) * (W / 2);
var sx2 = W / 2 + s2 * (x + dx - view.camX) * (W / 2);
var sy1 = H / 2 - s1 * (seg.y - view.camY) * (H / 2);
var sy2 = H / 2 - s2 * (seg2.y - view.camY) * (H / 2);
var sw1 = s1 * ROAD * (W / 2);
var sw2 = s2 * ROAD * (W / 2);
x += dx;
dx += seg.curve;
if (sy1 >= sy2 || sy2 >= maxY || sy1 >= maxY) { continue; }
var light = Math.floor(idx / 3) % 2 === 0;
var grassC = light ? pal.grass : pal.grassOff;
var roadC = light ? pal.road : pal.roadOff;
var rumC = light ? pal.rumble : pal.rumbleOff;
ctx.fillStyle = grassC;
ctx.fillRect(0, sy2, W, sy1 - sy2);
poly(ctx, sx1 - sw1 * 1.15, sy1, sx1 + sw1 * 1.15, sy1, sx2 + sw2 * 1.15, sy2, sx2 - sw2 * 1.15, sy2, rumC);
poly(ctx, sx1 - sw1, sy1, sx1 + sw1, sy1, sx2 + sw2, sy2, sx2 - sw2, sy2, roadC);
if (light) {
var lw1 = sw1 * 0.03; var lw2 = sw2 * 0.03;
for (var l = -1; l <= 1; l += 2) {
poly(ctx, sx1 + l * sw1 * 0.5 - lw1, sy1, sx1 + l * sw1 * 0.5 + lw1, sy1, sx2 + l * sw2 * 0.5 + lw2, sy2, sx2 + l * sw2 * 0.5 - lw2, sy2, pal.lane);
}
}
if (idx === 0) {
for (var c = 0; c < 12; c++) {
var cx1 = sx1 - sw1 + (c * 2 * sw1) / 12;
var cx2 = sx2 - sw2 + (c * 2 * sw2) / 12;
poly(ctx, cx1, sy1, cx1 + sw1 / 12, sy1, cx2 + sw2 / 12, sy2, cx2, sy2, c % 2 ? "#111111" : "#ffffff");
}
}
drawn.push({ n: n, idx: idx, seg: seg, sx: (sx1 + sx2) / 2, sy: sy1, s: (s1 + s2) / 2, sw: (sw1 + sw2) / 2 });
maxY = sy1;
}
for (var d = drawn.length - 1; d >= 0; d--) {
var D = drawn[d];
var sc = D.s * (W / 2);
if (sc < 0.5) { continue; }
var side = D.seg.side;
SPR.drawScenery(ctx, D.sx - D.sw * 2.2, D.sy, Math.max(0.6, sc * 0.09), side, t);
SPR.drawScenery(ctx, D.sx + D.sw * 2.2, D.sy, Math.max(0.6, sc * 0.09), (side + 3) % 6, t + 1);
if (D.seg.pad === 1) { SPR.drawPad(ctx, D.sx, D.sy - 2, Math.max(4, D.sw * 1.2)); }
if (D.seg.hz !== 0) { SPR.drawHazard(ctx, D.sx + D.seg.hzLane * D.sw, D.sy - 2, Math.max(0.5, sc * 0.06), D.seg.hz, t); }
if (D.seg.coin === 1) { SPR.drawCoin(ctx, D.sx + D.seg.coinLane * D.sw, D.sy - 10 * sc * 0.06, Math.max(0.5, sc * 0.06), t); }
}
for (var tr = st.traps.length - 1; tr >= 0; tr--) {
var trap = st.traps[tr];
var rel = trap.prog - ((human.lap - 1) * track.length + baseDist);
if (rel < 0 || rel > DRAW * SEG) { continue; }
var tn = Math.round(rel / SEG);
var info = null;
for (var f = 0; f < drawn.length; f++) { if (drawn[f].n === tn) { info = drawn[f]; break; } }
if (!info) { continue; }
var tsc = info.s * (W / 2);
SPR.drawHazard(ctx, info.sx + trap.lane * info.sw, info.sy - 2, Math.max(0.5, tsc * 0.06), trap.kind === "fire" ? 2 : 1, t);
}
var order = st.karts.slice().sort(function (a, b) {
var pa = ((a.lap - 1) * track.length + Math.max(0, a.dist)) - ((human.lap - 1) * track.length + baseDist);
var pb = ((b.lap - 1) * track.length + Math.max(0, b.dist)) - ((human.lap - 1) * track.length + baseDist);
return pb - pa;
});
for (var oi = 0; oi < order.length; oi++) {
var kk = order[oi];
if (kk.human) { continue; }
var krel = ((kk.lap - 1) * track.length + Math.max(0, kk.dist)) - ((human.lap - 1) * track.length + baseDist);
if (krel < 5 || krel > DRAW * SEG) { continue; }
var kn = Math.round(krel / SEG);
var kinfo = null;
for (var g = 0; g < drawn.length; g++) { if (drawn[g].n === kn) { kinfo = drawn[g]; break; } }
if (!kinfo) { continue; }
var ksc = kinfo.s * (W / 2);
var kx = kinfo.sx + kk.lane * ROAD * kinfo.s * (W / 2);
var vis = look.visuals[kk.i] || look.visuals[0];
var kw = Math.max(6, ksc * 26);
SPR.drawKart(ctx, kx, kinfo.sy, kw, {
color: vis.color, scarf: vis.scarf, body: vis.body, tiresWide: vis.tiresWide,
engineKind: vis.engineKind, spoiler: vis.spoiler, spoilerKind: vis.spoilerKind,
bodyKind: vis.bodyKind, charmKind: null, lean: 0,
boost: kk.boostT > 0, boostBig: false, burn: kk.burnT > 0, shield: kk.shield > 0, star: kk.starT > 0, t: t
});
}
var hv = look.visuals[human.i] || look.visuals[0];
var hLean = 0;
if (human.spin <= 0) {
var segH = segs[baseIdx];
hLean = -(segH.curve * 0.2);
}
SPR.drawKart(ctx, W / 2, H - 24, 200, {
color: hv.color, scarf: hv.scarf, body: hv.body, tiresWide: hv.tiresWide,
engineKind: hv.engineKind, spoiler: hv.spoiler, spoilerKind: hv.spoilerKind,
bodyKind: hv.bodyKind, charmKind: hv.charmKind, charmBlink: true, lean: hLean,
boost: human.boostT > 0, boostBig: true, burn: human.burnT > 0,
shield: human.shield > 0, star: human.starT > 0, ghost: human.starT > 0, t: t
});
if (human.boostT > 0) {
ctx.fillStyle = "rgba(255,255,255,0.5)";
for (var sl = 0; sl < 8; sl++) {
var sly = (sl * 97 + Math.floor(t * 600)) % H;
ctx.fillRect(0, sly, W, 2);
}
}
ctx.fillStyle = "rgba(0,0,0,0.45)";
ctx.fillRect(W - 150, 54, 140, 10);
var hprog = ((human.lap - 1) * track.length + baseDist) / (track.length * st.laps);
ctx.fillStyle = "#ffd23f";
ctx.fillRect(W - 150, 54, 140 * Math.min(1, hprog), 10);
for (var pi = 0; pi < st.karts.length; pi++) {
var pk = st.karts[pi];
var pp = ((pk.lap - 1) * track.length + Math.max(0, pk.dist)) / (track.length * st.laps);
ctx.fillStyle = pk.human ? "#ffffff" : "#ff5a3c";
ctx.fillRect(W - 150 + 140 * Math.min(1, pp) - 2, 52, 4, 14);
}
}
return { createView: createView, drawRace: drawRace };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.render; }

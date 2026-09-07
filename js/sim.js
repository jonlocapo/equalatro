"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.sim = (function () {
var TG = null;
if (typeof EQ !== "undefined" && EQ.trackgen) { TG = EQ.trackgen; }
else if (typeof require !== "undefined") { TG = require("./trackgen.js"); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function kartParams(stats, mods) {
return {
top: 46 + stats.sp * 3.4,
acc: 16 + stats.ac * 2.4,
lat: 1.6 + stats.ha * 0.22,
grip: 0.6 + stats.ha * 0.12,
chargeNeed: Math.max(0.8, 2.6 - stats.tu * 0.18) / (1 + (mods.chargeRatePct || 0)),
boostDur: 1.1 + stats.tu * 0.08,
boostMul: (1 + stats.tu * 0.02) * (1 + (mods.boostPowerPct || 0)),
weight: stats.we
};
}
function mkKit(actives) {
var kit = { BOOST: 0, FIRE: 0, OIL: 0, ZAP: 0, SHIELD: 0, STAR: 0 };
if (actives) {
for (var i = 0; i < actives.length; i++) {
var a = actives[i];
if (kit[a.id] !== undefined) { kit[a.id] += (a.charges || 1); }
}
}
return kit;
}
function createRace(cfg) {
var st = {
track: cfg.track,
laps: cfg.laps,
karts: [],
traps: [],
time: 0,
finished: 0,
aggression: cfg.aggression !== undefined ? cfg.aggression : 0.5,
over: false
};
for (var i = 0; i < cfg.karts.length; i++) {
var c = cfg.karts[i];
var params = kartParams(c.stats, c.mods);
st.karts.push({
i: i, name: c.name, human: !!c.human,
params: params, mods: c.mods,
kit: c.kit ? { BOOST: c.kit.BOOST || 0, FIRE: c.kit.FIRE || 0, OIL: c.kit.OIL || 0, ZAP: c.kit.ZAP || 0, SHIELD: c.kit.SHIELD || 0, STAR: c.kit.STAR || 0 } : mkKit(c.actives),
shield: Math.round(c.mods.shield || 0),
skill: c.skill !== undefined ? c.skill : 0.95,
dist: -i * 12, speed: 0, lane: ((i % 4) - 1.5) * 0.4,
lap: 1, done: false, finishTime: 0, place: i + 1,
spin: 0, boostT: 0, starT: 0, burnT: 0, burnSlow: 0,
charge: 0, drifting: false, coins: 0, passes: 0,
hzCd: 0, padCd: 0, bumpCd: 0, aiCd: 1 + Math.random() * 2,
wob: Math.random() * 10, lastPlace: i + 1
});
}
computePlaces(st);
return st;
}
function progressOf(st, k) { return (k.lap - 1) * st.track.length + Math.max(0, k.dist); }
function computePlaces(st) {
var order = st.karts.slice().sort(function (a, b) {
if (a.done && b.done) { return a.finishTime - b.finishTime; }
if (a.done) { return -1; }
if (b.done) { return 1; }
return progressOf(st, b) - progressOf(st, a);
});
for (var i = 0; i < order.length; i++) { order[i].place = i + 1; }
}
function applyHit(st, k, slowFrac, spinDur, burnDur, ev, kind) {
if (k.starT > 0 || k.done) { return; }
if (k.shield > 0) {
k.shield--;
ev.push({ t: "shieldblock", i: k.i });
return;
}
var top = k.params.top;
k.speed = Math.min(k.speed, top * (1 - slowFrac));
if (spinDur > 0) { k.spin = Math.max(k.spin, spinDur); }
if (burnDur > 0) { k.burnT = Math.max(k.burnT, burnDur); k.burnSlow = Math.max(k.burnSlow, slowFrac); }
ev.push({ t: "hit", i: k.i, kind: kind || "bump" });
}
function dropTrap(st, k, kind) {
var prog = progressOf(st, k) - 10;
var slow = kind === "fire" ? 0.35 + (k.mods.burnSlowPct || 0) * 0.5 : 0.45;
var dur = kind === "fire" ? 2 + (k.mods.burnDur || 0) : 0;
st.traps.push({ prog: prog, lane: clamp(k.lane, -1, 1), kind: kind, slow: Math.min(0.65, slow), dur: dur, ttl: 30, owner: k.i });
}
function useKit(st, k, id, ev) {
if (k.done || k.kit[id] <= 0) { return false; }
if (id === "BOOST") {
k.kit.BOOST--; k.boostT = Math.max(k.boostT, k.params.boostDur);
ev.push({ t: "boost", i: k.i }); return true;
}
if (id === "FIRE") { k.kit.FIRE--; dropTrap(st, k, "fire"); ev.push({ t: "trap", i: k.i, kind: "fire" }); return true; }
if (id === "OIL") { k.kit.OIL--; dropTrap(st, k, "oil"); ev.push({ t: "trap", i: k.i, kind: "oil" }); return true; }
if (id === "ZAP") {
var best = null; var bestD = 220;
for (var q = 0; q < st.karts.length; q++) {
var o = st.karts[q];
if (o.i === k.i || o.done) { continue; }
var d = progressOf(st, o) - progressOf(st, k);
if (d > 5 && d < bestD) { bestD = d; best = o; }
}
k.kit.ZAP--;
if (best) { applyHit(st, best, 0.5, 0.8, 0, ev, "zap"); ev.push({ t: "zap", i: k.i, target: best.i }); }
else { ev.push({ t: "zapfail", i: k.i }); }
return true;
}
if (id === "SHIELD") {
if (k.shield >= 3) { return false; }
k.kit.SHIELD--; k.shield++;
ev.push({ t: "shieldup", i: k.i }); return true;
}
if (id === "STAR") {
k.kit.STAR--; k.starT = 3; k.spin = 0; k.burnT = 0;
ev.push({ t: "star", i: k.i }); return true;
}
return false;
}
var USE_ORDER = ["STAR", "BOOST", "ZAP", "SHIELD", "FIRE", "OIL"];
function aiInput(st, k, dt) {
k.wob += dt * 3;
var ahead = TG.segAt(st.track, Math.max(0, k.dist) + 120).seg;
var target = clamp(-ahead.curve * 0.28, -0.85, 0.85);
for (var s = 40; s <= 140; s += 40) {
var info = TG.segAt(st.track, Math.max(0, k.dist) + s);
var sg = info.seg;
if (sg.hz !== 0 && Math.abs(sg.hzLane - k.lane) < 0.4) { target = sg.hzLane > 0 ? -0.7 : 0.7; break; }
}
for (var ti = 0; ti < st.traps.length; ti++) {
var tr = st.traps[ti];
var dp = tr.prog - progressOf(st, k);
if (dp > 20 && dp < 150 && Math.abs(tr.lane - k.lane) < 0.4) { target = tr.lane > 0 ? -0.7 : 0.7; break; }
}
var wobble = Math.sin(k.wob) * 0.25 * (1.05 - k.skill);
target += wobble;
var steer = clamp((target - k.lane) * 3, -1, 1);
var segNow = TG.segAt(st.track, Math.max(0, k.dist)).seg;
var drift = Math.abs(segNow.curve) > 1.1 && k.speed > k.params.top * 0.55;
k.aiCd -= dt;
var use = null;
if (k.aiCd <= 0) {
k.aiCd = 2.5 + Math.random() * 3;
var follower = null;
for (var q = 0; q < st.karts.length; q++) {
var o = st.karts[q];
if (o.i === k.i || o.done) { continue; }
var gap = progressOf(st, k) - progressOf(st, o);
if (gap > 0 && gap < 70) { follower = o; break; }
}
if (follower && k.kit.FIRE > 0 && st.aggression > 0.45) { use = "FIRE"; }
else if (follower && k.kit.OIL > 0) { use = "OIL"; }
else if (k.kit.BOOST > 0 && Math.abs(segNow.curve) < 0.6) { use = "BOOST"; }
else if (k.kit.ZAP > 0 && k.place > 2) { use = "ZAP"; }
}
return { steer: steer * k.skill, drift: drift, use: use };
}
function stepRace(st, dt, humanInput) {
if (dt > 0.05) { dt = 0.05; }
if (dt <= 0) { return []; }
var ev = [];
st.time += dt;
computePlaces(st);
var leaderProg = 0;
for (var li = 0; li < st.karts.length; li++) {
if (!st.karts[li].done) { leaderProg = Math.max(leaderProg, progressOf(st, st.karts[li])); }
}
for (var i = 0; i < st.karts.length; i++) {
var k = st.karts[i];
if (k.done) {
k.speed = Math.max(0, k.speed - 30 * dt);
k.dist += k.speed * dt;
continue;
}
var inp;
if (k.human) { inp = humanInput || { steer: 0, drift: false, use: false }; }
else { inp = aiInput(st, k, dt); }
if (k.hzCd > 0) { k.hzCd -= dt; }
if (k.padCd > 0) { k.padCd -= dt; }
if (k.bumpCd > 0) { k.bumpCd -= dt; }
if (k.boostT > 0) { k.boostT -= dt; }
if (k.starT > 0) { k.starT -= dt; }
if (k.spin > 0) { k.spin -= dt; }
if (k.burnT > 0) { k.burnT -= dt; if (k.burnT <= 0) { k.burnSlow = 0; } }
var segNow = TG.segAt(st.track, Math.max(0, k.dist)).seg;
var ratio = clamp(k.speed / k.params.top, 0, 1.6);
if (k.spin > 0) {
k.speed = Math.max(k.params.top * 0.3, k.speed - 40 * dt);
} else {
var steer = clamp(inp.steer || 0, -1, 1);
var gripF = 0.7 + k.params.grip * 0.3;
k.lane += steer * k.params.lat * dt * (0.55 + 0.45 * Math.min(1, ratio));
k.lane -= segNow.curve * ratio * dt * 0.5 / gripF;
k.lane = clamp(k.lane, -2.2, 2.2);
var wantDrift = !!inp.drift && Math.abs(steer) > 0.25 && k.speed > k.params.top * 0.4;
if (wantDrift) {
if (!k.drifting) { k.drifting = true; }
k.charge += dt / k.params.chargeNeed;
if (k.charge >= 1) { k.charge = 1; }
} else {
if (k.drifting) {
k.drifting = false;
if (k.charge >= 1) {
k.boostT = Math.max(k.boostT, k.params.boostDur * 0.8);
ev.push({ t: "boost", i: k.i, mini: true });
}
k.charge = 0;
}
}
var topMul = 1;
if (k.boostT > 0) { topMul = k.params.boostMul; }
if (k.starT > 0) { topMul = Math.max(topMul, 1.35); }
if (k.burnT > 0 && k.starT <= 0) { topMul *= (1 - Math.min(0.6, k.burnSlow)); }
if (!k.human) {
var gap = (leaderProg - progressOf(st, k)) / st.track.length;
topMul *= 1 + clamp(gap, -0.4, 0.6) * 0.12 * st.aggression;
topMul *= 0.92 + k.skill * 0.08;
}
var target = k.params.top * topMul;
if (Math.abs(k.lane) > 1) {
var cut = k.mods.offroadCutPct || 0;
target = Math.min(target, k.params.top * (1 - 0.45 * (1 - cut)));
}
var acc = k.params.acc;
if (target > k.speed) { k.speed = Math.min(target, k.speed + acc * dt); }
else { k.speed = Math.max(target, k.speed - 60 * dt); }
}
var useId = k.human ? null : inp.use;
if (k.human && humanInput && humanInput.use) {
for (var u = 0; u < USE_ORDER.length; u++) {
if (k.kit[USE_ORDER[u]] > 0) { useId = USE_ORDER[u]; break; }
}
humanInput.use = false;
}
if (useId) { useKit(st, k, useId, ev); }
k.dist += k.speed * dt;
var prog = progressOf(st, k);
if (segNow.hz !== 0 && k.hzCd <= 0 && Math.abs(k.lane - segNow.hzLane) < 0.3) {
k.hzCd = 2;
if (segNow.hz === 1) { applyHit(st, k, 0.45, 1.1, 0, ev, "oil"); }
else { applyHit(st, k, 0.35, 0, 2, ev, "fire"); }
}
if (segNow.coin === 1 && segNow.coinLap !== k.lap) {
var rad = (k.mods.magnet ? 0.65 : 0.3);
if (Math.abs(k.lane - segNow.coinLane) < rad) {
segNow.coinLap = k.lap;
k.coins++;
ev.push({ t: "coin", i: k.i });
}
}
if (segNow.pad === 1 && k.padCd <= 0 && Math.abs(k.lane) < 0.95) {
k.padCd = 1.2;
k.boostT = Math.max(k.boostT, 0.9);
ev.push({ t: "boost", i: k.i, pad: true });
}
for (var t2 = st.traps.length - 1; t2 >= 0; t2--) {
var tr = st.traps[t2];
if (tr.owner === k.i) { continue; }
var dp = prog - tr.prog;
if (Math.abs(dp) < 7 && Math.abs(k.lane - tr.lane) < 0.32) {
st.traps.splice(t2, 1);
if (tr.kind === "fire") { applyHit(st, k, tr.slow, 0, tr.dur, ev, "fire"); }
else { applyHit(st, k, tr.slow, 1.0, 0, ev, "oil"); }
}
}
for (var j = 0; j < st.karts.length; j++) {
var o = st.karts[j];
if (o.i === k.i || o.done) { continue; }
var dpp = progressOf(st, o) - prog;
if (Math.abs(dpp) < 8 && Math.abs(o.lane - k.lane) < 0.35 && k.bumpCd <= 0 && o.bumpCd <= 0) {
k.bumpCd = 0.8; o.bumpCd = 0.8;
if (k.starT > 0 && o.starT <= 0) { applyHit(st, o, 0.5, 1.0, 0, ev, "star"); }
else if (o.starT > 0 && k.starT <= 0) { applyHit(st, k, 0.5, 1.0, 0, ev, "star"); }
else {
var kw = k.params.weight * (1 + (k.mods.bumpPct || 0));
var ow = o.params.weight * (1 + (o.mods.bumpPct || 0));
if (kw >= ow) {
o.lane = clamp(o.lane + (o.lane >= k.lane ? 0.5 : -0.5), -2.2, 2.2);
o.speed = Math.min(o.speed, o.params.top * 0.85);
ev.push({ t: "bump", i: k.i, target: o.i });
} else {
k.lane = clamp(k.lane + (k.lane >= o.lane ? 0.5 : -0.5), -2.2, 2.2);
k.speed = Math.min(k.speed, k.params.top * 0.85);
ev.push({ t: "bump", i: o.i, target: k.i });
}
}
}
}
if (k.dist >= st.track.length) {
k.dist -= st.track.length;
k.lap++;
if (k.lap > st.laps) {
k.done = true;
k.finishTime = st.time;
st.finished++;
ev.push({ t: "finish", i: k.i, place: st.finished });
}
}
}
for (var t3 = st.traps.length - 1; t3 >= 0; t3--) {
st.traps[t3].ttl -= dt;
if (st.traps[t3].ttl <= 0) { st.traps.splice(t3, 1); }
}
computePlaces(st);
for (var p2 = 0; p2 < st.karts.length; p2++) {
var kk = st.karts[p2];
if (!kk.done && kk.place < kk.lastPlace) {
kk.passes++;
if (kk.human) { ev.push({ t: "pass", i: kk.i }); }
}
kk.lastPlace = kk.place;
}
var allDone = true;
for (var f = 0; f < st.karts.length; f++) { if (!st.karts[f].done) { allDone = false; break; } }
st.over = allDone;
return ev;
}
return {
kartParams: kartParams,
createRace: createRace,
stepRace: stepRace,
progressOf: progressOf,
computePlaces: computePlaces
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.sim; }

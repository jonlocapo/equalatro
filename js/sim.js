"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.sim = (function () {
var TG = null;
if (typeof EQ !== "undefined" && EQ.trackgen) { TG = EQ.trackgen; }
else if (typeof require !== "undefined") { TG = require("./trackgen.js"); }
var EX = null;
if (typeof EQ !== "undefined" && EQ.extra) { EX = EQ.extra; }
else if (typeof require !== "undefined") { EX = require("./extra.js"); }
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
laps: cfg.laps || 1,
karts: [],
traps: [],
time: 0,
finished: 0,
aggression: cfg.aggression !== undefined ? cfg.aggression : 0.5,
chaos: cfg.chaos || 0,
finalLeg: !!cfg.finalLeg,
eventMods: cfg.eventMods || {},
checkpoints: cfg.checkpoints || [],
over: false
};
for (var i = 0; i < cfg.karts.length; i++) {
var c = cfg.karts[i];
var params = kartParams(c.stats, c.mods);
var kit = c.kit ? { BOOST: c.kit.BOOST || 0, FIRE: c.kit.FIRE || 0, OIL: c.kit.OIL || 0, ZAP: c.kit.ZAP || 0, SHIELD: c.kit.SHIELD || 0, STAR: c.kit.STAR || 0 } : mkKit(c.actives);
var maxhp = 100 + Math.round(c.mods.maxhp || 0);
if (c.boss === "SURV") { maxhp += 40; }
if (c.boss === "AGGRO") { kit.OIL++; kit.FIRE++; }
st.karts.push({
i: i, name: c.name, human: !!c.human,
params: params, mods: c.mods, kit: kit,
shield: Math.round(c.mods.shield || 0),
skill: c.skill !== undefined ? c.skill : 0.95,
rank: c.rank !== undefined ? c.rank : 99,
title: c.title || "",
persona: c.persona || null,
boss: c.boss || null, bossShown: false,
finisher: !!c.finisher, finisherUsed: false,
hp: c.hp !== undefined ? c.hp : maxhp, maxhp: maxhp,
fuel: c.fuel !== undefined ? c.fuel : 100, maxfuel: 100,
wrecked: false, weapon: c.weapon || null,
pitting: false, pitT: 0, pitWhy: null, pitCd: 10,
dist: -i * 6, speed: 0, lane: ((i % 5) - 2) * 0.35,
lap: 1, done: false, finishTime: 0, place: i + 1, seg: 0,
spin: 0, boostT: 0, starT: 0, burnT: 0, burnSlow: 0,
charge: 0, drifting: false, coins: 0, passes: 0,
hzCd: 0, padCd: 0, bumpCd: 0, aiCd: 1 + Math.random() * 2,
jinxCd: 0, windUsed: false, startPlace: i + 1,
bountySeen: {}, wob: Math.random() * 10, lastPlace: i + 1
});
}
computePlaces(st);
for (var s = 0; s < st.karts.length; s++) { st.karts[s].startPlace = st.karts[s].place; st.karts[s].lastPlace = st.karts[s].place; }
return st;
}
function progressOf(st, k) { return (k.lap - 1) * st.track.length + Math.max(0, k.dist); }
function fracOf(st, k) { return progressOf(st, k) / (st.track.length * st.laps); }
function segOf(st, prog) {
var s = 0;
for (var i = 0; i < st.checkpoints.length; i++) {
if (prog >= st.checkpoints[i]) { s = i + 1; }
}
return s;
}
function computePlaces(st) {
var order = st.karts.slice().sort(function (a, b) {
if (a.done && b.done) { return a.finishTime - b.finishTime; }
if (a.done) { return -1; }
if (b.done) { return 1; }
return progressOf(st, b) - progressOf(st, a);
});
for (var i = 0; i < order.length; i++) { order[i].place = i + 1; }
}
function rev(st, k, id, ev) {
if (k.bossShown || k.human) { return; }
k.bossShown = true;
ev.push({ t: "reveal", i: k.i, boss: id });
}
function hurt(st, k, dmg, ev, kind) {
if (k.starT > 0 || k.done || k.pitting) { return; }
k.hp -= dmg;
if (k.boss === "SURV" && !k.windUsed && k.hp < k.maxhp * 0.3 && k.hp > 0) {
k.windUsed = true;
k.hp += 15;
rev(st, k, "SURV", ev);
}
if (k.hp <= 0 && !k.wrecked) {
k.hp = 0;
k.wrecked = true;
k.spin = 0;
ev.push({ t: "wreck", i: k.i, kind: kind || "damage" });
}
}
function applyHit(st, k, slowFrac, spinDur, burnDur, dmg, ev, kind) {
if (k.starT > 0 || k.done || k.pitting) { return; }
if (k.shield > 0) {
k.shield--;
ev.push({ t: "shieldblock", i: k.i });
return;
}
k.speed = Math.min(k.speed, k.params.top * (1 - slowFrac));
if (spinDur > 0) { k.spin = Math.max(k.spin, spinDur); }
if (burnDur > 0) { k.burnT = Math.max(k.burnT, burnDur); k.burnSlow = Math.max(k.burnSlow, slowFrac); }
if (dmg > 0) { hurt(st, k, dmg, ev, kind); }
ev.push({ t: "hit", i: k.i, kind: kind || "bump" });
}
function dropTrap(st, k, kind, ev, dmg) {
var prog = progressOf(st, k) - 10;
var slow = kind === "fire" ? 0.35 + (k.mods.burnSlowPct || 0) * 0.5 : (kind === "mine" ? 0.5 : 0.45);
var dur = kind === "fire" ? 2 + (k.mods.burnDur || 0) : 0;
st.traps.push({ prog: prog, lane: clamp(k.lane, -1, 1), kind: kind, slow: Math.min(0.65, slow), dur: dur, dmg: dmg !== undefined ? dmg : (kind === "fire" ? 10 : 14), ttl: 30, owner: k.i });
if (k.boss === "AGGRO" && (kind === "fire" || kind === "oil")) { rev(st, k, "AGGRO", ev); }
}
function nearestAhead(st, k, maxD) {
var best = null; var bestD = maxD || 220;
for (var q = 0; q < st.karts.length; q++) {
var o = st.karts[q];
if (o.i === k.i || o.done) { continue; }
var d = progressOf(st, o) - progressOf(st, k);
if (d > 3 && d < bestD) { bestD = d; best = o; }
}
return best;
}
function fireWeapon(st, k, ev) {
var w = k.weapon;
if (!w) { return false; }
k.weapon = null;
if (w === "MIS") {
var t = nearestAhead(st, k, 400);
if (t) { applyHit(st, t, 0.5, 1, 0, 20, ev, "mis"); }
ev.push({ t: "wfire", i: k.i, kind: "MIS", target: t ? t.i : -1 });
return true;
}
if (w === "MINE") { dropTrap(st, k, "mine", ev, 18); ev.push({ t: "wfire", i: k.i, kind: "MINE" }); return true; }
if (w === "EMP") {
var n = 0;
for (var q = 0; q < st.karts.length; q++) {
var o = st.karts[q];
if (o.i === k.i || o.done) { continue; }
var d = progressOf(st, o) - progressOf(st, k);
if (d > 0 && d < 150) { applyHit(st, o, 0.3, 0.5, 0, 8, ev, "emp"); n++; }
}
ev.push({ t: "wfire", i: k.i, kind: "EMP", n: n });
return true;
}
if (w === "TURBO") {
if (k.fuel <= 0) { ev.push({ t: "wfire", i: k.i, kind: "TURBO" }); return true; }
k.fuel = Math.max(0, k.fuel - 2);
k.boostT = Math.max(k.boostT, k.params.boostDur);
ev.push({ t: "boost", i: k.i });
return true;
}
if (w === "SHIELD") {
if (k.shield < 3) { k.shield++; }
ev.push({ t: "shieldup", i: k.i });
return true;
}
if (w === "PATCH") {
k.hp = Math.min(k.maxhp, k.hp + 30);
ev.push({ t: "patch", i: k.i });
return true;
}
return false;
}
function useKit(st, k, id, ev) {
if (k.done || k.kit[id] <= 0) { return false; }
if (id === "BOOST") {
if (k.fuel <= 0) { return false; }
k.kit.BOOST--; k.fuel = Math.max(0, k.fuel - 3);
k.boostT = Math.max(k.boostT, k.params.boostDur);
ev.push({ t: "boost", i: k.i }); return true;
}
if (id === "FIRE") { k.kit.FIRE--; dropTrap(st, k, "fire", ev); ev.push({ t: "trap", i: k.i, kind: "fire" }); return true; }
if (id === "OIL") { k.kit.OIL--; dropTrap(st, k, "oil", ev); ev.push({ t: "trap", i: k.i, kind: "oil" }); return true; }
if (id === "ZAP") {
var best = nearestAhead(st, k, 220);
k.kit.ZAP--;
if (best) { applyHit(st, best, 0.5, 0.8, 0, 16, ev, "zap"); ev.push({ t: "zap", i: k.i, target: best.i }); }
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
var P = k.persona || {};
var ahead = TG.segAt(st.track, Math.max(0, k.dist) + 120).seg;
var target = clamp(-ahead.curve * 0.28, -0.85, 0.85);
if (P.blockB) {
var prey = null;
for (var b = 0; b < st.karts.length; b++) {
var bo = st.karts[b];
if (bo.i === k.i || bo.done) { continue; }
var gap = progressOf(st, k) - progressOf(st, bo);
if (gap > 0 && gap < 40) { prey = bo; break; }
}
if (prey) { target = clamp(prey.lane, -0.8, 0.8); }
}
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
var driftTh = 1.1 * (P.driftB || 1);
var drift = Math.abs(segNow.curve) > driftTh && k.speed > k.params.top * 0.55;
k.aiCd -= dt;
var use = null;
var fire = false;
var aggr = (P.aggr || 1) * (1 + st.chaos * 0.06);
if (k.aiCd <= 0) {
k.aiCd = (2.5 + Math.random() * 3) / aggr;
var follower = null;
for (var q = 0; q < st.karts.length; q++) {
var o = st.karts[q];
if (o.i === k.i || o.done) { continue; }
var gap2 = progressOf(st, k) - progressOf(st, o);
if (gap2 > 0 && gap2 < 70) { follower = o; break; }
}
var wb = P.weaponB || 1;
if (k.weapon && Math.random() < 0.7 * wb) {
if (k.weapon === "MIS" || k.weapon === "EMP") { if (nearestAhead(st, k, 300)) { fire = true; } }
else if (k.weapon === "MINE") { if (follower) { fire = true; } }
else if (k.weapon === "TURBO") { if (Math.abs(segNow.curve) < 0.6) { fire = true; } }
else if (k.weapon === "SHIELD") { if (k.hp < k.maxhp * 0.5) { fire = true; } }
else if (k.weapon === "PATCH") { if (k.wrecked || k.hp < k.maxhp * 0.4) { fire = true; } }
}
if (!fire) {
if (follower && k.kit.FIRE > 0 && st.aggression > 0.45) { use = "FIRE"; }
else if (follower && k.kit.OIL > 0) { use = "OIL"; }
else if (k.kit.BOOST > 0 && k.fuel > 15 && Math.abs(segNow.curve) < 0.6) { use = "BOOST"; }
else if (k.kit.ZAP > 0 && k.place > 2) { use = "ZAP"; }
}
}
return { steer: steer * k.skill, drift: drift, use: use, fire: fire };
}
function stepRace(st, dt, humanInput) {
if (dt > 0.05) { dt = 0.05; }
if (dt <= 0) { return []; }
var ev = [];
st.time += dt;
if (st.eventMods.oilrain && Math.random() < dt * 0.5) {
var ri = Math.floor(Math.random() * st.track.count);
var sg2 = st.track.segs[ri];
if (sg2.hz === 0) { sg2.hz = 1; sg2.hzLane = [-0.6, 0, 0.6][Math.floor(Math.random() * 3)]; }
}
computePlaces(st);
var leaderProg = 0;
for (var li = 0; li < st.karts.length; li++) {
if (!st.karts[li].done) { leaderProg = Math.max(leaderProg, progressOf(st, st.karts[li])); }
}
var n = st.karts.length;
for (var i = 0; i < n; i++) {
var k = st.karts[i];
if (k.done) {
k.speed = Math.max(0, k.speed - 30 * dt);
k.dist += k.speed * dt;
continue;
}
if (k.pitting) {
k.speed = Math.max(0, k.speed - 60 * dt);
k.pitT -= dt;
if (k.pitT <= 0) {
k.pitting = false;
ev.push({ t: "unpitted", i: k.i });
}
continue;
}
var inp;
if (k.human) { inp = humanInput || { steer: 0, drift: false, use: false, fire: false }; }
else { inp = aiInput(st, k, dt); }
if (k.hzCd > 0) { k.hzCd -= dt; }
if (k.padCd > 0) { k.padCd -= dt; }
if (k.bumpCd > 0) { k.bumpCd -= dt; }
if (k.boostT > 0) { k.boostT -= dt; }
if (k.starT > 0) { k.starT -= dt; }
if (k.spin > 0) { k.spin -= dt; }
if (k.jinxCd > 0) { k.jinxCd -= dt; }
if (k.burnT > 0) {
k.burnT -= dt;
hurt(st, k, 3 * dt, ev, "burn");
if (k.burnT <= 0) { k.burnSlow = 0; }
}
if (k.wrecked) {
var rr = (k.speed < 2 ? 25 : 10) * (1 + (k.mods.regenPct || 0));
k.hp += rr * dt;
if (k.hp >= k.maxhp) {
k.hp = k.maxhp;
k.wrecked = false;
ev.push({ t: "unwreck", i: k.i });
}
}
var segNow = TG.segAt(st.track, Math.max(0, k.dist)).seg;
var ratio = clamp(k.speed / k.params.top, 0, 1.6);
if (k.fuel <= 0) {
var fr = (k.speed < 2 ? 30 : 10) * (1 + (k.mods.regenPct || 0));
k.fuel = Math.min(k.maxfuel, k.fuel + fr * dt);
} else {
k.fuel = Math.max(0, k.fuel - dt * (0.55 + 0.5 * ratio));
}
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
if (k.charge >= 1 && k.fuel > 0) {
k.fuel = Math.max(0, k.fuel - 2);
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
if (k.wrecked) { topMul = Math.min(topMul, 0.15); }
else if (k.fuel <= 0) { topMul = Math.min(topMul, 0.4); }
if (k.boss === "SLIP") {
var prey = nearestAhead(st, k, 70);
if (prey) { topMul *= 1.08; rev(st, k, "SLIP", ev); }
}
if (!k.human) {
var gap = (leaderProg - progressOf(st, k)) / st.track.length;
var band = clamp(gap, -0.4, 0.6) * 0.12 * st.aggression;
if (k.boss === "CLOSE" && (k.startPlace - k.place) >= 3) {
band *= 1.6;
rev(st, k, "CLOSE", ev);
}
topMul *= 1 + band;
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
var doFire = k.human ? !!(humanInput && humanInput.fire) : !!inp.fire;
if (k.human && humanInput) {
if (humanInput.use) {
for (var u = 0; u < USE_ORDER.length; u++) {
if (k.kit[USE_ORDER[u]] > 0) { useId = USE_ORDER[u]; break; }
}
humanInput.use = false;
}
if (humanInput.fire) { humanInput.fire = false; }
}
if (useId) { useKit(st, k, useId, ev); }
if (doFire) { fireWeapon(st, k, ev); }
if (k.finisher && !k.finisherUsed && st.finalLeg && fracOf(st, k) > 0.55 && k.place <= 6) {
k.finisherUsed = true;
k.kit.STAR = (k.kit.STAR || 0) + 1;
useKit(st, k, "STAR", ev);
ev.push({ t: "reveal", i: k.i, boss: "FINISHER" });
}
k.dist += k.speed * dt;
var prog = progressOf(st, k);
k.seg = segOf(st, prog);
if (!k.pitting && segNow.hz !== 0 && k.hzCd <= 0 && Math.abs(k.lane - segNow.hzLane) < 0.3) {
k.hzCd = 2;
if (segNow.hz === 1) { applyHit(st, k, 0.45, 1.1, 0, 10, ev, "oil"); }
else { applyHit(st, k, 0.35, 0, 2, 8, ev, "fire"); }
}
if (segNow.coin === 1 && (segNow.coinCd || 0) <= st.time) {
var rad = (k.mods.magnet ? 0.65 : 0.3);
if (Math.abs(k.lane - segNow.coinLane) < rad) {
segNow.coinCd = st.time + 20;
k.coins++;
ev.push({ t: "coin", i: k.i });
}
}
if (segNow.wcell === 1 && !k.weapon && (segNow.wCd || 0) <= st.time) {
segNow.wCd = st.time + (st.eventMods.cache ? 5 : 20);
if (EX) { k.weapon = EX.rollWeapon(Math.random, k.place / n); }
else { k.weapon = "TURBO"; }
ev.push({ t: "weapon", i: k.i, w: k.weapon });
}
if (segNow.pad === 1 && k.padCd <= 0 && Math.abs(k.lane) < 0.95) {
k.padCd = 1.2;
if (k.fuel > 0) { k.boostT = Math.max(k.boostT, 0.9); }
ev.push({ t: "boost", i: k.i, pad: true });
}
if (!k.pitting) {
for (var t2 = st.traps.length - 1; t2 >= 0; t2--) {
var tr = st.traps[t2];
if (tr.owner === k.i) { continue; }
var dp = prog - tr.prog;
if (Math.abs(dp) < 7 && Math.abs(k.lane - tr.lane) < 0.32) {
st.traps.splice(t2, 1);
if (tr.kind === "fire") { applyHit(st, k, tr.slow, 0, tr.dur, tr.dmg, ev, "fire"); }
else { applyHit(st, k, tr.slow, 1.0, 0, tr.dmg, ev, tr.kind === "mine" ? "mine" : "oil"); }
}
}
for (var j = 0; j < n; j++) {
var o = st.karts[j];
if (o.i === k.i || o.done || o.pitting) { continue; }
var dpp = progressOf(st, o) - prog;
if (Math.abs(dpp) < 8 && Math.abs(o.lane - k.lane) < 0.35 && k.bumpCd <= 0 && o.bumpCd <= 0) {
k.bumpCd = 0.8; o.bumpCd = 0.8;
if (k.starT > 0 && o.starT <= 0) { applyHit(st, o, 0.5, 1.0, 0, 8, ev, "star"); }
else if (o.starT > 0 && k.starT <= 0) { applyHit(st, k, 0.5, 1.0, 0, 8, ev, "star"); }
else {
var kw = k.params.weight * (1 + (k.mods.bumpPct || 0)) * (k.boss === "BULLY" ? 1.6 : 1);
var ow = o.params.weight * (1 + (o.mods.bumpPct || 0)) * (o.boss === "BULLY" ? 1.6 : 1);
if (kw >= ow) {
o.lane = clamp(o.lane + (o.lane >= k.lane ? 0.5 : -0.5), -2.2, 2.2);
o.speed = Math.min(o.speed, o.params.top * 0.85);
if (k.boss === "BULLY") { rev(st, k, "BULLY", ev); }
hurt(st, o, 6, ev, "bump");
ev.push({ t: "bump", i: k.i, target: o.i });
} else {
k.lane = clamp(k.lane + (k.lane >= o.lane ? 0.5 : -0.5), -2.2, 2.2);
k.speed = Math.min(k.speed, k.params.top * 0.85);
if (o.boss === "BULLY") { rev(st, o, "BULLY", ev); }
hurt(st, k, 6, ev, "bump");
ev.push({ t: "bump", i: o.i, target: k.i });
}
}
}
}
}
if (k.dist >= st.track.length) {
k.dist = st.track.length;
if (!k.done) {
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
for (var p2 = 0; p2 < n; p2++) {
var kk = st.karts[p2];
if (!kk.done && kk.place < kk.lastPlace) {
kk.passes++;
if (kk.boss === "JINX" && kk.jinxCd <= 0 && Math.random() < 0.15) {
kk.jinxCd = 8;
var victim = nearestAhead(st, kk, 40);
if (victim) {
applyHit(st, victim, 0.3, 0.6, 0, 4, ev, "jinx");
rev(st, kk, "JINX", ev);
}
}
if (EX && !kk.human) {
var vv = null;
for (var q3 = 0; q3 < n; q3++) {
var oo = st.karts[q3];
if (oo.i === kk.i || oo.done) { continue; }
var dd = progressOf(st, kk) - progressOf(st, oo);
if (dd > 0 && dd < 40) { vv = oo; break; }
}
if (vv) {
var key = kk.seg + ":" + vv.name;
if (!kk.bountySeen[key]) {
kk.bountySeen[key] = true;
var mult = (st.eventMods.bountyMult || 1);
ev.push({ t: "bounty", i: kk.i, amt: Math.round(EX.bountyFor(vv.title) * mult), victim: vv.name });
}
}
}
if (kk.human) {
var vh = null;
for (var q4 = 0; q4 < n; q4++) {
var oh = st.karts[q4];
if (oh.i === kk.i || oh.done) { continue; }
var dh = progressOf(st, kk) - progressOf(st, oh);
if (dh > 0 && dh < 40) { vh = oh; break; }
}
if (vh && EX) {
var keyh = kk.seg + ":" + vh.name;
if (!kk.bountySeen[keyh]) {
kk.bountySeen[keyh] = true;
var mh = (st.eventMods.bountyMult || 1);
ev.push({ t: "bounty", i: kk.i, amt: Math.round(EX.bountyFor(vh.title) * mh), victim: vh.name });
}
}
ev.push({ t: "pass", i: kk.i });
}
}
kk.lastPlace = kk.place;
}
var running = 0;
for (var f = 0; f < n; f++) { if (!st.karts[f].done) { running++; } }
st.over = running === 0;
return ev;
}
return {
kartParams: kartParams,
createRace: createRace,
stepRace: stepRace,
progressOf: progressOf,
fracOf: fracOf,
segOf: segOf,
computePlaces: computePlaces
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.sim; }

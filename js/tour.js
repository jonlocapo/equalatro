"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.tour = (function () {
function G() { return EQ.game.getS(); }
function $ (id) { return EQ.game.$(id); }
function newTour(driverId) {
var D = EQ.data;
var EX = EQ.extra;
var rng = EQ.util.mulberry32(EQ.util.hashStr("tour" + Math.floor(Math.random() * 1e9).toString(36)));
var seed = "tour" + Math.floor(rng() * 1e9).toString(36);
var cpu = [];
for (var i = 0; i < 24; i++) {
var stats = {
sp: 3.8 - i * 0.07 + (rng() - 0.5),
ac: 3.8 - i * 0.07 + (rng() - 0.5),
ha: 3.8 - i * 0.07 + (rng() - 0.5),
tu: 3.8 - i * 0.07 + (rng() - 0.5),
we: 3.8 - i * 0.07 + (rng() - 0.5)
};
for (var k in stats) { stats[k] = Math.max(1, Math.min(9, Math.round(stats[k] * 10) / 10)); }
cpu.push({
name: D.CPU_NAMES[i], rank: i, title: D.titleFor(i),
skill: Math.min(1, 0.99 - i * 0.004) + (rng() - 0.5) * 0.02,
stats: stats, boss: D.assignBoss(rng, i),
persona: EX.assignPersona(rng, i),
finisher: i === 0, alive: true,
hp: 100, fuel: 100, bonus: {}
});
}
G().run = {
seed: seed, coins: 60, driver: driverId,
equip: { ENGINE: "e_putt", TIRES: "t_donuts", BODY: "b_crate", SPOILER: "s_plank", CHARM: "c_shroom" },
owned: [D.PART_BY_ID.e_putt, D.PART_BY_ID.t_donuts, D.PART_BY_ID.b_crate, D.PART_BY_ID.s_plank, D.PART_BY_ID.c_shroom],
cpu: cpu, segIdx: 0, wins: 0,
firstCross: 0, eventSeg: -1,
pit: null, feed: []
};
G().run.loadout = D.calcLoadout(driverId, G().run.equip);
EQ.game.toGarage();
}
function aliveCount() {
var S = G();
if (!S.run) { return 0; }
var n = 1;
for (var i = 0; i < S.run.cpu.length; i++) { if (S.run.cpu[i].alive) { n++; } }
return n;
}
function cpuByName(name) {
var cpu = G().run.cpu;
for (var i = 0; i < cpu.length; i++) { if (cpu[i].name === name) { return cpu[i]; } }
return null;
}
function startTour() {
var D = EQ.data;
var EX = EQ.extra;
var S = G();
var track = EQ.trackgen.genTour(S.run.seed);
var loadout = D.calcLoadout(S.run.driver, S.run.equip);
S.run.loadout = loadout;
var rng = EQ.util.mulberry32(EQ.util.hashStr(S.run.seed + ":grid"));
var karts = [];
karts.push({ name: loadout.driver.name, human: true, stats: loadout.stats, mods: loadout.mods, actives: loadout.actives, hp: 100, fuel: 100 });
var visuals = [{
color: loadout.driver.color, scarf: loadout.driver.scarf,
body: EQ.game.eqId("BODY"), tiresWide: ((EQ.game.eqId("TIRES").s || {}).we || 0) >= 2,
engineKind: D.PART_BY_ID[EQ.game.eqId("ENGINE")].kind,
spoiler: EQ.game.eqId("SPOILER"), spoilerKind: D.PART_BY_ID[EQ.game.eqId("SPOILER")].kind,
bodyKind: D.PART_BY_ID[EQ.game.eqId("BODY")].kind,
charmKind: D.PART_BY_ID[EQ.game.eqId("CHARM")].kind
}];
var cols = ["#ff5a3c", "#ffd23f", "#7bf1a8", "#3a86ff", "#c084fc", "#ffb703", "#9ad8ff", "#ffffff"];
var bodies = ["b_crate", "b_paper", "b_ember", "b_cushion", "b_vault"];
var kinds = D.KIND_LIST;
var ci = 0;
for (var i = 0; i < S.run.cpu.length; i++) {
var c = S.run.cpu[i];
var b2 = bodies[Math.floor(rng() * bodies.length)];
karts.push({
name: c.name, human: false,
stats: { sp: Math.round(c.stats.sp), ac: Math.round(c.stats.ac), ha: Math.round(c.stats.ha), tu: Math.round(c.stats.tu), we: Math.round(c.stats.we) },
mods: D.baseMods(), kit: { BOOST: 0, FIRE: 0, OIL: c.rank <= 7 ? 1 : 0, ZAP: 0, SHIELD: 0, STAR: 0 },
skill: c.skill, boss: c.boss, rank: c.rank, title: c.title,
persona: EX.PERSONAS[c.persona], finisher: c.finisher,
hp: c.hp, fuel: c.fuel
});
ci++;
visuals.push({
color: cols[ci % cols.length], scarf: cols[(ci + 3) % cols.length],
body: b2, tiresWide: rng() < 0.3,
engineKind: kinds[Math.floor(rng() * kinds.length)],
spoiler: "s_plank", spoilerKind: kinds[Math.floor(rng() * kinds.length)],
bodyKind: D.PART_BY_ID[b2].kind, charmKind: null
});
}
var gates = {};
for (var g = 0; g < track.checkpoints.length; g++) {
gates[Math.floor(track.checkpoints[g].dist / track.segLen)] = 1;
}
S.run.checkpoints = track.checkpoints.map(function (c) { return c.dist; });
S.run.segIdx = 0;
S.run.firstCross = 0;
S.run.eventSeg = -1;
var st = EQ.sim.createRace({ track: track, laps: 1, karts: karts, aggression: 0.5, chaos: 0, finalLeg: false, eventMods: {}, checkpoints: S.run.checkpoints });
EQ.game.beginRace(st, { visuals: visuals, palette: 0, gates: gates, fog: 0, sparks: false }, track.name.toUpperCase());
}
function crossed(st, k, idx) {
return EQ.sim.progressOf(st, k) >= st.checkpoints[idx];
}
function afterStep(dt) {
var S = G();
if (!S.race || S.screen === "results" || S.screen === "over") { return; }
var st = S.race.st;
var me = EQ.game.meKart();
$("hud-seg").textContent = "SEG " + Math.min(9, me.seg + 1) + "/9";
if (st.over) { return; }
cpuPitTick(dt, st);
var pseg = me.seg;
if (pseg !== S.run.eventSeg) {
S.run.eventSeg = pseg;
applyEvent(pseg, st);
}
var cp = S.run.checkpoints[S.run.segIdx];
var allIn = true;
var anyIn = false;
for (var i = 0; i < st.karts.length; i++) {
var k = st.karts[i];
if (k.done) { anyIn = true; continue; }
if (EQ.sim.progressOf(st, k) >= cp) { anyIn = true; }
else { allIn = false; }
}
if (anyIn && !S.run.firstCross) { S.run.firstCross = st.time; }
if (allIn || (S.run.firstCross && st.time - S.run.firstCross > 75)) {
segmentEnd();
}
}
function applyEvent(pseg, st) {
var S = G();
var evId = (st.track.events || {})[pseg];
st.eventMods = {};
S.race.look.fog = 0;
S.race.look.sparks = false;
if (!evId) { return; }
var def = EQ.extra.EVENTS[evId];
if (!def) { return; }
st.eventMods = { bountyMult: def.bountyMult, oilrain: !!def.oilrain, cache: !!def.cache };
S.race.look.fog = def.fog || 0;
S.race.look.sparks = (evId === "meteor" || evId === "storm");
EQ.game.hudMsg(def.name, 2.5);
if (def.freeBoost) {
for (var i = 0; i < st.karts.length; i++) { st.karts[i].kit.BOOST++; }
}
}
function cpuPitTick(dt, st) {
var S = G();
for (var i = 0; i < st.karts.length; i++) {
var k = st.karts[i];
if (k.human || k.done) { continue; }
if (k.pitting) { continue; }
k.pitCd -= dt;
if (k.pitCd > 0) { continue; }
var P = k.persona || {};
k.pitCd = (25 + Math.random() * 20) / (P.pitB || 1);
var needFuel = k.fuel < 35;
var needFix = k.hp < k.maxhp * 0.45;
var wantPart = Math.random() < 0.3 * (P.pitB || 1);
if (!needFuel && !needFix && !wantPart) { continue; }
k.pitting = true;
k.pitWhy = needFix ? "repair" : (needFuel ? "fuel" : "parts");
k.pitT = 4 + Math.random() * 3;
}
}
function onEvents(ev) {
var S = G();
if (!S.race) { return; }
for (var i = 0; i < ev.length; i++) {
var e = ev[i];
var k = S.race.st.karts[e.i];
if (!k) { continue; }
if (e.t === "bounty" && k.human) {
S.run.coins += e.amt;
EQ.game.hudMsg("+" + e.amt + "c BOUNTY " + e.victim, 1.4);
EQ.audio.sfx("coin");
}
else if (e.t === "reveal") {
EQ.game.hudMsg(k.name + " reveals " + bossName(e.boss), 2);
EQ.audio.sfx("zap");
}
else if (e.t === "unpitted" && !k.human) {
var c = cpuByName(k.name);
if (c) {
if (k.pitWhy === "fuel") { k.fuel = 100; c.fuel = 100; }
else if (k.pitWhy === "repair") { k.hp = k.maxhp; k.wrecked = false; c.hp = 100; }
else {
for (var sk in c.stats) { c.stats[sk] = Math.max(1, Math.min(9, Math.round((c.stats[sk] + 0.3) * 10) / 10)); }
}
S.run.feed.unshift(k.name + " back out (" + (k.pitWhy || "service") + ")");
if (S.run.feed.length > 6) { S.run.feed.pop(); }
if (S.screen === "pit") { renderFeed(); }
}
}
else if (e.t === "finish" && k.human) {
EQ.game.hudMsg("FINISH", 2);
}
}
}
function bossName(id) {
if (id === "FINISHER") { return "FINISHER"; }
return EQ.data.BOSS[id] ? EQ.data.BOSS[id].name.toUpperCase() : id;
}
function orderTable(st) {
var t = [];
for (var i = 0; i < st.karts.length; i++) {
var k = st.karts[i];
t.push({ name: k.name, human: k.human, place: k.place, time: k.done ? k.finishTime : -1, title: k.title || "", wrecked: k.wrecked });
}
t.sort(function (a, b) { return a.place - b.place; });
return t;
}
function eliminate(k) {
k.dist = -100000;
k.speed = 0;
k.pitting = true;
k.pitT = 1e12;
k.weapon = null;
var c = cpuByName(k.name);
if (c) { c.alive = false; }
}
function segmentEnd() {
var S = G();
var D = EQ.data;
var st = S.race.st;
S.screen = "results";
EQ.audio.engine(false, 0);
EQ.game.show("scr-results");
$("hud").classList.add("hidden");
$("touch").classList.add("hidden");
var table = orderTable(st);
var segIdx = S.run.segIdx;
var isFinal = segIdx >= 8;
var cut = isFinal ? 0 : D.SEG_CUTS[segIdx];
var me = EQ.game.meKart();
var gain = Math.max(5, 60 - me.place * 2);
S.run.coins += gain;
if (me.place === 1) { S.run.wins++; EQ.audio.sfx("win"); }
else { EQ.audio.sfx("pickup"); }
if (isFinal) {
finishTour(table);
return;
}
$("res-title").textContent = "SEGMENT " + (segIdx + 1) + " - " + EQ.util.ordinal(me.place);
var rt = $("res-table");
rt.innerHTML = "";
for (var r = 0; r < table.length; r++) {
if (r === table.length - cut) {
rt.appendChild(EQ.game.el("div", "cutline", "--- CUT: BOTTOM " + cut + " OUT ---"));
}
var row = table[r];
var tstr = row.time >= 0 ? EQ.util.fmtTime(row.time * 1000) : (row.wrecked ? "WRECK" : "RACING");
var cls = row.human ? "me" : null;
rt.appendChild(EQ.game.el("div", cls, EQ.util.ordinal(row.place) + " " + row.name + (row.title ? " [" + row.title + "]" : "") + (row.human ? " (YOU)" : "") + " - " + tstr));
}
for (var e2 = table.length - cut; e2 < table.length; e2++) {
if (table[e2].human) { continue; }
for (var q = 0; q < st.karts.length; q++) {
if (st.karts[q].name === table[e2].name) { eliminate(st.karts[q]); }
}
}
$("res-reward").textContent = "+" + gain + "c. " + aliveCount() + " karts left. The fallen feed the loot pool.";
$("btn-to-shop").textContent = "RESUME RACE";
}
function afterResults() {
var S = G();
if (S.screen !== "results") { return; }
S.run.segIdx++;
S.run.firstCross = 0;
S.screen = "race";
EQ.game.show(null);
$("hud").classList.remove("hidden");
if (S.touchMode) { $("touch").classList.remove("hidden"); }
EQ.game.hudMsg("SEGMENT " + (S.run.segIdx + 1) + " - GO", 1.5);
EQ.audio.sfx("go");
}
function finishTour(table) {
var S = G();
var champ = table[0];
var names = "";
for (var i = 0; i < Math.min(3, table.length); i++) {
if (i > 0) { names += ", "; }
names += EQ.util.ordinal(table[i].place) + " " + table[i].name;
}
if (champ.human) {
EQ.extra.addCrown();
EQ.game.saveBest(9, true);
EQ.audio.sfx("win");
tourOver("TOUR CHAMPION", "You beat 24 rivals over 9 segments. Podium: " + names + ". Segment wins: " + S.run.wins + ". Crown banked. New drivers unlocked.");
} else {
EQ.game.saveBest(9, false);
EQ.audio.sfx("lose");
tourOver(EQ.util.ordinal(champ.place) + " " + champ.name.toUpperCase() + " TAKES THE TOUR", "You placed " + EQ.util.ordinal(orderTable(S.race.st).filter(function (r) { return r.human; })[0].place) + ". Podium: " + names + ". Segment wins: " + S.run.wins + ".");
}
}
function tourOver(title, stats) {
var S = G();
S.screen = "over";
EQ.game.show("scr-over");
$("hud").classList.add("hidden");
$("touch").classList.add("hidden");
$("over-title").textContent = title;
$("over-stats").textContent = stats;
S.race = null;
}
function togglePit() {
var S = G();
if (!S.race) { return; }
var me = EQ.game.meKart();
if (S.screen === "race") {
if (me.done || me.pitting) { return; }
me.pitting = true;
me.pitT = 1e9;
S.screen = "pit";
EQ.game.show("scr-pit");
openPit();
} else if (S.screen === "pit") {
me.pitting = false;
me.pitT = 0;
S.screen = "race";
EQ.game.show(null);
}
}
function openPit() {
var S = G();
var D = EQ.data;
if (!S.run.pit || S.run.pit.seg !== S.run.segIdx) {
var rng = EQ.util.mulberry32(EQ.util.hashStr(S.run.seed + ":pit" + S.run.segIdx));
S.run.pit = {
seg: S.run.segIdx,
offers: D.pitDraft(rng, S.run.segIdx, 25 - aliveCount(), S.run.loadout.mods.luck || 0, EQ.game.ownedSet()),
svc: null
};
}
$("pit-info").textContent = pitInfo();
renderPitDraft();
renderPitService();
renderFeed();
$("pit-service-fill").style.width = "0%";
}
function pitInfo() {
var S = G();
var me = EQ.game.meKart();
return "HP " + Math.round(me.hp) + "/" + me.maxhp + " Fuel " + Math.round(me.fuel) + " Coins " + S.run.coins + "c. Rivals are passing you right now.";
}
function renderPitDraft() {
var S = G();
var dd = $("pit-draft");
dd.innerHTML = "";
var offers = S.run.pit.offers;
if (!offers.length) { dd.textContent = "Sold out. Reroll for 1c."; return; }
for (var i = 0; i < offers.length; i++) {
(function (p) {
var card = EQ.game.partCard(p, "Click to buy and bolt on (2s)");
card.onclick = function () { pitBuy(p); };
dd.appendChild(card);
})(offers[i]);
}
}
function renderPitService() {
var D = EQ.data;
var bf = $("btn-pit-fuel");
var br = $("btn-pit-repair");
var svc = G().run.pit.svc;
bf.textContent = "REFUEL " + D.FUEL_COST + "c (4s)";
br.textContent = "REPAIR " + D.FIX_COST + "c (4s)";
bf.disabled = !!svc;
br.disabled = !!svc;
}
function renderFeed() {
var feed = $("pit-feed");
feed.innerHTML = "";
var lines = G().run.feed;
for (var i = 0; i < Math.min(6, lines.length); i++) {
feed.appendChild(EQ.game.el("div", null, lines[i]));
}
}
function pitService(kind) {
var S = G();
var D = EQ.data;
if (S.screen !== "pit" || !S.run.pit || S.run.pit.svc) { return; }
var cost = kind === "fuel" ? D.FUEL_COST : D.FIX_COST;
if (S.run.coins < cost) { return; }
S.run.coins -= cost;
S.run.pit.svc = { type: kind, t: 4, total: 4 };
EQ.audio.sfx("click");
renderPitService();
}
function pitReroll() {
var S = G();
var D = EQ.data;
if (S.screen !== "pit" || !S.run.pit) { return; }
if (S.run.coins < D.REROLL_COST) { return; }
S.run.coins -= D.REROLL_COST;
var rng = EQ.util.mulberry32(EQ.util.hashStr(S.run.seed + ":re" + S.run.segIdx + S.run.coins));
S.run.pit.offers = D.pitDraft(rng, S.run.segIdx, 25 - aliveCount(), S.run.loadout.mods.luck || 0, EQ.game.ownedSet());
EQ.audio.sfx("click");
renderPitDraft();
$("pit-info").textContent = pitInfo();
}
function pitBuy(p) {
var S = G();
if (S.screen !== "pit" || !S.run.pit || S.run.pit.svc) {
if (S.run.pit && S.run.pit.svc) { $("pit-info").textContent = "CREW BUSY. Wait for the bar."; }
return;
}
var price = EQ.data.priceOf(p);
if (S.run.coins < price) { return; }
S.run.coins -= price;
var idx = S.run.pit.offers.indexOf(p);
if (idx >= 0) { S.run.pit.offers.splice(idx, 1); }
S.run.pit.svc = { type: "part", t: 2, total: 2, part: p };
EQ.audio.sfx("click");
renderPitDraft();
renderPitService();
}
function pitTick(dt) {
var S = G();
if (!S.race || !S.run.pit || !S.run.pit.svc) { return; }
var svc = S.run.pit.svc;
svc.t -= dt;
$("pit-service-fill").style.width = Math.round((1 - svc.t / svc.total) * 100) + "%";
if (svc.t > 0) { return; }
var me = EQ.game.meKart();
if (svc.type === "fuel") { me.fuel = me.maxfuel; }
else if (svc.type === "repair") {
me.hp = me.maxhp;
if (me.wrecked) { me.wrecked = false; }
}
else if (svc.type === "part" && svc.part) { EQ.game.claimPart(svc.part); }
S.run.pit.svc = null;
EQ.audio.sfx("pickup");
$("pit-info").textContent = pitInfo();
renderPitService();
}
return {
newTour: newTour, startTour: startTour, afterStep: afterStep, onEvents: onEvents,
pitTick: pitTick, togglePit: togglePit, pitService: pitService, pitReroll: pitReroll,
afterResults: afterResults, aliveCount: aliveCount
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.tour; }

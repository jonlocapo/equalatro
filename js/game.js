"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.game = (function () {
function $(id) { return document.getElementById(id); }
function el(tag, cls, html) {
var d = document.createElement(tag);
if (cls) { d.className = cls; }
if (html !== undefined) { d.innerHTML = html; }
return d;
}
var S = null;
function newRunState() {
return {
screen: "title",
run: null,
race: null,
view: null,
keys: {},
paused: false,
msgTimer: 0,
lastT: 0,
acc: 0,
countT: 0,
endT: 0,
touch: { left: false, right: false, drift: false }
};
}
function best() {
try {
var b = JSON.parse(localStorage.getItem("equalatro_best") || "null");
if (b) { return b; }
} catch (e) {}
return { circuit: 0, wins: 0 };
}
function saveBest(circuit, win) {
var b = best();
b.circuit = Math.max(b.circuit, circuit);
if (win) { b.wins++; }
try { localStorage.setItem("equalatro_best", JSON.stringify(b)); } catch (e) {}
}
function show(id) {
var screens = ["scr-title", "scr-drivers", "scr-garage", "scr-results", "scr-shop", "scr-over", "scr-help", "paused"];
for (var i = 0; i < screens.length; i++) { $(screens[i]).classList.add("hidden"); }
if (id) { $(id).classList.remove("hidden"); }
}
function startRun(driverId) {
var D = EQ.data;
S.run = {
seed: "run" + Math.floor(Math.random() * 1e9).toString(36),
circuit: 1,
hearts: 3,
coins: 30,
driver: driverId,
equip: { ENGINE: D.STARTER.ENGINE, TIRES: D.STARTER.TIRES, BODY: D.STARTER.BODY, SPOILER: D.STARTER.SPOILER, CHARM: D.STARTER.CHARM },
owned: [D.STARTER.ENGINE, D.STARTER.TIRES, D.STARTER.BODY, D.STARTER.SPOILER, D.STARTER.CHARM],
stock: [],
draft: [],
reroll: 10,
wins: 0
};
S.run.loadout = D.calcLoadout(driverId, S.run.equip);
toGarage();
}
function ownedSet() {
var o = {};
for (var i = 0; i < S.run.owned.length; i++) { o[S.run.owned[i]] = true; }
for (var s in S.run.equip) { o[S.run.equip[s]] = true; }
return o;
}
function partCard(p, extra) {
var D = EQ.data;
var c = el("div", "card");
var kind = D.KINDS[p.kind];
var stats = [];
for (var i = 0; i < D.STAT_KEYS.length; i++) {
var k = D.STAT_KEYS[i];
var v = p.s[k] || 0;
if (v !== 0) { stats.push(D.STAT_NAMES[k].slice(0, 3) + (v > 0 ? "+" + v : v)); }
}
var cv = document.createElement("canvas");
cv.width = 48; cv.height = 36;
c.appendChild(cv);
var x = cv.getContext("2d");
x.fillStyle = "#0b0e1a"; x.fillRect(0, 0, 48, 36);
x.fillStyle = kind.color; x.fillRect(6, 6, 36, 20);
x.fillStyle = "#14101f"; x.fillRect(10, 10, 28, 6);
x.fillStyle = "#ffffff"; x.fillRect(10, 20, 28, 2);
c.appendChild(el("div", "nm", p.name));
c.appendChild(el("div", null, "<span class=r rar-" + p.rar + ">" + D.RNAME[p.rar] + "</span> " + D.SLOT_NAMES[p.slot] + " - <span style=color:" + kind.color + ">" + kind.name + "</span>"));
c.appendChild(el("div", null, (stats.length ? stats.join(" ") : "No stat change")));
c.appendChild(el("div", null, p.fx));
if (extra) { c.appendChild(el("div", null, extra)); }
c._part = p;
return c;
}
function toGarage() {
var D = EQ.data;
S.screen = "garage";
S.run.loadout = D.calcLoadout(S.run.driver, S.run.equip);
show("scr-garage");
EQ.audio.ensure();
$("gar-title").textContent = "GARAGE - CIRCUIT " + S.run.circuit;
var drv = D.DRIVER_BY_ID[S.run.driver];
$("gar-driver").textContent = drv.name + " - " + drv.blurb + " | Hearts " + heartsStr() + " | Coins " + S.run.coins + "c";
var gs = $("gar-stats");
gs.innerHTML = "";
for (var i = 0; i < D.STAT_KEYS.length; i++) {
var k = D.STAT_KEYS[i];
var v = S.run.loadout.stats[k];
var row = el("div", "statrow");
row.appendChild(el("span", "lbl", D.STAT_NAMES[k]));
var bar = el("div", "bar");
var fill = el("div", null);
fill.style.width = (v * 10) + "%";
bar.appendChild(fill);
row.appendChild(bar);
row.appendChild(el("span", null, "" + v));
gs.appendChild(row);
}
var sy = $("gar-syn");
sy.innerHTML = "";
if (S.run.loadout.synergies.length === 0) {
sy.textContent = "No synergy yet. Match 2+ of a family.";
} else {
for (var q = 0; q < S.run.loadout.synergies.length; q++) {
var s = S.run.loadout.synergies[q];
sy.appendChild(el("div", null, "<span style=color:" + D.KINDS[s.kind].color + ">" + s.text + "</span>"));
}
}
var acts = S.run.loadout.actives;
if (acts.length) {
var an = [];
for (var a = 0; a < acts.length; a++) { an.push(D.ACTIVE_INFO[acts[a].id].name + " x" + acts[a].charges); }
sy.appendChild(el("div", null, "SPACE powers: " + an.join(", ")));
}
var gp = $("gar-parts");
gp.innerHTML = "";
for (var sl = 0; sl < D.SLOTS.length; sl++) {
var slot = D.SLOTS[sl];
gp.appendChild(el("div", null, "<b>" + D.SLOT_NAMES[slot] + "</b>: " + D.PART_BY_ID[S.run.equip[slot]].name));
for (var o = 0; o < S.run.owned.length; o++) {
var p = D.PART_BY_ID[S.run.owned[o]];
if (!p || p.slot !== slot || p.id === S.run.equip[slot]) { continue; }
(function (pp) {
var card = partCard(pp, "Click to equip");
card.onclick = function () {
S.run.equip[pp.slot] = pp.id;
EQ.audio.sfx("click");
toGarage();
};
gp.appendChild(card);
})(p);
}
}
}
function heartsStr() {
var s = "";
for (var i = 0; i < 3; i++) { s += i < S.run.hearts ? "H" : "-"; }
return s;
}
function startRace() {
var D = EQ.data;
var TG = EQ.trackgen;
S.screen = "countdown";
show(null);
$("hud").classList.remove("hidden");
if (S.touchMode) { $("touch").classList.remove("hidden"); }
var track = TG.genTrack(S.run.seed, S.run.circuit);
var loadout = D.calcLoadout(S.run.driver, S.run.equip);
S.run.loadout = loadout;
var rng = EQ.util.mulberry32(EQ.util.hashStr(S.run.seed + ":ai" + S.run.circuit));
var aiStats = D.aiStatsFor(rng, S.run.circuit);
var karts = [];
karts.push({ name: loadout.driver.name, human: true, stats: loadout.stats, mods: loadout.mods, actives: loadout.actives });
for (var i = 0; i < 7; i++) {
var skill = Math.min(1, 0.86 + S.run.circuit * 0.015) + (rng() - 0.5) * 0.05;
var kit = { BOOST: 0, FIRE: 0, OIL: 0, ZAP: 0, SHIELD: 0, STAR: 0 };
if (S.run.circuit >= 2 && rng() < 0.7) { kit.OIL = 1; }
if (S.run.circuit >= 3 && rng() < 0.6) { kit.BOOST = 1; }
if (S.run.circuit >= 4 && rng() < 0.5) { kit.ZAP = 1; }
if (S.run.circuit >= 5 && rng() < 0.6) { kit.FIRE = 1; }
karts.push({ name: D.AI_NAMES[i], human: false, stats: aiStats[i], mods: D.baseMods(), kit: kit, skill: skill });
}
var st = EQ.sim.createRace({ track: track, laps: track.laps, karts: karts, aggression: Math.min(1, 0.35 + S.run.circuit * 0.07) });
var cols = ["#ffd23f", "#7bf1a8", "#c084fc", "#3a86ff", "#e0e0e0", "#ff5a3c", "#ffb703", "#9ad8ff"];
var bodies = ["b_crate", "b_paper", "b_ember", "b_cushion", "b_vault"];
var visuals = [];
for (var v = 0; v < 8; v++) {
if (v === 0) {
var eq = S.run.equip;
visuals.push({
color: loadout.driver.color, scarf: loadout.driver.scarf,
body: eq.BODY, tiresWide: (D.PART_BY_ID[eq.TIRES].s.we || 0) >= 2,
engineKind: D.PART_BY_ID[eq.ENGINE].kind,
spoiler: eq.SPOILER, spoilerKind: D.PART_BY_ID[eq.SPOILER].kind,
bodyKind: D.PART_BY_ID[eq.BODY].kind,
charmKind: D.PART_BY_ID[eq.CHARM].kind
});
} else {
var b2 = bodies[Math.floor(rng() * bodies.length)];
var kinds = D.KIND_LIST;
visuals.push({
color: cols[v % cols.length], scarf: cols[(v + 3) % cols.length],
body: b2, tiresWide: rng() < 0.3,
engineKind: kinds[Math.floor(rng() * kinds.length)],
spoiler: "s_plank", spoilerKind: kinds[Math.floor(rng() * kinds.length)],
bodyKind: D.PART_BY_ID[b2].kind, charmKind: null
});
}
}
S.race = { st: st, look: { visuals: visuals, palette: (S.run.circuit - 1) % 4 }, input: { steer: 0, drift: false, use: false }, over: false };
if (!S.view) { S.view = EQ.render.createView($("cv")); }
S.view.snap = true;
$("hud-circuit").textContent = "CIRCUIT " + S.run.circuit + " - " + track.name;
S.countT = 0;
S.acc = 0;
hudMsg(track.name, 2.2);
}
function hudMsg(txt, dur) {
$("hud-msg").textContent = txt;
S.msgTimer = dur || 1.5;
}
function updateHUD() {
var st = S.race.st;
var me = st.karts[0];
for (var i = 1; i < st.karts.length; i++) { if (st.karts[i].human) { me = st.karts[i]; } }
$("hud-pos").textContent = EQ.util.ordinal(me.place);
$("hud-lap").textContent = "LAP " + Math.min(me.lap, st.laps) + "/" + st.laps;
$("hud-time").textContent = EQ.util.fmtTime(st.time * 1000);
$("hud-hearts").textContent = heartsStr();
$("hud-coins").textContent = S.run.coins + "c";
var ready = null;
for (var a = 0; a < me.kitOrder 나; a++) {}
var order = ["STAR", "BOOST", "ZAP", "SHIELD", "FIRE", "OIL"];
for (var q = 0; q < order.length; q++) {
if (me.kit[order[q]] > 0) { ready = { id: order[q], n: me.kit[order[q]] }; break; }
}
if (ready) {
$("hud-active-icon").textContent = EQ.data.ACTIVE_INFO[ready.id].icon;
$("hud-active-n").textContent = "x" + ready.n;
} else {
$("hud-active-icon").textContent = "-";
$("hud-active-n").textContent = "";
}
$("hud-charge-fill").style.width = Math.round((me.charge || 0) * 100) + "%";
}
function loop(ts) {
requestAnimationFrame(loop);
if (!S.race || S.screen === "garage" || S.screen === "shop" || S.screen === "results" || S.screen === "over" || S.screen === "title" || S.screen === "drivers") { return; }
if (S.paused) { return; }
if (!S.lastT) { S.lastT = ts; }
var dt = Math.min(0.1, (ts - S.lastT) / 1000);
S.lastT = ts;
if (S.screen === "countdown") {
S.countT += dt;
var step = Math.floor(S.countT / 0.7);
var elc = $("count");
elc.classList.remove("hidden");
if (step < 3) {
var n = "" + (3 - step);
if (elc.textContent !== n) { elc.textContent = n; EQ.audio.sfx("count"); }
} else if (step < 4) {
if (elc.textContent !== "GO") { elc.textContent = "GO"; EQ.audio.sfx("go"); }
} else {
elc.classList.add("hidden");
S.screen = "race";
}
EQ.render.drawRace(S.view, S.race.st, S.race.look, ts / 1000, dt);
return;
}
if (S.screen !== "race") { return; }
pollInput();
S.acc += dt;
var steps = 0;
while (S.acc > 1 / 60 && steps < 5) {
var ev = EQ.sim.stepRace(S.race.st, 1 / 60, S.race.input);
handleEvents(ev);
S.acc -= 1 / 60;
steps++;
}
EQ.render.drawRace(S.view, S.race.st, S.race.look, ts / 1000, dt);
updateHUD();
EQ.audio.engine(true, Math.min(1, S.race.st.karts[0].speed / S.race.st.karts[0].params.top));
if (S.msgTimer > 0) {
S.msgTimer -= dt;
if (S.msgTimer <= 0) { $("hud-msg").textContent = ""; }
}
var me = null;
for (var i = 0; i < S.race.st.karts.length; i++) { if (S.race.st.karts[i].human) { me = S.race.st.karts[i]; } }
if (me && me.done && !S.race.over) {
S.race.over = true;
S.endT = 0;
}
if (S.race.over) {
S.endT += dt;
if (S.endT > 1.2) { finishRace(); }
}
}
function handleEvents(ev) {
for (var i = 0; i < ev.length; i++) {
var e = ev[i];
var isMe = S.race.st.karts[e.i] && S.race.st.karts[e.i].human;
if (e.t === "coin" && isMe) { EQ.audio.sfx("coin"); }
else if (e.t === "boost" && isMe) { EQ.audio.sfx("boost"); }
else if (e.t === "hit" && isMe) { EQ.audio.sfx("hit"); hudMsg("HIT", 0.7); }
else if (e.t === "zap" && isMe) { EQ.audio.sfx("zap"); }
else if (e.t === "star" && isMe) { EQ.audio.sfx("star"); hudMsg("STAR", 1); }
else if (e.t === "finish" && isMe) {
var me = S.race.st.karts[e.i];
if (e.place === 1) { hudMsg("WINNER", 2); }
else { hudMsg(EQ.util.ordinal(e.place), 2); }
}
else if (e.t === "pass" && isMe) { S.run.coins += 0; }
}
}
function pollInput() {
var k = S.keys;
var left = k.ArrowLeft || k.a || k.A || S.touch.left;
var right = k.ArrowRight || k.d || k.D || S.touch.right;
var steer = 0;
if (left) { steer -= 1; }
if (right) { steer += 1; }
S.race.input.steer = steer;
S.race.input.drift = !!(k.Shift || k.s || k.S || k.ArrowDown || S.touch.drift);
}
function finishRace() {
S.screen = "results";
EQ.audio.engine(false, 0);
var st = S.race.st;
var guard = 0;
while (!st.over && guard < 3000) {
EQ.sim.stepRace(st, 1 / 60, { steer: 0, drift: false, use: false });
guard++;
}
EQ.sim.computePlaces(st);
var me = null;
for (var i = 0; i < st.karts.length; i++) { if (st.karts[i].human) { me = st.karts[i]; } }
var place = me.place;
var D = EQ.data;
var table = [];
for (var q = 0; q < st.karts.length; q++) {
var kk = st.karts[q];
table.push({ name: kk.name, human: kk.human, place: kk.place, time: kk.done ? kk.finishTime : -1 });
}
table.sort(function (a, b) { return a.place - b.place; });
show("scr-results");
$("hud").classList.add("hidden");
$("touch").classList.add("hidden");
$("res-title").textContent = EQ.util.ordinal(place) + " PLACE";
var rt = $("res-table");
rt.innerHTML = "";
for (var r = 0; r < table.length; r++) {
var row = table[r];
var tstr = row.time >= 0 ? EQ.util.fmtTime(row.time * 1000) : "DNF";
rt.appendChild(el("div", null, EQ.util.ordinal(row.place) + " " + row.name + (row.human ? " (YOU)" : "") + " - " + tstr));
}
var baseCoins = [60, 45, 35, 25, 15, 12, 10, 8][Math.min(8, place) - 1] || 8;
var gain = Math.round((baseCoins + me.coins * 2 + me.passes * 1) * (1 + (S.run.loadout.mods.coinMultPct || 0)));
S.run.coins += gain;
if (place === 1) {
S.run.hearts = Math.min(3, S.run.hearts + 1);
S.run.wins++;
EQ.audio.sfx("win");
saveBest(S.run.circuit, true);
} else if (place >= 7) {
S.run.hearts -= 2;
EQ.audio.sfx("lose");
} else if (place >= 5) {
S.run.hearts -= 1;
EQ.audio.sfx("lose");
} else {
EQ.audio.sfx("win");
}
saveBest(S.run.circuit, false);
var rng = EQ.util.mulberry32(EQ.util.hashStr(S.run.seed + ":shop" + S.run.circuit));
var luck = S.run.loadout.mods.luck || 0;
var n = place === 1 ? 3 : (place <= 3 ? 2 : (place === 4 ? 1 : 0));
S.run.draft = n > 0 ? D.draftParts(rng, S.run.circuit, n, luck, ownedSet()) : [];
S.run.stock = [D.pickPartForShop ? null : null];
S.run.stock = [];
var ex = ownedSet();
for (var s2 = 0; s2 < S.run.draft.length; s2++) { ex[S.run.draft[s2].id] = true; }
for (var s3 = 0; s3 < 2; s3++) {
var all = D.PARTS;
var rar = D.rollRarity(rng, S.run.circuit, luck);
var pool = [];
for (var pi = 0; pi < all.length; pi++) { if (all[pi].rar === rar && !ex[all[pi].id]) { pool.push(all[pi]); } }
if (!pool.length) { for (var pj = 0; pj < all.length; pj++) { if (!ex[all[pj].id]) { pool.push(all[pj]); } } }
if (!pool.length) { break; }
var pick = pool[Math.floor(rng() * pool.length)];
ex[pick.id] = true;
S.run.stock.push(pick);
}
S.run.reroll = 10;
var rw = place <= 4 ? "Safe. Hearts hold at " + Math.max(0, S.run.hearts) + "." : "Rough one. Hearts: " + Math.max(0, S.run.hearts) + ".";
$("res-reward").textContent = "+" + gain + "c. " + rw;
}
function toShop() {
if (S.run.hearts <= 0) {
gameOver();
return;
}
S.screen = "shop";
show("scr-shop");
renderShop();
}
function renderShop() {
var D = EQ.data;
$("shop-coins").textContent = "Coins: " + S.run.coins + "c | Hearts: " + heartsStr() + " | Circuit " + S.run.circuit + " cleared";
var dd = $("shop-draft");
dd.innerHTML = "";
if (S.run.draft.length === 0) {
dd.textContent = "No draft this time. Place top 4 next race.";
} else {
for (var i = 0; i < S.run.draft.length; i++) {
(function (p) {
var card = partCard(p, "Click to take (free)");
card.onclick = function () {
claimPart(p);
S.run.draft = [];
EQ.audio.sfx("pickup");
renderShop();
};
dd.appendChild(card);
})(S.run.draft[i]);
}
}
var ss = $("shop-stock");
ss.innerHTML = "";
for (var s = 0; s < S.run.stock.length; s++) {
(function (p) {
var price = D.priceOf(p);
var card = partCard(p, price + "c - click to buy");
if (S.run.coins < price) { card.style.opacity = 0.5; }
card.onclick = function () {
if (S.run.coins < price) { return; }
S.run.coins -= price;
claimPart(p);
var idx = S.run.stock.indexOf(p);
if (idx >= 0) { S.run.stock.splice(idx, 1); }
EQ.audio.sfx("pickup");
renderShop();
};
ss.appendChild(card);
})(S.run.stock[s]);
}
$("btn-reroll").textContent = "REROLL " + S.run.reroll + "c";
var canNext = S.run.draft.length === 0;
$("btn-next").disabled = !canNext;
$("btn-next").textContent = canNext ? "NEXT CIRCUIT" : "TAKE YOUR DRAFT FIRST";
}
function claimPart(p) {
S.run.owned.push(p.id);
S.run.equip[p.slot] = p.id;
S.run.loadout = EQ.data.calcLoadout(S.run.driver, S.run.equip);
}
function gameOver() {
S.screen = "over";
show("scr-over");
$("hud").classList.add("hidden");
$("over-title").textContent = "WRECKED AT CIRCUIT " + S.run.circuit;
$("over-stats").textContent = "Wins: " + S.run.wins + " | Circuits cleared: " + (S.run.circuit - 1);
}
function bind() {
window.addEventListener("keydown", function (e) {
if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].indexOf(e.key) >= 0) { e.preventDefault(); }
S.keys[e.key] = true;
if (e.key === " ") { if (S.race) { S.race.input.use = true; } }
if (e.key === "m" || e.key === "M") { toggleMute(); }
if (e.key === "p" || e.key === "P" || e.key === "Escape") { togglePause(); }
if (e.key === "Enter" && S.screen === "title") { $("btn-start").click(); }
});
window.addEventListener("keyup", function (e) { S.keys[e.key] = false; });
S.touchMode = ("ontouchstart" in window);
function hold(id, prop) {
var b = $(id);
var on = function (e) { e.preventDefault(); S.touch[prop] = true; };
var off = function (e) { e.preventDefault(); S.touch[prop] = false; };
b.addEventListener("touchstart", on, { passive: false });
b.addEventListener("touchend", off, { passive: false });
b.addEventListener("mousedown", on);
b.addEventListener("mouseup", off);
b.addEventListener("mouseleave", off);
}
hold("tch-left", "left");
hold("tch-right", "right");
hold("tch-drift", "drift");
$("tch-use").addEventListener("touchstart", function (e) { e.preventDefault(); if (S.race) { S.race.input.use = true; } }, { passive: false });
$("tch-use").addEventListener("mousedown", function (e) { e.preventDefault(); if (S.race) { S.race.input.use = true; } });
$("btn-start").onclick = function () { EQ.audio.ensure(); EQ.audio.sfx("click"); S.screen = "drivers"; show("scr-drivers"); renderDrivers(); };
$("btn-help").onclick = function () { EQ.audio.sfx("click"); S.helpFrom = S.screen; S.screen = "help"; show("scr-help"); };
$("btn-close-help").onclick = function () { EQ.audio.sfx("back"); S.screen = S.helpFrom === "help" ? "title" : (S.helpFrom || "title"); show(S.screen === "title" ? "scr-title" : null); if (S.screen === "title") { show("scr-title"); } };
$("btn-drv-back").onclick = function () { EQ.audio.sfx("back"); S.screen = "title"; show("scr-title"); };
$("btn-back-drivers").onclick = function () { EQ.audio.sfx("back"); S.screen = "drivers"; show("scr-drivers"); renderDrivers(); };
$("btn-race").onclick = function () { EQ.audio.sfx("click"); startRace(); };
$("btn-to-shop").onclick = function () { EQ.audio.sfx("click"); toShop(); };
$("btn-reroll").onclick = function () {
if (S.run.coins < S.run.reroll) { return; }
S.run.coins -= S.run.reroll;
S.run.reroll += 5;
var D = EQ.data;
var rng = EQ.util.mulberry32(EQ.util.hashStr(S.run.seed + ":reroll" + S.run.circuit + S.run.reroll));
var luck = S.run.loadout.mods.luck || 0;
var ex = ownedSet();
for (var i = 0; i < S.run.draft.length; i++) { ex[S.run.draft[i].id] = true; }
S.run.stock = D.draftParts(rng, S.run.circuit, 2, luck, Object.keys(ex));
EQ.audio.sfx("click");
renderShop();
};
$("btn-heal").onclick = function () {
if (S.run.hearts >= 3 || S.run.coins < 80) { return; }
S.run.coins -= 80;
S.run.hearts++;
EQ.audio.sfx("pickup");
renderShop();
};
$("btn-next").onclick = function () {
if (S.run.draft.length) { return; }
EQ.audio.sfx("click");
S.run.circuit++;
toGarage();
};
$("btn-again").onclick = function () { EQ.audio.sfx("click"); S.screen = "drivers"; show("scr-drivers"); renderDrivers(); };
$("btn-mute").onclick = function () { toggleMute(); };
$("btn-pause").onclick = function () { togglePause(); };
$("btn-resume").onclick = function () { togglePause(); };
$("btn-quit").onclick = function () {
S.paused = false;
S.race = null;
S.screen = "title";
EQ.audio.engine(false, 0);
$("hud").classList.add("hidden");
$("touch").classList.add("hidden");
show("scr-title");
refreshBest();
};
}
function toggleMute() {
EQ.audio.ensure();
var m = EQ.audio.toggleMute();
$("btn-mute").textContent = m ? "MUTE" : "SND";
}
function togglePause() {
if (S.screen !== "race") { return; }
S.paused = !S.paused;
if (S.paused) { show("paused"); EQ.audio.engine(false, 0); }
else { show(null); }
}
function renderDrivers() {
var D = EQ.data;
var list = $("drv-list");
list.innerHTML = "";
for (var i = 0; i < D.DRIVERS.length; i++) {
(function (drv) {
var c = el("div", "card");
var cv = document.createElement("canvas");
cv.width = 48; cv.height = 48;
c.appendChild(cv);
EQ.sprites.drawPortrait(cv, drv);
c.appendChild(el("div", "nm", drv.name));
c.appendChild(el("div", null, "SPD " + drv.base.sp + " ACC " + drv.base.ac + " HND " + drv.base.ha + " TRB " + drv.base.tu + " WGT " + drv.base.we));
c.appendChild(el("div", null, drv.blurb));
c.onclick = function () {
EQ.audio.ensure();
EQ.audio.sfx("click");
startRun(drv.id);
};
list.appendChild(c);
})(D.DRIVERS[i]);
}
}
function refreshBest() {
var b = best();
$("best-line").textContent = b.circuit > 0 ? "Best: circuit " + b.circuit + " | Wins: " + b.wins : "No runs yet. Make history.";
}
function boot() {
S = newRunState();
bind();
refreshBest();
show("scr-title");
requestAnimationFrame(loop);
}
if (typeof window !== "undefined") {
window.addEventListener("DOMContentLoaded", boot);
}
return { boot: boot };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.game; }

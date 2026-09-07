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
screen: "title", run: null, race: null, view: null,
keys: {}, paused: false, msgTimer: 0, lastT: 0, acc: 0,
countT: 0, endT: 0,
touch: { left: false, right: false, drift: false }
};
}
function best() {
try {
var b = JSON.parse(localStorage.getItem("equalatro_best") || "null");
if (b) { return b; }
} catch (e) {}
return { seg: 0, crowns: 0 };
}
function saveBest(seg, crown) {
var b = best();
b.seg = Math.max(b.seg, seg);
if (crown) { b.crowns++; }
try { localStorage.setItem("equalatro_best", JSON.stringify(b)); } catch (e) {}
}
function show(id) {
var screens = ["scr-title", "scr-drivers", "scr-garage", "scr-results", "scr-shop", "scr-over", "scr-help", "scr-pit", "paused"];
for (var i = 0; i < screens.length; i++) { $(screens[i]).classList.add("hidden"); }
if (id) { $(id).classList.remove("hidden"); }
}
function eqId(slot) {
var v = S.run.equip[slot];
return typeof v === "string" ? v : v.id;
}
function ownedSet() {
var o = {};
for (var i = 0; i < S.run.owned.length; i++) { o[S.run.owned[i].id] = true; }
o[eqId("ENGINE")] = true; o[eqId("TIRES")] = true; o[eqId("BODY")] = true; o[eqId("SPOILER")] = true; o[eqId("CHARM")] = true;
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
var ed = p.ed && p.ed !== "STD" ? " <span class=edtag style=color:" + D.EDITIONS[p.ed].color + ">" + D.EDITIONS[p.ed].name + "</span>" : "";
c.appendChild(el("div", null, "<span class=r rar-" + p.rar + ">" + D.RNAME[p.rar] + "</span> " + D.SLOT_NAMES[p.slot] + " - <span style=color:" + kind.color + ">" + kind.name + "</span>" + ed));
c.appendChild(el("div", null, (stats.length ? stats.join(" ") : "No stat change")));
c.appendChild(el("div", null, p.fx));
c.appendChild(el("div", null, "Price: " + D.priceOf(p) + "c"));
if (extra) { c.appendChild(el("div", null, extra)); }
c._part = p;
return c;
}
function claimPart(p) {
var found = false;
for (var i = 0; i < S.run.owned.length; i++) { if (S.run.owned[i].id === p.id && (S.run.owned[i].ed || "STD") === (p.ed || "STD")) { found = true; } }
if (!found) { S.run.owned.push(p); }
S.run.equip[p.slot] = p;
S.run.loadout = EQ.data.calcLoadout(S.run.driver, S.run.equip);
}
function toGarage() {
var D = EQ.data;
S.screen = "garage";
S.run.loadout = D.calcLoadout(S.run.driver, S.run.equip);
show("scr-garage");
EQ.audio.ensure();
$("gar-title").textContent = "PADDOCK - STAR TOUR";
$("btn-race").textContent = "START TOUR - 25 KARTS";
var drv = D.DRIVER_BY_ID[S.run.driver] || EQ.extra.allDrivers(D.DRIVERS).filter(function (d) { return d.id === S.run.driver; })[0];
$("gar-driver").textContent = drv.name + " - " + drv.blurb + " | " + S.run.coins + "c";
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
if (S.run.loadout.synergies.length === 0) { sy.textContent = "No synergy yet. Match 2+ of a family."; }
else {
for (var q = 0; q < S.run.loadout.synergies.length; q++) {
var s = S.run.loadout.synergies[q];
sy.appendChild(el("div", null, "<span style=color:" + D.KINDS[s.kind].color + ">" + s.text + "</span>"));
}
}
var acts = S.run.loadout.actives;
if (acts.length) {
var an = [];
for (var a = 0; a < acts.length; a++) { an.push(D.ACTIVE_INFO[acts[a].id].name + " x" + acts[a].charges); }
sy.appendChild(el("div", null, "Charm (C): " + an.join(", ")));
}
sy.appendChild(el("div", null, "SPACE fires weapon. E pits. Pits are live, the race never waits."));
var gp = $("gar-parts");
gp.innerHTML = "";
for (var sl = 0; sl < D.SLOTS.length; sl++) {
var slot = D.SLOTS[sl];
var eqP = S.run.equip[slot];
var eqName = typeof eqP === "string" ? D.PART_BY_ID[eqP].name : eqP.name;
gp.appendChild(el("div", null, "<b>" + D.SLOT_NAMES[slot] + "</b>: " + eqName));
for (var o = 0; o < S.run.owned.length; o++) {
var p = S.run.owned[o];
if (p.slot !== slot || p.id === eqId(slot)) { continue; }
(function (pp) {
var card = partCard(pp, "Click to equip");
card.onclick = function () {
S.run.equip[pp.slot] = pp;
EQ.audio.sfx("click");
toGarage();
};
gp.appendChild(card);
})(p);
}
}
}
function beginRace(st, look, label) {
S.screen = "countdown";
show(null);
if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }
$("hud").classList.remove("hidden");
if (S.touchMode) { $("touch").classList.remove("hidden"); }
S.race = { st: st, look: look, input: { steer: 0, drift: false, use: false, fire: false }, over: false };
if (!S.view) { S.view = EQ.render.createView($("cv")); }
S.view.snap = true;
$("hud-circuit").textContent = label;
S.countT = 0;
S.acc = 0;
hudMsg(label, 2.2);
}
function hudMsg(txt, dur) {
$("hud-msg").textContent = txt;
S.msgTimer = dur || 1.5;
}
function meKart() {
var st = S.race.st;
for (var i = 0; i < st.karts.length; i++) { if (st.karts[i].human) { return st.karts[i]; } }
return st.karts[0];
}
function updateHUD() {
var st = S.race.st;
var me = meKart();
$("hud-pos").textContent = EQ.util.ordinal(me.place) + "/" + st.karts.length;
$("hud-time").textContent = EQ.util.fmtTime(st.time * 1000);
$("hud-left").textContent = S.run ? (EQ.tour ? EQ.tour.aliveCount() : "") + " LEFT" : "";
$("hud-coins").textContent = (S.run ? S.run.coins : 0) + "c";
$("hud-hp-fill").style.width = Math.max(0, Math.round(me.hp / me.maxhp * 100)) + "%";
$("hud-fuel-fill").style.width = Math.max(0, Math.round(me.fuel)) + "%";
var order = ["STAR", "BOOST", "ZAP", "SHIELD", "FIRE", "OIL"];
var ready = null;
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
$("hud-weap-icon").textContent = me.weapon ? (EQ.extra.WEAPONS[me.weapon] ? EQ.extra.WEAPONS[me.weapon].icon : "?") : "-";
$("hud-charge-fill").style.width = Math.round((me.charge || 0) * 100) + "%";
}
function loop(ts) {
requestAnimationFrame(loop);
if (!S) { return; }
if (S.screen === "garage" || S.screen === "results" || S.screen === "over" || S.screen === "title" || S.screen === "drivers" || S.screen === "shop" || S.screen === "help") { return; }
if (!S.race && S.screen !== "pit") { return; }
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
if (S.screen === "race" || S.screen === "pit") {
if (S.screen === "race") { pollInput(); }
else { S.race.input.steer = 0; S.race.input.drift = false; }
S.acc += dt;
var steps = 0;
while (S.acc > 1 / 60 && steps < 5) {
var ev = EQ.sim.stepRace(S.race.st, 1 / 60, S.race.input);
handleEvents(ev);
if (EQ.tour) { EQ.tour.onEvents(ev); }
S.acc -= 1 / 60;
steps++;
}
EQ.render.drawRace(S.view, S.race.st, S.race.look, ts / 1000, dt);
updateHUD();
var me = meKart();
EQ.audio.engine(true, Math.min(1, me.speed / me.params.top));
if (S.msgTimer > 0) {
S.msgTimer -= dt;
if (S.msgTimer <= 0) { $("hud-msg").textContent = ""; }
}
if (EQ.tour) { EQ.tour.afterStep(dt); }
if (S.screen === "pit" && EQ.tour) { EQ.tour.pitTick(dt); }
}
}
function handleEvents(ev) {
for (var i = 0; i < ev.length; i++) {
var e = ev[i];
var k = S.race.st.karts[e.i];
var isMe = k && k.human;
if (e.t === "coin" && isMe) { EQ.audio.sfx("coin"); S.run.coins += 1; }
else if (e.t === "boost" && isMe) { EQ.audio.sfx("boost"); }
else if (e.t === "hit" && isMe) { EQ.audio.sfx("hit"); }
else if (e.t === "zap" && isMe) { EQ.audio.sfx("zap"); }
else if (e.t === "star" && isMe) { EQ.audio.sfx("star"); hudMsg("STAR", 1); }
else if (e.t === "weapon" && isMe) { EQ.audio.sfx("pickup"); hudMsg("WEAPON: " + e.w, 1); }
else if (e.t === "wfire" && isMe) { EQ.audio.sfx("zap"); }
else if (e.t === "wreck" && isMe) { EQ.audio.sfx("hit"); hudMsg("WRECKED - REGEN", 1.5); }
else if (e.t === "unwreck" && isMe) { EQ.audio.sfx("go"); hudMsg("BACK UP", 1); }
else if (e.t === "patch" && isMe) { EQ.audio.sfx("pickup"); }
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
function bind() {
window.addEventListener("keydown", function (e) {
if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].indexOf(e.key) >= 0) { e.preventDefault(); }
S.keys[e.key] = true;
if (!S.race) { return; }
if (e.key === " ") { S.race.input.fire = true; }
if (e.key === "c" || e.key === "C") { S.race.input.use = true; }
if (e.key === "e" || e.key === "E") { if (EQ.tour) { EQ.tour.togglePit(); } }
if (e.key === "m" || e.key === "M") { toggleMute(); }
if (e.key === "p" || e.key === "P" || e.key === "Escape") { togglePause(); }
if (e.key === "Enter" && S.screen === "title") { $("btn-start").click(); }
});
window.addEventListener("keyup", function (e) { S.keys[e.key] = false; });
S.touchMode = ("ontouchstart" in window);
function hold(id, prop) {
var b = $(id);
if (!b) { return; }
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
function tap(id, fn) {
var b = $(id);
if (!b) { return; }
b.addEventListener("touchstart", function (e) { e.preventDefault(); fn(); }, { passive: false });
b.addEventListener("mousedown", function (e) { e.preventDefault(); fn(); });
}
tap("tch-use", function () { if (S.race) { S.race.input.fire = true; } });
tap("tch-charm", function () { if (S.race) { S.race.input.use = true; } });
tap("tch-pit", function () { if (EQ.tour) { EQ.tour.togglePit(); } });
$("btn-start").onclick = function () { EQ.audio.ensure(); EQ.audio.sfx("click"); S.screen = "drivers"; show("scr-drivers"); renderDrivers(); };
$("btn-help").onclick = function () { EQ.audio.sfx("click"); S.screen = "help"; show("scr-help"); };
$("btn-close-help").onclick = function () { EQ.audio.sfx("back"); S.screen = "title"; show("scr-title"); };
$("btn-drv-back").onclick = function () { EQ.audio.sfx("back"); S.screen = "title"; show("scr-title"); };
$("btn-back-drivers").onclick = function () { EQ.audio.sfx("back"); S.screen = "drivers"; show("scr-drivers"); renderDrivers(); };
$("btn-race").onclick = function () { EQ.audio.sfx("click"); if (EQ.tour) { EQ.tour.startTour(); } };
$("btn-to-shop").onclick = function () { EQ.audio.sfx("click"); if (EQ.tour) { EQ.tour.afterResults(); } };
$("btn-pit-fuel").onclick = function () { if (EQ.tour) { EQ.tour.pitService("fuel"); } };
$("btn-pit-repair").onclick = function () { if (EQ.tour) { EQ.tour.pitService("repair"); } };
$("btn-pit-reroll").onclick = function () { if (EQ.tour) { EQ.tour.pitReroll(); } };
$("btn-leave").onclick = function () { if (EQ.tour) { EQ.tour.togglePit(); } };
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
if (S.screen !== "race" && S.screen !== "pit") { return; }
S.paused = !S.paused;
if (S.paused) { show("paused"); EQ.audio.engine(false, 0); }
else { show(null); if (S.screen === "pit") { show("scr-pit"); } }
}
function renderDrivers() {
var D = EQ.data;
var list = $("drv-list");
list.innerHTML = "";
var drivers = EQ.extra ? EQ.extra.allDrivers(D.DRIVERS) : D.DRIVERS.slice();
for (var i = 0; i < drivers.length; i++) {
(function (drv) {
var c = el("div", "card" + (drv.locked ? " locked" : ""));
var cv = document.createElement("canvas");
cv.width = 48; cv.height = 48;
c.appendChild(cv);
EQ.sprites.drawPortrait(cv, drv);
c.appendChild(el("div", "nm", drv.name + (drv.locked ? " (LOCKED - " + drv.need + " crowns)" : "")));
c.appendChild(el("div", null, "SPD " + drv.base.sp + " ACC " + drv.base.ac + " HND " + drv.base.ha + " TRB " + drv.base.tu + " WGT " + drv.base.we));
c.appendChild(el("div", null, drv.blurb));
if (!drv.locked) {
c.onclick = function () {
EQ.audio.ensure();
EQ.audio.sfx("click");
if (EQ.tour) { EQ.tour.newTour(drv.id); }
};
}
list.appendChild(c);
})(drivers[i]);
}
}
function refreshBest() {
var b = best();
var crowns = EQ.extra ? EQ.extra.totalCrowns() : 0;
$("best-line").textContent = b.seg > 0 ? "Best: segment " + b.seg + " | Tour crowns banked: " + crowns : "No tours yet. Crowns banked: " + crowns;
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
function getS() { return S; }
return { boot: boot, getS: getS, $, el: el, show: show, hudMsg: hudMsg, partCard: partCard, claimPart: claimPart, toGarage: toGarage, beginRace: beginRace, meKart: meKart, eqId: eqId, ownedSet: ownedSet, best: best, saveBest: saveBest, refreshBest: refreshBest };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.game; }

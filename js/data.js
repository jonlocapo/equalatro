"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.data = (function () {
var SLOTS = ["ENGINE", "TIRES", "BODY", "SPOILER", "CHARM"];
var SLOT_NAMES = { ENGINE: "Engine", TIRES: "Tires", BODY: "Body", SPOILER: "Spoiler", CHARM: "Charm" };
var STAT_KEYS = ["sp", "ac", "ha", "tu", "we"];
var STAT_NAMES = { sp: "Speed", ac: "Accel", ha: "Handling", tu: "Turbo", we: "Weight" };
var KINDS = {
PYRO: { name: "Pyro", color: "#ff5a3c" },
VOLT: { name: "Volt", color: "#ffd23f" },
GRIP: { name: "Grip", color: "#7bf1a8" },
AERO: { name: "Aero", color: "#3a86ff" },
BULK: { name: "Bulk", color: "#c084fc" },
LUCKY: { name: "Lucky", color: "#ffb703" }
};
var KIND_LIST = ["PYRO", "VOLT", "GRIP", "AERO", "BULK", "LUCKY"];
var RARITIES = ["C", "U", "R", "E", "L"];
var RNAME = { C: "Common", U: "Uncommon", R: "Rare", E: "Epic", L: "Legendary" };
var RPRICE = { C: 40, U: 70, R: 110, E: 160, L: 230 };
var ACTIVE_INFO = {
BOOST: { name: "Boost", icon: "B" },
FIRE: { name: "Fire Drop", icon: "F" },
OIL: { name: "Oil Slick", icon: "O" },
ZAP: { name: "Zap", icon: "Z" },
SHIELD: { name: "Shield", icon: "S" },
STAR: { name: "Star", icon: "*" }
};
var SYNERGY = {
PYRO: { l2: { stats: {}, mods: { burnSlowPct: 0.25, burnDur: 0.5 }, text: "Pyro 2: burns sting +25% and linger" }, l3: { stats: {}, mods: { burnSlowPct: 0.6, burnDur: 1.2 }, text: "Pyro 3+: burns sting +60%, trails burn long" } },
VOLT: { l2: { stats: {}, mods: { chargeRatePct: 0.2 }, text: "Volt 2: boost charges 20% faster" }, l3: { stats: {}, mods: { chargeRatePct: 0.45, boostPowerPct: 0.1 }, text: "Volt 3+: charges 45% faster, boosts hit harder" } },
GRIP: { l2: { stats: { ha: 1, tu: 1 }, mods: {}, text: "Grip 2: +1 handling, +1 turbo" }, l3: { stats: { ha: 2, tu: 2 }, mods: {}, text: "Grip 3+: +2 handling, +2 turbo" } },
AERO: { l2: { stats: { sp: 1, ac: 1 }, mods: {}, text: "Aero 2: +1 speed, +1 accel" }, l3: { stats: { sp: 2, ac: 1 }, mods: { boostPowerPct: 0.1 }, text: "Aero 3+: +2 speed, +1 accel, stronger boost" } },
BULK: { l2: { stats: {}, mods: { bumpPct: 0.3, offroadCutPct: 0.2 }, text: "Bulk 2: heavy shoves, eats rough ground" }, l3: { stats: { we: 1 }, mods: { bumpPct: 0.6, offroadCutPct: 0.35 }, text: "Bulk 3+: +1 weight, huge shoves" } },
LUCKY: { l2: { stats: {}, mods: { coinMultPct: 0.25, luck: 0.1 }, text: "Lucky 2: +25% coins, better shop odds" }, l3: { stats: {}, mods: { coinMultPct: 0.6, luck: 0.25 }, text: "Lucky 3+: +60% coins, much better shop odds" } }
};
var DRIVERS = [
{ id: "pip", name: "Pip", color: "#ffd23f", scarf: "#e63946", base: { sp: 3, ac: 3, ha: 3, tu: 3, we: 3 }, passive: { coinMultPct: 0.1 }, blurb: "Steady all rounder. Earns 10% extra coins." },
{ id: "moss", name: "Moss", color: "#7bf1a8", scarf: "#2d6a4f", base: { sp: 2, ac: 3, ha: 5, tu: 4, we: 2 }, passive: { chargeRatePct: 0.15 }, blurb: "Corner artist. Charges boost 15% faster." },
{ id: "brick", name: "Brick", color: "#c084fc", scarf: "#5a189a", base: { sp: 4, ac: 2, ha: 2, tu: 2, we: 5 }, passive: { bumpPct: 0.3, offroadCutPct: 0.2 }, blurb: "Flying wall. Shoves rivals aside." },
{ id: "volt", name: "Volt", color: "#3a86ff", scarf: "#ffd23f", base: { sp: 3, ac: 5, ha: 2, tu: 3, we: 2 }, passive: { boostPowerPct: 0.15 }, blurb: "Launch specialist. Boosts hit 15% harder." },
{ id: "wisp", name: "Wisp", color: "#e0e0e0", scarf: "#ff5a3c", base: { sp: 3, ac: 4, ha: 4, tu: 2, we: 1 }, passive: { shield: 1 }, blurb: "Slippery ghost. Blocks one hit per race." }
];
var PARTS = [
{ id: "e_putt", name: "Putt Putt", slot: "ENGINE", rar: "C", kind: "GRIP", s: { sp: 0, ac: 2, ha: 1, tu: 0, we: -1 }, m: { chargeRatePct: 0.1 }, fx: "Charges boost 10% faster." },
{ id: "e_cinder", name: "Cinder V4", slot: "ENGINE", rar: "C", kind: "PYRO", s: { sp: 1, ac: 1, ha: 0, tu: 0, we: 0 }, m: { burnDur: 0.5 }, fx: "Flame trails last longer." },
{ id: "e_coil", name: "Spark Coil", slot: "ENGINE", rar: "U", kind: "VOLT", s: { sp: 0, ac: 2, ha: 0, tu: 1, we: 0 }, m: { chargeRatePct: 0.2 }, fx: "Charges boost 20% faster." },
{ id: "e_snail", name: "Turbo Snail", slot: "ENGINE", rar: "R", kind: "VOLT", s: { sp: 2, ac: 1, ha: 0, tu: 1, we: -1 }, m: { boostPowerPct: 0.15, chargeRatePct: 0.15 }, fx: "Boosts hit harder and charge faster." },
{ id: "e_mammoth", name: "Mammoth Diesel", slot: "ENGINE", rar: "R", kind: "BULK", s: { sp: 2, ac: -1, ha: -1, tu: 0, we: 3 }, m: { bumpPct: 0.25, offroadCutPct: 0.25 }, fx: "Slow to wake, unstoppable awake." },
{ id: "e_falcon", name: "Falcon Heart", slot: "ENGINE", rar: "E", kind: "AERO", s: { sp: 3, ac: 1, ha: 1, tu: 0, we: -1 }, m: { boostPowerPct: 0.2 }, fx: "Screams at top speed." },
{ id: "e_solar", name: "Solar Crown", slot: "ENGINE", rar: "L", kind: "VOLT", s: { sp: 2, ac: 2, ha: 1, tu: 2, we: 0 }, m: { boostPowerPct: 0.25, chargeRatePct: 0.3 }, fx: "The dream engine. Hums in gold." },
{ id: "t_socks", name: "Grip Socks", slot: "TIRES", rar: "C", kind: "GRIP", s: { sp: 0, ac: 1, ha: 2, tu: 1, we: -1 }, m: {}, fx: "Plain, grippy, honest rubber." },
{ id: "t_donuts", name: "Drift Donuts", slot: "TIRES", rar: "C", kind: "LUCKY", s: { sp: -1, ac: 1, ha: 1, tu: 2, we: 0 }, m: { coinMultPct: 0.1 }, fx: "Showboating pays a little extra." },
{ id: "t_cinder", name: "Cinder Treads", slot: "TIRES", rar: "U", kind: "PYRO", s: { sp: 1, ac: 0, ha: 1, tu: 0, we: 1 }, m: { burnSlowPct: 0.2 }, fx: "Burns sting 20% more." },
{ id: "t_hydro", name: "Hydro Planers", slot: "TIRES", rar: "U", kind: "AERO", s: { sp: 0, ac: 0, ha: 2, tu: 1, we: 0 }, m: { offroadCutPct: 0.3 }, fx: "Skims over rough ground." },
{ id: "t_magnet", name: "Mag Boots", slot: "TIRES", rar: "R", kind: "LUCKY", s: { sp: 0, ac: 1, ha: 1, tu: 0, we: 1 }, m: { magnet: 1, coinMultPct: 0.15 }, fx: "Pulls in nearby coins." },
{ id: "t_titan", name: "Titan Rolls", slot: "TIRES", rar: "E", kind: "BULK", s: { sp: 1, ac: -1, ha: 0, tu: -1, we: 4 }, m: { bumpPct: 0.35, offroadCutPct: 0.3 }, fx: "Steamrolls everything, including lap times." },
{ id: "t_phantom", name: "Phantom Wheels", slot: "TIRES", rar: "L", kind: "GRIP", s: { sp: 1, ac: 1, ha: 3, tu: 2, we: -1 }, m: { chargeRatePct: 0.2 }, fx: "Barely touches the road." },
{ id: "b_crate", name: "Crate Frame", slot: "BODY", rar: "C", kind: "BULK", s: { sp: 0, ac: 0, ha: 0, tu: -1, we: 2 }, m: { bumpPct: 0.2 }, fx: "A box with wheels. Sturdy box." },
{ id: "b_paper", name: "Paper Dart", slot: "BODY", rar: "C", kind: "AERO", s: { sp: 1, ac: 1, ha: 0, tu: 0, we: -1 }, m: {}, fx: "Light and eager." },
{ id: "b_ember", name: "Ember Hull", slot: "BODY", rar: "U", kind: "PYRO", s: { sp: 1, ac: 0, ha: 0, tu: 1, we: 1 }, m: { burnDur: 0.5, burnSlowPct: 0.15 }, fx: "Warm to the touch. Hot to chase." },
{ id: "b_cushion", name: "Cushion", slot: "BODY", rar: "U", kind: "GRIP", s: { sp: -1, ac: 1, ha: 2, tu: 0, we: 1 }, m: {}, fx: "Bounces back from bumps." },
{ id: "b_vault", name: "Volt Vault", slot: "BODY", rar: "R", kind: "VOLT", s: { sp: 0, ac: 2, ha: -1, tu: 1, we: 1 }, m: { chargeRatePct: 0.2 }, fx: "Hums with stored lightning." },
{ id: "b_aegis", name: "Aegis Shell", slot: "BODY", rar: "E", kind: "AERO", s: { sp: 0, ac: 0, ha: 1, tu: 0, we: 2 }, m: { shield: 1 }, fx: "Blocks one hit per race." },
{ id: "b_gilded", name: "Gilded Tub", slot: "BODY", rar: "L", kind: "LUCKY", s: { sp: 2, ac: 1, ha: 1, tu: 1, we: 1 }, m: { coinMultPct: 0.3, luck: 0.15 }, fx: "Pays out and finds better stock." },
{ id: "s_plank", name: "Shelf Plank", slot: "SPOILER", rar: "C", kind: "AERO", s: { sp: 1, ac: 0, ha: 1, tu: 0, we: 0 }, m: {}, fx: "Downforce, more or less." },
{ id: "s_flag", name: "Lucky Flag", slot: "SPOILER", rar: "C", kind: "LUCKY", s: { sp: 0, ac: 0, ha: 1, tu: 1, we: 0 }, m: { coinMultPct: 0.15 }, fx: "Flutters toward money." },
{ id: "s_fin", name: "Shark Fin", slot: "SPOILER", rar: "U", kind: "GRIP", s: { sp: 0, ac: 1, ha: 2, tu: 0, we: 0 }, m: {}, fx: "Cuts corners like water." },
{ id: "s_torch", name: "Torch Rack", slot: "SPOILER", rar: "U", kind: "PYRO", s: { sp: 0, ac: 0, ha: 0, tu: 1, we: 1 }, m: { burnDur: 0.5 }, fx: "Drips a little extra fire." },
{ id: "s_antenna", name: "Storm Antenna", slot: "SPOILER", rar: "R", kind: "VOLT", s: { sp: -1, ac: 2, ha: 0, tu: 2, we: -1 }, m: { boostPowerPct: 0.15 }, fx: "Calls down speed." },
{ id: "s_ram", name: "Ram Bar", slot: "SPOILER", rar: "E", kind: "BULK", s: { sp: 1, ac: -1, ha: 0, tu: -1, we: 2 }, m: { bumpPct: 0.4 }, fx: "The argument ender." },
{ id: "s_halo", name: "Sky Halo", slot: "SPOILER", rar: "L", kind: "AERO", s: { sp: 2, ac: 1, ha: 2, tu: 1, we: -1 }, m: { boostPowerPct: 0.15, offroadCutPct: 0.2 }, fx: "Barely legal. Barely touching." },
{ id: "c_shroom", name: "Lucky Shroom", slot: "CHARM", rar: "C", kind: "LUCKY", s: { sp: 0, ac: 1, ha: 0, tu: 1, we: 0 }, m: {}, active: "BOOST", charges: 1, fx: "SPACE: small boost on demand." },
{ id: "c_oil", name: "Oil Can", slot: "CHARM", rar: "C", kind: "BULK", s: { sp: 0, ac: 0, ha: 0, tu: 0, we: 1 }, m: {}, active: "OIL", charges: 2, fx: "SPACE: drops a slick behind you." },
{ id: "c_ember", name: "Ember Charm", slot: "CHARM", rar: "U", kind: "PYRO", s: { sp: 0, ac: 0, ha: 0, tu: 1, we: 0 }, m: { burnSlowPct: 0.25 }, active: "FIRE", charges: 2, fx: "SPACE: drops fire that slows rivals." },
{ id: "c_zap", name: "Zap Bug", slot: "CHARM", rar: "U", kind: "VOLT", s: { sp: 0, ac: 1, ha: 0, tu: 0, we: 0 }, m: { chargeRatePct: 0.1 }, active: "ZAP", charges: 1, fx: "SPACE: zaps the rival ahead of you." },
{ id: "c_guard", name: "Guard Shell", slot: "CHARM", rar: "R", kind: "GRIP", s: { sp: -1, ac: 0, ha: 1, tu: 0, we: 1 }, m: { shield: 1 }, active: "SHIELD", charges: 1, fx: "SPACE: shield. Blocks the next hit." },
{ id: "c_magnet", name: "Coin Magnet", slot: "CHARM", rar: "E", kind: "LUCKY", s: { sp: 0, ac: 0, ha: 1, tu: 0, we: 0 }, m: { magnet: 1, coinMultPct: 0.25 }, active: "BOOST", charges: 1, fx: "SPACE: boost. Coins fly to you." },
{ id: "c_star", name: "Fallen Star", slot: "CHARM", rar: "L", kind: "AERO", s: { sp: 1, ac: 1, ha: 1, tu: 1, we: 0 }, m: { boostPowerPct: 0.1 }, active: "STAR", charges: 1, fx: "SPACE: brief invincible star run." }
];
var PART_BY_ID = {};
for (var i = 0; i < PARTS.length; i++) { PART_BY_ID[PARTS[i].id] = PARTS[i]; }
var DRIVER_BY_ID = {};
for (var d = 0; d < DRIVERS.length; d++) { DRIVER_BY_ID[DRIVERS[d].id] = DRIVERS[d]; }
var STARTER = { ENGINE: "e_putt", TIRES: "t_donuts", BODY: "b_crate", SPOILER: "s_plank", CHARM: "c_shroom" };
var AI_NAMES = ["Rook", "Tansy", "Gruf", "Nixie", "Pobble", "Sarge", "Fig"];
function baseMods() {
return { boostPowerPct: 0, chargeRatePct: 0, burnSlowPct: 0, burnDur: 0, shield: 0, coinMultPct: 0, magnet: 0, bumpPct: 0, offroadCutPct: 0, luck: 0 };
}
function addMods(dst, src) {
if (!src) { return; }
for (var k in src) { if (typeof dst[k] === "number" && typeof src[k] === "number") { dst[k] += src[k]; } }
}
function addStats(dst, src) {
for (var k = 0; k < STAT_KEYS.length; k++) { var key = STAT_KEYS[k]; dst[key] += (src[key] || 0); }
}
function calcLoadout(driverId, equip) {
var drv = DRIVER_BY_ID[driverId] || DRIVERS[0];
var stats = { sp: drv.base.sp, ac: drv.base.ac, ha: drv.base.ha, tu: drv.base.tu, we: drv.base.we };
var mods = baseMods();
addMods(mods, drv.passive);
var list = [];
var actives = [];
var counts = {};
for (var s = 0; s < SLOTS.length; s++) {
var slot = SLOTS[s];
var p = PART_BY_ID[equip[slot]];
if (!p) { continue; }
list.push(p);
addStats(stats, p.s);
addMods(mods, p.m);
counts[p.kind] = (counts[p.kind] || 0) + 1;
if (p.active) { actives.push({ id: p.active, charges: p.charges || 1, max: p.charges || 1, from: p.id }); }
}
var synergies = [];
for (var k = 0; k < KIND_LIST.length; k++) {
var kind = KIND_LIST[k];
var n = counts[kind] || 0;
if (n >= 2) {
var tier = n >= 3 ? "l3" : "l2";
var bonus = SYNERGY[kind][tier];
addStats(stats, bonus.stats);
addMods(mods, bonus.mods);
synergies.push({ kind: kind, count: n, tier: n >= 3 ? 3 : 2, text: bonus.text });
}
}
for (var q = 0; q < STAT_KEYS.length; q++) {
var key2 = STAT_KEYS[q];
stats[key2] = Math.max(1, Math.min(10, Math.round(stats[key2])));
}
mods.offroadCutPct = Math.max(0, Math.min(0.6, mods.offroadCutPct));
mods.shield = Math.max(0, Math.min(3, Math.round(mods.shield)));
mods.magnet = mods.magnet > 0 ? 1 : 0;
return { driver: drv, stats: stats, mods: mods, actives: actives, synergies: synergies, list: list };
}
function rollRarity(rng, circuit, luck) {
var wC = 55, wU = 27, wR = 12, wE = 4.5, wL = 1.5;
var shift = Math.min(30, Math.max(0, circuit - 1) * 4);
wC -= shift; wR += shift * 0.5; wE += shift * 0.32; wL += shift * 0.18;
var total = wC + wU + wR + wE + wL;
var r = rng() * total;
var tier = "C";
if ((r -= wC) < 0) { tier = "C"; }
else if ((r -= wU) < 0) { tier = "U"; }
else if ((r -= wR) < 0) { tier = "R"; }
else if ((r -= wE) < 0) { tier = "E"; }
else { tier = "L"; }
if (luck > 0 && tier !== "L" && rng() < luck) {
if (tier === "C") { tier = "U"; }
else if (tier === "U") { tier = "R"; }
else if (tier === "R") { tier = "E"; }
else if (tier === "E") { tier = "L"; }
}
return tier;
}
function pickPart(rng, circuit, luck, exclude) {
var rar = rollRarity(rng, circuit, luck);
var pool = [];
for (var i = 0; i < PARTS.length; i++) {
if (PARTS[i].rar === rar && !exclude[PARTS[i].id]) { pool.push(PARTS[i]); }
}
if (pool.length === 0) {
for (var j = 0; j < PARTS.length; j++) { if (!exclude[PARTS[j].id]) { pool.push(PARTS[j]); } }
}
if (pool.length === 0) { pool = PARTS.slice(); }
return pool[Math.floor(rng() * pool.length)];
}
function draftParts(rng, circuit, n, luck, excludeIds) {
var exclude = {};
for (var e = 0; e < excludeIds.length; e++) { exclude[excludeIds[e]] = true; }
var out = [];
var guard = 0;
while (out.length < n && guard < 60) {
guard++;
var p = pickPart(rng, circuit, luck, exclude);
if (!exclude[p.id]) { exclude[p.id] = true; out.push(p); }
}
return out;
}
function priceOf(p) { return RPRICE[p.rar] || 40; }
function aiStatsFor(rng, circuit) {
var out = [];
var avg = 3 + Math.min(4, (circuit - 1) * 0.55);
for (var i = 0; i < 7; i++) {
var spread = (rng() - 0.5) * 1.6;
var lead = i < 2 ? 0.4 : (i > 4 ? -0.4 : 0);
var v = avg + spread + lead;
out.push({
sp: Math.max(1, Math.min(10, Math.round(v + (rng() - 0.5)))),
ac: Math.max(1, Math.min(10, Math.round(v + (rng() - 0.5)))),
ha: Math.max(1, Math.min(10, Math.round(v + (rng() - 0.5)))),
tu: Math.max(1, Math.min(10, Math.round(v + (rng() - 0.5)))),
we: Math.max(1, Math.min(10, Math.round(v + (rng() - 0.5))))
});
}
return out;
}
return {
SLOTS: SLOTS, SLOT_NAMES: SLOT_NAMES, STAT_KEYS: STAT_KEYS, STAT_NAMES: STAT_NAMES,
KINDS: KINDS, KIND_LIST: KIND_LIST, RARITIES: RARITIES, RNAME: RNAME, RPRICE: RPRICE,
ACTIVE_INFO: ACTIVE_INFO, SYNERGY: SYNERGY, DRIVERS: DRIVERS, DRIVER_BY_ID: DRIVER_BY_ID,
PARTS: PARTS, PART_BY_ID: PART_BY_ID, STARTER: STARTER, AI_NAMES: AI_NAMES,
baseMods: baseMods, calcLoadout: calcLoadout, rollRarity: rollRarity,
draftParts: draftParts, priceOf: priceOf, aiStatsFor: aiStatsFor
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.data; }

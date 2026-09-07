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
var RPRICE = { C: 2, U: 4, R: 6, E: 8, L: 10 };
var EDITIONS = {
STD: { name: "Standard", color: "#cfd2d6", cost: 0, w: 70 },
FOIL: { name: "Foil", color: "#7bf1a8", cost: 2, w: 15 },
HOLO: { name: "Holographic", color: "#3a86ff", cost: 3, w: 9 },
POLY: { name: "Polychrome", color: "#ff5a3c", cost: 5, w: 4.5 },
NEG: { name: "Negative", color: "#e8e8f0", cost: -99, w: 1.5 }
};
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
VOLT: { l2: { stats: {}, mods: { chargeRatePct: 0.2, regenPct: 0.25 }, text: "Volt 2: charges 20% faster, regens quicker" }, l3: { stats: {}, mods: { chargeRatePct: 0.45, boostPowerPct: 0.1 }, text: "Volt 3+: charges 45% faster, boosts hit harder" } },
GRIP: { l2: { stats: { ha: 1, tu: 1 }, mods: {}, text: "Grip 2: +1 handling, +1 turbo" }, l3: { stats: { ha: 2, tu: 2 }, mods: {}, text: "Grip 3+: +2 handling, +2 turbo" } },
AERO: { l2: { stats: { sp: 1, ac: 1 }, mods: {}, text: "Aero 2: +1 speed, +1 accel" }, l3: { stats: { sp: 2, ac: 1 }, mods: { boostPowerPct: 0.1 }, text: "Aero 3+: +2 speed, +1 accel, stronger boost" } },
BULK: { l2: { stats: {}, mods: { bumpPct: 0.3, offroadCutPct: 0.2, maxhp: 15 }, text: "Bulk 2: heavy shoves, +15 HP, eats rough ground" }, l3: { stats: { we: 1 }, mods: { bumpPct: 0.6, offroadCutPct: 0.35, maxhp: 30 }, text: "Bulk 3+: +1 weight, +30 HP, huge shoves" } },
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
{ id: "t_hydro", name: "Hydro Planers", slot: "TIRES", rar: "U", kind: "AERO", s: { sp: 0, ac: 0, ha: 2, tu: 1, we: 0 }, m: { offroadCutPct: 0.3, regenPct: 0.25 }, fx: "Skims rough ground, patches up fast." },
{ id: "t_magnet", name: "Mag Boots", slot: "TIRES", rar: "R", kind: "LUCKY", s: { sp: 0, ac: 1, ha: 1, tu: 0, we: 1 }, m: { magnet: 1, coinMultPct: 0.15 }, fx: "Pulls in nearby coins." },
{ id: "t_titan", name: "Titan Rolls", slot: "TIRES", rar: "E", kind: "BULK", s: { sp: 1, ac: -1, ha: 0, tu: -1, we: 4 }, m: { bumpPct: 0.35, offroadCutPct: 0.3 }, fx: "Steamrolls everything, including lap times." },
{ id: "t_phantom", name: "Phantom Wheels", slot: "TIRES", rar: "L", kind: "GRIP", s: { sp: 1, ac: 1, ha: 3, tu: 2, we: -1 }, m: { chargeRatePct: 0.2 }, fx: "Barely touches the road." },
{ id: "b_crate", name: "Crate Frame", slot: "BODY", rar: "C", kind: "BULK", s: { sp: 0, ac: 0, ha: 0, tu: -1, we: 2 }, m: { bumpPct: 0.2 }, fx: "A box with wheels. Sturdy box." },
{ id: "b_paper", name: "Paper Dart", slot: "BODY", rar: "C", kind: "AERO", s: { sp: 1, ac: 1, ha: 0, tu: 0, we: -1 }, m: {}, fx: "Light and eager." },
{ id: "b_ember", name: "Ember Hull", slot: "BODY", rar: "U", kind: "PYRO", s: { sp: 1, ac: 0, ha: 0, tu: 1, we: 1 }, m: { burnDur: 0.5, burnSlowPct: 0.15 }, fx: "Warm to the touch. Hot to chase." },
{ id: "b_cushion", name: "Cushion", slot: "BODY", rar: "U", kind: "GRIP", s: { sp: -1, ac: 1, ha: 2, tu: 0, we: 1 }, m: { regenPct: 0.3 }, fx: "Bounces back. Wrecks patch up 30% faster." },
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
{ id: "c_shroom", name: "Lucky Shroom", slot: "CHARM", rar: "C", kind: "LUCKY", s: { sp: 0, ac: 1, ha: 0, tu: 1, we: 0 }, m: {}, active: "BOOST", charges: 1, fx: "C: small boost on demand." },
{ id: "c_oil", name: "Oil Can", slot: "CHARM", rar: "C", kind: "BULK", s: { sp: 0, ac: 0, ha: 0, tu: 0, we: 1 }, m: {}, active: "OIL", charges: 2, fx: "C: drops a slick behind you." },
{ id: "c_ember", name: "Ember Charm", slot: "CHARM", rar: "U", kind: "PYRO", s: { sp: 0, ac: 0, ha: 0, tu: 1, we: 0 }, m: { burnSlowPct: 0.25 }, active: "FIRE", charges: 2, fx: "C: drops fire that slows rivals." },
{ id: "c_zap", name: "Zap Bug", slot: "CHARM", rar: "U", kind: "VOLT", s: { sp: 0, ac: 1, ha: 0, tu: 0, we: 0 }, m: { chargeRatePct: 0.1 }, active: "ZAP", charges: 1, fx: "C: zaps the rival ahead of you." },
{ id: "c_guard", name: "Guard Shell", slot: "CHARM", rar: "R", kind: "GRIP", s: { sp: -1, ac: 0, ha: 1, tu: 0, we: 1 }, m: { shield: 1 }, active: "SHIELD", charges: 1, fx: "C: shield. Blocks the next hit." },
{ id: "c_magnet", name: "Coin Magnet", slot: "CHARM", rar: "E", kind: "LUCKY", s: { sp: 0, ac: 0, ha: 1, tu: 0, we: 0 }, m: { magnet: 1, coinMultPct: 0.25, regenPct: 0.25 }, active: "BOOST", charges: 1, fx: "C: boost. Coins and repairs fly to you." },
{ id: "c_star", name: "Fallen Star", slot: "CHARM", rar: "L", kind: "AERO", s: { sp: 1, ac: 1, ha: 1, tu: 1, we: 0 }, m: { boostPowerPct: 0.1 }, active: "STAR", charges: 1, fx: "C: brief invincible star run." }
];
var PART_BY_ID = {};
for (var i = 0; i < PARTS.length; i++) { PART_BY_ID[PARTS[i].id] = PARTS[i]; }
var DRIVER_BY_ID = {};
for (var d = 0; d < DRIVERS.length; d++) { DRIVER_BY_ID[DRIVERS[d].id] = DRIVERS[d]; }
var STARTER = { ENGINE: "e_putt", TIRES: "t_donuts", BODY: "b_crate", SPOILER: "s_plank", CHARM: "c_shroom" };
var AI_NAMES = ["Rook", "Tansy", "Gruf", "Nixie", "Pobble", "Sarge", "Fig"];
var CPU_NAMES = ["Rook", "Tansy", "Gruf", "Nixie", "Pobble", "Sarge", "Fig", "Jolt", "Mira", "Onyx", "Kess", "Bram", "Ludo", "Vex", "Zara", "Quinn", "Ash", "Bolt", "Cleo", "Dex", "Ember", "Flint", "Gigi", "Hugo"];
var LEGS = [
{ racers: 25, cut: 20, laps: 1, chaos: 0 },
{ racers: 20, cut: 15, laps: 1, chaos: 1 },
{ racers: 15, cut: 10, laps: 2, chaos: 2 },
{ racers: 10, cut: 6, laps: 2, chaos: 3 },
{ racers: 6, cut: 1, laps: 3, chaos: 4 }
];
var SEGS = [25, 23, 21, 19, 16, 13, 10, 8, 6];
var SEG_CUTS = [2, 2, 2, 3, 3, 3, 2, 2];
var PIT_TIME = 25;
var SERVICE_COST = 3;
var FUEL_COST = 3;
var FIX_COST = 3;
var REROLL_COST = 1;
var FUEL_MAX = 100;
var HP_BASE = 100;
var BOSS = {
SLIP: { name: "Slipstream", desc: "+8% speed while chasing" },
BULLY: { name: "Bully", desc: "Wins every shove" },
AGGRO: { name: "Aggro", desc: "Carries extra traps" },
SURV: { name: "Survivor", desc: "+40 HP and a second wind" },
CLOSE: { name: "Closer", desc: "Hunts the leader late" },
JINX: { name: "Jinx", desc: "May spin karts it passes" }
};
var BOSS_KEYS = ["SLIP", "BULLY", "AGGRO", "SURV", "CLOSE", "JINX"];
var FINISHER = { name: "Finisher", desc: "Conjures a star on the final leg" };
function titleFor(rank) {
if (rank === 0) { return "ACE"; }
if (rank <= 2) { return "RIVAL"; }
if (rank <= 7) { return "HUNTER"; }
return "PACK";
}
function assignBoss(rng, rank) {
if (rank > 7 && rng() < 0.5) { return null; }
return BOSS_KEYS[Math.floor(rng() * BOSS_KEYS.length)];
}
function baseMods() {
return { boostPowerPct: 0, chargeRatePct: 0, burnSlowPct: 0, burnDur: 0, shield: 0, coinMultPct: 0, magnet: 0, bumpPct: 0, offroadCutPct: 0, luck: 0, maxhp: 0, regenPct: 0 };
}
function addMods(dst, src) {
if (!src) { return; }
for (var k in src) { if (typeof dst[k] === "number" && typeof src[k] === "number") { dst[k] += src[k]; } }
}
function addStats(dst, src) {
for (var k = 0; k < STAT_KEYS.length; k++) { var key = STAT_KEYS[k]; dst[key] += (src[key] || 0); }
}
function topStatKey(s) {
var bestK = "sp"; var bestV = -99;
for (var k = 0; k < STAT_KEYS.length; k++) {
var v = s[STAT_KEYS[k]] || 0;
if (v > bestV) { bestV = v; bestK = STAT_KEYS[k]; }
}
return bestK;
}
function applyEdition(stats, mods, p) {
var ed = p.ed || "STD";
if (ed === "FOIL") { stats[topStatKey(p.s)] += 1; }
else if (ed === "HOLO") { for (var k in mods) { if (typeof mods[k] === "number" && (k === "burnSlowPct" || k === "burnDur" || k === "chargeRatePct" || k === "boostPowerPct" || k === "coinMultPct" || k === "luck" || k === "regenPct")) { mods[k] = Math.round(mods[k] * 1.5 * 100) / 100; } } }
else if (ed === "POLY") {
var k1 = topStatKey(p.s);
stats[k1] += 1;
var s2 = {}; for (var q = 0; q < STAT_KEYS.length; q++) { s2[STAT_KEYS[q]] = p.s[STAT_KEYS[q]] || 0; }
s2[k1] = -99;
var k2 = topStatKey(s2);
stats[k2] += 1;
for (var m in mods) { if (typeof mods[m] === "number" && m !== "shield" && m !== "magnet" && m !== "maxhp") { mods[m] = Math.round(mods[m] * 1.25 * 100) / 100; } }
}
else if (ed === "NEG") { stats[topStatKey(p.s)] += 1; mods.luck = Math.round((mods.luck + 0.05) * 100) / 100; }
}
function editionize(rng, part, luck, heat) {
var total = 0;
var keys = ["STD", "FOIL", "HOLO", "POLY", "NEG"];
for (var i = 0; i < keys.length; i++) { total += EDITIONS[keys[i]].w; }
var roll = rng() * total;
var ed = "STD";
for (var j = 0; j < keys.length; j++) {
roll -= EDITIONS[keys[j]].w;
if (roll <= 0) { ed = keys[j]; break; }
}
if ((luck || 0) > 0 && ed === "STD" && rng() < luck * 0.5) { ed = "FOIL"; }
if ((heat || 0) > 3 && ed === "STD" && rng() < 0.1 + heat * 0.02) { ed = "FOIL"; }
var copy = { id: part.id, name: part.name, slot: part.slot, rar: part.rar, kind: part.kind, s: part.s, m: part.m, fx: part.fx, ed: ed };
if (part.active) { copy.active = part.active; copy.charges = part.charges; }
var price = (RPRICE[part.rar] || 2) + EDITIONS[ed].cost;
if (ed === "NEG") { price = 0; }
copy.price = Math.max(0, price);
return copy;
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
var p = typeof equip[slot] === "string" ? PART_BY_ID[equip[slot]] : equip[slot];
if (!p) { continue; }
list.push(p);
addStats(stats, p.s);
var pm = {};
addMods(pm, p.m);
applyEdition(stats, pm, p);
addMods(mods, pm);
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
return editionize(rng, pool[Math.floor(rng() * pool.length)], luck, 0);
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
function pitDraft(rng, leg, eliminated, luck, excludeIds) {
var exclude = {};
for (var e = 0; e < excludeIds.length; e++) { exclude[excludeIds[e]] = true; }
var effCircuit = 1 + (eliminated + leg * 2.5) / 4;
var heat = eliminated + leg;
var out = [];
var guard = 0;
function weightOf(p) {
var w = 1;
if (p.slot === "CHARM") { w *= 0.55; }
if (p.active === "STAR") { w *= 0.5; }
if (p.active === "ZAP") { w *= 0.7; }
return w;
}
while (out.length < 3 && guard < 90) {
guard++;
var rar = rollRarity(rng, effCircuit, luck);
var pool = [];
for (var i = 0; i < PARTS.length; i++) {
if (PARTS[i].rar === rar && !exclude[PARTS[i].id]) { pool.push(PARTS[i]); }
}
if (pool.length === 0) {
for (var j = 0; j < PARTS.length; j++) { if (!exclude[PARTS[j].id]) { pool.push(PARTS[j]); } }
}
if (pool.length === 0) { break; }
var total = 0;
for (var w = 0; w < pool.length; w++) { total += weightOf(pool[w]); }
var roll = rng() * total;
var pick = pool[pool.length - 1];
for (var v = 0; v < pool.length; v++) {
roll -= weightOf(pool[v]);
if (roll <= 0) { pick = pool[v]; break; }
}
if (!exclude[pick.id]) { exclude[pick.id] = true; out.push(editionize(rng, pick, luck, heat)); }
}
return out;
}
function cpuScore(p) {
var s = RARITIES.indexOf(p.rar) * 2;
for (var k = 0; k < STAT_KEYS.length; k++) { s += Math.max(0, p.s[STAT_KEYS[k]] || 0); }
if (p.active) { s += 1; }
return s;
}
function cpuDecide(rng, offers, rank) {
if (!offers.length) { return null; }
if (rank > 2 && rng() < 0.2) { return offers[Math.floor(rng() * offers.length)]; }
var bestP = offers[0];
var bestS = cpuScore(bestP);
for (var i = 1; i < offers.length; i++) {
var s = cpuScore(offers[i]);
if (s > bestS) { bestS = s; bestP = offers[i]; }
}
return bestP;
}
function cpuService(hp, maxhp) {
return hp < maxhp * 0.55 ? "repair" : "fuel";
}
function priceOf(p) {
if (p.price !== undefined) { return p.price; }
return RPRICE[p.rar] || 2;
}
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
EDITIONS: EDITIONS, ACTIVE_INFO: ACTIVE_INFO, SYNERGY: SYNERGY, DRIVERS: DRIVERS, DRIVER_BY_ID: DRIVER_BY_ID,
PARTS: PARTS, PART_BY_ID: PART_BY_ID, STARTER: STARTER, AI_NAMES: AI_NAMES,
CPU_NAMES: CPU_NAMES, LEGS: LEGS, SEGS: SEGS, SEG_CUTS: SEG_CUTS, PIT_TIME: PIT_TIME, SERVICE_COST: SERVICE_COST,
FUEL_COST: FUEL_COST, FIX_COST: FIX_COST, REROLL_COST: REROLL_COST,
FUEL_MAX: FUEL_MAX, HP_BASE: HP_BASE, BOSS: BOSS, BOSS_KEYS: BOSS_KEYS, FINISHER: FINISHER,
titleFor: titleFor, assignBoss: assignBoss,
baseMods: baseMods, calcLoadout: calcLoadout, rollRarity: rollRarity, editionize: editionize,
draftParts: draftParts, pitDraft: pitDraft, cpuDecide: cpuDecide, cpuService: cpuService,
priceOf: priceOf, aiStatsFor: aiStatsFor
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.data; }

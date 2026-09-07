"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.data = (function () {
var SLOTS = ["ENGINE", "TIRES", "BODY", "SPOILER", "CHARM"];
var SLOT_NAMES = { ENGINE: "Engine", TIRES: "Tires", BODY: "Body", SPOILER: "Spoiler", CHARM: "Charm" };
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
var SYNERGY = {
PYRO: { l2: { stats: {}, mods: { burnSlowPct: 0.25, burnDur: 0.5 }, text: "Pyro 2: burns sting +25% and last longer" },
l3: { stats: {}, mods: { burnSlowPct: 0.6, burnDur: 1.2 }, text: "Pyro 3+: burns sting +60%, trails burn long" } },
VOLT: { l2: { stats: {}, mods: { chargeRatePct: 0.2 }, text: "Volt 2: boost charges 20% faster" },
l3: { stats: {}, mods: { chargeRatePct: 0.45, boostPowerPct: 0.1 }, text: "Volt 3+: charges 45% faster, boosts hit harder" } },
GRIP: { l2: { stats: { ha: 1, tu: 1 }, mods: {}, text: "Grip 2: +1 handling, +1 turbo" },
l3: { stats: { ha: 2, tu: 2 }, mods: {}, text: "Grip 3+: +2 handling, +2 turbo" } },
AERO: { l2: { stats: { sp: 1, ac: 1 }, mods: {}, text: "Aero 2: +1 speed, +1 accel" },
l3: { stats: { sp: 2, ac: 1 }, mods: { boostPowerPct: 0.1 }, text: "Aero 3+: +2 speed, +1 accel, stronger boost" } },
BULK: { l2: { stats: {}, mods: { bumpPct: 0.3, offroadCutPct: 0.2 }, text: "Bulk 2: heavy shoves, ignores rough ground" },
l3: { stats: { we: 1 }, mods: { bumpPct: 0.6, offroadCutPct: 0.35 }, text: "Bulk 3+: +1 weight, huge shoves" } },
LUCKY: { l2: { stats: {}, mods: { coinMultPct: 0.25, luck: 0.1 }, text: "Lucky 2: +25% coins, better shop odds" },
l3: { stats: {}, mods: { coinMultPct: 0.6, luck: 0.25 }, text: "Lucky 3+: +60% coins, much better shop odds" } }
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
{ id:: "x", name: "x", slot: "BODY", rar: "C", kind: "GRIP", s: { sp: 0, ac: 0, ha: 0, tu: 0, we: 0 }, m: {}, fx: "Placeholder never used." }
];
return { SLOTS: SLOTS };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.data; }

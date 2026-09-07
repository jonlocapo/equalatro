"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.extra = (function () {
var WEAPONS = {
MIS: { name: "Homer", icon: "M", desc: "Homing missile at the kart ahead. Big slow, big ouch." },
MINE: { name: "Popcorn", icon: "N", desc: "Drops a mine behind you." },
EMP: { name: "Static", icon: "E", desc: "Zaps everything just ahead of you." },
TURBO: { name: "Sugar Rush", icon: "T", desc: "Sweet instant boost." },
SHIELD: { name: "Bubble", icon: "U", desc: "Blocks the next hit." },
PATCH: { name: "Snack", icon: "P", desc: "Repairs 30 HP on the spot." }
};
var WEAPON_KEYS = ["MIS", "MINE", "EMP", "TURBO", "SHIELD", "PATCH"];
function rollWeapon(rng, placeFrac) {
var pool;
if (placeFrac < 0.25) { pool = ["MINE", "TURBO", "SHIELD", "EMP", "PATCH"]; }
else if (placeFrac < 0.6) { pool = ["MIS", "MINE", "EMP", "TURBO", "SHIELD", "PATCH"]; }
else { pool = ["MIS", "MIS", "EMP", "TURBO", "SHIELD", "PATCH", "MINE"]; }
return pool[Math.floor(rng() * pool.length)];
}
var EVENTS = {
meteor: { name: "METEOR SHOWER", desc: "Burning debris knocks weapons loose. Arm up.", bountyMult: 1, hazardMul: 2.2, fog: 0, cache: true },
frenzy: { name: "BOOST FRENZY", desc: "Pads everywhere, plus a free boost charge.", bountyMult: 1, hazardMul: 0.7, fog: 0, freeBoost: true },
cache: { name: "WEAPON CACHE", desc: "Weapon cells refill fast. Arm up.", bountyMult: 1, hazardMul: 1, fog: 0, cache: true },
oilrain: { name: "OIL RAIN", desc: "Slicks form ahead. Yuck.", bountyMult: 1, hazardMul: 1, fog: 0, oilrain: true },
fog: { name: "FOG BANK", desc: "Thick fog. Bounties doubled for the brave.", bountyMult: 2, hazardMul: 1, fog: 1 },
gold: { name: "GOLD RUSH", desc: "Coin lines and double bounties.", bountyMult: 2, hazardMul: 1, fog: 0 },
storm: { name: "STAR STORM", desc: "Final segment. Everything at once. Good luck.", bountyMult: 2, hazardMul: 1.8, fog: 0.5, cache: true }
};
var PERSONAS = {
daredevil: { name: "Daredevil", aggr: 1.3, driftB: 0.8, blockB: 0, weaponB: 1.2, pitB: 0.6, rerollB: 0.4 },
blocker: { name: "Blocker", aggr: 1.1, driftB: 1.2, blockB: 1, weaponB: 1, pitB: 0.8, rerollB: 0.5 },
drifter: { name: "Drifter", aggr: 0.9, driftB: 0.6, blockB: 0, weaponB: 0.9, pitB: 0.7, rerollB: 0.6 },
hoarder: { name: "Hoarder", aggr: 0.8, driftB: 1, blockB: 0, weaponB: 0.5, pitB: 1.3, rerollB: 1.6 },
sharpshooter: { name: "Sharpshooter", aggr: 1.2, driftB: 1, blockB: 0.3, weaponB: 1.5, pitB: 0.8, rerollB: 0.8 },
pitboss: { name: "Pitboss", aggr: 0.85, driftB: 1.1, blockB: 0, weaponB: 0.8, pitB: 1.6, rerollB: 1.2 }
};
var PERSONA_KEYS = ["daredevil", "blocker", "drifter", "hoarder", "sharpshooter", "pitboss"];
function assignPersona(rng, rank) {
return PERSONA_KEYS[Math.floor(rng() * PERSONA_KEYS.length)];
}
var BOUNTY = { ACE: 8, RIVAL: 6, HUNTER: 5, PACK: 3 };
function bountyFor(title) {
if (title === "ACE") { return BOUNTY.ACE; }
if (title === "RIVAL") { return BOUNTY.RIVAL; }
if (title === "HUNTER") { return BOUNTY.HUNTER; }
return BOUNTY.PACK;
}
var UNLOCK_DRIVERS = [
{ id: "juno", name: "Juno", color: "#ff9f1c", scarf: "#ffffff", crowns: 1, base: { sp: 3, ac: 3, ha: 4, tu: 3, we: 3 }, passive: { regenPct: 0.3 }, blurb: "Snack powered. Wrecks patch up 30% faster." },
{ id: "byte", name: "Byte", color: "#80ffdb", scarf: "#22223b", crowns: 2, base: { sp: 3, ac: 4, ha: 3, tu: 4, we: 2 }, passive: { chargeRatePct: 0.1, coinMultPct: 0.1 }, blurb: "Overclocked. Charges fast, earns fast." },
{ id: "sol", name: "Sol", color: "#ff5a3c", scarf: "#ffd23f", crowns: 3, base: { sp: 4, ac: 3, ha: 3, tu: 3, we: 3 }, passive: { boostPowerPct: 0.1, bumpPct: 0.15 }, blurb: "Little sun. Hits hard, boosts harder." },
{ id: "nova", name: "Nova", color: "#f8f7ff", scarf: "#c084fc", crowns: 5, base: { sp: 4, ac: 4, ha: 4, tu: 4, we: 2 }, passive: { luck: 0.1 }, blurb: "Superstar. Slightly luckier shops." }
];
function totalCrowns() {
try { return JSON.parse(localStorage.getItem("equalatro_crowns") || "0") | 0; }
catch (e) { return 0; }
}
function addCrown() {
try { localStorage.setItem("equalatro_crowns", JSON.stringify(totalCrowns() + 1)); } catch (e) {}
}
function allDrivers(base) {
var out = base.slice();
var crowns = totalCrowns();
for (var i = 0; i < UNLOCK_DRIVERS.length; i++) {
var u = UNLOCK_DRIVERS[i];
var copy = {};
for (var k in u) { copy[k] = u[k]; }
copy.locked = crowns < u.crowns;
copy.need = u.crowns;
out.push(copy);
}
return out;
}
return {
WEAPONS: WEAPONS, WEAPON_KEYS: WEAPON_KEYS, rollWeapon: rollWeapon,
EVENTS: EVENTS, PERSONAS: PERSONAS, PERSONA_KEYS: PERSONA_KEYS, assignPersona: assignPersona,
BOUNTY: BOUNTY, bountyFor: bountyFor,
UNLOCK_DRIVERS: UNLOCK_DRIVERS, totalCrowns: totalCrowns, addCrown: addCrown, allDrivers: allDrivers
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.extra; }

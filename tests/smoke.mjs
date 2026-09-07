import { createRequire } from "module";
const require = createRequire(import.meta.url);
const util = require("../js/util.js");
const data = require("../js/data.js");
const trackgen = require("../js/trackgen.js");
const sim = require("../js/sim.js");
let fails = 0;
function ok(cond, name) {
  if (cond) { console.log("PASS " + name); }
  else { fails++; console.log("FAIL " + name); }
}
const r1 = util.mulberry32(12345);
const r2 = util.mulberry32(12345);
ok(r1() === r2() && r1() === r2(), "util rng deterministic");
ok(util.fmtTime(75432) === "1:15.432", "util fmtTime");
ok(util.ordinal(1) === "1st" && util.ordinal(4) === "4th", "util ordinal");
ok(data.PARTS.length === 35, "data has 35 parts");
const bySlot = {};
const ids = {};
let schemaOk = true;
for (const p of data.PARTS) {
  bySlot[p.slot] = (bySlot[p.slot] || 0) + 1;
  if (ids[p.id]) { schemaOk = false; }
  ids[p.id] = true;
  if (!data.SLOTS.includes(p.slot)) { schemaOk = false; }
  if (!data.RARITIES.includes(p.rar)) { schemaOk = false; }
  if (!data.KIND_LIST.includes(p.kind)) { schemaOk = false; }
  for (const k of data.STAT_KEYS) {
    const v = p.s[k] || 0;
    if (!Number.isInteger(v) || v < -2 || v > 4) { schemaOk = false; }
  }
  if (!p.fx || !p.name) { schemaOk = false; }
}
ok(schemaOk, "data part schema valid");
ok(data.SLOTS.every((s) => bySlot[s] === 7), "data 7 parts per slot");
const starter = data.calcLoadout("pip", data.STARTER);
ok(data.STAT_KEYS.every((k) => starter.stats[k] >= 1 && starter.stats[k] <= 10), "data starter stats clamped");
const pyroEquip = { ENGINE: "e_cinder", TIRES: "t_cinder", BODY: "b_ember", SPOILER: "s_plank", CHARM: "c_shroom" };
const pyro = data.calcLoadout("pip", pyroEquip);
const pyroSyn = pyro.synergies.find((s) => s.kind === "PYRO");
ok(pyroSyn && pyroSyn.tier === 3, "data pyro 3 synergy fires");
ok(pyro.actives.length === 1 && pyro.actives[0].id === "BOOST", "data charm active extracted");
const rr = util.mulberry32(99);
const seen = {};
let rarOk = true;
for (let i = 0; i < 200; i++) {
  const t = data.rollRarity(rr, 1 + (i % 10), 0.1);
  seen[t] = true;
  if (!data.RARITIES.includes(t)) { rarOk = false; }
}
ok(rarOk && seen.C && seen.U && seen.R, "data rarity rolls valid with spread");
const drng = util.mulberry32(7);
const draft = data.draftParts(drng, 3, 2, 0.1, Object.keys(ids).slice(0, 30));
ok(draft.length === 2 && draft[0].id !== draft[1].id, "data draft distinct picks");
const t1 = trackgen.genTrack("seedA", 1);
const t1b = trackgen.genTrack("seedA", 1);
ok(JSON.stringify(t1) === JSON.stringify(t1b), "trackgen deterministic");
ok(t1.laps === 2 && trackgen.genTrack("seedA", 5).laps === 3, "trackgen lap counts");
const h1 = trackgen.hazardCount(trackgen.genTrack("seedB", 1));
const h8 = trackgen.hazardCount(trackgen.genTrack("seedB", 8));
ok(h8 > h1, "trackgen hazards scale with circuit");
function mkRace(circuit, humanStats) {
  const track = trackgen.genTrack("smoke", circuit);
  const loadout = data.calcLoadout("pip", data.STARTER);
  const karts = [{ name: "Pip", human: true, stats: humanStats || loadout.stats, mods: loadout.mods, actives: loadout.actives }];
  const arng = util.mulberry32(1000 + circuit);
  const aiStats = data.aiStatsFor(arng, circuit);
  for (let i = 0; i < 7; i++) {
    karts.push({ name: data.AI_NAMES[i], human: false, stats: aiStats[i], mods: data.baseMods(), kit: { BOOST: 0, FIRE: 0, OIL: 1, ZAP: 0, SHIELD: 0, STAR: 0 }, skill: 0.9 });
  }
  return sim.createRace({ track, laps: track.laps, karts, aggression: 0.5 });
}
const st = mkRace(1);
const input = { steer: 0, drift: false, use: false };
let steps = 0;
let evOk = true;
let nanSeen = false;
input.use = true;
while (!st.over && steps < 40000) {
  if (steps === 60) { input.use = false; }
  const ev = sim.stepRace(st, 1 / 60, input);
  if (!Array.isArray(ev)) { evOk = false; }
  for (const k of st.karts) {
    if (!isFinite(k.dist) || !isFinite(k.speed) || !isFinite(k.lane)) { nanSeen = true; }
  }
  steps++;
}
ok(st.over, "sim race completes, steps=" + steps);
ok(evOk && !nanSeen, "sim events finite, no NaN");
const places = st.karts.map((k) => k.place).sort((a, b) => a - b).join(",");
ok(places === "1,2,3,4,5,6,7,8", "sim places unique 1-8");
const st6 = mkRace(6);
let s6 = 0;
const dumb = { steer: 0.3, drift: false, use: false };
while (!st6.over && s6 < 40000) { sim.stepRace(st6, 1 / 60, dumb); s6++; }
ok(st6.over, "sim circuit 6 race completes");
const stT = mkRace(2);
const fireLoad = data.calcLoadout("volt", { ENGINE: "e_snail", TIRES: "t_cinder", BODY: "b_ember", SPOILER: "s_torch", CHARM: "c_ember" });
stT.karts[0].kit = { BOOST: 0, FIRE: 2, OIL: 0, ZAP: 0, SHIELD: 0, STAR: 0 };
stT.karts[0].mods = fireLoad.mods;
sim.stepRace(stT, 1 / 60, { steer: 0, drift: false, use: true });
ok(stT.traps.length === 1 && stT.traps[0].kind === "fire", "sim fire trap drops");
if (fails > 0) { console.log(fails + " FAILURES"); process.exit(1); }
console.log("ALL SMOKE TESTS PASSED");

EQUALATRO - STAR TOUR RACER - DEVELOPER HANDBOOK
Play it live at https://jonlocapo.github.io/equalatro/ - Stack is plain HTML plus canvas plus WebAudio. No build step, no dependencies, no framework.

1. RUN IT AT HOME
Clone the repo, serve the folder with any static server (for example python http dot server), open index dot html. Pushing to main redeploys Pages within a minute or two. The Pages API status sometimes says errored even when the deploy worked, so always check the live URL itself.

2. WHAT THE GAME IS
25 karts race ONE long procedurally generated road split into 9 segments. Everyone finishes each segment, THEN the slowest are cut: 25-23-21-19-16-13-10-8-6. The final segment crowns the champion. There are no laps. Wrecked karts crawl and regenerate, empty tanks sputter and refill, and pit stops happen LIVE while rivals keep racing. The number one CPU seed carries an intentionally unfair FINISHER.

3. CONTROLS
Arrows or WASD steer, gas is automatic. Hold a steering direction into a turn to drift, release for a mini turbo. SPACE fires the weapon. C fires the charm power. E pulls into the pit and launches again. P pauses, M mutes. Touch buttons appear on mobile: arrows, DRIFT, WPN, PWR, PIT.

4. CORE LOOP
Title - drivers - paddock garage - one continuous race - segment result overlays with cuts - live pits during racing - final segment - champion screen. Crowns bank to localStorage and unlock extra drivers. That is the only meta progression on purpose.

5. KART SYSTEM
Five slots: ENGINE, TIRES, BODY, SPOILER, CHARM. Five stats 1 to 10: Speed, Accel, Handling, Turbo, Weight. 35 parts total, 7 per slot, in rarities Common, Uncommon, Rare, Epic, Legendary. Parts also carry passive mods (boost power, charge rate, burn strength, shields, coin magnet, bump power, offroad resist, max HP, regen) and CHARM parts carry the active power fired with C.
Families give Balatro style synergies: PYRO, VOLT, GRIP, AERO, BULK, LUCKY. Two of a family is a rookie bonus, three or more is a champion bonus. See SYNERGY in js data dot js.
Editions drop Balatro style on any part offer: Standard, Foil plus 1 to best stat plus 2 coins, Holographic effect mods times 1 point 5 plus 3 coins, Polychrome plus 1 to two stats and effects times 1 point 25 plus 5 coins, Negative free plus small luck. Strong effects stay rare on purpose: in pitDraft, CHARM offers are weighted 0 point 55, STAR 0 point 5, ZAP 0 point 7. Loot heat rises with eliminations plus segment index, so late tour offers go Epic and Legendary.

6. WEAPONS
Purple cells grant one held weapon. Back markers roll the spicy pool. MIS homing missile, MINE dropped mine, EMP hits everything just ahead, TURBO instant boost, SHIELD plus one block, PATCH plus 30 HP. Fire with SPACE. CPUs fire by personality.

7. HP FUEL REGEN
Base 100 HP, BULK synergy and SURVIVOR boss raise it. Hits deal 4 to 20 by source, burn ticks 3 per second. At zero HP the kart is WRECKED: crawls at 15 percent speed and regens 10 per second moving, 25 per second stopped, faster with regenPct mods. Full HP auto revives. Fuel drains about 0 point 55 to 1 point 05 per second plus 2 to 3 per boost. Empty tank sputters at 40 percent and refills 10 per second moving, 30 stopped. Optimal play is to burn hard, pull over briefly, and rejoin. That is intentional.

8. LIVE PITS
Press E anywhere. The kart stops, goes ghost, and the pit overlay opens while the race continues. Services run on timers: refuel 3 coins 4 seconds, repair 3 coins 4 seconds, bolt on a bought part 2 seconds, one job at a time, reroll offers 1 coin. CPU crews pit on their own timers by personality and get small stat bumps instead of real parts. Time in pit is positions lost. That is the whole minigame.

9. SEGMENT EVENTS
Every third segment rolls an event: METEOR SHOWER sparks plus fast weapon cells, BOOST FRENZY extra pads plus free boost for all, WEAPON CACHE fast refilling cells, OIL RAIN random slicks spawn live, FOG BANK heavy fog plus double bounties, GOLD RUSH double bounties, STAR STORM on the final segment which is fog plus cache plus double bounties plus sparks. Event mods live on st dot eventMods and look dot fog plus look dot sparks.

10. BOSSES AND PERSONALITIES
CPU ranks: 0 ACE, 1 to 2 RIVAL, 3 to 7 HUNTER, rest PACK. Hidden boss effects reveal with a toast on first trigger: SLIPSTREAM plus 8 percent chasing, BULLY wins shoves, AGGRO extra traps, SURVIVOR plus 40 HP and a second wind, CLOSER stronger rubber band after gaining 3 places, JINX 15 percent spin on passes. The ACE also has FINISHER: on the final stretch, if placed 6th or better past 55 percent distance, it conjures a STAR. It is meant to be unfair. Beat it with lines or loot.
Personalities change driving, not just stats: daredevil, blocker (covers your lane), drifter, hoarder (saves weapons), sharpshooter, pitboss (pits and rerolls a lot). All CPUs share one decision function cpuDecide and one service rule cpuService, so the RNG is fair. Difficulty comes from rank stats, kits, and the finisher.

11. ECONOMY
Part prices 1 to 10 by rarity plus edition cost. Coins from pickups (1c), pass bounties by victim rank (ACE 8, RIVAL 6, HUNTER 5, PACK 3, once per victim per segment, doubled on fog and gold events), and segment placement (60 minus 2 per place, minimum 5). Services cost 3, reroll 1. Tow truck revive is a planned feature, not yet built.

12. FILE MAP
index dot html - all screens, HUD bars, live pit overlay, touch buttons, script order util data trackgen extra sprites sim render audio game tour.
css style dot css - pixel UI, HUD, pit overlay, edition tags, responsive rules.
js util dot js - seeded RNG mulberry32, hash, clamp, fmtTime, ordinal.
js data dot js - slots, stats, kinds, 35 parts, drivers, editions plus editionize, synergies, calcLoadout, rarity rolls, pitDraft with effect rarity weights, cpuDecide plus cpuService, SEG and SEG_CUTS tables, economy constants.
js trackgen dot js - genTrack for single races plus tests, genTour for the linear 9 segment road with checkpoints, gates, weapon cells, coins, pads, hazards.
js extra dot js - WEAPONS plus rollWeapon, EVENTS defs, PERSONAS, BOUNTY table, UNLOCK_DRIVERS plus crown storage.
js sim dot js - headless race sim. createRace, stepRace with fixed dt, computePlaces. Handles physics, drift turbos, traps, weapons fire, HP fuel wreck regen, bosses, finisher, bounties, live pitting ghost, rubber band AI with personas, checkpoints. No DOM at top level, safe to require in Node.
js render dot js - Mode7 style pseudo 3D road, pastel Kirby skies with clouds, candy scenery, gates, weapon cells, fog overlay, storm sparks, minimap, 25 kart culling.
js sprites dot js - procedural pixel karts reflecting equipped parts, Kirby scenery set, coins, hazards, mines, pads, gates, portraits.
js audio dot js - WebAudio synth SFX plus engine hum plus mute.
js game dot js - screens, state S, main loop, countdown, HUD, input incl touch, garage, drivers with locks, charm plus weapon fire wiring. Exposes EQ dot game helpers.
js tour dot js - tour flow: newTour roster build, startTour grid build, afterStep checkpoints cuts events, segmentEnd results, live pit logic and timers, CPU pit crews, bounties wiring, champion and unlocks.
tests smoke dot mjs - headless checks for data, trackgen, and sim. Written for CI that is not yet enabled.

13. TUNING KNOBS (most run defining numbers live here)
Tour shape: SEGS racer counts and SEG_CUTS in data dot js. Segment road lengths segCounts in genTour. Mercy timer 75 seconds in tour dot afterStep.
Damage: oil 10 to 14, fire 8 to 10, zap 16, missile 20, mine 18, EMP 8, bump 6, burn tick 3 per second, all in sim dot js hurt plus applyHit plus fireWeapon.
Regen: wreck 10 moving 25 stopped, fuel 10 moving 30 stopped, times regenPct, in stepRace. Wreck crawl 0 point 15 top, sputter 0 point 4 top.
Fuel: drain 0 point 55 plus 0 point 5 times speed ratio, boost costs 2 to 3.
Pit: fuel and repair 3 coins 4 seconds, bolt 2 seconds, reroll 1 coin, in tour dot js plus data dot js costs.
Bounties: ACE 8 RIVAL 6 HUNTER 5 PACK 3 in extra dot js.
AI: base stats 3 point 8 minus rank times 0 point 07, skill 0 point 99 minus rank times 0 point 004, rubber band 0 point 12 times aggression, all in tour dot js plus sim dot js.
Loot heat: pitDraft effective circuit equals 1 plus eliminations plus 2 point 5 per segment over 4.

14. SIM CONTRACT FOR NEW SYSTEMS
Kart fields that matter: hp maxhp fuel wrecked weapon pitting pitT pitWhy pitCd persona boss rank title finisher seg kit shield starT boostT. Events emitted per step: boost hit coin weapon wfire trap zap zapfail shieldblock shieldup star patch bump pass reveal wreck unwreck bounty finish unpitted. st dot eventMods carries bountyMult oilrain cache. st dot checkpoints is dist array. Eliminated karts are parked at dist minus 100000 with pitting true and pitT huge, which sorts them last with zero sim changes.

15. KNOWN GAPS (honest list, fix in this order if something feels off)
Balance is untested against humans. Most likely wrong: fuel range versus segment length, wreck time loss versus repair cost, ACE difficulty with finisher.
No CI. tests smoke dot mjs exists but the token lacks the workflow scope, so .github workflows cannot be pushed from here. Run gh auth refresh dash s workflow on a home machine, then push the workflow file from the earlier plan.
No tow truck revive yet. Design agreed: 100 coins once per tour to relaunch after a wreck that costs you the cut. Currently a bad wreck spiral just loses positions, which is softer but less dramatic.
Player elimination only happens at cuts. Mid segment rage quits are handled by the QUIT button.
Mobile pit overlay is usable but cramped. Cards stack vertically by design.
Renderer culls far karts, so 24 rival dots on the minimap are the main way to feel the pack. Consider name tags for the top 3.

16. ROADMAP IDEAS ( brainstormed, not promised )
Live position bubble showing seconds above or below the cut line. Arrival order shared pit draft pool. CPU tells before boss reveals (spikes, flicker, smoke). Nemesis nameplate for whoever beats you twice. Commentator feed lines for wrecks and bounties. Daily shared seed. Ghost replays. Rain segments. Reverse grid starts for segment winners.

17. HOW PUSHES WERE DONE FROM A LOCKED DOWN MACHINE
No clone, no local files. Each file went up through the GitHub Contents API via gh api PUT with base64 content, fetching the file sha first for updates. Two hard limits to respect from home too: Windows caps a single command near 32K characters, so keep every file under about 20K characters or split modules (that is why game dot js and tour dot js are separate). And this token has gist read org repo scopes only, which is why workflow files return 404. Use a token with the workflow scope for Actions.

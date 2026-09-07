"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.audio = (function () {
var ctx = null;
var muted = false;
var engineOsc = null;
var engineGain = null;
function ensure() {
if (ctx || muted) { return; }
try {
var AC = window.AudioContext || window.webkitAudioContext;
ctx = new AC();
} catch (e) { ctx = null; }
}
function tone(freq, dur, type, vol, slide) {
if (!ctx || muted) { return; }
try {
var o = ctx.createOscillator();
var g = ctx.createGain();
o.type = type || "square";
o.frequency.setValueAtTime(freq, ctx.currentTime);
if (slide) { o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + dur); }
g.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
o.connect(g); g.connect(ctx.destination);
o.start(); o.stop(ctx.currentTime + dur);
} catch (e) {}
}
function sfx(name) {
if (!ctx || muted) { return; }
if (name === "click") { tone(660, 0.07, "square", 0.06); }
else if (name === "back") { tone(330, 0.08, "square", 0.06); }
else if (name === "coin") { tone(990, 0.06, "square", 0.05); tone(1320, 0.09, "square", 0.05); }
else if (name === "boost") { tone(180, 0.35, "sawtooth", 0.09, 500); }
else if (name === "hit") { tone(140, 0.25, "sawtooth", 0.1, -80); }
else if (name === "pickup") { tone(520, 0.1, "triangle", 0.08, 260); }
else if (name === "count") { tone(440, 0.12, "square", 0.08); }
else if (name === "go") { tone(880, 0.3, "square", 0.1, 220); }
else if (name === "win") { tone(523, 0.12, "square", 0.08); setTimeout(function () { tone(659, 0.12, "square", 0.08); }, 120); setTimeout(function () { tone(784, 0.2, "square", 0.08); }, 240); }
else if (name === "lose") { tone(330, 0.15, "sawtooth", 0.08, -120); setTimeout(function () { tone(220, 0.25, "sawtooth", 0.08, -80); }, 150); }
else if (name === "zap") { tone(1200, 0.15, "sawtooth", 0.07, -900); }
else if (name === "star") { tone(700, 0.1, "square", 0.08, 700); setTimeout(function () { tone(900, 0.12, "square", 0.08, 700); }, 100); }
}
function engine(on, ratio) {
if (!ctx || muted) {
if (engineOsc && !muted) { try { engineOsc.stop(); } catch (e) {} engineOsc = null; }
return;
}
try {
if (on && !engineOsc) {
engineOsc = ctx.createOscillator();
engineGain = ctx.createGain();
engineOsc.type = "sawtooth";
engineGain.gain.value = 0.025;
engineOsc.connect(engineGain); engineGain.connect(ctx.destination);
engineOsc.start();
}
if (!on && engineOsc) {
engineOsc.stop(); engineOsc = null; engineGain = null;
return;
}
if (engineOsc) {
engineOsc.frequency.setValueAtTime(60 + ratio * 140, ctx.currentTime);
engineGain.gain.setValueAtTime(0.02 + ratio * 0.02, ctx.currentTime);
}
} catch (e) {}
}
function toggleMute() {
muted = !muted;
if (muted && engineOsc) { try { engineOsc.stop(); } catch (e) {} engineOsc = null; }
return muted;
}
function isMuted() { return muted; }
return { ensure: ensure, sfx: sfx, engine: engine, toggleMute: toggleMute, isMuted: isMuted };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.audio; }

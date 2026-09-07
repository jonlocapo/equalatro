"use strict";
var EQ = (typeof window !== "undefined") ? (window.EQ = window.EQ || {}) : {};
EQ.sprites = (function () {
function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }
function kindColor(kind) {
if (kind === "PYRO") { return "#ff5a3c"; }
if (kind === "VOLT") { return "#ffd23f"; }
if (kind === "GRIP") { return "#7bf1a8"; }
if (kind === "AERO") { return "#3a86ff"; }
if (kind === "BULK") { return "#c084fc"; }
return "#ffb703";
}
function hashId(s) {
var h = 0;
for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
return Math.abs(h);
}
function drawKart(ctx, cx, baseY, w, o) {
o = o || {};
var u = w / 16;
var lean = Math.max(-1, Math.min(1, o.lean || 0));
var ox = cx - 8 * u + lean * 2 * u;
function X(c) { return ox + c * u; }
function Y(r) { return baseY - (12 - r) * u; }
var bodyC = o.color || "#ffd23f";
var dark = "#14101f";
var scarfC = o.scarf || "#e63946";
if (o.ghost) { ctx.globalAlpha = 0.55; }
R(ctx, X(2), Y(11), 12 * u, 1.2 * u, "rgba(0,0,0,0.35)");
var wide = o.tiresWide ? 1 : 0;
R(ctx, X(1 - wide), Y(8), (3 + wide) * u, 3.4 * u, "#0c0c12");
R(ctx, X(12), Y(8), (3 + wide) * u, 3.4 * u, "#0c0c12");
R(ctx, X(1.6 - wide), Y(8.8), (1.6 + wide) * u, 1.8 * u, "#5a5a6e");
R(ctx, X(12.8), Y(8.8), (1.6 + wide) * u, 1.8 * u, "#5a5a6e");
var variant = hashId(o.body || "b_crate") % 3;
var bw = variant === 2 ? 9 : 8;
var bx = 8 - bw / 2;
R(ctx, X(bx), Y(6.4), bw * u, 2.8 * u, bodyC);
R(ctx, X(bx + 0.8), Y(6.9), (bw - 1.6) * u, 1.1 * u, "rgba(255,255,255,0.35)");
if (variant === 0) { R(ctx, X(6.4), Y(9.0), 3.2 * u, 1.2 * u, bodyC); }
if (variant === 1) { R(ctx, X(5.6), Y(9.0), 4.8 * u, 0.9 * u, bodyC); }
if (variant === 2) { R(ctx, X(6.8), Y(8.8), 2.4 * u, 1.4 * u, dark); }
R(ctx, X(bx), Y(8.2), bw * u, 0.7 * u, kindColor(o.bodyKind || "GRIP"));
R(ctx, X(5), Y(2.6), 6 * u, 3.6 * u, bodyC);
R(ctx, X(5), Y(2.6), 6 * u, 0.9 * u, "rgba(255,255,255,0.4)");
R(ctx, X(5.8), Y(4.0), 4.4 * u, 1.4 * u, dark);
R(ctx, X(8.6), Y(4.0), 1.6 * u, 1.4 * u, "#9ad8ff");
R(ctx, X(4), Y(6.0), 8 * u, 0.9 * u, scarfC);
var sw = 10 + (hashId(o.spoiler || "s_plank") % 5);
var sx = 8 - sw / 2;
R(ctx, X(sx), Y(0.6), sw * u, 1.1 * u, "#23232e");
R(ctx, X(sx), Y(0.6), sw * u, 0.4 * u, kindColor(o.spoilerKind || "AERO"));
R(ctx, X(6.6), Y(1.4), 0.9 * u, 1.6 * u, "#23232e");
R(ctx, X(8.5), Y(1.4), 0.9 * u, 1.6 * u, "#23232e");
if (o.boost) {
var fl = 1.5 + Math.random() * 1.5 + (o.boostBig ? 1.2 : 0);
var fc = o.engineKind === "PYRO" ? "#ff5a3c" : (o.engineKind === "VOLT" ? "#ffd23f" : "#3a86ff");
R(ctx, X(6.2), Y(9.6), 1.2 * u, fl * u, fc);
R(ctx, X(8.6), Y(9.6), 1.2 * u, fl * u, fc);
R(ctx, X(6.4), Y(9.6), 0.8 * u, fl * 0.5 * u, "#ffffff");
R(ctx, X(8.8), Y(9.6), 0.8 * u, fl * 0.5 * u, "#ffffff");
}
if (o.burn) {
R(ctx, X(4.5), Y(10.6), 2 * u, 1.4 * u, "#ff5a3c");
R(ctx, X(9.5), Y(10.6), 2 * u, 1.4 * u, "#ffd23f");
}
if (o.charmKind && o.charmBlink !== false) {
var cc = kindColor(o.charmKind);
var bob = Math.sin((o.t || 0) * 5) * 0.5 * u;
R(ctx, X(7), Y(-0.6) + bob, 2 * u, 2 * u, cc);
R(ctx, X(7.5), Y(-0.1) + bob, 1 * u, 1 * u, "#ffffff");
}
if (o.shield) {
ctx.strokeStyle = "#7bf1a8";
ctx.lineWidth = Math.max(1, u * 0.5);
ctx.strokeRect(X(2.4), Y(0.4), 11.2 * u, 11 * u);
}
if (o.star) {
var cols = ["#ffd23f", "#ff5a3c", "#7bf1a8", "#3a86ff"];
R(ctx, X(3), Y(1), 10 * u, 0.8 * u, cols[Math.floor((o.t || 0) * 8) % 4]);
}
ctx.globalAlpha = 1;
}
function drawCoin(ctx, x, y, s, t) {
var w = Math.abs(Math.cos(t * 4)) * 0.7 + 0.3;
R(ctx, x - 4 * s * w, y - 5 * s, 8 * s * w, 10 * s, "#ffb703");
R(ctx, x - 4 * s * w, y - 5 * s, 8 * s * w, 2 * s, "#ffe08a");
R(ctx, x - 2 * s * w, y - 2 * s, 4 * s * w, 4 * s, "#fff3b0");
}
function drawHazard(ctx, x, y, s, type, t) {
if (type === 1) {
R(ctx, x - 7 * s, y - 2 * s, 14 * s, 4 * s, "#15151f");
R(ctx, x - 5 * s, y - 2 * s, 5 * s, 2 * s, "#3a3a4d");
R(ctx, x + 1 * s, y - 1 * s, 3 * s, 1 * s, "#7a7a99");
} else {
var f = Math.sin(t * 12 + x) * 1.2 * s;
R(ctx, x - 5 * s, y - 6 * s, 10 * s, 6 * s, "#ff5a3c");
R(ctx, x - 3 * s, y - 9 * s - f, 6 * s, 5 * s, "#ffd23f");
R(ctx, x - 1 * s, y - 6 * s, 2 * s, 3 * s, "#ffffff");
}
}
function drawPad(ctx, x, y, w, c) {
R(ctx, x - w / 2, y - 3, w, 6, c || "#3a86ff");
R(ctx, x - w / 4, y - 6, w / 2, 3, "#ffffff");
R(ctx, x - w / 4, y + 3, w / 2, 3, "#ffffff");
}
function drawScenery(ctx, x, y, s, id, t) {
var sway = Math.sin((t || 0) * 2 + x * 0.05) * s;
if (id === 0) {
R(ctx, x - 2 * s + sway, y - 14 * s, 4 * s, 14 * s, "#5a3a21");
R(ctx, x - 8 * s + sway, y - 22 * s, 16 * s, 10 * s, "#2d6a4f");
R(ctx, x - 5 * s + sway, y - 25 * s, 10 * s, 5 * s, "#40916c");
} else if (id === 1) {
R(ctx, x - 6 * s, y - 6 * s, 12 * s, 6 * s, "#5a5a6e");
R(ctx, x - 4 * s, y - 8 * s, 8 * s, 3 * s, "#8a8aa3");
} else if (id === 2) {
R(ctx, x - 3 * s, y - 16 * s, 6 * s, 16 * s, "#8a6d3b");
R(ctx, x - 9 * s, y - 22 * s, 18 * s, 8 * s, "#ffd23f");
R(ctx, x - 9 * s, y - 22 * s, 18 * s, 2 * s, "#fff3b0");
} else if (id === 3) {
R(ctx, x - 5 * s, y - 12 * s, 10 * s, 12 * s, "#3a86ff");
R(ctx, x - 2 * s, y - 15 * s, 4 * s, 4 * s, "#9ad8ff");
} else if (id === 4) {
R(ctx, x - 7 * s, y - 4 * s, 14 * s, 4 * s, "#c2b280");
R(ctx, x - 4 * s, y - 9 * s, 8 * s, 6 * s, "#d8c690");
} else {
R(ctx, x - 6 * s, y - 12 * s, 12 * s, 12 * s, "#e63946");
R(ctx, x - 6 * s, y - 12 * s, 12 * s, 3 * s, "#ffffff");
R(ctx, x - 2 * s, y - 4 * s, 4 * s, 4 * s, "#ffffff");
}
}
function drawPortrait(cv, driver) {
var ctx = cv.getContext("2d");
var W = cv.width; var H = cv.height;
ctx.clearRect(0, 0, W, H);
var u = W / 16;
R(ctx, 0, 0, W, H, "#0b0e1a");
R(ctx, 3 * u, 12 * u, 10 * u, 3 * u, driver.color);
R(ctx, 4 * u, 2 * u, 8 * u, 9 * u, driver.color);
R(ctx, 4 * u, 2 * u, 8 * u, 2 * u, "rgba(255,255,255,0.4)");
R(ctx, 5 * u, 5.5 * u, 6 * u, 2.6 * u, "#14101f");
R(ctx, 8.4 * u, 5.5 * u, 2 * u, 2.6 * u, "#9ad8ff");
R(ctx, 5.6 * u, 6 * u, 1.4 * u, 1.4 * u, "#ffffff");
R(ctx, 3 * u, 11 * u, 10 * u, 1.6 * u, driver.scarf);
}
return {
drawKart: drawKart,
drawCoin: drawCoin,
drawHazard: drawHazard,
drawPad: drawPad,
drawScenery: drawScenery,
drawPortrait: drawPortrait,
kindColor: kindColor
};
})();
if (typeof module !== "undefined" && module.exports) { module.exports = EQ.sprites; }

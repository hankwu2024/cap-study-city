// ===== 像素美術：角色與家具（全部用程式畫，不需要圖檔） =====
const T = 16; // 一格 16 像素

function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
function shadow(c, x, y, rx, ry) {
  c.fillStyle = 'rgba(0,0,0,.22)';
  c.beginPath(); c.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2); c.fill();
}

// ---------- 家具 ----------
const C = {
  wood: '#9c6b3f', woodD: '#6e4524', woodL: '#c08a55', metal: '#9aa4b1', metalD: '#5f6b78',
  dark: '#2d3436', white: '#f5f6fa', leaf: '#3c9d4e', leafD: '#2a7a3b', leafL: '#6cc36f', pot: '#b5651d',
};

function books(c, x, y, w, seed) {
  const cols = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#d35400', '#7f8c8d'];
  for (let i = 0; i < w; i += 2) {
    const h = 6 + ((i * 7 + seed) % 3);
    R(c, x + i, y + 9 - h, 2, h, cols[(i + seed) % cols.length]);
  }
}

const PROPS = {
  // ===== 通用 =====
  plant: { w: 1, h: 1, draw(c, x, y, t) {
    shadow(c, x + 8, y + 15, 6, 2);
    R(c, x + 4, y + 9, 8, 6, C.pot); R(c, x + 3, y + 9, 10, 2, '#cf7a2b');
    const s = Math.sin(t * 2 + x) > 0.6 ? 1 : 0;
    R(c, x + 3 + s, y + 1, 10, 8, C.leaf); R(c, x + 1, y + 4, 4, 4, C.leafD); R(c, x + 11, y + 3, 4, 5, C.leafD);
    R(c, x + 6, y - 2, 4, 4, C.leafL); R(c, x + 5 + s, y + 3, 2, 2, C.leafL);
  } },
  bigPlant: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 7, 2);
    R(c, x + 3, y + 22, 10, 9, C.pot);
    const s = Math.sin(t * 1.5 + y) > 0.5 ? 1 : 0;
    R(c, x + 7, y + 8, 2, 14, C.leafD);
    R(c, x + 1 + s, y + 4, 14, 8, C.leaf); R(c, x + 3, y, 10, 6, C.leafL); R(c, x + 2, y + 12, 5, 6, C.leaf); R(c, x + 9, y + 13, 6, 5, C.leaf);
  } },
  bookshelf: { w: 2, h: 2, draw(c, x, y) {
    R(c, x, y, 32, 30, C.woodD); R(c, x + 2, y + 2, 28, 26, C.wood);
    for (let r = 0; r < 3; r++) { R(c, x + 3, y + 3 + r * 9, 26, 8, '#5a3a1e'); books(c, x + 4, y + 3 + r * 9 - 1, 24, r * 3 + x); }
  } },
  desk: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 2, 30, 8, C.woodL); R(c, x + 1, y + 10, 30, 3, C.wood);
    R(c, x + 2, y + 13, 2, 3, C.woodD); R(c, x + 28, y + 13, 2, 3, C.woodD);
    R(c, x + 6, y + 3, 8, 5, C.white); R(c, x + 7, y + 4, 6, 1, '#bbb'); R(c, x + 7, y + 6, 5, 1, '#bbb');
    R(c, x + 20, y + 1, 2, 6, '#e67e22');
  } },
  chair: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 15, 6, 2);
    R(c, x + 4, y + 1, 8, 5, C.woodD); R(c, x + 5, y + 2, 6, 1, C.woodL); R(c, x + 3, y + 6, 10, 6, C.wood); R(c, x + 3, y + 6, 10, 1, C.woodL); R(c, x + 4, y + 12, 2, 3, C.woodD); R(c, x + 10, y + 12, 2, 3, C.woodD);
  } },
  // 面向書桌（椅背在下方）
  chairUp: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 15, 6, 2);
    R(c, x + 4, y + 10, 2, 5, C.woodD); R(c, x + 10, y + 10, 2, 5, C.woodD);
    R(c, x + 3, y + 3, 10, 6, C.wood); R(c, x + 3, y + 3, 10, 1, C.woodL);
    R(c, x + 3, y + 8, 10, 5, C.woodD); R(c, x + 4, y + 9, 8, 1, C.woodL); R(c, x + 5, y + 11, 6, 1, '#5a3a1e');
  } },
  board: { w: 3, h: 1, wall: true, draw(c, x, y, t, o) {
    R(c, x + 1, y + 1, 46, 13, C.woodD); R(c, x + 3, y + 2, 42, 10, o.color || '#2f5d50');
    R(c, x + 6, y + 4, 14, 1, '#ffffffaa'); R(c, x + 6, y + 7, 22, 1, '#ffffffaa'); R(c, x + 6, y + 10, 10, 1, '#ffffffaa');
    R(c, x + 34, y + 4, 8, 6, '#ffd166');
  } },
  rug: { w: 5, h: 3, flat: true, draw(c, x, y, t, o) {
    const col = o.color || '#b33939';
    R(c, x + 2, y + 2, 76, 44, col); R(c, x + 5, y + 5, 70, 38, '#ffffff33'); R(c, x + 8, y + 8, 64, 32, col);
    for (let i = 0; i < 8; i++) R(c, x + 12 + i * 8, y + 22, 4, 4, '#ffffff44');
  } },
  trophy: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 7, 2);
    R(c, x + 2, y + 22, 12, 9, '#7f6a3a'); R(c, x + 4, y + 18, 8, 4, '#c9a227');
    R(c, x + 2, y + 4, 12, 12, '#f1c40f'); R(c, x, y + 5, 3, 6, '#f1c40f'); R(c, x + 13, y + 5, 3, 6, '#f1c40f');
    R(c, x + 6, y + 16, 4, 3, '#f1c40f'); R(c, x + 4, y + 6, 2, 6, '#fff3a0');
    if (Math.floor(t * 2) % 3 === 0) R(c, x + 12, y + 2, 2, 2, '#fff');
  } },
  uploadStation: { w: 2, h: 2, draw(c, x, y, t, o) {
    const g = 0.5 + 0.5 * Math.sin(t * 4);
    c.fillStyle = `rgba(255,214,0,${0.25 + g * 0.35})`; c.beginPath(); c.ellipse(x + 16, y + 28, 16, 5, 0, 0, 7); c.fill();
    R(c, x + 4, y + 10, 24, 18, '#3d3d5c'); R(c, x + 6, y + 12, 20, 10, '#7efff5');
    R(c, x + 8, y + 14, 16, 1, '#1e6f6a'); R(c, x + 8, y + 17, 10, 1, '#1e6f6a');
    R(c, x + 4, y + 24, 24, 4, o.color || '#ffd600');
    const ay = y - 6 + Math.round(Math.sin(t * 5) * 2);
    R(c, x + 14, ay, 4, 7, '#ffd600'); R(c, x + 11, ay + 3, 10, 2, '#ffd600'); R(c, x + 12, ay + 1, 8, 2, '#ffd600');
  } },
  sofa: { w: 3, h: 1, draw(c, x, y, t, o) {
    const col = o.color || '#6c7a89';
    shadow(c, x + 24, y + 15, 22, 2);
    R(c, x + 1, y, 46, 7, col); R(c, x + 1, y + 6, 46, 8, col); R(c, x + 4, y + 7, 40, 5, '#ffffff33');
    R(c, x, y + 2, 4, 12, '#00000033'); R(c, x + 44, y + 2, 4, 12, '#00000033');
  } },
  lamp: { w: 1, h: 1, draw(c, x, y, t) {
    R(c, x + 7, y + 4, 2, 11, C.metalD); R(c, x + 4, y + 14, 8, 2, C.metalD);
    R(c, x + 3, y - 2, 10, 6, '#ffe8a3'); c.fillStyle = 'rgba(255,240,170,.18)'; c.beginPath(); c.arc(x + 8, y + 2, 12, 0, 7); c.fill();
  } },

  // ===== 國文 =====
  inkDesk: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 3, 30, 8, '#5b3a29'); R(c, x + 2, y + 11, 3, 4, '#3e2619'); R(c, x + 27, y + 11, 3, 4, '#3e2619');
    R(c, x + 4, y + 4, 14, 6, '#fdf6e3'); R(c, x + 7, y + 5, 2, 4, '#222'); R(c, x + 11, y + 5, 2, 3, '#222'); R(c, x + 14, y + 6, 2, 3, '#222');
    R(c, x + 21, y + 5, 6, 4, '#222'); R(c, x + 25, y, 1, 7, '#d4a373'); R(c, x + 24, y + 6, 3, 2, '#111');
  } },
  bamboo: { w: 1, h: 2, draw(c, x, y, t) {
    R(c, x + 3, y + 26, 10, 6, '#7f8c8d');
    const s = Math.round(Math.sin(t * 1.3 + x) * 1);
    for (const bx of [4, 8, 11]) { R(c, x + bx + s, y + 2, 2, 25, '#55a630'); for (let k = 0; k < 4; k++) R(c, x + bx + s, y + 5 + k * 6, 2, 1, '#2b6a1a'); }
    R(c, x + 1 + s, y + 3, 5, 2, '#80b918'); R(c, x + 10 + s, y + 9, 5, 2, '#80b918'); R(c, x + 2 + s, y + 14, 5, 2, '#80b918');
  } },
  lantern: { w: 1, h: 1, draw(c, x, y, t) {
    const g = 0.6 + 0.4 * Math.sin(t * 7 + x);
    c.fillStyle = `rgba(255,120,60,${0.18 * g})`; c.beginPath(); c.arc(x + 8, y + 7, 13, 0, 7); c.fill();
    R(c, x + 7, y - 4, 2, 3, '#333'); R(c, x + 4, y - 1, 8, 2, '#b8860b');
    R(c, x + 2, y + 1, 12, 11, '#d62828'); R(c, x + 3, y + 3, 10, 7, `rgba(255,200,80,${g})`); R(c, x + 4, y + 12, 8, 2, '#b8860b');
    R(c, x + 7, y + 14, 2, 2, '#f1c40f');
  } },
  scrollStand: { w: 1, h: 2, draw(c, x, y) {
    shadow(c, x + 8, y + 31, 6, 2);
    R(c, x + 2, y + 1, 12, 2, '#5b3a29'); R(c, x + 3, y + 3, 10, 22, '#f8f0d8'); R(c, x + 2, y + 25, 12, 2, '#5b3a29');
    R(c, x + 7, y + 6, 2, 3, '#222'); R(c, x + 6, y + 11, 4, 2, '#222'); R(c, x + 7, y + 15, 2, 5, '#222'); R(c, x + 10, y + 20, 2, 2, '#c0392b');
    R(c, x + 7, y + 27, 2, 4, '#5b3a29');
  } },
  teaSet: { w: 1, h: 1, draw(c, x, y, t) {
    R(c, x + 1, y + 8, 14, 6, '#5b3a29'); R(c, x + 4, y + 3, 7, 6, '#e8e8e8'); R(c, x + 11, y + 5, 3, 2, '#e8e8e8'); R(c, x + 6, y + 2, 3, 1, '#ccc');
    const st = Math.floor(t * 3) % 3; R(c, x + 6 + st, y - 2 - st, 1, 2, '#ffffff88');
  } },
  // ===== 英文 =====
  phoneBooth: { w: 1, h: 2, draw(c, x, y) {
    shadow(c, x + 8, y + 31, 7, 2);
    R(c, x + 1, y, 14, 31, '#c0392b'); R(c, x + 3, y + 5, 10, 18, '#a8e0ff'); R(c, x + 3, y + 13, 10, 1, '#c0392b'); R(c, x + 7, y + 5, 1, 18, '#c0392b');
    R(c, x + 2, y + 1, 12, 3, '#222'); R(c, x + 4, y + 2, 8, 1, '#fff');
  } },
  abcBlocks: { w: 1, h: 1, draw(c, x, y) {
    R(c, x + 1, y + 8, 7, 7, '#e74c3c'); R(c, x + 8, y + 8, 7, 7, '#3498db'); R(c, x + 4, y + 1, 7, 7, '#f1c40f');
    R(c, x + 3, y + 10, 3, 3, '#fff'); R(c, x + 10, y + 10, 3, 3, '#fff'); R(c, x + 6, y + 3, 3, 3, '#fff');
  } },
  globe: { w: 1, h: 1, draw(c, x, y, t) {
    shadow(c, x + 8, y + 15, 5, 2);
    R(c, x + 6, y + 11, 4, 3, C.woodD); R(c, x + 4, y + 14, 8, 2, C.woodD);
    c.fillStyle = '#3a86ff'; c.beginPath(); c.arc(x + 8, y + 6, 6, 0, 7); c.fill();
    const o = Math.floor(t * 3) % 6;
    R(c, x + 3 + o, y + 3, 3, 3, '#38b000'); R(c, x + 5 + ((o + 3) % 6), y + 7, 3, 2, '#38b000');
  } },
  phonograph: { w: 1, h: 1, draw(c, x, y, t) {
    R(c, x + 2, y + 9, 12, 6, C.woodD); R(c, x + 3, y + 8, 10, 2, '#222');
    R(c, x + 8, y + 2, 2, 7, '#c9a227'); R(c, x + 6, y - 3, 9, 6, '#f1c40f'); R(c, x + 8, y - 2, 5, 4, '#a07a10');
    if (Math.floor(t * 2) % 2) { R(c, x + 1, y - 4, 2, 3, '#555'); R(c, x + 3, y - 4, 1, 1, '#555'); }
  } },
  mailbox: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 15, 5, 2);
    R(c, x + 4, y, 8, 14, '#c0392b'); R(c, x + 3, y, 10, 2, '#a5281b'); R(c, x + 5, y + 4, 6, 1, '#222'); R(c, x + 6, y + 8, 4, 2, '#f1c40f');
  } },
  // ===== 數學 =====
  abacus: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 15, 13, 2);
    R(c, x + 2, y + 2, 28, 12, C.woodD); R(c, x + 4, y + 4, 24, 8, '#f5e6c8'); R(c, x + 4, y + 7, 24, 1, C.woodD);
    for (let i = 0; i < 6; i++) { R(c, x + 6 + i * 4, y + 4, 2, 2, '#c0392b'); R(c, x + 6 + i * 4, y + 9 + (i % 2), 2, 2, '#c0392b'); }
  } },
  geoSolids: { w: 2, h: 1, draw(c, x, y, t) {
    shadow(c, x + 16, y + 15, 13, 2);
    R(c, x + 2, y + 6, 9, 9, '#3498db'); R(c, x + 4, y + 4, 9, 2, '#5dade2'); R(c, x + 11, y + 6, 2, 9, '#21618c');
    for (let i = 0; i < 7; i++) R(c, x + 18 - i / 1.5 + 0, y + 3 + i * 1.6, 1 + i * 1.3, 2, '#e67e22');
    const b = Math.round(Math.sin(t * 3) * 1.5);
    c.fillStyle = '#e74c3c'; c.beginPath(); c.arc(x + 27, y + 10 + b, 4, 0, 7); c.fill();
  } },
  easelPi: { w: 1, h: 2, draw(c, x, y) {
    R(c, x + 3, y + 16, 2, 15, C.woodD); R(c, x + 11, y + 16, 2, 15, C.woodD);
    R(c, x + 1, y + 2, 14, 16, '#fff'); R(c, x + 1, y + 2, 14, 1, C.woodD);
    R(c, x + 4, y + 6, 8, 2, '#c0392b'); R(c, x + 5, y + 8, 2, 6, '#c0392b'); R(c, x + 9, y + 8, 2, 6, '#c0392b');
  } },
  dice: { w: 1, h: 1, draw(c, x, y, t) {
    const b = Math.floor(t) % 6;
    R(c, x + 3, y + 5, 10, 10, '#fff'); R(c, x + 3, y + 14, 10, 1, '#bbb');
    const pips = [[[7, 9]], [[5, 7], [9, 11]], [[5, 7], [7, 9], [9, 11]], [[5, 7], [9, 7], [5, 11], [9, 11]], [[5, 7], [9, 7], [7, 9], [5, 11], [9, 11]], [[5, 6], [9, 6], [5, 9], [9, 9], [5, 12], [9, 12]]][b];
    pips.forEach(([a, d]) => R(c, x + a, y + d, 2, 2, '#222'));
  } },
  // ===== 公民 =====
  scales: { w: 1, h: 1, draw(c, x, y, t) {
    const tilt = Math.round(Math.sin(t * 1.5) * 1.5);
    R(c, x + 7, y + 2, 2, 12, '#c9a227'); R(c, x + 4, y + 13, 8, 2, '#c9a227');
    R(c, x + 1, y + 3 + tilt, 14, 1, '#c9a227');
    R(c, x, y + 6 + tilt, 5, 2, '#f1c40f'); R(c, x + 11, y + 6 - tilt, 5, 2, '#f1c40f');
  } },
  ballotBox: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 15, 6, 2);
    R(c, x + 2, y + 4, 12, 11, '#ecf0f1'); R(c, x + 2, y + 4, 12, 2, '#bdc3c7'); R(c, x + 5, y + 5, 6, 1, '#333');
    R(c, x + 6, y + 9, 4, 3, '#c0392b'); R(c, x + 7, y, 3, 5, '#fff');
  } },
  gavelDesk: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 2, 30, 12, '#4a2c1a'); R(c, x + 3, y + 4, 26, 3, '#6b4226'); R(c, x + 12, y + 9, 8, 3, '#c9a227');
    R(c, x + 20, y + 1, 7, 3, '#8b5a2b'); R(c, x + 22, y + 4, 2, 4, '#8b5a2b');
  } },
  flagStand: { w: 1, h: 2, draw(c, x, y, t, o) {
    R(c, x + 3, y + 1, 2, 29, '#bbb'); R(c, x + 1, y + 29, 6, 2, '#777');
    const w = Math.round(Math.sin(t * 4) * 1);
    R(c, x + 5, y + 2 + w, 10, 7, o.color || '#8e44ad'); R(c, x + 7, y + 4 + w, 4, 3, '#fff');
  } },
  // ===== 地理 =====
  mapTable: { w: 2, h: 2, draw(c, x, y, t) {
    shadow(c, x + 16, y + 30, 14, 3);
    R(c, x + 1, y + 6, 30, 20, C.woodD); R(c, x + 3, y + 8, 26, 16, '#a9d6e5');
    R(c, x + 6, y + 10, 8, 6, '#90be6d'); R(c, x + 16, y + 13, 10, 8, '#90be6d'); R(c, x + 9, y + 17, 4, 4, '#f9c74f');
    const p = Math.floor(t * 2) % 2; R(c, x + 20, y + 14 - p, 2, 3, '#e63946');
    R(c, x + 3, y + 26, 2, 5, C.woodD); R(c, x + 27, y + 26, 2, 5, C.woodD);
  } },
  mountain: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 12, 30, 3, C.woodD);
    for (let i = 0; i < 9; i++) { R(c, x + 4 + i, y + 12 - i, 18 - i * 2, 1, '#6a994e'); }
    for (let i = 0; i < 3; i++) R(c, x + 12 + i, y + 3 + i, 4 - i, 1, '#fff');
    for (let i = 0; i < 6; i++) R(c, x + 18 + i, y + 12 - i, 12 - i * 2, 1, '#7c8b5a');
  } },
  signpost: { w: 1, h: 2, draw(c, x, y) {
    R(c, x + 7, y + 4, 2, 27, C.woodD);
    R(c, x + 1, y + 5, 12, 4, '#e9c46a'); R(c, x + 12, y + 6, 2, 2, '#e9c46a');
    R(c, x + 3, y + 11, 12, 4, '#f4a261'); R(c, x + 2, y + 12, 2, 2, '#f4a261');
    R(c, x + 2, y + 17, 11, 4, '#2a9d8f');
  } },
  compass: { w: 1, h: 1, draw(c, x, y, t) {
    c.fillStyle = '#c9a227'; c.beginPath(); c.arc(x + 8, y + 9, 6, 0, 7); c.fill();
    c.fillStyle = '#fff8dc'; c.beginPath(); c.arc(x + 8, y + 9, 5, 0, 7); c.fill();
    const a = Math.sin(t) * 0.5;
    c.strokeStyle = '#e63946'; c.beginPath(); c.moveTo(x + 8, y + 9); c.lineTo(x + 8 + Math.sin(a) * 4, y + 9 - Math.cos(a) * 4); c.stroke();
  } },
  // ===== 歷史 =====
  vase: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 15, 5, 2);
    R(c, x + 5, y, 6, 2, '#1d4e89'); R(c, x + 6, y + 2, 4, 2, '#f1f1f1'); R(c, x + 3, y + 4, 10, 9, '#f1f1f1'); R(c, x + 5, y + 13, 6, 2, '#f1f1f1');
    R(c, x + 5, y + 6, 6, 1, '#1d4e89'); R(c, x + 4, y + 9, 3, 2, '#1d4e89'); R(c, x + 9, y + 9, 3, 2, '#1d4e89');
  } },
  armor: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 6, 2);
    R(c, x + 3, y + 28, 10, 3, C.woodD); R(c, x + 7, y + 20, 2, 8, C.woodD);
    R(c, x + 4, y + 2, 8, 7, '#8d99ae'); R(c, x + 5, y + 5, 6, 1, '#222'); R(c, x + 7, y - 1, 2, 3, '#c1121f');
    R(c, x + 2, y + 9, 12, 11, '#8d99ae'); R(c, x + 4, y + 11, 8, 1, '#edf2f4'); R(c, x + 4, y + 14, 8, 1, '#edf2f4');
    if (Math.floor(t * 1.5) % 4 === 0) R(c, x + 5, y + 3, 2, 1, '#fff');
  } },
  pillar: { w: 1, h: 2, draw(c, x, y) {
    shadow(c, x + 8, y + 31, 7, 2);
    R(c, x + 1, y, 14, 3, '#e5e5e5'); R(c, x + 3, y + 3, 10, 25, '#f2f2f2'); R(c, x + 1, y + 28, 14, 3, '#e5e5e5');
    R(c, x + 5, y + 3, 1, 25, '#cfcfcf'); R(c, x + 9, y + 3, 1, 25, '#cfcfcf');
  } },
  hourglass: { w: 1, h: 1, draw(c, x, y, t) {
    R(c, x + 3, y + 1, 10, 2, C.woodD); R(c, x + 3, y + 13, 10, 2, C.woodD);
    R(c, x + 4, y + 3, 8, 4, '#d6eaf8'); R(c, x + 6, y + 7, 4, 2, '#d6eaf8'); R(c, x + 4, y + 9, 8, 4, '#d6eaf8');
    const s = (t * 0.5) % 1; R(c, x + 5, y + 4 + Math.round(s * 2), 6, 3 - Math.round(s * 2), '#f4d03f'); R(c, x + 5, y + 12 - Math.round(s * 3), 6, 1 + Math.round(s * 3), '#f4d03f');
    R(c, x + 7, y + 7, 2, 4, '#f4d03f');
  } },
  bell: { w: 1, h: 2, draw(c, x, y, t) {
    R(c, x + 1, y + 2, 14, 2, C.woodD); R(c, x + 1, y + 4, 2, 27, C.woodD); R(c, x + 13, y + 4, 2, 27, C.woodD);
    const s = Math.round(Math.sin(t * 2) * 1);
    R(c, x + 4 + s, y + 6, 8, 12, '#9c7a3c'); R(c, x + 3 + s, y + 16, 10, 3, '#9c7a3c'); R(c, x + 6 + s, y + 9, 4, 1, '#c9a227');
  } },
  // ===== 理化 =====
  labBench: { w: 2, h: 1, draw(c, x, y, t) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 6, 30, 8, '#ecf0f1'); R(c, x + 1, y + 6, 30, 2, '#2d3436');
    R(c, x + 4, y - 2, 6, 8, '#a8e6cf'); R(c, x + 5, y + 1, 4, 5, '#2ecc71');
    R(c, x + 14, y - 4, 2, 6, '#dfe6e9'); R(c, x + 12, y + 2, 6, 4, '#ff7675');
    R(c, x + 23, y - 1, 6, 7, '#dfe6e9'); R(c, x + 24, y + 2, 4, 4, '#74b9ff');
    const b = Math.floor(t * 4) % 4; R(c, x + 6, y + 3 - b, 1, 1, '#fff'); R(c, x + 15, y - 1 - b, 1, 1, '#fff'); R(c, x + 26, y + 2 - (b % 3), 1, 1, '#fff');
  } },
  tesla: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 6, 2);
    R(c, x + 4, y + 26, 8, 5, '#2d3436'); R(c, x + 6, y + 10, 4, 16, '#b87333');
    for (let i = 0; i < 8; i++) R(c, x + 6, y + 11 + i * 2, 4, 1, '#8a5524');
    c.fillStyle = '#b2bec3'; c.beginPath(); c.arc(x + 8, y + 7, 5, 0, 7); c.fill();
    if (Math.floor(t * 10) % 3 !== 0) {
      c.strokeStyle = '#a29bfe'; c.beginPath(); c.moveTo(x + 8, y + 7);
      const a = t * 37; c.lineTo(x + 8 + Math.cos(a) * 5, y + 3 + Math.sin(a) * 4); c.lineTo(x + 8 + Math.cos(a) * 9, y + 6 + Math.sin(a * 1.3) * 6); c.stroke();
    }
  } },
  magnet: { w: 1, h: 1, draw(c, x, y, t) {
    R(c, x + 2, y + 3, 4, 10, '#e74c3c'); R(c, x + 10, y + 3, 4, 10, '#3498db'); R(c, x + 2, y + 11, 12, 3, '#888');
    R(c, x + 2, y + 1, 4, 2, '#ddd'); R(c, x + 10, y + 1, 4, 2, '#ddd');
    const k = Math.floor(t * 3) % 3; R(c, x + 7, y + 2 + k * 2, 2, 1, '#636e72');
  } },
  pendulum: { w: 1, h: 2, draw(c, x, y, t) {
    R(c, x + 1, y + 1, 14, 2, '#636e72'); R(c, x + 2, y + 3, 2, 28, '#636e72'); R(c, x + 1, y + 29, 14, 2, '#636e72');
    const a = Math.sin(t * 2.4) * 0.5;
    const ex = x + 9 + Math.sin(a) * 14, ey = y + 3 + Math.cos(a) * 18;
    c.strokeStyle = '#dfe6e9'; c.beginPath(); c.moveTo(x + 9, y + 3); c.lineTo(ex, ey); c.stroke();
    c.fillStyle = '#fdcb6e'; c.beginPath(); c.arc(ex, ey, 3, 0, 7); c.fill();
  } },
  // ===== 地科 =====
  telescope: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 7, 2);
    R(c, x + 3, y + 20, 2, 11, '#555'); R(c, x + 11, y + 20, 2, 11, '#555'); R(c, x + 7, y + 18, 2, 13, '#555');
    for (let i = 0; i < 6; i++) R(c, x + 2 + i * 2, y + 16 - i * 2, 6, 4, '#dfe6e9');
    R(c, x + 12, y + 4, 4, 4, '#2d3436');
    if (Math.floor(t * 2) % 2) R(c, x + 14, y + 1, 1, 1, '#ffeaa7');
  } },
  planets: { w: 2, h: 2, draw(c, x, y, t) {
    shadow(c, x + 16, y + 30, 12, 3);
    R(c, x + 15, y + 22, 2, 8, '#555'); R(c, x + 10, y + 29, 12, 2, '#555');
    c.fillStyle = '#fdcb6e'; c.beginPath(); c.arc(x + 16, y + 12, 5, 0, 7); c.fill();
    const orbit = [[9, 0.9, '#74b9ff', 2], [13, 0.5, '#e17055', 3]];
    orbit.forEach(([r, sp, col, s]) => {
      const a = t * sp; c.fillStyle = col; c.beginPath(); c.arc(x + 16 + Math.cos(a) * r, y + 12 + Math.sin(a) * r * 0.5, s, 0, 7); c.fill();
    });
  } },
  rocks: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 8, 30, 7, C.woodD);
    R(c, x + 3, y + 3, 7, 6, '#7f8c8d'); R(c, x + 4, y + 4, 2, 2, '#bdc3c7');
    R(c, x + 12, y + 2, 7, 7, '#c0392b'); R(c, x + 14, y + 3, 2, 3, '#e17055');
    R(c, x + 22, y + 4, 7, 5, '#dfe6e9'); R(c, x + 24, y + 5, 3, 1, '#a29bfe');
  } },
  volcano: { w: 2, h: 1, draw(c, x, y, t) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 12, 30, 3, C.woodD);
    for (let i = 0; i < 8; i++) R(c, x + 4 + i * 1.5, y + 12 - i, 24 - i * 3, 1, '#6d4c41');
    R(c, x + 14, y + 4, 4, 2, '#e74c3c');
    for (let k = 0; k < 3; k++) { const p = ((t * 0.8 + k / 3) % 1); R(c, x + 15 + Math.sin(p * 9 + k) * 2, y + 3 - p * 12, 3, 3, `rgba(180,180,180,${1 - p})`); }
  } },
  // ===== 生物 =====
  microscope: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 15, 5, 2);
    R(c, x + 3, y + 13, 10, 2, '#2d3436'); R(c, x + 9, y + 4, 2, 9, '#2d3436'); R(c, x + 5, y + 9, 6, 2, '#636e72');
    R(c, x + 5, y, 4, 8, '#b2bec3'); R(c, x + 5, y + 7, 3, 2, '#2d3436');
  } },
  aquarium: { w: 2, h: 1, draw(c, x, y, t) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 12, 30, 4, C.woodD); R(c, x + 1, y - 2, 30, 14, '#2d3436'); R(c, x + 2, y - 1, 28, 12, '#74c0fc');
    R(c, x + 2, y + 8, 28, 3, '#e9c46a'); R(c, x + 5, y + 3, 1, 5, '#2a9d8f'); R(c, x + 25, y + 2, 1, 6, '#2a9d8f');
    const fx = x + 4 + ((t * 10) % 22), fy = y + 3 + Math.sin(t * 2) * 1;
    R(c, fx, fy, 4, 2, '#ff7f50'); R(c, fx - 1, fy, 1, 2, '#ff7f50');
    const gx = x + 26 - ((t * 7) % 22); R(c, gx, y + 5, 3, 2, '#ffd166');
    if (Math.floor(t * 3) % 2) R(c, x + 12, y + ((Math.floor(t * 6)) % 8), 1, 1, '#fff');
  } },
  dna: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 6, 2);
    R(c, x + 4, y + 28, 8, 3, '#636e72');
    for (let i = 0; i < 12; i++) {
      const a = t * 2 + i * 0.6; const dx = Math.sin(a) * 5;
      R(c, x + 7 + dx, y + 2 + i * 2.2, 2, 2, '#e84393'); R(c, x + 7 - dx, y + 2 + i * 2.2, 2, 2, '#0984e3');
      if (i % 2 === 0) R(c, x + 8 - Math.abs(dx), y + 2.5 + i * 2.2, Math.abs(dx) * 2, 1, '#dfe6e9');
    }
  } },
  skeleton: { w: 1, h: 2, draw(c, x, y, t) {
    R(c, x + 7, y + 22, 2, 9, '#636e72'); R(c, x + 4, y + 29, 8, 2, '#636e72');
    R(c, x + 5, y + 1, 6, 6, '#f5f6fa'); R(c, x + 6, y + 3, 1, 2, '#222'); R(c, x + 9, y + 3, 1, 2, '#222');
    R(c, x + 7, y + 7, 2, 12, '#f5f6fa'); for (let i = 0; i < 4; i++) R(c, x + 4, y + 9 + i * 2, 8, 1, '#f5f6fa');
    const s = Math.round(Math.sin(t * 2)); R(c, x + 2, y + 9 + s, 2, 8, '#f5f6fa'); R(c, x + 12, y + 9 - s, 2, 8, '#f5f6fa');
    R(c, x + 5, y + 19, 2, 6, '#f5f6fa'); R(c, x + 9, y + 19, 2, 6, '#f5f6fa');
  } },
  flowers: { w: 1, h: 1, draw(c, x, y, t) {
    R(c, x + 3, y + 10, 10, 5, '#8d6e63');
    const s = Math.round(Math.sin(t * 2 + x));
    [[4, '#ff6b6b'], [8, '#ffd93d'], [11, '#c77dff']].forEach(([fx, col], i) => {
      R(c, x + fx, y + 4 + i, 1, 6, C.leafD); R(c, x + fx - 1 + s, y + 2 + i, 3, 3, col);
    });
  } },
  // ===== 大廳 =====
  roundTable: { w: 3, h: 3, draw(c, x, y, t) {
    const g = 0.5 + 0.5 * Math.sin(t * 3);
    c.fillStyle = `rgba(255,215,0,${0.15 + g * 0.2})`; c.beginPath(); c.ellipse(x + 24, y + 28, 26, 18, 0, 0, 7); c.fill();
    shadow(c, x + 24, y + 38, 18, 5);
    c.fillStyle = C.woodD; c.beginPath(); c.ellipse(x + 24, y + 25, 19, 13, 0, 0, 7); c.fill();
    c.fillStyle = C.woodL; c.beginPath(); c.ellipse(x + 24, y + 23, 18, 12, 0, 0, 7); c.fill();
    c.fillStyle = '#ffe08a'; c.beginPath(); c.ellipse(x + 24, y + 22, 8, 5, 0, 0, 7); c.fill();
    // 全息投影
    const h = Math.round(Math.sin(t * 2) * 2);
    R(c, x + 20, y + 6 + h, 8, 8, `rgba(120,255,255,${0.4 + g * 0.3})`); R(c, x + 22, y + 8 + h, 4, 4, 'rgba(255,255,255,.7)');
    // 椅子
    [[2, 18], [40, 18], [21, 40], [21, -2]].forEach(([cx, cy]) => { R(c, x + cx, y + cy, 7, 7, '#8e5b34'); R(c, x + cx + 1, y + cy + 1, 5, 4, '#b07a4f'); });
  } },
  countdown: { w: 8, h: 1, wall: true, draw(c, x, y, t) {
    const g = 0.6 + 0.4 * Math.sin(t * 5);
    R(c, x, y - 2, 128, 17, '#1a1a2e');
    c.strokeStyle = `rgba(255,60,90,${g})`; c.lineWidth = 2; c.strokeRect(x + 2, y - 1, 124, 14); c.lineWidth = 1;
    c.fillStyle = `rgba(255,60,90,${0.15 * g})`; c.fillRect(x - 4, y - 6, 136, 26);
  } },
  mural: { w: 8, h: 1, wall: true, draw(c, x, y, t) {
    R(c, x, y - 2, 128, 17, '#1e2a3a');
    SUBJECTS.forEach((s, i) => {
      const lv = roomLevel(s);
      R(c, x + 6 + i * 13, y + 11 - lv, 9, lv + 1, s.color);
    });
    R(c, x + 2, y + 12, 124, 1, '#ffffff55');
  } },
  reception: { w: 4, h: 1, draw(c, x, y, t) {
    shadow(c, x + 32, y + 15, 30, 2);
    R(c, x + 1, y + 2, 62, 12, '#5d6d7e'); R(c, x + 1, y + 2, 62, 3, '#aeb6bf'); R(c, x + 6, y + 7, 52, 4, '#85929e');
    R(c, x + 44, y - 4, 10, 7, '#2d3436'); R(c, x + 45, y - 3, 8, 5, Math.floor(t * 2) % 2 ? '#55efc4' : '#00b894');
    R(c, x + 10, y - 1, 6, 4, '#fdcb6e');
  } },
  fountain: { w: 2, h: 2, draw(c, x, y, t) {
    c.fillStyle = '#95a5a6'; c.beginPath(); c.ellipse(x + 16, y + 22, 15, 8, 0, 0, 7); c.fill();
    c.fillStyle = '#74b9ff'; c.beginPath(); c.ellipse(x + 16, y + 21, 12, 6, 0, 0, 7); c.fill();
    R(c, x + 14, y + 8, 4, 13, '#bdc3c7');
    for (let k = 0; k < 6; k++) { const p = (t * 1.2 + k / 6) % 1; const dir = k % 2 ? 1 : -1; R(c, x + 16 + dir * p * 10, y + 6 + (p - 0.5) ** 2 * 40 - 10, 2, 2, '#dff9fb'); }
  } },
  vending: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 7, 2);
    R(c, x + 1, y + 1, 14, 30, '#d63031'); R(c, x + 3, y + 3, 10, 16, '#dfe6e9');
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) R(c, x + 4 + k * 3, y + 4 + r * 5, 2, 4, ['#0984e3', '#fdcb6e', '#00b894'][(r + k) % 3]);
    R(c, x + 4, y + 22, 8, 3, '#2d3436'); R(c, x + 12, y + 21, 2, 2, Math.floor(t * 2) % 2 ? '#55efc4' : '#2d3436');
  } },
  // ===== 修練室 =====
  dummy: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 6, 2);
    R(c, x + 7, y + 20, 2, 11, C.woodD); R(c, x + 4, y + 29, 8, 2, C.woodD);
    const w = Math.round(Math.sin(t * 3 + x) * 1);
    R(c, x + 4 + w, y + 2, 8, 7, '#e1b382'); R(c, x + 3 + w, y + 9, 10, 11, '#c89666'); R(c, x + 1 + w, y + 11, 14, 3, '#c89666');
    R(c, x + 6 + w, y + 13, 4, 4, '#c0392b'); R(c, x + 7 + w, y + 14, 2, 2, '#fff');
  } },
  mat: { w: 7, h: 5, flat: true, draw(c, x, y) {
    R(c, x + 2, y + 2, 108, 76, '#3d6b5a'); R(c, x + 6, y + 6, 100, 68, '#4f8a74');
    c.strokeStyle = '#ffffff55'; c.beginPath(); c.arc(x + 56, y + 40, 22, 0, 7); c.stroke();
  } },
  weaponRack: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 10, 30, 4, C.woodD); R(c, x + 2, y - 6, 2, 16, C.woodD); R(c, x + 28, y - 6, 2, 16, C.woodD);
    R(c, x + 8, y - 8, 2, 18, '#bdc3c7'); R(c, x + 7, y + 4, 4, 2, '#c0392b');
    R(c, x + 15, y - 8, 2, 18, C.woodL); R(c, x + 14, y - 10, 4, 3, '#7f8c8d');
    R(c, x + 22, y - 6, 2, 16, '#3ad1ff');
  } },
  altar: { w: 3, h: 2, draw(c, x, y, t) {
    const g = 0.5 + 0.5 * Math.sin(t * 3);
    c.fillStyle = `rgba(170,120,255,${0.2 + g * 0.3})`; c.beginPath(); c.ellipse(x + 24, y + 26, 26, 9, 0, 0, 7); c.fill();
    R(c, x + 4, y + 14, 40, 14, '#4b3b6b'); R(c, x + 4, y + 14, 40, 3, '#7d6aa8');
    R(c, x + 10, y + 2 + Math.round(Math.sin(t * 2) * 2), 28, 12, '#f8f0d8');
    R(c, x + 8, y + 2 + Math.round(Math.sin(t * 2) * 2), 3, 12, '#8b5a2b'); R(c, x + 37, y + 2 + Math.round(Math.sin(t * 2) * 2), 3, 12, '#8b5a2b');
    R(c, x + 15, y + 6 + Math.round(Math.sin(t * 2) * 2), 18, 1, '#555'); R(c, x + 15, y + 9 + Math.round(Math.sin(t * 2) * 2), 12, 1, '#555');
  } },
  // ===== 書房 =====
  readingDesk: { w: 3, h: 2, draw(c, x, y, t) {
    const g = 0.5 + 0.5 * Math.sin(t * 3);
    c.fillStyle = `rgba(80,200,255,${0.15 + g * 0.2})`; c.beginPath(); c.ellipse(x + 24, y + 26, 26, 8, 0, 0, 7); c.fill();
    shadow(c, x + 24, y + 30, 22, 3);
    R(c, x + 2, y + 8, 44, 14, '#6e4524'); R(c, x + 2, y + 8, 44, 3, '#8d5a30'); R(c, x + 4, y + 22, 3, 8, '#4a2c1a'); R(c, x + 41, y + 22, 3, 8, '#4a2c1a');
    R(c, x + 8, y + 2, 14, 10, '#fff'); R(c, x + 22, y + 2, 14, 10, '#f3f3f3'); R(c, x + 21, y + 2, 2, 10, '#c0392b');
    R(c, x + 10, y + 4, 9, 1, '#999'); R(c, x + 10, y + 7, 7, 1, '#999'); R(c, x + 25, y + 4, 8, 1, '#999');
    R(c, x + 40, y + 2, 4, 6, '#f1c40f');
  } },
  cabinet: { w: 1, h: 2, draw(c, x, y) {
    shadow(c, x + 8, y + 31, 7, 2);
    R(c, x + 1, y + 2, 14, 29, '#7f8c8d'); for (let i = 0; i < 4; i++) { R(c, x + 2, y + 4 + i * 7, 12, 6, '#95a5a6'); R(c, x + 6, y + 6 + i * 7, 4, 1, '#2d3436'); }
  } },
  // ===== 城門 =====
  gate: { w: 3, h: 2, draw(c, x, y, t) {
    const g = 0.5 + 0.5 * Math.sin(t * 2.5);
    R(c, x, y - 6, 48, 38, '#57606f'); R(c, x, y - 6, 48, 4, '#747d8c');
    R(c, x + 6, y + 2, 36, 30, '#2f3542');
    c.fillStyle = `rgba(80,255,180,${0.35 + g * 0.4})`; c.fillRect(x + 8, y + 4, 32, 28);
    for (let k = 0; k < 5; k++) { const p = (t * 0.7 + k / 5) % 1; R(c, x + 10 + k * 6, y + 30 - p * 26, 2, 2, `rgba(255,255,255,${1 - p})`); }
    R(c, x + 18, y - 4, 12, 3, '#f1c40f');
  } },
  torch: { w: 1, h: 1, draw(c, x, y, t) {
    const g = 0.6 + 0.4 * Math.sin(t * 9 + x);
    c.fillStyle = `rgba(255,150,40,${0.2 * g})`; c.beginPath(); c.arc(x + 8, y + 2, 12, 0, 7); c.fill();
    R(c, x + 7, y + 4, 2, 11, C.woodD);
    R(c, x + 5, y - 2 + (g > 0.8 ? -1 : 0), 6, 6, '#ff9f1a'); R(c, x + 6, y, 4, 3, '#fff200');
  } },
  ticketBooth: { w: 2, h: 1, draw(c, x, y, t) {
    shadow(c, x + 16, y + 15, 14, 2);
    R(c, x + 1, y + 2, 30, 12, '#e1b12c'); R(c, x + 1, y + 2, 30, 3, '#fbc531');
    R(c, x + 10, y + 6, 12, 5, '#fff'); R(c, x + 12, y + 7, 8, 1, '#c0392b'); R(c, x + 12, y + 9, 6, 1, '#c0392b');
  } },
  // ===== 室外 =====
  tree: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 8, 3);
    R(c, x + 6, y + 20, 4, 11, '#6d4c41');
    const s = Math.round(Math.sin(t + x * 0.3) * 0.8);
    R(c, x + 1 + s, y + 8, 14, 13, '#2d6a4f'); R(c, x + 3 + s, y + 2, 10, 8, '#40916c'); R(c, x + 5 + s, y - 2, 6, 5, '#52b788');
  } },
  bush: { w: 1, h: 1, draw(c, x, y) {
    R(c, x + 1, y + 6, 14, 9, '#40916c'); R(c, x + 3, y + 3, 10, 5, '#52b788'); R(c, x + 4, y + 8, 2, 2, '#e63946');
  } },
};

// 設定每種家具顏色用的小幫手
// 家具自動加上深色描邊：先畫到小畫布，再把描邊算出來（靜態家具會快取，動態的每秒更新 15 次）
const PROP_OUTLINE = [26, 19, 32];
const _propStatic = new Map();
const _propAnim = new WeakMap();
const PROP_STATIC = new Set(['desk', 'chair', 'chairUp', 'bookshelf', 'sofa', 'inkDesk', 'scrollStand', 'abcBlocks', 'mailbox', 'phoneBooth', 'abacus', 'easelPi',
  'ballotBox', 'gavelDesk', 'mountain', 'signpost', 'vase', 'pillar', 'rocks', 'microscope', 'reception', 'weaponRack', 'cabinet', 'ticketBooth', 'bush', 'rock',
  'bench', 'boxes', 'paperStack', 'signboard', 'mat', 'tree']);
function _outlineProp(def, p, t) {
  const pad = 10, top = 18;
  const cv = document.createElement('canvas');
  cv.width = p.w * T + pad * 2; cv.height = p.h * T + top + pad;
  const c = cv.getContext('2d');
  def.draw(c, pad, top, t, p);
  const img = c.getImageData(0, 0, cv.width, cv.height), d = img.data, W = cv.width, H = cv.height;
  const a = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[(y * W + x) * 4 + 3];
  const mark = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (a(x, y) >= 100) continue;
    if (a(x - 1, y) >= 200 || a(x + 1, y) >= 200 || a(x, y - 1) >= 200 || a(x, y + 1) >= 200) mark.push((y * W + x) * 4);
  }
  mark.forEach(i => { d[i] = PROP_OUTLINE[0]; d[i + 1] = PROP_OUTLINE[1]; d[i + 2] = PROP_OUTLINE[2]; d[i + 3] = 255; });
  c.putImageData(img, 0, 0);
  return { cv, pad, top };
}
function drawProp(c, p, t) {
  const def = PROPS[p.type];
  if (!def) return;
  if (def.wall || def.flat || def.ground || p.noOutline) { def.draw(c, p.px, p.py, t, p); return; }
  let o;
  if (PROP_STATIC.has(p.type)) {
    const key = p.type + '|' + (p.color || '');
    o = _propStatic.get(key);
    if (!o) { o = _outlineProp(def, p, 0); _propStatic.set(key, o); }
  } else {
    const frame = Math.floor(t * 15) + (typeof nightLevel === 'function' ? Math.round(nightLevel() * 3) * 100000 : 0);
    const slot = _propAnim.get(p);
    if (slot && slot.frame === frame) o = slot.o;
    else { o = _outlineProp(def, p, t + (p.px % 97) * 0.13); _propAnim.set(p, { frame, o }); }
  }
  c.drawImage(o.cv, Math.round(p.px - o.pad), Math.round(p.py - o.top));
}

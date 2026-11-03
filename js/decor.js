// ===== 加強版裝飾：窗戶、時鐘、海報、路燈、長椅……以及光源設定 =====

// 依照現在時間決定天色（0 = 白天，1 = 深夜）
function nightLevel() {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7 && h < 17) return 0;
  if (h >= 17 && h < 19.5) return (h - 17) / 2.5;
  if (h >= 4.5 && h < 7) return 1 - (h - 4.5) / 2.5;
  return 1;
}
function skyColors() {
  const n = nightLevel();
  if (n <= 0) return ['#7ec8f5', '#cdeeff'];
  if (n < 0.6) return ['#f08a5d', '#ffd1a1'];
  return ['#1b1f4a', '#3a3f7a'];
}

Object.assign(PROPS, {
  window: { w: 2, h: 1, wall: true, draw(c, x, y, t, o) {
    const [a, b] = skyColors();
    R(c, x + 2, y + 1, 28, 13, '#e8e2d6');
    const g = c.createLinearGradient(0, y + 2, 0, y + 12); g.addColorStop(0, a); g.addColorStop(1, b);
    c.fillStyle = g; c.fillRect(x + 4, y + 2, 24, 10);
    if (nightLevel() < 0.6) { const cx = x + 4 + ((t * 2 + x) % 30) - 4; R(c, cx, y + 4, 6, 2, '#ffffffcc'); R(c, cx + 1, y + 3, 3, 1, '#ffffffcc'); }
    else { R(c, x + 21, y + 3, 3, 3, '#fff6c8'); if (Math.floor(t * 2 + x) % 5 === 0) R(c, x + 8, y + 5, 1, 1, '#fff'); R(c, x + 13, y + 8, 1, 1, '#fffbe0'); }
    R(c, x + 15, y + 2, 2, 10, '#e8e2d6'); R(c, x + 4, y + 7, 24, 1, '#e8e2d6');
    R(c, x + 1, y + 13, 30, 2, '#cfc6b4');
    const cur = o.color || '#c0392b';
    R(c, x, y, 4, 13, cur); R(c, x + 28, y, 4, 13, cur); R(c, x + 1, y, 1, 13, '#ffffff33'); R(c, x + 29, y, 1, 13, '#ffffff33');
    R(c, x - 1, y - 1, 34, 1, '#8d6e63');
  } },
  clock: { w: 1, h: 1, wall: true, draw(c, x, y) {
    const d = new Date();
    c.fillStyle = '#5d4037'; c.beginPath(); c.arc(x + 8, y + 7, 6.5, 0, 7); c.fill();
    c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(x + 8, y + 7, 5.2, 0, 7); c.fill();
    const hand = (ang, len, col) => { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 8, y + 7); c.lineTo(x + 8 + Math.sin(ang) * len, y + 7 - Math.cos(ang) * len); c.stroke(); };
    hand((d.getHours() % 12 + d.getMinutes() / 60) / 12 * Math.PI * 2, 2.8, '#222');
    hand(d.getMinutes() / 60 * Math.PI * 2, 4.2, '#222');
    hand(d.getSeconds() / 60 * Math.PI * 2, 4.5, '#e74c3c');
  } },
  poster: { w: 1, h: 1, wall: true, draw(c, x, y, t, o) {
    R(c, x + 2, y, 12, 14, '#fdfdfd'); R(c, x + 3, y + 1, 10, 7, o.color || '#3498db');
    R(c, x + 4, y + 9, 8, 1, '#999'); R(c, x + 4, y + 11, 6, 1, '#bbb'); R(c, x + 7, y - 1, 2, 2, '#e74c3c');
    R(c, x + 5, y + 3, 3, 3, '#ffffff99');
  } },
  painting: { w: 2, h: 1, wall: true, draw(c, x, y, t, o) {
    R(c, x + 2, y, 28, 14, '#b8862b'); R(c, x + 4, y + 2, 24, 10, o.color || '#7fb3d5');
    R(c, x + 4, y + 8, 24, 4, '#6a9955'); R(c, x + 8, y + 5, 6, 4, '#4f7942'); R(c, x + 18, y + 4, 8, 5, '#5d8a4a');
    R(c, x + 22, y + 3, 3, 3, '#fff3b0'); R(c, x + 2, y, 28, 1, '#e5b961');
  } },
  wallShelf: { w: 2, h: 1, wall: true, draw(c, x, y, t, o) {
    R(c, x + 1, y + 10, 30, 3, '#8d6e63'); R(c, x + 2, y + 13, 2, 2, '#5d4037'); R(c, x + 28, y + 13, 2, 2, '#5d4037');
    books(c, x + 3, y + 1, 14, x % 7);
    R(c, x + 20, y + 5, 5, 5, '#e8e8e8'); R(c, x + 21, y + 3, 3, 2, '#3c9d4e');
    R(c, x + 26, y + 6, 3, 4, o.color || '#f1c40f');
  } },
  noticeBoard: { w: 2, h: 1, wall: true, draw(c, x, y, t) {
    R(c, x + 1, y, 30, 14, '#8d5a30'); R(c, x + 3, y + 2, 26, 10, '#d7b98e');
    [['#fff9c4', 4, 3], ['#c8e6c9', 12, 4], ['#ffcdd2', 20, 3], ['#bbdefb', 8, 8]].forEach(([col, px, py]) => { R(c, x + px, y + py, 7, 6, col); R(c, x + px + 3, y + py - 1, 1, 1, '#e74c3c'); });
  } },
  bench: { w: 2, h: 1, draw(c, x, y) {
    shadow(c, x + 16, y + 14, 14, 2);
    R(c, x + 1, y + 1, 30, 4, '#a1887f'); R(c, x + 1, y + 1, 30, 1, '#d7ccc8');
    R(c, x + 1, y + 6, 30, 4, '#8d6e63'); R(c, x + 1, y + 6, 30, 1, '#bcaaa4');
    R(c, x + 3, y + 10, 2, 4, '#4e342e'); R(c, x + 27, y + 10, 2, 4, '#4e342e');
  } },
  lampPost: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 4, 1.5);
    R(c, x + 7, y + 6, 2, 25, '#37474f'); R(c, x + 5, y + 29, 6, 2, '#263238');
    R(c, x + 4, y + 1, 8, 6, '#37474f'); R(c, x + 5, y + 2, 6, 4, nightLevel() > 0.3 ? '#fff3b0' : '#e0e6ea'); R(c, x + 6, y - 1, 4, 2, '#263238');
  } },
  flowerBed: { w: 2, h: 1, draw(c, x, y, t) {
    R(c, x + 1, y + 4, 30, 11, '#795548'); R(c, x + 2, y + 5, 28, 8, '#5d4037');
    const cols = ['#ff6b81', '#ffd93d', '#a29bfe', '#ff9f43', '#fff'];
    for (let i = 0; i < 7; i++) { const s = Math.round(Math.sin(t * 2 + i + x) * 0.6); R(c, x + 3 + i * 4, y + 5, 1, 4, '#3c9d4e'); R(c, x + 2 + i * 4 + s, y + 2 + (i % 2) * 2, 3, 3, cols[(i + x) % 5]); }
  } },
  rock: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 14, 6, 2);
    R(c, x + 3, y + 7, 10, 7, '#8d99a6'); R(c, x + 4, y + 5, 7, 3, '#a4b0bd'); R(c, x + 5, y + 6, 3, 2, '#c8d0d8'); R(c, x + 10, y + 9, 3, 5, '#6c7a89');
  } },
  stoneLantern: { w: 1, h: 2, draw(c, x, y, t) {
    shadow(c, x + 8, y + 31, 6, 2);
    R(c, x + 4, y + 26, 8, 5, '#9e9e9e'); R(c, x + 6, y + 16, 4, 10, '#b0b0b0');
    R(c, x + 3, y + 8, 10, 8, '#9e9e9e'); R(c, x + 5, y + 10, 6, 4, nightLevel() > 0.3 ? '#ffd27a' : '#5a5a5a');
    R(c, x + 1, y + 5, 14, 3, '#8a8a8a'); R(c, x + 5, y + 2, 6, 3, '#8a8a8a');
  } },
  signboard: { w: 3, h: 2, draw(c, x, y) {
    shadow(c, x + 24, y + 31, 16, 2);
    R(c, x + 6, y + 14, 3, 17, '#5d4037'); R(c, x + 39, y + 14, 3, 17, '#5d4037');
    R(c, x + 1, y + 1, 46, 16, '#8d5a30'); R(c, x + 3, y + 3, 42, 12, '#f5e6c8'); R(c, x + 1, y + 1, 46, 1, '#c08a55');
  } },
  pond: { w: 5, h: 3, ground: true, draw(c, x, y, t) {
    c.fillStyle = '#8d7b68'; c.beginPath(); c.ellipse(x + 40, y + 24, 39, 22, 0, 0, 7); c.fill();
    c.fillStyle = '#4fa3d1'; c.beginPath(); c.ellipse(x + 40, y + 24, 35, 19, 0, 0, 7); c.fill();
    c.fillStyle = '#7cc4ea'; c.beginPath(); c.ellipse(x + 34, y + 20, 22, 9, 0, 0, 7); c.fill();
    for (let k = 0; k < 3; k++) { const p = (t * 0.4 + k / 3) % 1; c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`; c.beginPath(); c.ellipse(x + 26 + k * 14, y + 24 + (k % 2) * 4, 3 + p * 8, 1.5 + p * 3, 0, 0, 7); c.stroke(); }
    R(c, x + 52, y + 26, 6, 3, '#3c9d4e'); R(c, x + 54, y + 25, 2, 1, '#ff8fab');
    R(c, x + 18, y + 16, 5, 2, '#3c9d4e');
    const fx = x + 30 + Math.sin(t * 0.8) * 12, fy = y + 28 + Math.cos(t * 0.8) * 4; R(c, fx, fy, 4, 2, '#ff7f50');
  } },
  corridorRug: { w: 1, h: 1, flat: true, draw(c, x, y) {
    R(c, x, y + 3, 16, 10, '#8e2b2b'); R(c, x, y + 4, 16, 1, '#d4a35a'); R(c, x, y + 11, 16, 1, '#d4a35a');
    R(c, x + 6, y + 7, 4, 2, '#d4a35a');
  } },
  sideTable: { w: 1, h: 1, draw(c, x, y, t) {
    shadow(c, x + 8, y + 15, 6, 2);
    R(c, x + 2, y + 6, 12, 3, '#a0704a'); R(c, x + 3, y + 9, 2, 6, '#6e4524'); R(c, x + 11, y + 9, 2, 6, '#6e4524');
    R(c, x + 5, y + 1, 5, 5, '#f4f4f4'); R(c, x + 6, y + 2, 3, 1, '#8d5a30');
    const st = Math.floor(t * 3) % 3; R(c, x + 7 + (st % 2), y - 2 - st, 1, 2, '#ffffff88');
  } },
  boxes: { w: 1, h: 1, draw(c, x, y) {
    shadow(c, x + 8, y + 15, 7, 2);
    R(c, x + 1, y + 6, 10, 9, '#c8a165'); R(c, x + 1, y + 6, 10, 2, '#e0bd85'); R(c, x + 5, y + 6, 2, 9, '#a07d45');
    R(c, x + 7, y + 1, 8, 7, '#b38b55'); R(c, x + 7, y + 1, 8, 2, '#d9b47c');
  } },
  paperStack: { w: 1, h: 1, draw(c, x, y) {
    R(c, x + 3, y + 8, 10, 6, '#f2f2f2'); R(c, x + 4, y + 6, 10, 6, '#ffffff'); R(c, x + 5, y + 4, 9, 6, '#fafafa');
    R(c, x + 6, y + 6, 6, 1, '#aaa'); R(c, x + 6, y + 8, 4, 1, '#aaa'); R(c, x + 3, y + 13, 10, 1, '#cfcfcf');
  } },
});

// 光源：[相對 x, 相對 y, 半徑, 顏色]，白天會很淡、晚上會很亮
const LIGHTS = {
  lamp: [8, 2, 40, '255,220,140'], lantern: [8, 7, 36, '255,120,60'], torch: [8, 1, 40, '255,150,50'],
  lampPost: [8, 4, 56, '255,230,150'], stoneLantern: [8, 12, 30, '255,200,110'],
  uploadStation: [16, 16, 34, '120,255,245'], roundTable: [24, 12, 50, '255,220,120'], gate: [24, 16, 60, '80,255,180'],
  tesla: [8, 7, 30, '170,150,255'], aquarium: [16, 4, 30, '120,200,255'], altar: [24, 10, 48, '180,130,255'],
  readingDesk: [24, 8, 38, '255,230,160'], vending: [8, 10, 26, '255,255,255'], fountain: [16, 14, 30, '160,220,255'],
  countdown: [64, 6, 80, '255,60,90'], trophy: [8, 10, 28, '255,220,80'], planets: [16, 12, 30, '255,210,120'],
};

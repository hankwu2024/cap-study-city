// ===== 角色、小貓、敵人：高解析度像素圖（用程式繪製）+ 自動描邊 + 自動明暗 =====
// 每張圖用 2 倍解析度畫，再以一半大小顯示，所以細節是原本的兩倍。

const SPRITE_OUTLINE = [26, 19, 32];
const _spriteCache = {};

// ---------- 繪圖小工具（在格子上畫） ----------
function _grid(w, h) { return Array.from({ length: h }, () => Array(w).fill('.')); }
function _put(g, x, y, k) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = k; }
function _rect(g, x, y, w, h, k) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) _put(g, x + i, y + j, k); }
function _ell(g, cx, cy, rx, ry, k) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) _put(g, x, y, k);
  }
}
function _poly(g, pts, k) {
  const ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= cy && y2 > cy) || (y2 <= cy && y1 > cy)) xs.push(x1 + (cy - y1) / (y2 - y1) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) _put(g, x, y, k);
  }
}
function _line(g, x0, y0, x1, y1, k) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) _put(g, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, k);
}

function _hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function _mix(c, t, k) { return c.map((v, i) => Math.round(v + (t[i] - v) * k)); }

// 把格子畫成圖：自動描邊 + 依照邊緣做亮面／暗面
function _render(g, pal, flat) {
  const h = g.length, w = g[0].length;
  const cv = document.createElement('canvas'); cv.width = w + 2; cv.height = h + 2;
  const c = cv.getContext('2d');
  const img = c.createImageData(w + 2, h + 2), d = img.data;
  const key = (x, y) => (y < 0 || y >= h || x < 0 || x >= w) ? '.' : g[y][x];
  const set = (x, y, rgb) => { const i = ((y + 1) * (w + 2) + (x + 1)) * 4; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; };
  const flatSet = new Set((flat || '').split(''));
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
    const k = key(x, y);
    if (k === '.') {
      if (key(x - 1, y) !== '.' || key(x + 1, y) !== '.' || key(x, y - 1) !== '.' || key(x, y + 1) !== '.') set(x, y, SPRITE_OUTLINE);
      continue;
    }
    let rgb = _hex(pal[k] || '#ff00ff');
    if (!flatSet.has(k)) {
      const up = key(x, y - 1) !== k, lf = key(x - 1, y) !== k, dn = key(x, y + 1) !== k, rt = key(x + 1, y) !== k;
      const up2 = key(x, y - 2) !== k, dn2 = key(x, y + 2) !== k;
      if (dn || rt) rgb = _mix(rgb, [20, 10, 40], dn ? 0.32 : 0.2);
      else if (dn2) rgb = _mix(rgb, [20, 10, 40], 0.14);
      else if (up || lf) rgb = _mix(rgb, [255, 250, 235], up ? 0.3 : 0.18);
      else if (up2) rgb = _mix(rgb, [255, 250, 235], 0.12);
    }
    set(x, y, rgb);
  }
  c.putImageData(img, 0, 0);
  return cv;
}

function _legRuns(row, keys) {
  const runs = []; let s = -1;
  for (let x = 0; x <= row.length; x++) {
    const on = x < row.length && row[x] !== '.' && (!keys || keys.includes(row[x]));
    if (on && s < 0) s = x;
    if (!on && s >= 0) { runs.push([s, x - 1]); s = -1; }
  }
  return runs;
}
// 走路：最下面 legRows 列是腳（只看 legKeys 顏色），第 1、3 格輪流把一隻腳抬高 lift 像素
function _walkFrames(base, pal, flat, legRows, lift, pairs, legKeys) {
  const H = base.length, frames = [];
  for (let f = 0; f < 4; f++) {
    const g = base.map(r => r.slice());
    if (f === 1 || f === 3) {
      const moves = [];
      for (let y = H - legRows; y < H; y++) {
        _legRuns(base[y], legKeys).forEach((run, i) => {
          const lifted = pairs ? (i % 2 === (f === 1 ? 0 : 1)) : (i === (f === 1 ? 0 : 1));
          if (lifted) moves.push([y, run]);
        });
      }
      moves.forEach(([y, run]) => {
        const fill = run[0] > 0 && base[y][run[0] - 1] !== '.' && !(legKeys || '').includes(base[y][run[0] - 1]) ? base[y][run[0] - 1] : '.';
        for (let x = run[0]; x <= run[1]; x++) g[y][x] = fill;
      });
      moves.forEach(([y, run]) => { for (let x = run[0]; x <= run[1]; x++) if (y - lift >= 0) g[y - lift][x] = base[y][x]; });
    }
    frames.push(_render(g, pal, flat));
  }
  return frames;
}

const CHARACTERS = [
  {
    id: 'chiling', name: '赤翎', title: '赤翎騎士', tag: '武俠 × 騎士',
    desc: '頭盔插著赤紅羽翎、圍著紅圍巾的小騎士，鐵甲之下是一步也不退的決心。',
    hp: 7, shield: 6, energy: 160, weapons: ['blade', 'pistol'],
    skill: { name: '鐵壁反擊', desc: '架起鐵壁 3.5 秒：不會受傷，碰到的敵方子彈全部反彈回去', cd: 10, type: 'guard' },
  },
  {
    id: 'fengxing', name: '銀隼', title: '護目鏡槍手', tag: '科幻 × 日常',
    desc: '白髮、頭戴護目鏡、紅圍巾隨風飄的槍手，背著帆布包到處闖蕩。',
    hp: 6, shield: 4, energy: 200, weapons: ['smg', 'pistol'],
    skill: { name: '火力全開', desc: '5 秒內射速提升為約 3 倍、開槍不耗能量，移動也變快', cd: 13, type: 'overdrive' },
  },
  {
    id: 'feihu', name: '緋狐', title: '狐火巫女', tag: '魔法',
    desc: '紅髮狐耳、披著火紋斗篷的小巫女，身邊總飄著幾團小狐火。',
    hp: 4, shield: 5, energy: 240, weapons: ['fire', 'staff'],
    skill: { name: '狐火環繞', desc: '召喚 5 團狐火繞著自己轉 7 秒，燒傷碰到的敵人並擋下敵方子彈', cd: 11, type: 'foxfire' },
  },
  {
    id: 'yeren', name: '夜刃', title: '赤龍武者', tag: '武俠 × 科幻',
    desc: '白髮赤角、戴著赤紅面甲的武者，背後盤踞著一條赤龍之魂。',
    hp: 5, shield: 6, energy: 180, weapons: ['laser', 'pistol'],
    skill: { name: '赤龍咆哮', desc: '赤龍咆哮震退周圍敵人，並放出貫穿一切的赤龍衝向前方', cd: 9, type: 'dragon' },
  },
];
const CHAR = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
const CHAR_MIGRATE = { lingxiao: 'chiling', xiaoju: 'fengxing', xingyu: 'feihu', tieyu: 'yeren' };

// 載入角色圖（data URL，不受 file:// 限制）
const _charImg = {};
function _charSheet(id) {
  if (_charImg[id]) return _charImg[id].complete && _charImg[id].naturalWidth ? _charImg[id] : null;
  const im = new Image(); im.src = CHAR_SHEETS[id].src; _charImg[id] = im; return null;
}
Object.keys(CHAR_SHEETS).forEach(_charSheet);

// (x, y) 是腳底中心；dir 0下 1上 2左 3右。上下走時保持上一次的左右朝向
function drawChar(c, ch, x, y, dir, t, moving) {
  t = Math.abs(t);
  const S = CHAR_SHEETS[ch.id], img = _charSheet(ch.id);
  if (dir === 2) c._charFace = -1; else if (dir === 3) c._charFace = 1;
  const face = c._charFace || 1;
  let f;
  if (moving) f = 3 + Math.floor(t * 9) % 4;
  else f = (t % 3.3) < 0.14 ? 2 : Math.floor(t * 1.6) % 2;
  x = Math.round(x); y = Math.round(y);
  const s = S.scale, w = S.w * s, h = S.h * s;
  shadow(c, x, y, Math.max(7, w * 0.3), 2.5);
  if (!img) return;
  const top = y - h + 1;
  // 光環：緋狐的狐火、夜刃的赤龍會發光脈動
  if (S.glow !== 'none') {
    const p = 0.5 + 0.5 * Math.sin(t * 4);
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y - h * 0.55, 2, x, y - h * 0.55, w * 0.7);
    const col = S.glow === 'dragon' ? '255,40,70' : '255,140,40';
    g.addColorStop(0, `rgba(${col},${0.22 + 0.12 * p})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(x - w, y - h * 1.3, w * 2, h * 1.6);
    c.restore();
  }
  c.save(); c.translate(x, 0); c.scale(face, 1);
  c.drawImage(img, f * S.w, 0, S.w, S.h, -w / 2, top, w, h);
  if (S.glow === 'dragon') {   // 赤龍氣場閃爍
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.07 + 0.07 * Math.sin(t * 5);
    c.drawImage(img, f * S.w, 0, S.w, S.h, -w / 2, top, w, h);
  }
  c.restore();
}

// ---------- 小貓 ----------
const CAT_PAL = { O: '#f5a03a', o: '#d27519', w: '#fff3e2', k: '#2a1a14', P: '#ff9fb0', G: '#8fd14f' };
function _catArt(pose) {
  const g = _grid(28, 22);
  if (pose === 'walk') {
    _line(g, 3, 12, 1, 4, 'O'); _line(g, 4, 12, 2, 4, 'O'); _ell(g, 2.5, 3.5, 1.6, 1.6, 'o');
    _rect(g, 5, 16, 3, 6, 'O'); _rect(g, 9, 16, 3, 6, 'O'); _rect(g, 16, 16, 3, 6, 'O'); _rect(g, 20, 16, 3, 6, 'O');
    _rect(g, 5, 20, 3, 2, 'w'); _rect(g, 9, 20, 3, 2, 'w'); _rect(g, 16, 20, 3, 2, 'w'); _rect(g, 20, 20, 3, 2, 'w');
    _ell(g, 13, 13, 10, 4.5, 'O'); _ell(g, 14, 15.5, 6, 2, 'w');
    [8, 11, 14].forEach(x => _rect(g, x, 9, 1, 4, 'o'));
    _ell(g, 22, 9, 5.5, 5, 'O');
    _poly(g, [[17, 6], [18, 0], [21, 4]], 'O'); _poly(g, [[22, 4], [25, 0], [26, 6]], 'O'); _put(g, 18, 3, 'P'); _put(g, 24, 3, 'P');
    _ell(g, 24.5, 11, 2.8, 1.8, 'w'); _put(g, 27, 10, 'P');
    _rect(g, 23, 8, 2, 2, 'k'); _put(g, 24, 8, 'G');
    _rect(g, 19, 7, 1, 1, 'o'); _rect(g, 21, 5, 1, 2, 'o');
  } else {
    // 坐著
    _ell(g, 13, 15, 7, 6.5, 'O'); _ell(g, 14, 16, 4, 4.5, 'w');
    _rect(g, 9, 19, 3, 3, 'O'); _rect(g, 16, 19, 3, 3, 'O'); _rect(g, 9, 21, 3, 1, 'w'); _rect(g, 16, 21, 3, 1, 'w');
    _poly(g, [[6, 21], [3, 20], [2, 16], [4, 14], [5, 18], [9, 20]], 'O');
    _ell(g, 15, 8, 6, 5.5, 'O');
    _poly(g, [[9, 6], [10, 0], [13, 4]], 'O'); _poly(g, [[17, 4], [20, 0], [21, 6]], 'O'); _put(g, 10, 3, 'P'); _put(g, 19, 3, 'P');
    _ell(g, 15, 10.5, 3, 1.8, 'w'); _put(g, 15, 9, 'P');
    if (pose === 'sleep') { _rect(g, 11, 8, 3, 1, 'k'); _rect(g, 17, 8, 3, 1, 'k'); }
    else { _rect(g, 11, 7, 2, 2, 'k'); _rect(g, 17, 7, 2, 2, 'k'); _put(g, 12, 7, 'G'); _put(g, 18, 7, 'G'); }
    [12, 15, 18].forEach(x => _rect(g, x, 3, 1, 2, 'o'));
  }
  return g;
}
function catFrames(pose) {
  const key = 'cat:' + pose;
  if (_spriteCache[key]) return _spriteCache[key];
  const g = _catArt(pose);
  return (_spriteCache[key] = pose === 'walk' ? _walkFrames(g, CAT_PAL, 'kPG', 4, 2, true) : [_render(g, CAT_PAL, 'kPG')]);
}
function drawCatSprite(c, x, y, pose, dir, t) {
  const fr = catFrames(pose);
  const img = fr[pose === 'walk' ? Math.floor(Math.abs(t) * 8) % 4 : 0];
  const w = img.width / 2, h = img.height / 2;
  x = Math.round(x); y = Math.round(y);
  shadow(c, x, y, 6, 2);
  const breathe = pose !== 'walk' && Math.floor(t * 1.2) % 2 ? -0.5 : 0;
  if (dir === 2) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.drawImage(img, -w / 2, y - h + 1 + breathe, w, h); c.restore(); }
  else c.drawImage(img, x - w / 2, y - h + 1 + breathe, w, h);
}

// ---------- 敵人 ----------
const ENEMY_ART = {
  slime() {
    const g = _grid(26, 20);
    _ell(g, 13, 12, 12, 7.5, 'G'); _ell(g, 13, 7, 7, 4, 'G');
    _ell(g, 8, 8, 2.5, 1.5, 'w'); _put(g, 12, 6, 'w');
    _rect(g, 8, 11, 2, 3, 'k'); _rect(g, 16, 11, 2, 3, 'k'); _put(g, 8, 11, 'w'); _put(g, 16, 11, 'w');
    _rect(g, 12, 15, 3, 1, 'k');
    return [g, { G: '#6cc04a', w: '#e9ffd8', k: '#1d2b14' }, 'wk'];
  },
  bat(f) {
    const g = _grid(30, 20);
    if (f) { _poly(g, [[12, 9], [1, 2], [4, 9], [1, 13], [7, 12]], 'P'); _poly(g, [[18, 9], [29, 2], [26, 9], [29, 13], [23, 12]], 'P'); }
    else { _poly(g, [[12, 10], [1, 16], [5, 11], [2, 7], [8, 8]], 'P'); _poly(g, [[18, 10], [29, 16], [25, 11], [28, 7], [22, 8]], 'P'); }
    _ell(g, 15, 10, 6, 6, 'B'); _poly(g, [[10, 6], [11, 0], [14, 5]], 'B'); _poly(g, [[16, 5], [19, 0], [20, 6]], 'B');
    _rect(g, 12, 9, 2, 2, 'E'); _rect(g, 17, 9, 2, 2, 'E'); _put(g, 14, 13, 'w'); _put(g, 16, 13, 'w');
    return [g, { P: '#5b2a8c', B: '#7e3fb8', E: '#ff4d6d', w: '#ffffff' }, 'Ew'];
  },
  archer() {
    const g = _grid(26, 32);
    _rect(g, 9, 25, 3, 5, 'L'); _rect(g, 14, 25, 3, 5, 'L'); _rect(g, 8, 29, 4, 3, 'k'); _rect(g, 14, 29, 4, 3, 'k');
    _rect(g, 7, 16, 12, 10, 'T'); _rect(g, 7, 22, 12, 2, 'L'); _rect(g, 12, 22, 2, 2, 'Y');
    _ell(g, 13, 10, 7.5, 6.5, 'S'); _poly(g, [[6, 9], [0, 4], [6, 13]], 'S'); _poly(g, [[20, 9], [26, 4], [20, 13]], 'S');
    _poly(g, [[5, 8], [13, 0], [21, 8], [19, 6], [13, 3], [7, 6]], 'H');
    _rect(g, 9, 10, 2, 2, 'E'); _rect(g, 15, 10, 2, 2, 'E'); _rect(g, 11, 14, 4, 1, 'k');
    _line(g, 22, 10, 24, 18, 'W'); _line(g, 24, 18, 22, 26, 'W'); _line(g, 22, 10, 22, 26, 'Q');
    return [g, { S: '#7fd88e', H: '#3f6b3a', T: '#d97b29', L: '#6b4a2b', Y: '#f3c13a', k: '#22201c', E: '#ffef5c', W: '#8b5a2b', Q: '#e8e2d0' }, 'EQ'];
  },
  wisp(f) {
    const g = _grid(24, 28);
    _poly(g, f ? [[4, 16], [7, 4], [10, 10], [12, 0], [15, 9], [18, 3], [20, 16]] : [[4, 16], [6, 6], [10, 11], [13, 2], [15, 10], [19, 5], [20, 16]], 'C');
    _ell(g, 12, 17, 8.5, 8, 'C'); _ell(g, 12, 18, 5.5, 5.5, 'c');
    _rect(g, 9, 16, 2, 3, 'k'); _rect(g, 14, 16, 2, 3, 'k');
    return [g, { C: '#52e3e8', c: '#c9fbff', k: '#103a4a' }, 'ck'];
  },
  knight() {
    const g = _grid(28, 34);
    _rect(g, 9, 27, 4, 5, 'D'); _rect(g, 15, 27, 4, 5, 'D'); _rect(g, 8, 31, 5, 3, 'k'); _rect(g, 15, 31, 5, 3, 'k');
    _rect(g, 7, 15, 14, 13, 'A'); _rect(g, 13, 16, 2, 10, 'D');
    _ell(g, 14, 9, 7, 7, 'A'); _rect(g, 9, 9, 10, 2, 'k'); _rect(g, 11, 9, 6, 1, 'E');
    _poly(g, [[12, 2], [14, -1], [16, 2]], 'R');
    _ell(g, 4.5, 21, 4.5, 6.5, 'S'); _rect(g, 4, 18, 1, 6, 'Y');
    _rect(g, 22, 10, 2, 16, 'W'); _rect(g, 20, 20, 6, 2, 'Y');
    return [g, { A: '#8e98a8', D: '#5a6373', k: '#22252c', E: '#ff3b3b', R: '#d63a44', S: '#6d4c3d', Y: '#e5b84a', W: '#d8dee6' }, 'E'];
  },
  boss(th) {
    const g = _grid(60, 60);
    const body = ['#4caf50', '#d84a3a', '#7d5fe8'][th];
    _ell(g, 30, 38, 27, 20, 'B'); _ell(g, 30, 30, 20, 14, 'B');
    _ell(g, 30, 44, 16, 9, 'b');
    _poly(g, [[14, 18], [16, 6], [22, 13], [30, 2], [38, 13], [44, 6], [46, 18]], 'Y');
    [[16, 8], [30, 4], [44, 8]].forEach(([x, y]) => _ell(g, x, y, 2, 2, 'J'));
    _ell(g, 21, 29, 5, 5.5, 'w'); _ell(g, 39, 29, 5, 5.5, 'w'); _ell(g, 22, 30, 2.5, 3, 'k'); _ell(g, 38, 30, 2.5, 3, 'k');
    _poly(g, [[15, 22], [26, 25], [25, 23]], 'k'); _poly(g, [[45, 22], [34, 25], [35, 23]], 'k');
    _ell(g, 30, 41, 11, 5, 'k'); for (let i = 0; i < 6; i++) _poly(g, [[20 + i * 4, 37], [22 + i * 4, 37], [21 + i * 4, 40]], 'w');
    _ell(g, 8, 44, 5, 4, 'B'); _ell(g, 52, 44, 5, 4, 'B');
    return [g, { B: body, b: '#ffffff33'.slice(0, 7), Y: '#f5c542', J: '#4fd1ff', w: '#ffffff', k: '#1c1420' }, 'wkJ'];
  },
};
function enemyFrames(type, th = 0) {
  const key = 'en:' + type + ':' + th;
  if (_spriteCache[key]) return _spriteCache[key];
  const make = f => { const [g, pal, flat] = ENEMY_ART[type](type === 'boss' ? th : f); if (type === 'boss') pal.b = _shadeHex(pal.B, 0.25); return _render(g, pal, flat); };
  const frames = (type === 'bat' || type === 'wisp') ? [make(0), make(1)] : [make(0)];
  // 受傷時的白色剪影
  const white = frames.map(cv => { const w = document.createElement('canvas'); w.width = cv.width; w.height = cv.height; const x = w.getContext('2d'); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, w.width, w.height); return w; });
  return (_spriteCache[key] = { frames, white });
}
function _shadeHex(hex, k) { const c = _mix(_hex(hex), [255, 255, 255], k); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }

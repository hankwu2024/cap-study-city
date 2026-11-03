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

// ---------- 四位角色 ----------
// 每隻角色由程式一筆一筆畫在 32×40 的格子上（顯示時縮成一半，所以細節是一般像素圖的兩倍）
// ph = 0/1：圍巾、羽翎、尾巴、披風的飄動；blink = 眨眼
const CW = 32, CH = 40;
function _legs(g, x1, x2, legCol, bootCol, w = 4, trim) {
  _rect(g, x1, 31, w, 6, legCol); _rect(g, x2, 31, w, 6, legCol);
  _rect(g, x1 - 1, 36, w + 1, 4, bootCol); _rect(g, x2, 36, w + 1, 4, bootCol);
  if (trim) { _rect(g, x1 - 1, 36, w + 1, 1, trim); _rect(g, x2, 36, w + 1, 1, trim); }
}

const CHAR_ART = {
  // 赤翎：紅羽鐵衛
  chiling(dir, ph) {
    const g = _grid(CW, CH);
    const side = dir === 'side', back = dir === 'up';
    // 背上的劍與圓盾
    if (back) { _ell(g, 16, 25, 7, 6.5, 'Q'); _ell(g, 16, 25, 4.5, 4, 'q'); _ell(g, 16, 25, 1.5, 1.5, 'G'); }
    if (!back && !side) { _rect(g, 25, 14, 2, 10, 'M'); _rect(g, 23, 23, 6, 1, 'G'); }
    if (side) _legs(g, 13, 19, 'F', 'k', 4, 'G'); else _legs(g, 11, 17, 'F', 'k', 4, 'G');
    // 膝甲
    if (side) { _rect(g, 13, 32, 4, 2, 'B'); _rect(g, 19, 32, 4, 2, 'B'); } else { _rect(g, 11, 32, 4, 2, 'B'); _rect(g, 17, 32, 4, 2, 'B'); }
    if (side) {
      _rect(g, 11, 22, 11, 10, 'B'); _ell(g, 16, 28, 6, 5, 'B');
      _rect(g, 11, 25, 11, 1, 'b'); _rect(g, 10, 29, 13, 2, 'L'); _rect(g, 19, 29, 2, 2, 'G');
      _rect(g, 9, 29, 3, 4, 'L'); _put(g, 10, 30, 'G');
      // 腰間的劍
      _line(g, 8, 30, 3, 36, 'M'); _rect(g, 9, 28, 1, 4, 'G');
    } else {
      _ell(g, 8.5, 24, 3.8, 3.2, 'B'); _ell(g, 23.5, 24, 3.8, 3.2, 'B');
      _rect(g, 6, 22, 5, 1, 'b'); _rect(g, 21, 22, 5, 1, 'b');
      _rect(g, 6, 25, 4, 6, 'B'); _rect(g, 22, 25, 4, 6, 'B');
      _ell(g, 8, 31.5, 2.3, 2, 'F'); _ell(g, 24, 31.5, 2.3, 2, 'F');
      _rect(g, 10, 22, 12, 9, 'B'); _ell(g, 16, 28, 7, 4, 'B');
      if (!back) {
        _rect(g, 15, 23, 2, 6, 'b'); _rect(g, 11, 26, 4, 1, 'b'); _rect(g, 17, 26, 4, 1, 'b');
        _put(g, 12, 23, 'W'); _put(g, 13, 23, 'W');
        _put(g, 11, 24, 'G'); _put(g, 20, 24, 'G');
      } else { _rect(g, 11, 26, 10, 1, 'b'); }
      _rect(g, 10, 29, 12, 2, 'L'); if (!back) { _rect(g, 15, 29, 2, 2, 'G'); _rect(g, 19, 29, 3, 3, 'L'); _put(g, 20, 30, 'G'); }
    }
    // 紅圍巾（有褶痕和流蘇，會隨風飄）
    if (side) {
      _ell(g, 15, 21, 8, 3, 'S'); _line(g, 10, 21, 20, 21, 's');
      _poly(g, [[9, 20], [13, 21], [8 - ph, 30], [3 - ph, 29 + ph], [6, 25]], 'S'); _line(g, 10, 22, 5 - ph, 28, 's');
      _rect(g, 17, 24, 3, 6, 'B'); _ell(g, 18.5, 30.5, 2, 2, 'F');
    } else if (back) {
      _ell(g, 16, 21, 9, 3, 'S'); _line(g, 9, 21, 23, 21, 's');
      _poly(g, [[12, 21], [20, 21], [19 + ph, 31], [16, 29], [13 + ph, 31]], 'S'); _line(g, 16, 22, 16, 28, 's');
    } else {
      _ell(g, 16, 21, 9, 3, 'S'); _line(g, 9, 21, 23, 21, 's'); _put(g, 12, 20, 'W');
      _poly(g, [[6, 21], [11, 21], [10, 30], [5 - ph, 31], [7 - ph, 26]], 'S'); _line(g, 8, 22, 7 - ph, 29, 's');
      _put(g, 6 - ph, 31, 's'); _put(g, 8 - ph, 31, 's');
    }
    // 頭盔
    _ell(g, 16, 11.5, 10, 10, 'H');
    _rect(g, 7, 19, 18, 1, 'h');
    if (side) {
      _rect(g, 17, 9, 10, 8, 'h'); _ell(g, 25.5, 13, 1.5, 4, 'h');
      [19, 21, 23, 25].forEach(x => _rect(g, x, 11, 1, 4, 'V'));
      _rect(g, 17, 9, 10, 1, 'H');
      _put(g, 13, 14, 'G'); _put(g, 11, 17, 'G'); _put(g, 15, 18, 'G');
      _rect(g, 9, 4, 1, 1, 'W'); _rect(g, 10, 3, 2, 1, 'W'); _put(g, 8, 6, 'W');
    } else if (back) {
      _rect(g, 15, 2, 2, 17, 'h');
      [9, 12, 20, 23].forEach(x => _put(g, x, 18, 'G'));
      _rect(g, 10, 5, 1, 2, 'W');
    } else {
      _rect(g, 8, 9, 16, 8, 'h'); _ell(g, 16, 17, 7, 1.5, 'h'); _rect(g, 8, 9, 16, 1, 'H');
      [10, 12, 14, 17, 19, 21].forEach(x => _rect(g, x, 11, 1, 4, 'V'));
      _rect(g, 15, 2, 2, 7, 'h');
      [7, 24].forEach(x => _put(g, x, 14, 'G')); [9, 12, 20, 23].forEach(x => _put(g, x, 19, 'G'));
      _rect(g, 10, 5, 1, 2, 'W'); _rect(g, 11, 4, 2, 1, 'W'); _put(g, 20, 4, 'W');
    }
    // 紅羽翎（一絲一絲的羽毛）
    const pl = side ? [[13, 1.5, 5, 2], [7.5, 3.2, 4, 2.2], [3.5, 6.5 + ph * 0.5, 3, 2.4], [2 - ph * 0.5, 10 + ph, 1.8, 2]]
      : [[14, 1.2, 5, 2], [8.5, 2.8, 4, 2.2], [4.5, 6 + ph * 0.5, 3, 2.4], [3 - ph * 0.5, 9.5 + ph, 1.8, 2]];
    pl.forEach(([x, y, rx, ry]) => _ell(g, x, y, rx, ry, 'R'));
    _line(g, pl[0][0] + 3, pl[0][1], pl[3][0] + 1, pl[3][1], 'r');
    [[11, 1], [7, 3], [4, 6]].forEach(([x, y]) => _put(g, x + (side ? -1 : 0), y + 1, 'r'));
    _put(g, pl[0][0], pl[0][1] - 1, 'p'); _put(g, pl[1][0], pl[1][1] - 1, 'p');
    return g;
  },

  // 風行：大草帽遊俠
  fengxing(dir, ph, blink) {
    const g = _grid(CW, CH);
    const side = dir === 'side', back = dir === 'up';
    if (side) _legs(g, 13, 19, 'F', 'k', 4, 'n'); else _legs(g, 11, 17, 'F', 'k', 4, 'n');
    // 外套、皮帶、扣子
    if (side) {
      _rect(g, 11, 22, 10, 10, 'B'); _ell(g, 16, 30, 6, 3, 'B'); _rect(g, 11, 28, 10, 2, 'n'); _rect(g, 18, 28, 2, 2, 'G');
      _rect(g, 9, 28, 3, 4, 'n'); _put(g, 10, 29, 'G');
      _rect(g, 17, 25, 3, 6, 'B'); _ell(g, 18.5, 31, 1.8, 1.8, 'K');
    } else {
      _rect(g, 10, 22, 12, 10, 'B'); _ell(g, 16, 30, 7, 3, 'B');
      _rect(g, 7, 25, 3, 6, 'B'); _rect(g, 22, 25, 3, 6, 'B'); _ell(g, 8.5, 31.5, 1.8, 1.8, 'K'); _ell(g, 23.5, 31.5, 1.8, 1.8, 'K');
      _rect(g, 10, 28, 12, 2, 'n');
      if (!back) { _rect(g, 15, 23, 2, 5, 'b'); _put(g, 14, 24, 'G'); _put(g, 14, 26, 'G'); _rect(g, 15, 28, 2, 2, 'G'); _rect(g, 19, 28, 3, 4, 'n'); _put(g, 20, 29, 'G'); }
    }
    // 大紅圍巾（有條紋，末端破破的）
    if (side) {
      _ell(g, 15, 22, 8, 3.5, 'C'); _line(g, 9, 22, 21, 22, 'c');
      _poly(g, [[9, 20], [13, 22], [8 - ph, 31], [1 - ph, 30 + ph], [5, 26], [2 - ph, 24]], 'C');
      _line(g, 10, 22, 4 - ph, 28, 'c'); _put(g, 3 - ph, 31, 'c');
    } else if (back) {
      _ell(g, 16, 22, 11, 3.5, 'C');
      _poly(g, [[6, 22], [26, 22], [27 + ph, 33], [21, 31], [16, 34], [11, 31], [5 - ph, 33]], 'C');
      _line(g, 7, 26, 25, 26, 'c'); _line(g, 7, 29, 26, 29, 'c');
    } else {
      _ell(g, 16, 22, 11, 3.5, 'C'); _line(g, 7, 22, 25, 22, 'c');
      _poly(g, [[4, 22], [9, 22], [8, 30], [2 - ph, 33], [4 - ph, 27]], 'C'); _line(g, 5, 25, 8, 25, 'c'); _line(g, 4, 28, 8, 28, 'c');
      _poly(g, [[23, 22], [28, 22], [29 + ph, 29], [25, 31]], 'C'); _line(g, 24, 25, 28, 25, 'c');
    }
    // 陰影中的臉 + 發光的眼睛
    if (side) _ell(g, 18, 16, 7, 5.5, 'D'); else _ell(g, 16, 16, 8, 5.5, 'D');
    if (!back) {
      const eyes = side ? [21] : [11, 18];
      eyes.forEach(x => {
        if (blink) _rect(g, x, 17, 3, 1, 'E');
        else { _rect(g, x, 15, 3, 3, 'E'); _put(g, x + 1, 15, 'W'); _put(g, x - 1, 16, 'e'); _put(g, x + 3, 16, 'e'); }
      });
      // 嘴裡叼的草
      if (side) { _line(g, 23, 19, 31, 15, 'Q'); _put(g, 31, 14, 'P'); _put(g, 30, 13, 'P'); _put(g, 29, 14, 'Q'); }
      else { _line(g, 20, 19, 29, 15 - ph, 'Q'); _put(g, 29, 14 - ph, 'P'); _put(g, 28, 13 - ph, 'P'); _put(g, 27, 14 - ph, 'Q'); }
    }
    // 大草帽：帽冠、帽帶、帽簷邊、編織紋
    if (side) {
      _ell(g, 15, 11, 15, 4, 'T'); _ell(g, 13.5, 6.5, 7.5, 5.5, 'T'); _rect(g, 6, 9, 15, 2, 'q'); _put(g, 19, 9, 'G');
      _line(g, 1, 12, 29, 12, 't'); [4, 8, 22, 26].forEach(x => _put(g, x, 10, 't'));
      _line(g, 9, 4, 12, 3, 'U'); _put(g, 8, 6, 'U');
    } else {
      _ell(g, 16, 11, 15.5, 4, 'T'); _ell(g, 16, 6.5, 8, 5.5, 'T'); _rect(g, 8, 9, 16, 2, 'q'); _rect(g, 21, 9, 2, 2, 'G');
      _rect(g, 15, 2, 2, 3, 't'); _line(g, 1, 12, 31, 12, 't'); [3, 6, 25, 28].forEach(x => _put(g, x, 10, 't'));
      if (!back) { _line(g, 10, 4, 13, 2, 'U'); _put(g, 9, 6, 'U'); }
    }
    return g;
  },

  // 緋狐：紅髮狐耳巫女
  feihu(dir, ph, blink) {
    const g = _grid(CW, CH);
    const side = dir === 'side', back = dir === 'up';
    // 尾巴（漸層到白色尾尖，會擺動）
    const tail = (cx, cy) => { _ell(g, cx, cy, 5, 6, 'A'); _ell(g, cx + 0.8, cy - 2.5, 3.6, 3.6, 'a2'); _ell(g, cx + 1.5, cy - 4.5, 3, 3, 'X'); _line(g, cx - 3, cy + 2, cx + 1, cy - 3, 'a'); };
    if (!back) { if (side) tail(5 - ph, 29); else tail(25 + ph, 30); }
    // 腳與鞋（鞋上有蝴蝶結）
    if (side) { _rect(g, 14, 32, 3, 5, 'F'); _rect(g, 19, 32, 3, 5, 'F'); _rect(g, 13, 36, 4, 4, 's'); _rect(g, 19, 36, 4, 4, 's'); _put(g, 15, 36, 'O'); _put(g, 21, 36, 'O'); }
    else { _rect(g, 12, 32, 3, 5, 'F'); _rect(g, 17, 32, 3, 5, 'F'); _rect(g, 11, 36, 4, 4, 's'); _rect(g, 17, 36, 4, 4, 's'); _put(g, 13, 36, 'O'); _put(g, 18, 36, 'O'); }
    // 身後的長髮
    if (!side) { _rect(g, 5, 14, 5, 17, 'A'); _rect(g, 22, 14, 5, 17, 'A'); _ell(g, 7 - ph * 0.5, 31, 2.5, 2, 'A'); _ell(g, 24.5 + ph * 0.5, 31, 2.5, 2, 'A'); _line(g, 7, 16, 7, 30, 'a'); _line(g, 24, 16, 24, 30, 'a'); }
    else { _poly(g, [[6, 12], [14, 12], [13, 31], [6 - ph, 32]], 'A'); _line(g, 9, 14, 9, 30, 'a'); }
    // 洋裝：泡泡袖、白色荷葉邊、圍裙、鈴鐺
    if (side) {
      _poly(g, [[13, 22], [21, 22], [23, 33], [11, 33]], 'D'); _rect(g, 11, 32, 13, 1, 'W'); _line(g, 16, 23, 15, 32, 'd');
      _ell(g, 18, 24, 2.5, 2, 'D'); _rect(g, 17, 25, 3, 5, 'D'); _ell(g, 18.5, 30.5, 1.6, 1.6, 'K'); _rect(g, 17, 29, 3, 1, 'W');
    } else {
      _poly(g, [[11, 22], [21, 22], [24, 33], [8, 33]], 'D'); _rect(g, 8, 32, 17, 1, 'W'); [10, 13, 16, 19, 22].forEach(x => _put(g, x, 33, 'W'));
      _ell(g, 9.5, 23.5, 2.5, 2, 'D'); _ell(g, 22.5, 23.5, 2.5, 2, 'D');
      _rect(g, 8, 24, 3, 6, 'D'); _rect(g, 21, 24, 3, 6, 'D'); _rect(g, 8, 29, 3, 1, 'W'); _rect(g, 21, 29, 3, 1, 'W');
      _ell(g, 9.5, 31.2, 1.6, 1.6, 'K'); _ell(g, 22.5, 31.2, 1.6, 1.6, 'K');
      if (!back) {
        _poly(g, [[13, 25], [19, 25], [20, 32], [12, 32]], 'Z'); _rect(g, 12, 31, 9, 1, 'W'); _put(g, 13, 26, 'z'); _put(g, 18, 26, 'z');
        _ell(g, 16, 24, 1.5, 1.5, 'O'); _put(g, 16, 25, 'o');
      } else { _ell(g, 16, 27, 3, 1.5, 'W'); _put(g, 14, 28, 'W'); _put(g, 18, 28, 'W'); }
    }
    if (!back) _ell(g, side ? 18 : 16, 22, side ? 4 : 5, 1.8, 'W');
    // 頭
    if (side) {
      _ell(g, 14, 14, 11, 10, 'A'); _ell(g, 19, 16.5, 6.5, 6.5, 'K');
      _poly(g, [[12, 6], [26, 7], [26, 12], [23, 10], [21, 13], [18, 10], [15, 13]], 'A');
      _line(g, 8, 8, 9, 20, 'a'); _line(g, 12, 6, 12, 12, 'a'); _put(g, 17, 7, 'h');
      if (blink) _rect(g, 21, 17, 3, 1, 'k');
      else { _rect(g, 21, 14, 3, 4, 'k'); _rect(g, 21, 16, 3, 2, 'Y'); _put(g, 22, 14, 'W'); _put(g, 23, 16, 'y'); _put(g, 24, 14, 'k'); }
      _rect(g, 20, 19, 2, 1, 'b'); _put(g, 24, 20, 'M');
      _poly(g, [[9, 6], [12, -1], [15, 5]], 'N'); _poly(g, [[11, 5], [12.3, 1.5], [13.6, 5]], 'P'); _put(g, 12, 4, 'X');
    } else if (back) {
      _ell(g, 16, 14, 12, 10.5, 'A');
      _line(g, 10, 8, 12, 22, 'a'); _line(g, 21, 8, 20, 22, 'a'); _line(g, 16, 5, 16, 21, 'a');
      _poly(g, [[5, 8], [8, -1], [12, 5]], 'N'); _poly(g, [[20, 5], [24, -1], [27, 8]], 'N');
      _rect(g, 14, 20, 4, 2, 'R'); _put(g, 13, 19, 'R'); _put(g, 18, 19, 'R');
      tail(16 + ph, 31); _ell(g, 16 + ph, 35.5, 3, 2.2, 'X');
    } else {
      _ell(g, 16, 14, 12, 10.5, 'A');
      _ell(g, 16, 17, 8, 7, 'K');
      _poly(g, [[7, 9], [25, 9], [25, 13], [22, 11], [20, 14], [17, 11], [15, 14], [12, 11], [10, 14], [7, 13]], 'A');
      _line(g, 9, 7, 8, 20, 'a'); _line(g, 23, 7, 24, 20, 'a'); _put(g, 12, 6, 'h'); _put(g, 13, 5, 'h'); _put(g, 20, 6, 'h');
      [[10, 'L'], [18, 'R']].forEach(([x]) => {
        if (blink) { _rect(g, x, 17, 4, 1, 'k'); }
        else { _rect(g, x, 14, 4, 5, 'k'); _rect(g, x, 16, 4, 3, 'Y'); _rect(g, x, 18, 4, 1, 'y'); _put(g, x + 1, 15, 'W'); _put(g, x + 2, 15, 'W'); _put(g, x + 2, 17, 'W'); }
        _rect(g, x - 1, 13, 1, 1, 'k'); _rect(g, x + 4, 13, 1, 1, 'k');
      });
      _rect(g, 8, 20, 3, 1, 'b'); _rect(g, 21, 20, 3, 1, 'b'); _put(g, 9, 21, 'b'); _put(g, 22, 21, 'b');
      _rect(g, 15, 21, 2, 1, 'M'); _put(g, 16, 22, 'm');
      _poly(g, [[4, 9], [7, -1], [12, 5]], 'N'); _poly(g, [[6, 7], [7.3, 2], [10, 5.5]], 'P'); _put(g, 7, 4, 'X'); _put(g, 8, 6, 'X');
      _poly(g, [[20, 5], [25, -1], [28, 9]], 'N'); _poly(g, [[22, 5.5], [24.7, 2], [26, 7]], 'P'); _put(g, 24, 4, 'X'); _put(g, 23, 6, 'X');
      // 髮飾：紅色繩結
      _rect(g, 24, 11, 3, 2, 'R'); _put(g, 25, 13, 'O');
    }
    return g;
  },

  // 夜刃：赤角機鎧
  yeren(dir, ph, blink) {
    const g = _grid(CW, CH);
    const side = dir === 'side', back = dir === 'up';
    // 披風（裡襯較暗，下襬破碎）
    const capeFront = pts => { _poly(g, pts, 'C'); };
    if (side) { capeFront([[7, 20], [15, 20], [13, 35], [9, 33], [6 - ph, 36], [2 - ph, 35], [5, 28]]); _line(g, 8, 22, 4 - ph, 34, 'c'); }
    else if (!back) { capeFront([[7, 21], [25, 21], [28 + ph, 35], [24, 33], [20, 36], [12, 36], [8, 33], [4 - ph, 35]]); _rect(g, 6, 30, 3, 4, 'c'); _rect(g, 23, 30, 3, 4, 'c'); }
    if (side) _legs(g, 13, 19, 'F', 'k', 4, 'R'); else _legs(g, 11, 17, 'F', 'k', 4, 'R');
    if (side) { _rect(g, 13, 33, 4, 1, 'G'); _rect(g, 19, 33, 4, 1, 'G'); } else { _rect(g, 11, 33, 4, 1, 'G'); _rect(g, 17, 33, 4, 1, 'G'); }
    // 機鎧：裝甲板、發光紋路
    if (side) {
      _rect(g, 11, 22, 11, 10, 'B'); _ell(g, 15, 23, 4.5, 3, 'G'); _poly(g, [[13, 21], [15, 17], [17, 21]], 'G');
      _line(g, 12, 26, 20, 26, 'b'); _line(g, 19, 23, 19, 28, 'E');
      _rect(g, 17, 24, 3, 7, 'B'); _ell(g, 18.5, 31, 2, 2, 'G'); _rect(g, 10, 29, 13, 2, 'G'); _put(g, 20, 29, 'E');
    } else {
      _ell(g, 8.5, 23.5, 4, 3, 'G'); _ell(g, 23.5, 23.5, 4, 3, 'G');
      _poly(g, [[5, 22], [6, 17], [9, 21]], 'G'); _poly(g, [[27, 22], [26, 17], [23, 21]], 'G');
      _rect(g, 6, 25, 4, 6, 'B'); _rect(g, 22, 25, 4, 6, 'B'); _rect(g, 6, 27, 4, 1, 'b'); _rect(g, 22, 27, 4, 1, 'b');
      _ell(g, 8, 31.5, 2.2, 2, 'G'); _ell(g, 24, 31.5, 2.2, 2, 'G');
      _rect(g, 10, 22, 12, 9, 'B'); _rect(g, 10, 29, 12, 2, 'G');
      if (!back) {
        _rect(g, 15, 23, 2, 6, 'R'); _rect(g, 13, 25, 6, 2, 'R'); _put(g, 16, 25, 'E'); _put(g, 15, 25, 'E');
        _line(g, 11, 23, 11, 28, 'b'); _line(g, 20, 23, 20, 28, 'b');
        _put(g, 11, 30, 'E'); _put(g, 20, 30, 'E'); _put(g, 7, 26, 'E'); _put(g, 24, 26, 'E');
      } else { _line(g, 16, 22, 16, 29, 'b'); }
    }
    if (back) { _poly(g, [[7, 21], [25, 21], [27 + ph, 35], [23, 33], [20, 36], [16, 34], [12, 36], [9, 33], [5 - ph, 35]], 'C'); _line(g, 16, 22, 16, 33, 'c'); _line(g, 11, 23, 9, 33, 'c'); _line(g, 21, 23, 23, 33, 'c'); }
    _rect(g, side ? 12 : 10, 19, side ? 9 : 12, 3, 'G'); _rect(g, side ? 12 : 10, 20, side ? 9 : 12, 1, 'b');
    // 頭髮、面罩、角
    const eyeCol = blink ? 'r' : 'E';
    if (side) {
      _ell(g, 14, 12, 10, 9, 'W');
      _poly(g, [[5, 8], [1, 3], [8, 5]], 'W'); _poly(g, [[6, 4], [8, -1], [12, 3]], 'W'); _poly(g, [[11, 3], [15, -1], [17, 4]], 'W'); _poly(g, [[4, 14], [0, 13 + ph], [5, 18]], 'W');
      _line(g, 8, 5, 10, 16, 'w'); _line(g, 12, 3, 13, 10, 'w');
      _rect(g, 17, 11, 9, 9, 'V'); _rect(g, 17, 10, 9, 2, 'R'); _rect(g, 17, 16, 9, 1, 'v'); _rect(g, 23, 17, 1, 2, 'v'); _rect(g, 25, 17, 1, 2, 'v');
      _rect(g, 21, 14, 4, 2, eyeCol); if (!blink) _put(g, 25, 14, 'e');
      _poly(g, [[19, 9], [24, -1], [23, 10]], 'R'); _put(g, 22, 4, 'r'); _put(g, 21, 6, 'r'); _put(g, 23, 1, 'p');
    } else if (back) {
      _ell(g, 16, 12, 11, 9.5, 'W');
      [[7, 8, 9, 0, 12, 5], [12, 4, 16, -1, 20, 4], [20, 5, 23, 0, 25, 8], [6, 14, 2, 17 + ph, 8, 18], [26, 14, 30, 17 + ph, 24, 18]].forEach(([a, b, c2, d, e, f]) => _poly(g, [[a, b], [c2, d], [e, f]], 'W'));
      _line(g, 12, 6, 13, 20, 'w'); _line(g, 20, 6, 19, 20, 'w'); _line(g, 16, 3, 16, 19, 'w');
      _poly(g, [[6, 12], [1, 2], [9, 9]], 'R'); _poly(g, [[26, 12], [31, 2], [23, 9]], 'R');
      _put(g, 4, 7, 'r'); _put(g, 28, 7, 'r');
    } else {
      _ell(g, 16, 12, 11, 9.5, 'W');
      [[7, 8, 9, 0, 12, 5], [12, 4, 16, -1, 20, 4], [20, 5, 23, 0, 25, 8]].forEach(([a, b, c2, d, e, f]) => _poly(g, [[a, b], [c2, d], [e, f]], 'W'));
      _line(g, 10, 4, 11, 9, 'w'); _line(g, 21, 4, 21, 9, 'w'); _put(g, 13, 3, 'w');
      _rect(g, 9, 11, 14, 9, 'V'); _ell(g, 16, 20, 6, 1.5, 'V');
      _rect(g, 9, 10, 14, 2, 'R'); _put(g, 16, 10, 'p');
      _rect(g, 9, 16, 14, 1, 'v'); [12, 14, 16, 18].forEach(x => _rect(g, x, 18, 1, 2, 'v'));
      _rect(g, 11, 14, 4, 2, eyeCol); _rect(g, 18, 14, 4, 2, eyeCol);
      if (!blink) { _put(g, 10, 14, 'e'); _put(g, 22, 14, 'e'); _put(g, 12, 14, 'p'); _put(g, 19, 14, 'p'); }
      _poly(g, [[6, 12], [1, 2], [9, 9]], 'R'); _poly(g, [[26, 12], [31, 2], [23, 9]], 'R');
      _put(g, 4, 7, 'r'); _put(g, 5, 9, 'r'); _put(g, 28, 7, 'r'); _put(g, 27, 9, 'r'); _put(g, 2, 3, 'p'); _put(g, 30, 3, 'p');
    }
    return g;
  },
};

const CHARACTERS = [
  {
    id: 'chiling', name: '赤翎', title: '赤翎鐵衛', tag: '武俠 × 騎士',
    desc: '頭盔上插著赤紅羽翎的鐵衛，守護同伴從不退後一步。',
    hp: 7, shield: 5, energy: 160, weapons: ['blade', 'pistol'],
    skill: { name: '鐵壁衝鋒', desc: '舉盾向前衝刺，撞飛路徑上的敵人，衝刺時無敵', cd: 5, type: 'dash' },
    pal: { R: '#e8434d', r: '#a3242c', p: '#ff9aa0', H: '#a9b2c4', h: '#7a8396', V: '#1d2029', W: '#ffffff', S: '#d63a44', s: '#9c2530', B: '#808aa0', b: '#5f687c', L: '#6a4526', G: '#f0c64f', F: '#414757', k: '#26262e', M: '#d6dde8', Q: '#8a5a35', q: '#b07a45' },
    flat: 'WVpG',
  },
  {
    id: 'fengxing', name: '風行', title: '荒野遊俠', tag: '日常 × 冒險',
    desc: '戴著大草帽、嘴裡叼根草的旅人，走到哪學到哪。',
    hp: 6, shield: 4, energy: 170, weapons: ['shotgun', 'pistol'],
    skill: { name: '疾風小憩', desc: '喘口氣回復 2 點生命、護盾全滿，並加速 4 秒', cd: 14, type: 'rest' },
    pal: { T: '#ad7d44', t: '#7a5228', U: '#e2b877', q: '#3e2b1b', D: '#1c1a24', E: '#ffa133', e: '#7a4a1a', W: '#fff6d8', Q: '#9adb5a', P: '#f2df85', C: '#d43b45', c: '#9a2731', B: '#46424f', b: '#34313f', n: '#6b4a2e', G: '#e3b83a', K: '#2a2733', F: '#2d2a36', k: '#17151b' },
    flat: 'DEWQPeU',
  },
  {
    id: 'feihu', name: '緋狐', title: '緋紅狐巫', tag: '魔法',
    desc: '紅髮狐耳的小巫女，尾巴一甩就能點燃狐火。',
    hp: 4, shield: 5, energy: 240, weapons: ['staff', 'pistol'],
    skill: { name: '狐火流星', desc: '召喚狐火流星砸向附近的敵人，範圍傷害', cd: 8, type: 'meteor' },
    pal: { N: '#4c2432', P: '#f2b8bd', A: '#e5434f', a: '#b52e3c', a2: '#f07070', h: '#ff8a8f', K: '#fde5d6', k: '#2a1820', Y: '#e08a2a', y: '#a8501a', W: '#ffffff', M: '#d94a5c', m: '#8a2a3a', b: '#f7a8a8', D: '#542a3b', d: '#3d1d2a', Z: '#f3e6e8', z: '#d9c3c7', O: '#f3b632', o: '#a8761a', R: '#d63a44', X: '#fdf9f2', F: '#f8dacb', s: '#2e1b22' },
    flat: 'kYyWMmbhO',
  },
  {
    id: 'yeren', name: '夜刃', title: '赤角機鎧', tag: '科幻',
    desc: '白髮赤角、戴著機械面罩的戰士，紅色雙眼能掃描所有弱點。',
    hp: 5, shield: 6, energy: 180, weapons: ['smg', 'pistol'],
    skill: { name: '魔眼無人機', desc: '放出一台自動射擊的無人機，持續 8 秒', cd: 12, type: 'turret' },
    pal: { W: '#eeeaf4', w: '#bdb4cc', R: '#e32b42', r: '#8c1424', p: '#ff8a96', V: '#26202f', v: '#3d3549', E: '#ff4458', e: '#ff9aa6', B: '#463e54', b: '#322b3d', G: '#7c7290', C: '#ad1b2e', c: '#6e0f1c', F: '#2a2433', k: '#151019' },
    flat: 'EeVpv',
  },
];
const CHAR = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
const CHAR_MIGRATE = { lingxiao: 'chiling', xiaoju: 'fengxing', xingyu: 'feihu', tieyu: 'yeren' };

// 調色盤的 key 可以是兩個字元（例如 a2），先換成單一字元再畫
function _normKeys(g, pal) {
  const map = {}, out = {}; let code = 0x4e00;
  Object.keys(pal).forEach(k => { if (k.length === 1) { map[k] = k; out[k] = pal[k]; } else { const ch = String.fromCharCode(code++); map[k] = ch; out[ch] = pal[k]; } });
  return { map, pal: out };
}
function _artGrid(ch, dir, ph, blink) {
  const g = CHAR_ART[ch.id](dir, ph, blink);
  return g;
}
function charFrames(ch, dirKey) {
  const key = ch.id + ':' + dirKey;
  if (_spriteCache[key]) return _spriteCache[key];
  const { map, pal } = _normKeys(null, ch.pal);
  const conv = g => g.map(r => r.map(k => map[k] || k));
  const flat = ch.flat.split('').map(k => map[k] || k).join('');
  const walk = [0, 1, 2, 3].map(f => _walkFrames(conv(_artGrid(ch, dirKey, f % 2, false)), pal, flat, 6, 2, false, 'FksGnRO')[f]);
  const idle = [0, 1].map(ph => _render(conv(_artGrid(ch, dirKey, ph, false)), pal, flat));
  const blink = _render(conv(_artGrid(ch, dirKey, 0, true)), pal, flat);
  return (_spriteCache[key] = { walk, idle, blink });
}

// (x, y) 是腳底中心；dir 0下 1上 2左 3右；圖以一半大小畫出
function drawChar(c, ch, x, y, dir, t, moving) {
  t = Math.abs(t);
  const fr = charFrames(ch, dir === 0 ? 'down' : dir === 1 ? 'up' : 'side');
  let img, bob = 0;
  if (moving) { const f = Math.floor(t * 8) % 4; img = fr.walk[f]; bob = f % 2 ? -1 : 0; }
  else {
    const ph = Math.floor(t * 1.6) % 2;
    img = (t % 3.3) < 0.14 ? fr.blink : fr.idle[ph];
    bob = ph ? -0.5 : 0;
  }
  x = Math.round(x); y = Math.round(y);
  shadow(c, x, y, 7, 2.5);
  const w = img.width / 2, h = img.height / 2;
  const top = y - h + 1 + bob;
  if (dir === 2) {
    c.save(); c.translate(x, 0); c.scale(-1, 1);
    c.drawImage(img, -w / 2, top, w, h);
    c.restore();
  } else c.drawImage(img, x - w / 2, top, w, h);
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

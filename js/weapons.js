// ===== 城外武器：高解析度像素圖（2 倍解析度繪製，一半大小顯示）=====
// 每把武器都朝右畫；pivot = 手握的位置，muzzle = 子彈射出的位置（格子座標）

const _WPN_CACHE = {};

// 旋轉的長條（符咒用）
function _strip(g, ox, oy, ang, s0, s1, hw, k) {
  const c = Math.cos(ang), s = Math.sin(ang), px = -s, py = c;
  _poly(g, [
    [ox + c * s0 + px * hw, oy + s * s0 + py * hw], [ox + c * s1 + px * hw, oy + s * s1 + py * hw],
    [ox + c * s1 - px * hw, oy + s * s1 - py * hw], [ox + c * s0 - px * hw, oy + s * s0 - py * hw],
  ], k);
}

const WEAPON_ART = {
  // 練習手槍：小巧的半自動手槍，木握把、黃色條紋
  pistol() {
    const g = _grid(27, 15);
    _poly(g, [[6, 8], [12, 8], [11, 14], [4, 14]], 'G');           // 木握把
    for (let y = 9; y <= 13; y += 2) _put(g, 8, y, 'g'), _put(g, 10, y - 1, 'g');
    _rect(g, 6, 2, 18, 5, 'S');                                   // 滑套
    for (let x = 8; x <= 12; x += 2) _rect(g, x, 3, 1, 3, 'd');   // 防滑紋
    _rect(g, 14, 5, 9, 1, 'Y');                                   // 黃色條紋
    _rect(g, 24, 3, 2, 3, 'd');                                   // 槍口
    _rect(g, 6, 7, 16, 2, 'F');                                   // 槍身
    _rect(g, 12, 9, 1, 3, 'F'); _rect(g, 12, 11, 5, 1, 'F'); _rect(g, 16, 9, 1, 3, 'F'); // 扳機護弓
    _rect(g, 14, 9, 1, 2, 'd');                                   // 扳機
    _rect(g, 7, 1, 2, 1, 'd'); _rect(g, 22, 1, 1, 1, 'd');        // 準星
    return { g, pal: { G: '#7b5230', g: '#5a3a1e', S: '#7f8c99', d: '#2d3436', Y: '#ffe066', F: '#465260' }, flat: 'Y', pivot: [8, 10], muzzle: [26, 4] };
  },
  // 機甲連射槍：機械感的衝鋒槍，橘色能量線圈、通風槍管
  smg() {
    const g = _grid(39, 18);
    _rect(g, 0, 4, 6, 3, 'B'); _rect(g, 0, 4, 2, 7, 'B');          // 槍托
    _poly(g, [[7, 10], [12, 10], [11, 16], [6, 16]], 'G');          // 握把
    _poly(g, [[16, 10], [21, 10], [22, 17], [17, 17]], 'M');        // 彈匣
    _rect(g, 17, 13, 4, 1, 'O');
    _rect(g, 6, 3, 20, 7, 'B');                                     // 機匣
    _rect(g, 8, 1, 14, 2, 'd'); for (let x = 9; x < 22; x += 3) _put(g, x, 1, 'B'); // 上方導軌
    _rect(g, 10, 5, 14, 2, 'O'); for (let x = 13; x < 24; x += 3) _rect(g, x, 5, 1, 2, 'd'); // 能量線圈
    _rect(g, 23, 3, 2, 1, 'O');                                     // 指示燈
    _rect(g, 26, 4, 8, 5, 'S'); for (let x = 27; x <= 32; x += 2) _rect(g, x, 5, 1, 3, 'd'); // 通風槍管
    _rect(g, 34, 5, 4, 3, 'd'); _rect(g, 37, 4, 1, 5, 'd');         // 槍口制退器
    _rect(g, 12, 9, 1, 3, 'd'); _rect(g, 12, 11, 4, 1, 'd');
    return { g, pal: { B: '#4a5263', G: '#2d3436', M: '#353b48', O: '#ff9f43', d: '#22272e', S: '#6c7a89' }, flat: 'O', pivot: [9, 12], muzzle: [38, 6] };
  },
  // 霰彈槍：木製槍托、雙管、泵動護木、金色雕紋
  shotgun() {
    const g = _grid(47, 14);
    _poly(g, [[0, 5], [12, 3], [13, 8], [7, 9], [0, 12]], 'W');     // 槍托
    _rect(g, 0, 5, 1, 7, 'd');                                      // 槍托墊
    _line(g, 3, 7, 9, 6, 'w');
    _rect(g, 12, 3, 10, 6, 'S');                                    // 機匣
    _line(g, 14, 5, 19, 5, 'Y'); _put(g, 16, 6, 'Y'); _put(g, 18, 4, 'Y'); // 金色雕紋
    _rect(g, 22, 3, 24, 2, 'B'); _rect(g, 22, 5, 24, 2, 'b');       // 雙管
    _rect(g, 45, 3, 1, 4, 'd');                                     // 槍口
    _rect(g, 22, 7, 22, 2, 'd');                                    // 彈倉管
    _rect(g, 26, 7, 10, 3, 'W'); for (let x = 28; x <= 34; x += 2) _rect(g, x, 7, 1, 3, 'w'); // 泵動護木
    _rect(g, 14, 9, 6, 1, 'F'); _rect(g, 19, 9, 1, 2, 'F'); _rect(g, 16, 9, 1, 2, 'd');
    _put(g, 44, 2, 'Y');                                            // 準星
    return { g, pal: { W: '#9a6233', w: '#6e4422', S: '#7f8c99', Y: '#feca57', B: '#3d4652', b: '#56626e', d: '#252a30', F: '#465260' }, flat: 'Y', pivot: [13, 9], muzzle: [46, 5] };
  },
  // 雷射步槍：白色流線外殼、瞄準鏡、藍色能量格、雙叉發射器
  laser() {
    const g = _grid(51, 17);
    _poly(g, [[0, 4], [9, 4], [11, 9], [3, 12], [0, 12]], 'H');     // 槍托
    _rect(g, 3, 6, 3, 2, '.');                                      // 槍托鏤空
    _poly(g, [[12, 10], [17, 10], [16, 16], [11, 16]], 'g');        // 握把
    _rect(g, 9, 4, 24, 6, 'H');                                     // 槍身
    _rect(g, 11, 10, 14, 2, 'g');
    _rect(g, 12, 6, 3, 2, 'C'); _rect(g, 17, 6, 3, 2, 'C'); _rect(g, 22, 6, 3, 2, 'C'); // 能量格
    _rect(g, 27, 5, 4, 1, 'g'); _rect(g, 27, 8, 4, 1, 'g');
    _rect(g, 14, 1, 12, 3, 'd'); _rect(g, 26, 1, 1, 3, 'C'); _rect(g, 13, 2, 1, 1, 'd'); // 瞄準鏡
    _rect(g, 33, 5, 12, 3, 'g'); _rect(g, 34, 6, 12, 1, 'C');       // 槍管 + 能量核心
    _rect(g, 43, 3, 7, 2, 'H'); _rect(g, 43, 8, 7, 2, 'H');         // 發射叉
    _rect(g, 49, 3, 1, 2, 'C'); _rect(g, 49, 8, 1, 2, 'C');
    return { g, pal: { H: '#e8eef2', g: '#95a5a6', C: '#48dbfb', d: '#2d3436' }, flat: 'C', pivot: [14, 12], muzzle: [50, 6] };
  },
  // 星辰法杖：木杖身、紫色緞帶、金色爪座托著星形水晶
  staff() {
    const g = _grid(50, 19);
    _rect(g, 0, 8, 36, 3, 'W');                                     // 杖身
    for (let x = 4; x < 34; x += 5) _put(g, x, 9, 'w');             // 木紋
    _rect(g, 0, 7, 2, 5, 'Y');                                      // 杖尾
    _rect(g, 14, 7, 5, 5, 'P'); _line(g, 15, 12, 11, 18, 'P'); _line(g, 17, 12, 15, 17, 'p'); // 緞帶
    _rect(g, 29, 7, 2, 5, 'Y'); _rect(g, 32, 7, 1, 5, 'Y');         // 金環
    _line(g, 34, 7, 38, 2, 'Y'); _line(g, 35, 7, 39, 2, 'Y');       // 爪座
    _line(g, 34, 11, 38, 16, 'Y'); _line(g, 35, 11, 39, 16, 'Y');
    const cx = 42.5, cy = 9.5, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.8 : 7; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    _poly(g, pts, 'C');                                             // 星形水晶
    _rect(g, 41, 8, 3, 3, 'L');
    return { g, pal: { W: '#8d5a2b', w: '#6a4020', Y: '#f9ca24', P: '#c56cf0', p: '#9b4fd0', C: '#e0b3ff', L: '#ffffff' }, flat: 'L', pivot: [12, 10], muzzle: [43, 10] };
  },
  // 竹林長弓：竹節弓臂、皮革握把、弓弦（pull 0~3 表示拉弓程度，拉滿會搭上箭）
  bow(pull = 0) {
    const g = _grid(36, 47), cx = 22, cy = 23;
    const nockX = 13 - pull * 3;
    // 弓弦
    _line(g, 13, 2, nockX, cy, 'T'); _line(g, 13, 44, nockX, cy, 'T');
    // 弓臂（中間往前凸，兩端往後彎）
    for (let y = 1; y <= 45; y++) {
      const k = (y - cy) / 22, x = cx - k * k * 9, th = Math.abs(k) > 0.8 ? 2 : 3;
      const node = Math.abs(y - cy) > 4 && (y % 6 === 0);
      _rect(g, Math.round(x), y, th, 1, node ? 'n' : 'W');
    }
    _rect(g, 12, 0, 2, 2, 'd'); _rect(g, 12, 45, 2, 2, 'd');        // 弓梢
    _rect(g, cx - 1, cy - 4, 5, 9, 'G'); _rect(g, cx - 1, cy - 2, 5, 1, 'g'); _rect(g, cx - 1, cy + 2, 5, 1, 'g'); // 握把
    // 搭箭
    if (pull > 0) {
      _rect(g, nockX, cy, 34 - nockX - 3, 1, 'A');
      _poly(g, [[31, cy - 2], [35, cy + 0.5], [31, cy + 3]], 'H');
      _rect(g, nockX + 1, cy - 1, 4, 1, 'F'); _rect(g, nockX + 1, cy + 1, 4, 1, 'F');
    }
    return { g, pal: { W: '#8fbf45', n: '#4e6b22', G: '#7b5230', g: '#c8a26a', d: '#3b4a1a', T: '#f5f6fa', A: '#c8a26a', H: '#b2bec3', F: '#55efc4' }, flat: 'TAF', pivot: [cx + 1, cy], muzzle: [34, cy] };
  },
  // 火焰符咒：扇形展開的三張黃符，上面有紅色符文與印章
  fire() {
    const g = _grid(31, 31), ox = 3, oy = 15;
    const draw = (ang, k) => {
      _strip(g, ox, oy, ang, 3, 25, 3.2, k);
      const c = Math.cos(ang), s = Math.sin(ang);
      for (let d = 8; d <= 19; d += 1) _put(g, ox + c * d, oy + s * d, 'r');               // 符文主線
      for (let d = 9; d <= 19; d += 4) for (let w = -2; w <= 2; w++) _put(g, ox + c * d - s * w, oy + s * d + c * w, 'r'); // 橫畫
      for (let w = -1; w <= 1; w++) for (let d = 22; d <= 23; d++) _put(g, ox + c * d - s * w, oy + s * d + c * w, 'R'); // 印章
    };
    draw(-0.5, 'Q'); draw(0.5, 'Q'); draw(0, 'P');
    _ell(g, 4, 15, 2.5, 2.5, 'd');                                  // 捏住的地方
    return { g, pal: { P: '#f6e27a', Q: '#e3c95a', r: '#d63031', R: '#ff4757', d: '#7b5230' }, flat: 'rR', pivot: [4, 15], muzzle: [28, 15] };
  },
  // 流光刃：金色護手、藍寶石、發光的刀身
  blade() {
    const g = _grid(51, 15);
    _ell(g, 2.5, 7.5, 2.5, 2.5, 'Y');                               // 劍首
    _rect(g, 4, 6, 8, 3, 'G'); for (let x = 5; x < 12; x += 2) _rect(g, x, 6, 1, 3, 'g'); // 纏繩握柄
    _poly(g, [[11, 0], [15, 3], [15, 12], [11, 15], [13, 7.5]], 'Y'); // 護手
    _rect(g, 12, 6, 3, 3, 'R');                                     // 寶石
    _poly(g, [[15, 4], [44, 4], [51, 7.5], [44, 11], [15, 11]], 'B'); // 刀身
    _rect(g, 16, 7, 27, 1, 'C');                                    // 流光血槽
    _rect(g, 16, 4, 28, 1, 'L');                                    // 刃口亮線
    return { g, pal: { Y: '#f9ca24', G: '#2c3e70', g: '#1a2550', R: '#3ad1ff', B: '#bfe9ff', C: '#3ad1ff', L: '#ffffff' }, flat: 'CLR', pivot: [7, 7], muzzle: [48, 7] };
  },
};

function weaponSprite(id, pull = 0) {
  const key = id + ':' + pull;
  if (!_WPN_CACHE[key]) {
    const a = WEAPON_ART[id](pull);
    _WPN_CACHE[key] = { cv: _render(a.g, a.pal, a.flat), pivot: a.pivot, muzzle: a.muzzle, w: a.g[0].length, h: a.g.length };
  }
  return _WPN_CACHE[key];
}

// 在 (x, y) 握著武器朝 ang 方向畫出來；回傳槍口的世界座標
function drawWeaponSprite(c, id, x, y, ang, opt = {}) {
  const s = weaponSprite(id, opt.pull || 0);
  const flip = Math.cos(ang) < 0 ? -1 : 1, sc = opt.scale || 0.5, back = opt.recoil || 0;
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(1, flip);
  c.drawImage(s.cv, -(s.pivot[0] + 1) * sc - back, -(s.pivot[1] + 1) * sc, s.cv.width * sc, s.cv.height * sc);
  c.restore();
  return weaponMuzzle(id, x, y, ang, opt.pull || 0, sc);
}

function weaponMuzzle(id, x, y, ang, pull = 0, sc = 0.5) {
  const s = weaponSprite(id, pull), flip = Math.cos(ang) < 0 ? -1 : 1;
  const dx = (s.muzzle[0] - s.pivot[0]) * sc, dy = (s.muzzle[1] - s.pivot[1]) * sc * flip;
  return { x: x + Math.cos(ang) * dx - Math.sin(ang) * dy, y: y + Math.sin(ang) * dx + Math.cos(ang) * dy };
}

// 圖示：把武器縮放到 bw × bh 的框裡（HUD、掉落物用）
function drawWeaponIcon(c, id, cx, cy, bw, bh, ang = 0) {
  const s = weaponSprite(id, id === 'bow' ? 3 : 0);
  const sc = Math.min(bw / s.cv.width, bh / s.cv.height);
  c.save(); c.translate(cx, cy); c.rotate(ang);
  c.drawImage(s.cv, -s.cv.width * sc / 2, -s.cv.height * sc / 2, s.cv.width * sc, s.cv.height * sc);
  c.restore();
}

// 子彈外觀
function drawProjectile(c, b, t) {
  const a = Math.atan2(b.vy, b.vx), ca = Math.cos(a), sa = Math.sin(a);
  const line = (len, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(b.x - ca * len, b.y - sa * len); c.lineTo(b.x, b.y); c.stroke(); };
  c.lineCap = 'round';
  switch (b.wid) {
    case 'pistol':
      line(5, 2.2, 'rgba(255,224,102,.35)'); line(2, 2.2, '#ffe066');
      c.fillStyle = '#fff'; c.fillRect(b.x - 0.5, b.y - 0.5, 1, 1); break;
    case 'smg':
      line(8, 1.6, 'rgba(255,159,67,.4)'); line(4, 1.6, '#ff9f43'); line(1.5, 1, '#fff3d6'); break;
    case 'shotgun':
      line(3, 1.4, 'rgba(254,202,87,.35)');
      c.fillStyle = '#feca57'; c.beginPath(); c.arc(b.x, b.y, 1.6, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.fillRect(b.x - 0.5, b.y - 0.5, 1, 1); break;
    case 'laser':
      c.globalCompositeOperation = 'lighter';
      line(16, 4, 'rgba(72,219,251,.25)'); line(14, 2.2, '#48dbfb'); line(12, 0.9, '#ffffff');
      c.globalCompositeOperation = 'source-over'; break;
    case 'staff': {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(197,108,240,.25)'; c.beginPath(); c.arc(b.x, b.y, 3.6, 0, 7); c.fill();
      c.globalCompositeOperation = 'source-over';
      c.save(); c.translate(b.x, b.y); c.rotate(t * 8); c.fillStyle = '#e0b3ff'; c.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.2 : 3, q = i * Math.PI / 5; c.lineTo(Math.cos(q) * r, Math.sin(q) * r); }
      c.closePath(); c.fill(); c.fillStyle = '#fff'; c.fillRect(-0.7, -0.7, 1.4, 1.4); c.restore(); break;
    }
    case 'bow':
      c.save(); c.translate(b.x, b.y); c.rotate(a);
      c.fillStyle = '#c8a26a'; c.fillRect(-9, -0.5, 8, 1);                   // 箭桿
      c.fillStyle = '#b2bec3'; c.beginPath(); c.moveTo(-1.5, -1.8); c.lineTo(2, 0); c.lineTo(-1.5, 1.8); c.closePath(); c.fill(); // 箭頭
      c.fillStyle = '#55efc4'; c.fillRect(-9, -1.6, 3, 1); c.fillRect(-9, 0.6, 3, 1); // 箭羽
      c.restore(); break;
    case 'fire': {
      const f = 0.8 + 0.2 * Math.sin(t * 40 + b.x);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,90,40,.22)'; c.beginPath(); c.arc(b.x - ca * 1.5, b.y - sa * 1.5, 3.6 * f, 0, 7); c.fill();
      c.globalCompositeOperation = 'source-over';
      c.save(); c.translate(b.x, b.y); c.rotate(a + Math.sin(t * 25) * 0.25);
      c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(-7 * f, 0); c.quadraticCurveTo(-1, -3.4, 2.6, 0); c.quadraticCurveTo(-1, 3.4, -7 * f, 0); c.fill();
      c.fillStyle = '#ffd32a'; c.beginPath(); c.moveTo(-4 * f, 0); c.quadraticCurveTo(0, -2, 2, 0); c.quadraticCurveTo(0, 2, -4 * f, 0); c.fill();
      c.fillStyle = '#f6e27a'; c.fillRect(-1, -1.5, 2.4, 3); c.fillStyle = '#d63031'; c.fillRect(-0.3, -1, 0.8, 2); // 符紙
      c.restore(); break;
    }
    default:
      c.fillStyle = b.color; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
  }
  c.lineCap = 'butt'; c.lineWidth = 1;
}

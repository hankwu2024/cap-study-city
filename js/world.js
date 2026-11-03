// ===== 城內地圖：房間配置、角色走動、互動 =====
const World = (() => {
  const BX = 3, BY = 3, W = 71, H = 49;
  const G_GRASS = 0, G_WALL = 1, G_FLOOR = 2, G_CORR = 3;
  const grid = new Uint8Array(W * H);
  const roomOf = new Array(W * H).fill(null);
  const solid = new Uint8Array(W * H);
  const rooms = [];
  let props = [];
  let canvas, ctx, staticLayer;
  let scale = 2, camX = 0, camY = 0;
  let t = 0, last = 0, running = false, paused = false;
  const keys = {};
  const player = { x: 0, y: 0, dir: 0, moving: false, path: null, onArrive: null };
  const cat = { x: 0, y: 0, tx: 0, ty: 0, dir: 3, wait: 0 };
  const fx = [];
  let hoverProp = null, nearProp = null;

  const idx = (x, y) => y * W + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

  // ---------- 房間配置 ----------
  const THEME = {
    chinese: ['inkDesk', 'bamboo', 'scrollStand', 'lantern', 'teaSet', 'lantern'],
    english: ['bookshelf', 'phoneBooth', 'abcBlocks', 'mailbox', 'phonograph', 'globe'],
    math: ['abacus', 'easelPi', 'geoSolids', 'dice', 'dice', 'lamp'],
    civics: ['gavelDesk', 'flagStand', 'scales', 'ballotBox', 'lamp', 'plant'],
    geography: ['mapTable', 'signpost', 'mountain', 'globe', 'compass', 'plant'],
    history: ['pillar', 'armor', 'vase', 'bell', 'hourglass', 'vase'],
    physics: ['labBench', 'tesla', 'magnet', 'pendulum', 'magnet', 'lamp'],
    earth: ['rocks', 'telescope', 'volcano', 'planets', 'compass', 'globe'],
    biology: ['aquarium', 'dna', 'microscope', 'skeleton', 'flowers', 'flowers'],
  };
  const SLOTS = [[0, 1, 1], [9, 3, 2], [0, 5, 3], [9, 6, 4], [0, 8, 5], [10, 8, 5]];

  function addRoom(r) { rooms.push(r); return r; }

  function build() {
    grid.fill(G_GRASS); roomOf.fill(null);
    rooms.length = 0;
    // 建築外框
    for (let y = BY; y < BY + 43; y++) for (let x = BX; x < BX + 65; x++) grid[idx(x, y)] = G_WALL;
    ['chinese', 'english', 'math', 'civics', 'geography'].forEach((id, i) =>
      addRoom({ id, kind: 'subject', sub: SUBJ[id], x: BX + i * 13, y: BY, w: 13, h: 11, doors: ['b'] }));
    addRoom({ id: 'train', kind: 'train', name: '修練室', x: BX, y: BY + 14, w: 17, h: 15, doors: ['t', 'b'] });
    addRoom({ id: 'lobby', kind: 'lobby', name: '大廳', x: BX + 17, y: BY + 14, w: 31, h: 15, doors: ['t', 'b'] });
    addRoom({ id: 'exam', kind: 'exam', name: '會考試題書房', x: BX + 48, y: BY + 14, w: 17, h: 15, doors: ['t', 'b'] });
    ['history', 'physics', 'earth', 'biology'].forEach((id, i) =>
      addRoom({ id, kind: 'subject', sub: SUBJ[id], x: BX + i * 13, y: BY + 32, w: 13, h: 11, doors: ['t'] }));
    addRoom({ id: 'gate', kind: 'gate', name: '城門', x: BX + 52, y: BY + 32, w: 13, h: 11, doors: ['t'] });

    rooms.forEach(r => {
      r.ix = r.x + 1; r.iy = r.y + 1; r.iw = r.w - 2; r.ih = r.h - 2;
      for (let y = r.iy; y < r.iy + r.ih; y++) for (let x = r.ix; x < r.ix + r.iw; x++) { grid[idx(x, y)] = G_FLOOR; roomOf[idx(x, y)] = r; }
    });
    // 走廊
    for (const cy of [BY + 11, BY + 29]) for (let y = cy; y < cy + 3; y++) for (let x = BX + 1; x < BX + 64; x++) grid[idx(x, y)] = G_CORR;
    // 門
    rooms.forEach(r => {
      const half = r.kind === 'lobby' ? 2 : 1;
      const cx = r.x + Math.floor(r.w / 2);
      r.doors.forEach(d => {
        const y = d === 'b' ? r.y + r.h - 1 : r.y;
        for (let x = cx - half; x <= cx + half; x++) { grid[idx(x, y)] = G_CORR; }
      });
    });
    layoutProps();
  }

  function P(r, type, x, y, extra = {}) {
    const def = PROPS[type];
    const p = Object.assign({ type, room: r, tx: r.ix + x, ty: r.iy + y, w: def.w, h: def.h, wall: !!def.wall, flat: !!def.flat }, extra);
    p.px = p.tx * T; p.py = p.ty * T;
    props.push(p);
    return p;
  }

  function layoutProps() {
    props = [];
    rooms.forEach(r => {
      if (r.kind === 'subject') {
        const s = r.sub, lv = roomLevel(s);
        r.level = lv;
        if (lv >= 6) P(r, 'rug', 3, 3, { color: s.color });
        P(r, 'board', 0, -1, { color: s.color, action: 'progress:' + s.id, label: '學習進度' });
        P(r, 'uploadStation', 8, 0, { color: s.color, action: 'upload:' + s.id, label: '⬆ 上傳考卷', bright: true, below: true });
        P(r, 'desk', 4, 4); P(r, 'chair', 5, 5);
        P(r, 'plant', 2, r.id === 'history' || r.id === 'physics' || r.id === 'earth' || r.id === 'biology' ? 2 : 0);
        THEME[r.id].forEach((type, i) => {
          const [x, y, need] = SLOTS[i];
          if (lv >= need) P(r, type, x, y);
        });
        if (lv >= 7) P(r, 'trophy', 10, 0);
      } else if (r.kind === 'lobby') {
        P(r, 'countdown', 2, -1, { action: 'roundtable' });
        P(r, 'mural', 19, -1, { action: 'roundtable' });
        P(r, 'roundTable', 13, 5, { action: 'roundtable', label: '圓桌：各科進度總覽', bright: true });
        P(r, 'sofa', 2, 4, { color: '#b5651d' }); P(r, 'sofa', 2, 8, { color: '#b5651d' });
        P(r, 'sofa', 24, 4, { color: '#4a6fa5' }); P(r, 'sofa', 24, 8, { color: '#4a6fa5' });
        [[0, 0], [28, 0], [0, 12], [28, 12], [11, 0], [17, 0], [11, 12], [17, 12]].forEach(([x, y]) => P(r, 'plant', x, y));
        P(r, 'fountain', 7, 5); P(r, 'vending', 21, 5); P(r, 'reception', 22, 11);
        P(r, 'lamp', 5, 11); P(r, 'bigPlant', 9, 9);
      } else if (r.kind === 'train') {
        P(r, 'mat', 4, 4);
        P(r, 'altar', 6, 5, { action: 'train', label: '修練卷軸：錯題重練', bright: true });
        [[0, 1], [2, 1], [12, 1], [14, 1]].forEach(([x, y]) => P(r, 'dummy', x, y));
        P(r, 'weaponRack', 0, 10); P(r, 'weaponRack', 13, 10);
        P(r, 'torch', 4, 0); P(r, 'torch', 10, 0);
        P(r, 'plant', 0, 12); P(r, 'plant', 14, 12);
      } else if (r.kind === 'exam') {
        [[0, 0], [2, 0], [11, 0], [13, 0]].forEach(([x, y]) => P(r, 'bookshelf', x, y));
        P(r, 'readingDesk', 6, 5, { action: 'exams', label: '歷屆試題與出題率', bright: true });
        P(r, 'cabinet', 0, 6); P(r, 'cabinet', 14, 6);
        P(r, 'globe', 0, 10); P(r, 'lamp', 14, 10); P(r, 'plant', 0, 12); P(r, 'plant', 14, 12);
        P(r, 'chair', 7, 8);
      } else if (r.kind === 'gate') {
        P(r, 'gate', 4, 7, { action: 'gate', label: '前往城外（需要出城令）', bright: true });
        P(r, 'torch', 3, 7); P(r, 'torch', 7, 7);
        P(r, 'ticketBooth', 0, 2, { action: 'gate' });
        P(r, 'signpost', 10, 3); P(r, 'plant', 0, 0); P(r, 'plant', 10, 0); P(r, 'bush', 0, 8); P(r, 'bush', 10, 8);
      }
    });
    // 戶外樹木
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x++) {
      if (grid[idx(x, y)] !== G_GRASS || (y + 1 < H && grid[idx(x, y + 1)] !== G_GRASS)) continue;
      const h = (x * 73856093 ^ y * 19349663) >>> 0;
      if (h % 5 === 0) props.push({ type: 'tree', tx: x, ty: y, w: 1, h: 2, px: x * T, py: y * T, outdoor: true });
      else if (h % 11 === 1) props.push({ type: 'bush', tx: x, ty: y + 1, w: 1, h: 1, px: x * T, py: (y + 1) * T, outdoor: true });
    }
    // 碰撞
    solid.fill(0);
    for (let i = 0; i < W * H; i++) if (grid[i] === G_WALL || grid[i] === G_GRASS) solid[i] = 1;
    props.forEach(p => {
      if (p.flat || p.wall || p.outdoor) return;
      for (let y = p.ty; y < p.ty + p.h; y++) for (let x = p.tx; x < p.tx + p.w; x++) if (inb(x, y)) solid[idx(x, y)] = 1;
    });
    renderStatic();
  }

  // ---------- 靜態圖層（地板、牆） ----------
  function floorColors(r, x, y) {
    if (!r) return ['#e3e3e3', '#d6d6d6'];
    if (r.kind === 'subject') return [r.sub.floorA, r.sub.floorB];
    if (r.kind === 'lobby') return ['#e0c9a0', '#d1b688'];
    if (r.kind === 'train') return ['#c9a66b', '#bf9a5c'];
    if (r.kind === 'exam') return ['#9c7158', '#8d644d'];
    return ['#a4a4a4', '#959595'];
  }

  function renderStatic() {
    staticLayer = document.createElement('canvas');
    staticLayer.width = W * T; staticLayer.height = H * T;
    const c = staticLayer.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const g = grid[idx(x, y)], px = x * T, py = y * T;
      const hsh = (x * 928371 + y * 123457) % 97;
      if (g === G_GRASS) {
        R(c, px, py, T, T, (x + y) % 2 ? '#5d9a42' : '#58933e');
        if (hsh % 7 === 0) R(c, px + (hsh % 12), py + (hsh % 9) + 3, 1, 3, '#7cc35a');
        if (hsh % 13 === 0) R(c, px + 4, py + 6, 2, 2, '#ffe066');
      } else if (g === G_WALL) {
        R(c, px, py, T, T, '#434957');
        R(c, px, py, T, 2, '#5a6172');
        const below = inb(x, y + 1) ? grid[idx(x, y + 1)] : G_WALL;
        if (below === G_FLOOR || below === G_CORR) {
          const r = roomOf[idx(x, y + 1)];
          R(c, px, py + 5, T, 11, r && r.kind === 'subject' ? shade(r.sub.color, 0.65) : '#d8cfbf');
          R(c, px, py + 14, T, 2, '#00000033');
        }
      } else {
        const r = roomOf[idx(x, y)];
        const [a, b] = floorColors(r, x, y);
        R(c, px, py, T, T, (x + y) % 2 ? a : b);
        if (r && r.kind === 'subject' && r.level >= 4) R(c, px + 7, py + 7, 2, 2, '#ffffff40');
        if (g === G_CORR) R(c, px, py + 15, T, 1, '#00000010');
        if (r && r.kind === 'exam') R(c, px, py + 15, T, 1, '#00000025');
        if (r && r.kind === 'train') R(c, px + 15, py, 1, T, '#00000020');
      }
    }
    // 平放的地毯
    props.filter(p => p.flat).forEach(p => drawProp(c, p, 0));
  }

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const mix = v => Math.round(v * (1 - k) + 255 * k);
    return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  }

  // ---------- 角色移動 ----------
  function blocked(px, py) {
    const pts = [[px - 5, py - 4], [px + 5, py - 4], [px - 5, py], [px + 5, py]];
    return pts.some(([x, y]) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return !inb(tx, ty) || solid[idx(tx, ty)]; });
  }

  function findPath(sx, sy, goals) {
    const goalSet = new Set(goals.map(([x, y]) => idx(x, y)));
    const prev = new Int32Array(W * H).fill(-1);
    const q = [idx(sx, sy)]; prev[q[0]] = q[0];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (goalSet.has(cur)) {
        const path = []; let k = cur;
        while (k !== prev[k]) { path.push([k % W, Math.floor(k / W)]); k = prev[k]; }
        return path.reverse();
      }
      const cx = cur % W, cy = Math.floor(cur / W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (!inb(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (prev[ni] !== -1 || solid[ni]) continue;
        prev[ni] = cur; q.push(ni);
      }
    }
    return null;
  }

  function walkTo(goals, onArrive) {
    const sx = Math.floor(player.x / T), sy = Math.floor((player.y - 2) / T);
    const path = findPath(sx, sy, goals);
    if (path) { player.path = path; player.onArrive = onArrive || null; if (!path.length && onArrive) { onArrive(); player.onArrive = null; } }
  }

  function propGoals(p) {
    const g = [];
    for (let y = p.ty - 1; y <= p.ty + p.h; y++) for (let x = p.tx - 1; x <= p.tx + p.w; x++) {
      if (inb(x, y) && !solid[idx(x, y)]) g.push([x, y]);
    }
    return g;
  }

  function update(dt) {
    if (paused) return;
    let vx = 0, vy = 0;
    if (keys.ArrowLeft || keys.KeyA) vx -= 1;
    if (keys.ArrowRight || keys.KeyD) vx += 1;
    if (keys.ArrowUp || keys.KeyW) vy -= 1;
    if (keys.ArrowDown || keys.KeyS) vy += 1;
    const sp = 90;
    if (vx || vy) { player.path = null; player.onArrive = null; }
    else if (player.path && player.path.length) {
      const [tx, ty] = player.path[0];
      const gx = tx * T + 8, gy = ty * T + 12;
      const dx = gx - player.x, dy = gy - player.y, d = Math.hypot(dx, dy);
      if (d < 2) { player.path.shift(); if (!player.path.length) { player.path = null; const f = player.onArrive; player.onArrive = null; if (f) f(); } }
      else { vx = dx / d; vy = dy / d; }
    }
    player.moving = !!(vx || vy);
    if (player.moving) {
      const len = Math.hypot(vx, vy); vx /= len; vy /= len;
      if (Math.abs(vx) > Math.abs(vy)) player.dir = vx < 0 ? 2 : 3; else player.dir = vy < 0 ? 1 : 0;
      const nx = player.x + vx * sp * dt, ny = player.y + vy * sp * dt;
      if (!blocked(nx, player.y)) player.x = nx;
      if (!blocked(player.x, ny)) player.y = ny;
    }
    // 附近可互動物件
    nearProp = null; let best = 26;
    props.forEach(p => {
      if (!p.action) return;
      const cx = Math.max(p.px, Math.min(player.x, p.px + p.w * T));
      const cy = Math.max(p.py, Math.min(player.y - 6, p.py + p.h * T));
      const d = Math.hypot(cx - player.x, cy - (player.y - 6));
      if (d < best) { best = d; nearProp = p; }
    });
    // 小貓
    const lobby = rooms.find(r => r.id === 'lobby');
    if (cat.wait > 0) cat.wait -= dt;
    else {
      const dx = cat.tx - cat.x, dy = cat.ty - cat.y, d = Math.hypot(dx, dy);
      if (d < 1) {
        cat.wait = 1 + Math.random() * 3;
        for (let k = 0; k < 20; k++) {
          const tx = lobby.ix + Math.floor(Math.random() * lobby.iw), ty = lobby.iy + Math.floor(Math.random() * lobby.ih);
          if (!solid[idx(tx, ty)]) { cat.tx = tx * T + 8; cat.ty = ty * T + 12; break; }
        }
      } else {
        const nx = cat.x + dx / d * 30 * dt, ny = cat.y + dy / d * 30 * dt;
        if (!blocked(nx, ny)) { cat.x = nx; cat.y = ny; } else cat.wait = 0.2, cat.tx = cat.x, cat.ty = cat.y;
        cat.dir = dx < 0 ? 2 : 3;
      }
    }
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 30 * dt; if (f.life <= 0) fx.splice(i, 1); }
  }

  // ---------- 繪製 ----------
  function drawCat(c) {
    const x = Math.round(cat.x), y = Math.round(cat.y), m = cat.wait <= 0 && Math.floor(t * 8) % 2;
    shadow(c, x, y, 5, 2);
    const f = cat.dir === 2 ? -1 : 1;
    R(c, x - 5, y - 7, 10, 5, '#f39c12'); R(c, x - 4, y - 2 - m, 2, 2, '#e67e22'); R(c, x + 2, y - 2 + m - 1, 2, 2, '#e67e22');
    R(c, x + f * 4 - 3, y - 11, 6, 5, '#f39c12'); R(c, x + f * 4 - 3, y - 13, 2, 2, '#f39c12'); R(c, x + f * 4 + 1, y - 13, 2, 2, '#f39c12');
    R(c, x + f * 4 + (f > 0 ? 1 : -2), y - 9, 1, 1, '#222');
    R(c, x - f * 6 - (f > 0 ? 1 : 0), y - 10 + Math.round(Math.sin(t * 4)), 2, 5, '#e67e22');
  }

  function render() {
    const vw = canvas.width / scale, vh = canvas.height / scale;
    camX = Math.max(0, Math.min(W * T - vw, player.x - vw / 2));
    camY = Math.max(0, Math.min(H * T - vh, player.y - vh / 2));
    if (W * T < vw) camX = (W * T - vw) / 2;
    if (H * T < vh) camY = (H * T - vh) / 2;
    camX = Math.round(camX * scale) / scale; camY = Math.round(camY * scale) / scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3f6e2c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);
    ctx.drawImage(staticLayer, 0, 0);
    // 牆上物件
    props.filter(p => p.wall).forEach(p => drawProp(ctx, p, t));
    // 依 y 排序繪製
    const list = props.filter(p => !p.wall && !p.flat && p.px + p.w * T > camX - 32 && p.px < camX + vw + 32 && p.py < camY + vh + 32 && p.py + p.h * T > camY - 32)
      .map(p => ({ y: p.py + p.h * T, d: () => drawProp(ctx, p, t) }));
    list.push({ y: player.y, d: () => drawChar(ctx, CHAR[Store.state.profile.char], player.x, player.y, player.dir, t, player.moving) });
    list.push({ y: cat.y, d: () => drawCat(ctx) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    // 高亮
    const hl = hoverProp || nearProp;
    if (hl) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.lineWidth = 1;
      ctx.strokeRect(hl.px - 1.5, hl.py - 1.5 - (hl.wall ? 2 : 0), hl.w * T + 3, hl.h * T + 3);
    }
    fx.forEach(f => R(ctx, f.x, f.y, 2, 2, f.col));
    // 路徑點
    if (player.path && player.path.length) {
      const [gx, gy] = player.path[player.path.length - 1];
      R(ctx, gx * T + 6, gy * T + 10, 4, 2, `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 10)})`);
    }
    drawLabels();
  }

  function toScreen(x, y) { return [(x - camX) * scale, (y - camY) * scale]; }

  function chip(text, sx, sy, bg, fg, size = 13) {
    ctx.font = `bold ${size}px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif`;
    const w = ctx.measureText(text).width + 12;
    ctx.fillStyle = bg; roundRect(sx - w / 2, sy - size - 4, w, size + 8, 5); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, sx, sy - size / 2);
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  function drawLabels() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const days = daysLeft();
    rooms.forEach(r => {
      const [sx, sy] = toScreen((r.x + r.w / 2) * T, r.y * T + 12);
      let text = r.name, bg = 'rgba(30,30,40,.85)';
      if (r.kind === 'subject') { text = `${r.sub.room}  Lv.${r.level}`; bg = r.sub.color; }
      chip(text, sx, sy, bg, '#fff', 13);
    });
    // 倒數看板
    const cd = props.find(p => p.type === 'countdown');
    if (cd) {
      const [sx, sy] = toScreen(cd.px + cd.w * T / 2, cd.py + 7);
      const size = Math.max(12, Math.round(8 * scale));
      ctx.font = `900 ${size}px "Microsoft JhengHei",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff2e63'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff4d6d';
      ctx.fillText(days >= 0 ? `會考倒數 ${days} 天` : '會考已結束', sx, sy);
      ctx.shadowBlur = 0;
    }
    // 可互動物件標籤
    props.forEach(p => {
      if (!p.label) return;
      const show = p.bright || p === nearProp || p === hoverProp;
      if (!show) return;
      const [sx, sy] = p.below ? toScreen(p.px + p.w * T / 2, p.py + p.h * T + 2) : toScreen(p.px + p.w * T / 2, p.py - 4);
      const active = p === nearProp || p === hoverProp;
      chip(active ? `${p.label}（按 E 或點擊）` : p.label, sx, p.below ? sy + 20 : sy - 6, active ? '#ffd600' : 'rgba(255,214,0,.85)', '#222', active ? 13 : 12);
    });
    // 玩家名稱
    const [px, py] = toScreen(player.x, player.y + 4);
    chip(Store.state.profile.name, px, py + 16, 'rgba(20,20,30,.8)', '#fff', 12);
  }

  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; t += dt;
    update(dt); render();
    requestAnimationFrame(loop);
  }

  // ---------- 互動 ----------
  function activate(p) {
    if (!p || !p.action) return;
    const [a, b] = p.action.split(':');
    if (a === 'progress') Panels.subject(SUBJ[b], 'progress');
    else if (a === 'upload') Panels.subject(SUBJ[b], 'upload');
    else if (a === 'roundtable') Panels.roundtable();
    else if (a === 'train') Panels.training();
    else if (a === 'exams') Panels.exams();
    else if (a === 'gate') Panels.gate();
  }

  function propAt(wx, wy) {
    let hit = null;
    props.forEach(p => {
      if (!p.action) return;
      const top = p.py - (p.wall ? 4 : 2);
      if (wx >= p.px && wx < p.px + p.w * T && wy >= top && wy < p.py + p.h * T) hit = p;
    });
    return hit;
  }

  function screenToWorld(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / scale + camX, (e.clientY - r.top) / scale + camY];
  }

  function bindInput() {
    window.addEventListener('keydown', e => {
      if (paused || Panels.isOpen() || !running) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      keys[e.code] = true;
      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { if (nearProp) { e.preventDefault(); activate(nearProp); clearKeys(); } }
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('blur', clearKeys);
    canvas.addEventListener('mousemove', e => {
      const [wx, wy] = screenToWorld(e);
      hoverProp = propAt(wx, wy);
      canvas.style.cursor = hoverProp ? 'pointer' : 'default';
    });
    canvas.addEventListener('click', e => {
      if (paused) return;
      const [wx, wy] = screenToWorld(e);
      const p = propAt(wx, wy);
      if (p) {
        if (p === nearProp) activate(p);
        else walkTo(propGoals(p), () => activate(p));
        return;
      }
      const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
      if (inb(tx, ty) && !solid[idx(tx, ty)]) walkTo([[tx, ty]]);
    });
    canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
    window.addEventListener('resize', resize);
  }
  function clearKeys() { for (const k in keys) keys[k] = false; }

  function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  }
  function zoom(d) { scale = Math.max(1, Math.min(5, scale + d)); }

  function roomCenter(id) {
    const r = rooms.find(r => r.id === id);
    // 找房間內靠近門的空地
    const cx = r.x + Math.floor(r.w / 2);
    const cy = r.doors[0] === 'b' ? r.y + r.h - 2 : r.y + 1;
    return [cx * T + 8, cy * T + 12];
  }

  function teleport(id) {
    const [x, y] = roomCenter(id);
    player.x = x; player.y = y; player.path = null; player.dir = 0;
    for (let i = 0; i < 20; i++) fx.push({ x: x + (Math.random() - 0.5) * 16, y: y - Math.random() * 20, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, life: 0.8, col: '#fff6a0' });
  }

  function levelUpFx(subId) {
    layoutProps();
    const r = rooms.find(r => r.id === subId);
    if (!r) return;
    for (let i = 0; i < 60; i++) fx.push({ x: (r.ix + Math.random() * r.iw) * T, y: (r.iy + Math.random() * r.ih) * T, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 40, life: 1.5 + Math.random(), col: ['#ffd600', '#fff', r.sub.color][i % 3] });
  }

  return {
    rooms,
    init(cv) {
      canvas = cv; ctx = canvas.getContext('2d');
      build();
      resize();
      scale = window.innerWidth >= 1500 ? 3 : 2;
      const [x, y] = roomCenter('lobby');
      player.x = x; player.y = y + 3 * T;
      cat.x = cat.tx = x + 40; cat.y = cat.ty = y + 40;
      bindInput();
    },
    start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); },
    stop() { running = false; clearKeys(); },
    pause(v) { paused = v; clearKeys(); },
    refresh() { layoutProps(); },
    teleport, zoom, levelUpFx,
  };
})();

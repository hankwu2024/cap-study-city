// ===== 城內地圖：房間配置、地板牆面材質、光影、角色走動、互動 =====
const World = (() => {
  const BX = 6, BY = 6, W = 77, H = 56;
  const G_GRASS = 0, G_WALL = 1, G_FLOOR = 2, G_CORR = 3, G_PAVE = 4, G_PATH = 5;
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
  const motes = [];
  const critters = [];
  let hoverProp = null, nearProp = null, lastNight = -1;

  const idx = (x, y) => y * W + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const hash = (x, y, k = 0) => ((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0;

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
  // 地板材質與壁紙
  const FLOOR = {
    chinese: 'wood', english: 'carpet', math: 'tile', civics: 'parquet', geography: 'wood', history: 'marble',
    physics: 'lab', earth: 'metal', biology: 'moss', lobby: 'marble', train: 'tatami', exam: 'darkwood', gate: 'stone',
  };
  const WALLPAPER = {
    chinese: ['#e9d8b4', '#a0522d', 'lattice'], english: ['#d6e4f0', '#2e5f8a', 'stripe'], math: ['#dcefe5', '#2f7d62', 'grid'],
    civics: ['#e6dcef', '#6c3483', 'stripe'], geography: ['#e3efd6', '#4e7d32', 'dots'], history: ['#efe3cf', '#8b5a2b', 'panel'],
    physics: ['#eef0f2', '#d35400', 'grid'], earth: ['#2b3350', '#8fa3d9', 'stars'], biology: ['#dff2d8', '#2e8b57', 'leaf'],
    lobby: ['#f3e3c3', '#9c6b3f', 'panel'], train: ['#ead7b0', '#6e4524', 'lattice'], exam: ['#d9c4a3', '#5d4037', 'panel'], gate: ['#bdbdbd', '#616161', 'brick'],
  };

  function addRoom(r) { rooms.push(r); return r; }

  function build() {
    grid.fill(G_GRASS); roomOf.fill(null);
    rooms.length = 0;
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
    for (const cy of [BY + 11, BY + 29]) for (let y = cy; y < cy + 3; y++) for (let x = BX + 1; x < BX + 64; x++) grid[idx(x, y)] = G_CORR;
    rooms.forEach(r => {
      const half = r.kind === 'lobby' ? 2 : 1;
      const cx = r.x + Math.floor(r.w / 2);
      r.doors.forEach(d => {
        const y = d === 'b' ? r.y + r.h - 1 : r.y;
        for (let x = cx - half; x <= cx + half; x++) grid[idx(x, y)] = G_CORR;
      });
    });
    // 戶外：建築外一圈人行道、城門往南的小路
    for (let y = BY - 1; y <= BY + 43; y++) for (let x = BX - 1; x <= BX + 65; x++) if (inb(x, y) && grid[idx(x, y)] === G_GRASS) grid[idx(x, y)] = G_PAVE;
    const gx = BX + 58;
    for (let y = BY + 44; y < H; y++) for (let x = gx - 1; x <= gx + 1; x++) grid[idx(x, y)] = G_PATH;
    for (let x = 0; x < W; x++) for (let y = BY + 47; y <= BY + 48; y++) if (grid[idx(x, y)] === G_GRASS) grid[idx(x, y)] = G_PATH;
    layoutProps();
  }

  function P(r, type, x, y, extra = {}) {
    return A(type, r.ix + x, r.iy + y, Object.assign({ room: r }, extra));
  }
  function A(type, tx, ty, extra = {}) {
    const def = PROPS[type];
    const p = Object.assign({ type, tx, ty, w: def.w, h: def.h, wall: !!def.wall, flat: !!def.flat, ground: !!def.ground }, extra);
    p.px = p.tx * T; p.py = p.ty * T;
    props.push(p);
    return p;
  }

  function layoutProps() {
    props = [];
    rooms.forEach(r => {
      if (r.kind === 'subject') {
        const s = r.sub, lv = roomLevel(s), top = r.doors[0] === 'b';
        r.level = lv;
        if (lv >= 6) P(r, 'rug', 3, 3, { color: s.color });
        P(r, 'board', 0, -1, { color: s.color, action: 'progress:' + s.id, label: '學習進度' });
        P(r, 'uploadStation', 8, 0, { color: s.color, action: 'upload:' + s.id, label: '⬆ 上傳考卷', bright: true, below: true });
        P(r, 'desk', 4, 4); P(r, 'chair', 5, 5);
        if (top) { P(r, 'window', 3, -1, { color: s.color }); P(r, 'clock', 6, -1); P(r, 'poster', 10, -1, { color: s.color }); }
        else { P(r, 'clock', 3, -1); P(r, 'poster', 7, -1, { color: s.color }); P(r, 'poster', 10, -1, { color: '#f1c40f' }); }
        P(r, 'plant', 2, top ? 0 : 2);
        P(r, 'paperStack', 3, top ? 7 : 6);
        THEME[r.id].forEach((type, i) => {
          const [x, y, need] = SLOTS[i];
          if (lv >= need) P(r, type, x, y);
        });
        if (lv >= 3) P(r, 'sideTable', 7, 4);
        if (lv >= 7) P(r, 'trophy', 10, 0);
      } else if (r.kind === 'lobby') {
        P(r, 'countdown', 2, -1, { action: 'roundtable' });
        P(r, 'mural', 19, -1, { action: 'roundtable' });
        P(r, 'clock', 11, -1); P(r, 'clock', 17, -1);
        P(r, 'roundTable', 13, 5, { action: 'roundtable', label: '圓桌：各科進度總覽', bright: true });
        P(r, 'sofa', 2, 4, { color: '#b5651d' }); P(r, 'sofa', 2, 8, { color: '#b5651d' }); P(r, 'sideTable', 5, 6);
        P(r, 'sofa', 24, 4, { color: '#4a6fa5' }); P(r, 'sofa', 24, 8, { color: '#4a6fa5' }); P(r, 'sideTable', 23, 6);
        [[0, 0], [28, 0], [0, 12], [28, 12], [10, 0], [18, 0], [11, 12], [17, 12]].forEach(([x, y]) => P(r, 'plant', x, y));
        P(r, 'fountain', 8, 5); P(r, 'vending', 21, 5); P(r, 'reception', 22, 11);
        P(r, 'lamp', 5, 11); P(r, 'bigPlant', 9, 9); P(r, 'lamp', 1, 6); P(r, 'lamp', 27, 6);
      } else if (r.kind === 'train') {
        P(r, 'mat', 4, 4);
        P(r, 'altar', 6, 5, { action: 'train', label: '修練卷軸：錯題重練', bright: true });
        [[0, 1], [2, 1], [12, 1], [14, 1]].forEach(([x, y]) => P(r, 'dummy', x, y));
        P(r, 'weaponRack', 0, 10); P(r, 'weaponRack', 13, 10);
        P(r, 'torch', 4, 0); P(r, 'torch', 10, 0);
        P(r, 'scrollStand', 0, 5); P(r, 'scrollStand', 14, 5);
        P(r, 'plant', 0, 12); P(r, 'plant', 14, 12);
        P(r, 'painting', 1, -1, { color: '#f6d7b0' }); P(r, 'painting', 11, -1, { color: '#f6d7b0' });
      } else if (r.kind === 'exam') {
        [[0, 0], [2, 0], [11, 0], [13, 0]].forEach(([x, y]) => P(r, 'bookshelf', x, y));
        P(r, 'readingDesk', 6, 5, { action: 'exams', label: '歷屆試題與出題率', bright: true });
        P(r, 'cabinet', 0, 6); P(r, 'cabinet', 14, 6);
        P(r, 'globe', 0, 10); P(r, 'lamp', 14, 10); P(r, 'plant', 0, 12); P(r, 'plant', 14, 12);
        P(r, 'chair', 7, 8); P(r, 'paperStack', 4, 6); P(r, 'paperStack', 10, 6); P(r, 'boxes', 13, 12);
        P(r, 'rug', 5, 9, { color: '#1f4e79' });
      } else if (r.kind === 'gate') {
        P(r, 'gate', 4, 7, { action: 'gate', label: '前往城外（需要出城令）', bright: true });
        P(r, 'torch', 3, 7); P(r, 'torch', 7, 7);
        P(r, 'ticketBooth', 0, 2, { action: 'gate' });
        P(r, 'signpost', 10, 3); P(r, 'plant', 0, 0); P(r, 'plant', 10, 0); P(r, 'bush', 0, 8); P(r, 'bush', 10, 8);
        P(r, 'stoneLantern', 1, 5); P(r, 'stoneLantern', 9, 5); P(r, 'noticeBoard', 7, -1); P(r, 'boxes', 0, 4);
      }
    });
    // 走廊：地毯、長椅、海報
    for (const cy of [BY + 12, BY + 30]) for (let x = BX + 2; x < BX + 63; x++) A('corridorRug', x, cy);
    for (let i = 0; i < 5; i++) {
      const rx = BX + i * 13;
      A('painting', rx + 1, BY + 10, { color: ['#f7c6a3', '#a3d5f7', '#c3f7a3', '#e3a3f7', '#f7e3a3'][i] });
      A('poster', rx + 10, BY + 10, { color: SUBJECTS[i].color });
      A('plant', rx + 11, BY + 11);
      if (i < 4) A('bench', rx + 2, BY + 13);
    }
    [[BX + 3, '#c0392b'], [BX + 12, '#2e86de'], [BX + 50, '#16a085'], [BX + 59, '#8e44ad']].forEach(([x, col]) => A('poster', x, BY + 28, { color: col }));
    A('noticeBoard', BX + 21, BY + 28); A('painting', BX + 40, BY + 28, { color: '#ffd7a8' });
    A('bench', BX + 21, BY + 31); A('bench', BX + 41, BY + 31);
    A('plant', BX + 1, BY + 29); A('plant', BX + 63, BY + 29); A('plant', BX + 1, BY + 11); A('plant', BX + 63, BY + 11);
    // 戶外
    for (let x = BX + 2; x < BX + 64; x += 8) { A('lampPost', x, BY - 4); A('lampPost', x + 4, BY + 44); }
    for (let y = BY + 4; y < BY + 42; y += 9) { A('lampPost', BX - 3, y); A('lampPost', BX + 66, y); }
    for (let x = BX + 4; x < BX + 62; x += 8) A('flowerBed', x, BY - 2);
    A('signboard', BX + 54, BY + 45, { label: '🏯 會考學習城', sign: true });
    A('pond', 1, H - 8);
    A('bench', BX + 30, BY + 45); A('bench', BX + 20, BY + 45);
    // 樹木、灌木、石頭（避開已經擺東西的位置）
    const used = new Set();
    props.forEach(p => { for (let y = p.ty - 1; y <= p.ty + p.h; y++) for (let x = p.tx - 1; x <= p.tx + p.w; x++) used.add(idx(x, y)); });
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) {
      if (used.has(idx(x, y)) || used.has(idx(x, y + 1))) continue;
      if (grid[idx(x, y)] !== G_GRASS || grid[idx(x, y + 1)] !== G_GRASS) continue;
      if (x < 7 && y > H - 10) continue;
      const h = hash(x, y);
      if (h % 6 === 0 && (x + y) % 2 === 0) props.push({ type: 'tree', tx: x, ty: y, w: 1, h: 2, px: x * T, py: y * T, outdoor: true });
      else if (h % 17 === 1) props.push({ type: 'bush', tx: x, ty: y + 1, w: 1, h: 1, px: x * T, py: (y + 1) * T, outdoor: true });
      else if (h % 29 === 3) props.push({ type: 'rock', tx: x, ty: y + 1, w: 1, h: 1, px: x * T, py: (y + 1) * T, outdoor: true });
    }
    solid.fill(0);
    for (let i = 0; i < W * H; i++) if (grid[i] === G_WALL || grid[i] === G_GRASS || grid[i] === G_PAVE || grid[i] === G_PATH) solid[i] = 1;
    props.forEach(p => {
      if (p.flat || p.wall || p.outdoor || p.ground) return;
      for (let y = p.ty; y < p.ty + p.h; y++) for (let x = p.tx; x < p.tx + p.w; x++) if (inb(x, y)) solid[idx(x, y)] = 1;
    });
    renderStatic();
  }

  // ---------- 材質 ----------
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const mix = v => Math.round(v * (1 - k) + 255 * k);
    return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  }
  function dark(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const mix = v => Math.round(v * (1 - k));
    return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  }

  function drawFloor(c, style, x, y, px, py, r) {
    const h = hash(x, y);
    const A1 = r && r.kind === 'subject' ? r.sub.floorA : null, B1 = r && r.kind === 'subject' ? r.sub.floorB : null;
    switch (style) {
      case 'wood': case 'darkwood': {
        const base = style === 'darkwood' ? ['#8a5f43', '#7d553b', '#946a4c'] : ['#c79a68', '#bb8d5c', '#d1a674'];
        for (let k = 0; k < 4; k++) {
          R(c, px, py + k * 4, T, 4, base[(h >>> k) % 3]);
          R(c, px, py + k * 4 + 3, T, 1, '#00000022');
          const seam = (h >>> (k * 3)) % 16; R(c, px + seam, py + k * 4, 1, 3, '#00000026');
          if ((h >>> (k + 5)) % 4 === 0) R(c, px + ((h >>> k) % 12) + 2, py + k * 4 + 1, 3, 1, '#ffffff18');
        }
        break;
      }
      case 'parquet': {
        const a = A1 || '#c9a87c', b = B1 || '#b8956a';
        const flip = (x + y) % 2;
        for (let k = 0; k < 4; k++) flip ? R(c, px + k * 4, py, 4, T, k % 2 ? a : b) : R(c, px, py + k * 4, T, 4, k % 2 ? a : b);
        R(c, px, py, T, 1, '#00000018'); R(c, px, py, 1, T, '#00000018');
        break;
      }
      case 'tile': case 'lab': {
        const a = style === 'lab' ? '#f2f2ef' : (A1 || '#d6e4dc'), b = style === 'lab' ? '#e6e6e2' : (B1 || '#c4d8cc');
        for (let k = 0; k < 4; k++) R(c, px + (k % 2) * 8, py + Math.floor(k / 2) * 8, 8, 8, (k + x + y) % 2 ? a : b);
        R(c, px, py, T, 1, '#00000020'); R(c, px, py + 8, T, 1, '#00000014'); R(c, px, py, 1, T, '#00000020'); R(c, px + 8, py, 1, T, '#00000014');
        R(c, px + 1, py + 1, 2, 1, '#ffffff55');
        break;
      }
      case 'carpet': {
        const a = A1 || '#c9d6e3';
        R(c, px, py, T, T, a);
        for (let k = 0; k < 6; k++) R(c, px + ((h >>> (k * 4)) % 16), py + ((h >>> (k * 4 + 2)) % 16), 1, 1, '#00000014');
        if ((x % 3 === 0) && (y % 3 === 0)) { R(c, px + 6, py + 6, 4, 4, '#ffffff40'); R(c, px + 7, py + 5, 2, 6, '#ffffff30'); }
        break;
      }
      case 'marble': {
        const lob = r && r.kind === 'lobby';
        const a = lob ? '#efe4cf' : '#e8e0d0', b = lob ? '#e2d4b8' : '#dbd1bf';
        R(c, px, py, T, T, (x + y) % 2 ? a : b);
        const v = h % 5; c.fillStyle = '#00000012';
        for (let k = 0; k < 6; k++) c.fillRect(px + ((v * 3 + k * 2) % 16), py + k * 2 + (v % 3), 2, 1);
        R(c, px, py, T, 1, '#ffffff40');
        if (lob && (x + y) % 4 === 0) R(c, px + 7, py + 7, 2, 2, '#c9a227');
        break;
      }
      case 'metal': {
        R(c, px, py, T, T, '#3a4362'); R(c, px + 1, py + 1, 14, 14, '#424b6c');
        [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([a, b]) => R(c, px + a, py + b, 1, 1, '#8b95b8'));
        if (h % 9 === 0) R(c, px + (h % 12) + 2, py + ((h >>> 3) % 12) + 2, 1, 1, '#ffffffaa');
        break;
      }
      case 'moss': {
        const a = A1 || '#cfe6c9', b = B1 || '#bcdab4';
        for (let k = 0; k < 4; k++) R(c, px + (k % 2) * 8, py + Math.floor(k / 2) * 8, 8, 8, (k + x + y) % 2 ? a : b);
        R(c, px, py, T, 1, '#00000018'); R(c, px, py, 1, T, '#00000018');
        if (h % 4 === 0) { R(c, px + (h % 11), py + 12, 3, 2, '#7fb069'); R(c, px + (h % 11) + 1, py + 11, 1, 1, '#9ccf7c'); }
        break;
      }
      case 'tatami': {
        const mat = ((Math.floor(x / 2) + y) % 2);
        R(c, px, py, T, T, mat ? '#cdbf87' : '#c4b67c');
        for (let k = 0; k < 8; k++) R(c, px, py + k * 2, T, 1, '#00000010');
        if (x % 2 === 0) R(c, px, py, 1, T, '#5a6b3a'); if (y % 1 === 0) R(c, px, py, T, 1, '#5a6b3a66');
        break;
      }
      case 'stone': {
        R(c, px, py, T, T, '#8e8e8e');
        const o = (y % 2) * 4;
        [[0 + o, 0, 7, 7], [8 + o, 0, 7, 7], [0, 8, 7, 7], [8, 8, 7, 7]].forEach(([a, b, w, hh], k) => {
          R(c, px + (a % 16), py + b, Math.min(w, 16 - (a % 16)), hh, ['#a3a3a3', '#9a9a9a', '#ababab', '#959595'][(h >>> k) % 4]);
          R(c, px + (a % 16), py + b, Math.min(w, 16 - (a % 16)), 1, '#ffffff22');
        });
        break;
      }
      case 'corridor': {
        R(c, px, py, T, T, (x + y) % 2 ? '#ece8e1' : '#e2ddd4');
        R(c, px, py, T, 1, '#00000010'); R(c, px, py, 1, T, '#00000010'); R(c, px + 2, py + 2, 3, 1, '#ffffff66');
        break;
      }
    }
  }

  function drawWallFace(c, x, y, px, py, r) {
    const [col, trim, pat] = r ? (WALLPAPER[r.kind === 'subject' ? r.id : r.kind] || ['#d8cfbf', '#8d6e63', 'panel']) : ['#e9e4da', '#8d7b68', 'panel'];
    R(c, px, py + 3, T, 13, col);
    if (pat === 'stripe') { for (let k = 0; k < 16; k += 4) R(c, px + k, py + 3, 2, 9, '#ffffff30'); }
    else if (pat === 'grid') { R(c, px + 7, py + 3, 1, 9, '#00000012'); R(c, px, py + 7, T, 1, '#00000012'); }
    else if (pat === 'dots') { R(c, px + 4, py + 6, 1, 1, '#00000020'); R(c, px + 12, py + 9, 1, 1, '#00000020'); }
    else if (pat === 'lattice') { R(c, px + 3, py + 4, 10, 1, trim + '55'); R(c, px + 3, py + 9, 10, 1, trim + '55'); R(c, px + 3, py + 4, 1, 6, trim + '55'); R(c, px + 12, py + 4, 1, 6, trim + '55'); }
    else if (pat === 'stars') { if (hash(x, y) % 3 === 0) R(c, px + hash(x, y) % 14 + 1, py + 5, 1, 1, '#ffffffcc'); if (hash(x, y, 1) % 4 === 0) R(c, px + 4, py + 9, 1, 1, '#ffe08a'); }
    else if (pat === 'leaf') { if ((x + y) % 2) { R(c, px + 5, py + 5, 3, 2, '#7fb06966'); R(c, px + 7, py + 7, 1, 2, '#2e8b5766'); } }
    else if (pat === 'brick') { for (let k = 0; k < 3; k++) { R(c, px, py + 3 + k * 4 + 3, T, 1, '#00000030'); R(c, px + ((k + x) % 2) * 8, py + 3 + k * 4, 1, 3, '#00000030'); } }
    else { R(c, px + 2, py + 5, 12, 5, '#ffffff22'); R(c, px + 2, py + 5, 12, 1, '#00000014'); }
    // 護牆板與踢腳線
    R(c, px, py + 11, T, 3, dark(col.length === 7 ? col : '#d8cfbf', 0.12));
    R(c, px, py + 11, T, 1, '#ffffff40');
    R(c, px, py + 14, T, 2, trim);
    // 牆頂
    R(c, px, py, T, 3, '#4a4f5c'); R(c, px, py, T, 1, '#6b7183'); R(c, px, py + 2, T, 1, '#2f333d');
  }

  function renderStatic() {
    staticLayer = document.createElement('canvas');
    staticLayer.width = W * T; staticLayer.height = H * T;
    const c = staticLayer.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const g = grid[idx(x, y)], px = x * T, py = y * T, h = hash(x, y);
      if (g === G_GRASS) {
        R(c, px, py, T, T, ['#5d9a42', '#589440', '#629f46'][h % 3]);
        for (let k = 0; k < 5; k++) R(c, px + ((h >>> (k * 3)) % 16), py + ((h >>> (k * 3 + 1)) % 16), 1, 1, (k % 2) ? '#4c8436' : '#73b052');
        if (h % 5 === 0) { const tx = px + (h % 12) + 2, ty = py + ((h >>> 4) % 10) + 4; R(c, tx, ty, 1, 3, '#7cc35a'); R(c, tx + 2, ty + 1, 1, 2, '#7cc35a'); R(c, tx - 2, ty + 1, 1, 2, '#6aae4a'); }
        if (h % 23 === 0) { const cx = px + (h % 10) + 3, cy = py + ((h >>> 5) % 10) + 3; const col = ['#ffe066', '#ff8fab', '#ffffff', '#a0c4ff'][(h >>> 7) % 4]; R(c, cx, cy, 2, 2, col); R(c, cx + 3, cy + 2, 2, 2, col); R(c, cx + 1, cy + 4, 2, 2, col); }
        if (h % 41 === 7) { R(c, px + 5, py + 9, 3, 2, '#9e9e9e'); R(c, px + 5, py + 9, 3, 1, '#c4c4c4'); }
      } else if (g === G_PAVE) {
        R(c, px, py, T, T, (x + y) % 2 ? '#c9c2b3' : '#c1b9a8');
        R(c, px, py, T, 1, '#00000018'); R(c, px, py, 1, T, '#00000018'); R(c, px + 1, py + 1, 4, 1, '#ffffff30');
      } else if (g === G_PATH) {
        R(c, px, py, T, T, '#c8a978');
        for (let k = 0; k < 4; k++) R(c, px + ((h >>> (k * 4)) % 15), py + ((h >>> (k * 4 + 2)) % 15), 2, 1, '#a88a5a');
        if (h % 7 === 0) R(c, px + 4, py + 9, 2, 2, '#e0c99b');
      } else if (g === G_WALL) {
        const below = inb(x, y + 1) ? grid[idx(x, y + 1)] : G_WALL;
        if (below === G_FLOOR || below === G_CORR) drawWallFace(c, x, y, px, py, roomOf[idx(x, y + 1)]);
        else if (below === G_PAVE || below === G_GRASS) {
          // 建築外牆：磚牆立面
          R(c, px, py, T, 4, '#4a4f5c'); R(c, px, py, T, 1, '#6b7183');
          R(c, px, py + 4, T, 12, '#a86b4f');
          for (let k = 0; k < 3; k++) { R(c, px, py + 4 + k * 4 + 3, T, 1, '#7d4a35'); R(c, px + ((k + x) % 2) * 8 + 3, py + 4 + k * 4, 1, 3, '#7d4a35'); }
          if (x % 4 === 1 && grid[idx(x - 1, y)] === G_WALL && grid[idx(x + 1, y)] === G_WALL) { R(c, px + 3, py + 6, 10, 7, '#2c3e50'); R(c, px + 4, py + 7, 8, 5, nightLevel() > 0.4 ? '#ffd27a' : '#8ec5e8'); R(c, px + 7, py + 7, 1, 5, '#2c3e50'); }
        } else {
          R(c, px, py, T, T, '#434957');
          R(c, px, py, T, 1, '#5a6172');
          if (hash(x, y) % 3 === 0) R(c, px + 4, py + 6, 6, 1, '#3a3f4b');
          const L = inb(x - 1, y) ? grid[idx(x - 1, y)] : G_WALL, Rr = inb(x + 1, y) ? grid[idx(x + 1, y)] : G_WALL;
          if (L !== G_WALL) R(c, px, py, 2, T, '#6b7183');
          if (Rr !== G_WALL) R(c, px + 14, py, 2, T, '#2f333d');
        }
      } else {
        const r = roomOf[idx(x, y)];
        drawFloor(c, g === G_CORR ? 'corridor' : (r ? FLOOR[r.kind === 'subject' ? r.id : r.kind] : 'corridor'), x, y, px, py, r);
        if (r && r.kind === 'subject' && r.level >= 4 && (x + y) % 3 === 0) R(c, px + 7, py + 7, 2, 2, '#ffffff38');
        // 牆角陰影
        const up = grid[idx(x, y - 1)], lf = grid[idx(x - 1, y)], rt = grid[idx(x + 1, y)];
        if (up === G_WALL) { R(c, px, py, T, 3, '#00000030'); R(c, px, py + 3, T, 2, '#00000016'); }
        if (lf === G_WALL) R(c, px, py, 3, T, '#00000022');
        if (rt === G_WALL) R(c, px + 13, py, 3, T, '#00000018');
      }
    }
    props.filter(p => p.flat).forEach(p => drawProp(c, p, 0));
    lastNight = nightLevel();
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
    // 環境粒子
    const vw = canvas.width / scale, vh = canvas.height / scale;
    if (motes.length < 45) {
      const x = camX + Math.random() * vw, y = camY + Math.random() * vh;
      const tx = Math.floor(x / T), ty = Math.floor(y / T);
      if (inb(tx, ty) && grid[idx(tx, ty)] === G_FLOOR) motes.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, life: 4 + Math.random() * 4, max: 8 });
    }
    for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; if (m.life <= 0) motes.splice(i, 1); }
    critters.forEach(b => {
      b.a += dt * b.s; b.x += Math.cos(b.a) * 14 * dt + b.dx * dt; b.y += Math.sin(b.a * 1.7) * 10 * dt;
      if (b.x < 0 || b.x > W * T) b.dx *= -1;
    });
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
      if (Math.random() < dt * 6) fx.push({ x: player.x + (Math.random() - 0.5) * 6, y: player.y - 1, vx: 0, vy: -6, life: 0.35, col: '#ffffff66', g: 0 });
    }
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
        if (!blocked(nx, ny)) { cat.x = nx; cat.y = ny; } else { cat.wait = 0.2; cat.tx = cat.x; cat.ty = cat.y; }
        cat.dir = dx < 0 ? 2 : 3;
      }
    }
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g ?? 30) * dt; if (f.life <= 0) fx.splice(i, 1); }
    if (Math.abs(nightLevel() - lastNight) > 0.15) renderStatic();
  }

  // ---------- 繪製 ----------
  function drawCat(c) {
    const x = Math.round(cat.x), y = Math.round(cat.y), m = cat.wait <= 0 && Math.floor(t * 8) % 2;
    shadow(c, x, y, 5, 2);
    const f = cat.dir === 2 ? -1 : 1;
    R(c, x - 6, y - 8, 12, 7, '#1a1320');
    R(c, x - 5, y - 7, 10, 5, '#f39c12'); R(c, x - 3, y - 6, 2, 3, '#e67e22'); R(c, x + 1, y - 6, 2, 3, '#e67e22');
    R(c, x - 4, y - 2 - m, 2, 2, '#e67e22'); R(c, x + 2, y - 2 + m - 1, 2, 2, '#e67e22');
    R(c, x + f * 4 - 3, y - 11, 6, 5, '#f39c12'); R(c, x + f * 4 - 3, y - 13, 2, 2, '#f39c12'); R(c, x + f * 4 + 1, y - 13, 2, 2, '#f39c12');
    R(c, x + f * 4 + (f > 0 ? 1 : -2), y - 9, 1, 1, '#222'); R(c, x + f * 4 - 2, y - 8, 1, 1, '#ffb3b3');
    R(c, x - f * 6 - (f > 0 ? 1 : 0), y - 10 + Math.round(Math.sin(t * 4)), 2, 5, '#e67e22');
    if (cat.wait > 2.5) { R(c, x + 6, y - 18 - Math.floor(t * 2) % 3, 3, 1, '#ffffffaa'); R(c, x + 7, y - 19 - Math.floor(t * 2) % 3, 1, 3, '#ffffffaa'); }
  }

  function drawLights(vw, vh) {
    const n = nightLevel();
    if (n > 0) {
      ctx.fillStyle = `rgba(18,22,58,${0.5 * n})`;
      ctx.fillRect(camX, camY, vw, vh);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const k = 0.18 + 0.5 * n;
    props.forEach(p => {
      const L = LIGHTS[p.type];
      if (!L) return;
      const lx = p.px + L[0], ly = p.py + L[1];
      if (lx < camX - 80 || lx > camX + vw + 80 || ly < camY - 80 || ly > camY + vh + 80) return;
      const flick = p.type === 'torch' || p.type === 'lantern' ? 0.85 + 0.15 * Math.sin(t * 9 + p.px) : 1;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, L[2]);
      g.addColorStop(0, `rgba(${L[3]},${0.35 * k * flick})`); g.addColorStop(1, `rgba(${L[3]},0)`);
      ctx.fillStyle = g; ctx.fillRect(lx - L[2], ly - L[2], L[2] * 2, L[2] * 2);
    });
    // 白天：窗戶灑進來的光
    if (n < 0.6) {
      props.forEach(p => {
        if (p.type !== 'window') return;
        if (p.px < camX - 64 || p.px > camX + vw + 64) return;
        const a = 0.07 * (1 - n);
        ctx.fillStyle = `rgba(255,250,220,${a})`;
        ctx.beginPath(); ctx.moveTo(p.px + 4, p.py + 14); ctx.lineTo(p.px + 28, p.py + 14); ctx.lineTo(p.px + 44, p.py + 74); ctx.lineTo(p.px + 14, p.py + 74); ctx.closePath(); ctx.fill();
      });
    }
    ctx.restore();
    // 灰塵 / 螢火蟲
    motes.forEach(m => { const a = Math.min(1, m.life, (m.max - m.life)) * 0.5; R(ctx, m.x, m.y, 1, 1, `rgba(255,250,220,${a})`); });
    critters.forEach(b => {
      if (b.x < camX - 10 || b.x > camX + vw + 10 || b.y < camY - 10 || b.y > camY + vh + 10) return;
      if (n > 0.5) { ctx.fillStyle = `rgba(220,255,120,${0.5 + 0.5 * Math.sin(t * 3 + b.a)})`; ctx.fillRect(Math.round(b.x), Math.round(b.y), 2, 2); }
      else { const w = Math.sin(t * 18 + b.a) > 0 ? 2 : 1; R(ctx, b.x - w, b.y, w, 2, b.col); R(ctx, b.x + 1, b.y, w, 2, b.col); R(ctx, b.x, b.y, 1, 2, '#333'); }
    });
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
    props.filter(p => p.ground).forEach(p => drawProp(ctx, p, t));
    props.filter(p => p.wall).forEach(p => drawProp(ctx, p, t));
    const list = props.filter(p => !p.wall && !p.flat && !p.ground && p.px + p.w * T > camX - 32 && p.px < camX + vw + 32 && p.py < camY + vh + 32 && p.py + p.h * T > camY - 32)
      .map(p => ({ y: p.py + p.h * T, d: () => drawProp(ctx, p, t) }));
    list.push({ y: player.y, d: () => drawChar(ctx, CHAR[Store.state.profile.char], player.x, player.y, player.dir, t, player.moving) });
    list.push({ y: cat.y, d: () => drawCat(ctx) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    fx.forEach(f => R(ctx, f.x, f.y, 2, 2, f.col));
    const hl = hoverProp || nearProp;
    if (hl) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.lineWidth = 1;
      ctx.strokeRect(hl.px - 1.5, hl.py - 1.5 - (hl.wall ? 2 : 0), hl.w * T + 3, hl.h * T + 3);
    }
    if (player.path && player.path.length) {
      const [gx, gy] = player.path[player.path.length - 1];
      R(ctx, gx * T + 6, gy * T + 10, 4, 2, `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 10)})`);
    }
    drawLights(vw, vh);
    // 畫面四周暗角
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLabels();
  }

  function toScreen(x, y) { return [(x - camX) * scale, (y - camY) * scale]; }

  function chip(text, sx, sy, bg, fg, size = 13) {
    ctx.font = `bold ${size}px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif`;
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; roundRect(sx - w / 2 + 1, sy - size - 2, w, size + 8, 6); ctx.fill();
    ctx.fillStyle = bg; roundRect(sx - w / 2, sy - size - 4, w, size + 8, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, sx, sy - size / 2);
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  function drawLabels() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const days = daysLeft();
    rooms.forEach(r => {
      const [sx, sy] = toScreen((r.x + r.w / 2) * T, r.y * T + 12);
      let text = r.name, bg = 'rgba(30,30,40,.88)';
      if (r.kind === 'subject') { text = `${r.sub.room}  Lv.${r.level}`; bg = r.sub.color; }
      chip(text, sx, sy, bg, '#fff', 13);
    });
    const cd = props.find(p => p.type === 'countdown');
    if (cd) {
      const [sx, sy] = toScreen(cd.px + cd.w * T / 2, cd.py + 7);
      const size = Math.max(12, Math.round(8 * scale));
      ctx.font = `900 ${size}px "Microsoft JhengHei",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff2e63'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff5c7a';
      ctx.fillText(days >= 0 ? `會考倒數 ${days} 天` : '會考已結束', sx, sy);
      ctx.shadowBlur = 0;
    }
    const sign = props.find(p => p.sign);
    if (sign) {
      const [sx, sy] = toScreen(sign.px + 24, sign.py + 9);
      ctx.font = `900 ${Math.max(10, Math.round(5 * scale))}px "Microsoft JhengHei",sans-serif`;
      ctx.fillStyle = '#5d4037'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('會考學習城', sx, sy);
    }
    props.forEach(p => {
      if (!p.label || p.sign) return;
      const show = p.bright || p === nearProp || p === hoverProp;
      if (!show) return;
      const [sx, sy] = p.below ? toScreen(p.px + p.w * T / 2, p.py + p.h * T + 2) : toScreen(p.px + p.w * T / 2, p.py - 4);
      const active = p === nearProp || p === hoverProp;
      chip(active ? `${p.label}（按 E 或點擊）` : p.label, sx, p.below ? sy + 20 : sy - 6, active ? '#ffd600' : 'rgba(255,214,0,.88)', '#222', active ? 13 : 12);
    });
    const [px, py] = toScreen(player.x, player.y + 4);
    chip(Store.state.profile.name, px, py + 16, 'rgba(20,20,30,.82)', '#fff', 12);
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

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function zoom(d) { scale = Math.max(1, Math.min(5, scale + d)); }

  function roomCenter(id) {
    const r = rooms.find(r => r.id === id);
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
      for (let i = 0; i < 14; i++) critters.push({ x: Math.random() * W * T, y: [BY - 4, BY + 45, BY + 50][i % 3] * T + Math.random() * 30, a: Math.random() * 7, s: 1 + Math.random(), dx: (Math.random() - 0.5) * 16, col: ['#ffd93d', '#ff8fab', '#ffffff', '#a0c4ff'][i % 4] });
      bindInput();
    },
    start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); },
    stop() { running = false; clearKeys(); },
    pause(v) { paused = v; clearKeys(); },
    refresh() { layoutProps(); },
    teleport, zoom, levelUpFx,
  };
})();

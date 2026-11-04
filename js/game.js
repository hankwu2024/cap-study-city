// ===== 城外：荒原試煉場（俯視角地城射擊） =====
const Game = (() => {
  const TS = 16, VW = 400, VH = 240;
  let cv, c, scale = 3, offX = 0, offY = 0;
  let running = false, paused = false, ended = false, last = 0, t = 0;
  let map, player, enemies, bullets, pickups, parts, texts, stage, waveLeft, portal, chest, turrets, meteors;
  let kills = 0, coins = 0, camX = 0, camY = 0, shake = 0, banner = null, nearItem = null;
  const keys = {};
  const mouse = { x: 0, y: 0, down: false, used: 0 };
  const stick = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const touchBtn = { fire: false };
  let isTouch = false;

  const WEAPONS = {
    pistol: { name: '練習手槍', cost: 0, rate: 0.28, dmg: 2, speed: 230, spread: 0.06, count: 1, color: '#ffe066' },
    smg: { name: '機甲連射槍', cost: 0.5, rate: 0.09, dmg: 1, speed: 260, spread: 0.14, count: 1, color: '#ff9f43' },
    shotgun: { name: '霰彈槍', cost: 2, rate: 0.55, dmg: 2, speed: 230, spread: 0.4, count: 5, color: '#feca57' },
    laser: { name: '雷射步槍', cost: 3, rate: 0.4, dmg: 5, speed: 430, spread: 0, count: 1, pierce: true, color: '#48dbfb' },
    staff: { name: '星辰法杖', cost: 1.5, rate: 0.3, dmg: 3, speed: 160, spread: 0.05, count: 1, homing: true, color: '#c56cf0' },
    bow: { name: '竹林長弓', cost: 1, rate: 0.45, dmg: 6, speed: 330, spread: 0, count: 1, pierce: true, color: '#a3cb38' },
    fire: { name: '火焰符咒', cost: 2.5, rate: 0.6, dmg: 3, speed: 170, spread: 0.3, count: 3, explode: true, color: '#ff6b6b' },
    blade: { name: '流光刃', melee: true, cost: 0, rate: 0.3, dmg: 5, range: 28, arc: 1.3, color: '#3ad1ff' },
  };
  const LOOT = ['shotgun', 'laser', 'staff', 'smg', 'bow', 'fire', 'blade'];
  const ENEMY = {
    slime: { hp: 5, r: 6, speed: 35, touch: 1, ai: 'chase' },
    bat: { hp: 3, r: 5, speed: 75, touch: 1, ai: 'zig' },
    archer: { hp: 6, r: 6, speed: 40, touch: 1, ai: 'ranged', cd: 1.8 },
    wisp: { hp: 8, r: 6, speed: 25, touch: 1, ai: 'ring', cd: 2.6 },
    knight: { hp: 15, r: 7, speed: 30, touch: 2, ai: 'chase' },
    boss: { hp: 160, r: 14, speed: 32, touch: 2, ai: 'boss' },
  };
  const THEMES = [
    { name: '荒原竹林', a: '#6b8f4e', b: '#638747', wall: '#3b5a2a', face: '#7a9a5c', crate: '#9c6b3f' },
    { name: '赤焰岩窟', a: '#7a4a3a', b: '#704234', wall: '#3d1f1a', face: '#8c4a3a', crate: '#5d4037' },
    { name: '星海遺跡', a: '#3a3a6a', b: '#343462', wall: '#1b1b3a', face: '#4d4d8a', crate: '#5f5f9c' },
  ];
  const theme = () => THEMES[Math.floor((stage - 1) / 5) % THEMES.length];
  const stageName = () => `${theme().name} ${Math.floor((stage - 1) / 5) + 1}-${((stage - 1) % 5) + 1}`;

  // ---------- 地圖 ----------
  function genMap(boss) {
    const w = boss ? 28 : 26, h = boss ? 20 : 18;
    const tiles = new Uint8Array(w * h);
    const hp = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x === 0 || y === 0 || x === w - 1 || y === h - 1) tiles[y * w + x] = 1;
    const cx = w / 2, cy = h / 2;
    const n = boss ? 4 : 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const bx = 2 + Math.floor(Math.random() * (w - 5)), by = 2 + Math.floor(Math.random() * (h - 5));
      if (Math.abs(bx - cx) < 4 && Math.abs(by - cy) < 4) continue;
      if (by > h - 6 && Math.abs(bx - cx) < 4) continue;
      const crate = Math.random() < 0.5;
      for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 2; x++) { tiles[y * w + x] = crate ? 2 : 1; if (crate) hp[y * w + x] = 3; }
    }
    return { w, h, tiles, hp };
  }
  const tileAt = (x, y) => { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return 1; return map.tiles[ty * map.w + tx]; };
  const solidAt = (x, y) => tileAt(x, y) !== 0;
  function circleBlocked(x, y, r) { return solidAt(x - r, y - r) || solidAt(x + r, y - r) || solidAt(x - r, y + r) || solidAt(x + r, y + r); }
  function moveEnt(e, dx, dy) {
    if (!circleBlocked(e.x + dx, e.y, e.r)) e.x += dx;
    if (!circleBlocked(e.x, e.y + dy, e.r)) e.y += dy;
  }
  function freeSpot(minDist) {
    for (let k = 0; k < 200; k++) {
      const x = (1.5 + Math.random() * (map.w - 3)) * TS, y = (1.5 + Math.random() * (map.h - 3)) * TS;
      if (circleBlocked(x, y, 7)) continue;
      if (Math.hypot(x - player.x, y - player.y) < minDist) continue;
      return [x, y];
    }
    return [map.w * TS / 2, TS * 3];
  }

  // ---------- 開始 ----------
  function newPlayer() {
    const ch = CHAR[Store.state.profile.char];
    return {
      ch, x: 0, y: 0, r: 5, dir: 0, hp: ch.hp, maxHp: ch.hp, shield: ch.shield, maxShield: ch.shield,
      energy: ch.energy, maxEnergy: ch.energy, weapons: ch.weapons.slice(), cur: 0, fireCd: 0, skillCd: 0,
      inv: 0, regen: 0, regenTick: 0, aim: 0, moving: false, dash: 0, dashDir: 0, speedUp: 0, swing: 0, guard: 0, rapid: 0, orbT: 0, orbHit: new Map(),
    };
  }

  function start() {
    cv = $('#game-canvas'); c = cv.getContext('2d');
    $('#world-canvas').classList.add('hidden'); $('#hud').classList.add('hidden');
    $('#game').classList.remove('hidden');
    $('#game-overlay').classList.add('hidden');
    isTouch = matchMedia('(pointer: coarse)').matches;
    $('#touch-ui').classList.toggle('hidden', !isTouch);
    World.stop();
    resize();
    player = newPlayer(); stage = 1; kills = 0; coins = 0; ended = false; paused = false;
    enterStage();
    running = true; last = performance.now(); requestAnimationFrame(loop);
  }

  function enterStage() {
    const isBoss = stage % 5 === 0, isTreasure = stage % 5 === 3;
    map = genMap(isBoss);
    decorate();
    enemies = []; bullets = []; pickups = []; parts = []; texts = []; turrets = []; meteors = [];
    portal = null; chest = null;
    player.x = map.w * TS / 2; player.y = (map.h - 3) * TS;
    unstick(player);
    banner = { text: stageName() + (isBoss ? '　⚠ 頭目房' : isTreasure ? '　🎁 寶箱房' : ''), life: 2.2 };
    if (isTreasure) {
      chest = { x: map.w * TS / 2, y: map.h * TS / 2 - 8, open: false };
      portal = { x: map.w * TS / 2, y: 3 * TS };
      waveLeft = 0;
    } else if (isBoss) {
      waveLeft = 0;
      spawn('boss', map.w * TS / 2, 5 * TS);
    } else {
      waveLeft = stage >= 6 ? 3 : 2;
      nextWave();
    }
  }

  function nextWave() {
    waveLeft--;
    const n = Math.min(12, 3 + Math.floor(stage * 0.8));
    const pool = ['slime', 'slime', 'bat'];
    if (stage >= 2) pool.push('archer');
    if (stage >= 4) pool.push('wisp');
    if (stage >= 7) pool.push('knight');
    for (let i = 0; i < n; i++) {
      const [x, y] = freeSpot(90);
      spawn(pool[Math.floor(Math.random() * pool.length)], x, y);
    }
  }

  function spawn(type, x, y) {
    const d = ENEMY[type], k = 1 + (stage - 1) * 0.12;
    enemies.push({ type, x, y, r: d.r, hp: Math.round(d.hp * k), maxHp: Math.round(d.hp * k), speed: d.speed, touch: d.touch, ai: d.ai,
      cd: (d.cd || 2) * (0.5 + Math.random()), spawnT: 0.7, flash: 0, ph: Math.random() * 6, phase: 0, phaseT: 3, charge: 0 });
  }

  // ---------- 輸入 ----------
  function bind() {
    window.addEventListener('keydown', e => {
      if (!running) return;
      keys[e.code] = true;
      if (e.code === 'Escape') togglePause();
      if (paused || ended) return;
      if (e.code === 'KeyQ') swap();
      if (e.code === 'KeyE') interact();
      if (e.code === 'KeyK') skill();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.down = false; stick.active = false; stick.dx = stick.dy = 0; });
    const cvs = $('#game-canvas');
    cvs.addEventListener('mousemove', e => { const r = cvs.getBoundingClientRect(); mouse.x = (e.clientX - r.left - offX) / scale; mouse.y = (e.clientY - r.top - offY) / scale; mouse.used = t; });
    cvs.addEventListener('mousedown', e => { if (e.button === 0) mouse.down = true; if (e.button === 2) skill(); });
    window.addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
    cvs.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('resize', () => running && resize());
    // 觸控
    const zone = $('#stick-zone');
    zone.addEventListener('pointerdown', e => { stick.active = true; stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.dx = stick.dy = 0; zone.setPointerCapture(e.pointerId); moveKnob(); });
    zone.addEventListener('pointermove', e => { if (!stick.active || e.pointerId !== stick.id) return; let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx *= m / d; dy *= m / d; } stick.dx = dx / m; stick.dy = dy / m; moveKnob(); });
    const endStick = () => { stick.active = false; stick.dx = stick.dy = 0; moveKnob(); };
    zone.addEventListener('pointerup', endStick); zone.addEventListener('pointercancel', endStick);
    const hold = (id, on, off) => { const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); on(); }); if (off) { b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); } };
    hold('#tb-fire', () => touchBtn.fire = true, () => touchBtn.fire = false);
    hold('#tb-skill', skill); hold('#tb-swap', swap); hold('#tb-use', interact); hold('#tb-pause', togglePause);
  }
  function moveKnob() { $('#stick-knob').style.transform = `translate(${stick.dx * 40}px, ${stick.dy * 40}px)`; }

  function resize() {
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    scale = Math.max(1, Math.floor(Math.min(cv.width / VW, cv.height / VH)));
    if (Math.min(cv.width / VW, cv.height / VH) < 1.5) scale = Math.min(cv.width / VW, cv.height / VH);
    offX = Math.round((cv.width - VW * scale) / 2); offY = Math.round((cv.height - VH * scale) / 2);
  }

  function togglePause() {
    if (ended) return;
    paused = !paused;
    const ov = $('#game-overlay');
    if (paused) {
      ov.innerHTML = `<div class="ov-box"><h2>⏸ 暫停</h2><p>${stageName()}　擊倒 ${kills}　金幣 ${coins}</p>
        <button class="btn big" id="g-resume">繼續</button><button class="btn ghost" id="g-quit">結束這次出城</button></div>`;
      ov.classList.remove('hidden');
      $('#g-resume').onclick = togglePause;
      $('#g-quit').onclick = () => { paused = false; gameOver(false); };
    } else ov.classList.add('hidden');
  }

  // ---------- 動作 ----------
  function weapon() { return WEAPONS[player.weapons[player.cur]]; }
  function swap() { player.cur = (player.cur + 1) % player.weapons.length; addText(player.x, player.y - 24, weapon().name, '#fff'); }

  function interact() {
    if (chest && !chest.open && Math.hypot(chest.x - player.x, chest.y - player.y) < 26) {
      chest.open = true;
      const opts = LOOT.filter(w => !player.weapons.includes(w));
      pickups.push({ kind: 'weapon', w: opts[Math.floor(Math.random() * opts.length)], x: chest.x - 14, y: chest.y + 14 });
      pickups.push({ kind: 'hp', x: chest.x + 14, y: chest.y + 14 });
      burst(chest.x, chest.y, '#ffd32a', 20);
      return;
    }
    if (nearItem && nearItem.kind === 'weapon') {
      const old = player.weapons[player.cur];
      player.weapons[player.cur] = nearItem.w;
      addText(player.x, player.y - 24, '獲得 ' + WEAPONS[nearItem.w].name, '#ffd32a');
      nearItem.w = old; nearItem.x = player.x; nearItem.y = player.y + 4;
    }
  }

  function skill() {
    if (paused || ended || player.skillCd > 0) return;
    const ch = player.ch;
    player.skillCd = ch.skill.cd;
    addText(player.x, player.y - 28, ch.skill.name + '！', '#7efff5');
    const ty = ch.skill.type;
    if (ty === 'guard') {
      // 赤翎：鐵壁反擊
      player.guard = 3.5; shake = 3; burst(player.x, player.y - 10, '#dfe6e9', 18);
    } else if (ty === 'overdrive') {
      // 銀隼：火力全開
      player.rapid = 5; player.speedUp = 5; burst(player.x, player.y - 8, '#ff9f43', 16);
    } else if (ty === 'foxfire') {
      // 緋狐：狐火環繞
      player.orbT = 7; player.orbHit = new Map(); burst(player.x, player.y - 8, '#ffb142', 20);
    } else if (ty === 'dragon') {
      // 夜刃：赤龍咆哮——先震退周圍，再放出貫穿的赤龍
      shake = 8;
      for (let i = 0; i < 36; i++) { const q = i / 36 * Math.PI * 2; parts.push({ x: player.x, y: player.y - 8, vx: Math.cos(q) * 160, vy: Math.sin(q) * 160, life: 0.3, col: i % 2 ? '#ff2d55' : '#ff8fa3', s: 2 }); }
      enemies.forEach(e => { if (e.spawnT <= 0 && dist(e, player) < 48) hurt(e, 4, (e.x - player.x) * 6, (e.y - player.y) * 6); });
      bullets.forEach(b => { if (!b.friendly && Math.hypot(b.x - player.x, b.y - player.y) < 48) b.life = 0; });
      const a = player.aim;
      bullets.push({ x: player.x + Math.cos(a) * 8, y: player.y - 8 + Math.sin(a) * 8, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230,
        r: 11, dmg: 14, life: 1.3, friendly: true, color: '#ff2d55', pierce: true, ghost: true, dragon: true, hit: new Set() });
    }
  }

  function orbPos() {
    const n = 5, out = [];
    for (let i = 0; i < n; i++) { const q = t * 4 + i / n * Math.PI * 2; out.push({ x: player.x + Math.cos(q) * 22, y: player.y - 8 + Math.sin(q) * 16 }); }
    return out;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function fire() {
    const w = weapon();
    if (player.fireCd > 0) return;
    if (player.energy < w.cost && player.rapid <= 0) { addText(player.x, player.y - 24, '能量不足', '#74b9ff'); player.fireCd = 0.4; return; }
    const od = player.rapid > 0;
    if (!od) player.energy -= w.cost;
    player.fireCd = w.rate * (od ? 0.35 : 1);
    const a = player.aim;
    if (w.melee) {
      player.swing = 0.15;
      enemies.forEach(e => {
        if (e.spawnT > 0) return;
        const d = dist(e, player); if (d > w.range + e.r) return;
        let da = Math.atan2(e.y - player.y, e.x - player.x) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < w.arc / 2 + 0.3) hurt(e, w.dmg, Math.cos(a) * 60, Math.sin(a) * 60);
      });
      // 揮砍可以打掉敵人的子彈
      bullets.forEach(b => { if (!b.friendly && Math.hypot(b.x - player.x, b.y - player.y) < w.range) { b.life = 0; burst(b.x, b.y, '#fff', 3); } });
      return;
    }
    const wid = player.weapons[player.cur], hand = handPos();
    const mz = weaponMuzzle(wid, hand.x, hand.y, a, wid === 'bow' ? 3 : 0);
    player.flash = 0.07;
    for (let i = 0; i < w.count; i++) {
      const sp = w.count > 1 ? (i / (w.count - 1) - 0.5) * w.spread : (Math.random() - 0.5) * w.spread;
      const ang = a + sp;
      bullets.push({ x: mz.x, y: mz.y, vx: Math.cos(ang) * w.speed, vy: Math.sin(ang) * w.speed, wid,
        r: w.explode ? 3 : 2, dmg: w.dmg, life: 1.4, friendly: true, color: w.color, pierce: w.pierce, homing: w.homing, explode: w.explode, hit: new Set() });
    }
    // 槍口火花
    const fc = wid === 'laser' ? '#c7f4ff' : wid === 'staff' ? '#f3d9ff' : wid === 'bow' ? null : '#fff3b0';
    if (fc) for (let i = 0; i < 4; i++) { const q = a + (Math.random() - 0.5) * 0.9, v = 40 + Math.random() * 50; parts.push({ x: mz.x, y: mz.y, vx: Math.cos(q) * v, vy: Math.sin(q) * v, life: 0.12, col: fc, s: 1 }); }
  }

  function hurt(e, dmg, kx, ky) {
    e.hp -= dmg; e.flash = 0.1;
    if (e.type !== 'boss') moveEnt(e, kx * 0.08, ky * 0.08);
    addText(e.x, e.y - 14, dmg, '#fff');
    burst(e.x, e.y - 4, '#fff', 3);
    if (e.hp <= 0) kill(e);
  }

  function kill(e) {
    e.dead = true; kills++; shake = Math.max(shake, e.type === 'boss' ? 10 : 2);
    burst(e.x, e.y - 4, e.type === 'boss' ? '#ff6b6b' : '#ffeaa7', e.type === 'boss' ? 60 : 12);
    const n = e.type === 'boss' ? 12 : 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) pickups.push({ kind: 'energy', x: e.x + (Math.random() - 0.5) * 16, y: e.y + (Math.random() - 0.5) * 16 });
    if (Math.random() < 0.6 || e.type === 'boss') pickups.push({ kind: 'coin', v: e.type === 'boss' ? 50 : 1 + Math.floor(Math.random() * 3), x: e.x, y: e.y });
    if (Math.random() < 0.06) pickups.push({ kind: 'hp', x: e.x, y: e.y });
    if (e.type === 'boss') {
      chest = { x: map.w * TS / 2, y: map.h * TS / 2, open: false };
      banner = { text: '頭目擊敗！', life: 2 };
    }
  }

  function damagePlayer(n) {
    if (player.inv > 0 || player.guard > 0 || ended) return;
    shake = 4; player.regen = 3; player.inv = 0.7;
    while (n-- > 0) { if (player.shield > 0) player.shield--; else player.hp--; }
    burst(player.x, player.y - 8, '#ff7675', 8);
    if (player.hp <= 0) { player.hp = 0; gameOver(true); }
  }

  // 角色卡在牆或箱子裡時，移到最近的空地
  function unstick(ent) {
    if (!circleBlocked(ent.x, ent.y, ent.r)) return;
    for (let rad = 4; rad <= 160; rad += 4) for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2, x = ent.x + Math.cos(a) * rad, y = ent.y + Math.sin(a) * rad;
      if (!circleBlocked(x, y, ent.r)) { ent.x = x; ent.y = y; return; }
    }
  }

  // ---------- 更新 ----------
  function aimTarget() {
    let best = null, bd = 230;
    enemies.forEach(e => { if (e.spawnT > 0) return; const d = dist(e, player); if (d < bd) { bd = d; best = e; } });
    return best;
  }

  function update(dt) {
    unstick(player);
    // 移動
    let vx = 0, vy = 0;
    if (keys.KeyA || keys.ArrowLeft) vx--; if (keys.KeyD || keys.ArrowRight) vx++;
    if (keys.KeyW || keys.ArrowUp) vy--; if (keys.KeyS || keys.ArrowDown) vy++;
    if (stick.active) { vx = stick.dx; vy = stick.dy; }
    const len = Math.hypot(vx, vy);
    player.moving = len > 0.1;
    if (len > 1) { vx /= len; vy /= len; }
    const sp = 88 * (player.speedUp > 0 ? 1.5 : 1);
    if (player.dash > 0) {
      player.dash -= dt;
      const dx = Math.cos(player.dashDir) * 320 * dt, dy = Math.sin(player.dashDir) * 320 * dt;
      moveEnt(player, dx, dy);
      parts.push({ x: player.x, y: player.y - 8, vx: 0, vy: 0, life: 0.25, col: '#3ad1ff', s: 3 });
      enemies.forEach(e => { if (!e.dead && e.spawnT <= 0 && !player.dashHit.has(e) && dist(e, player) < e.r + 12) { player.dashHit.add(e); hurt(e, 9, 0, 0); } });
    } else if (player.moving) moveEnt(player, vx * sp * dt, vy * sp * dt);
    if (player.moving) {
      if (Math.abs(vx) > Math.abs(vy)) player.dir = vx < 0 ? 2 : 3; else player.dir = vy < 0 ? 1 : 0;
    }
    // 瞄準
    const tg = aimTarget();
    if (tg) player.aim = Math.atan2(tg.y - 4 - (player.y - 8), tg.x - player.x);
    else if (!isTouch && t - mouse.used < 3) player.aim = Math.atan2(mouse.y + camY - (player.y - 8), mouse.x + camX - player.x);
    else if (player.moving) player.aim = Math.atan2(vy, vx);
    if (!player.moving) { const a = player.aim; player.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 2 : 3) : (Math.sin(a) < 0 ? 1 : 0); }
    // 計時
    player.fireCd -= dt; player.skillCd = Math.max(0, player.skillCd - dt); player.inv -= dt; player.speedUp -= dt; player.swing -= dt; player.flash = (player.flash || 0) - dt;
    player.guard -= dt; player.rapid -= dt; player.orbT -= dt;
    if (player.rapid > 0 && Math.random() < 0.4) parts.push({ x: player.x + (Math.random() - 0.5) * 12, y: player.y - Math.random() * 16, vx: 0, vy: -30, life: 0.3, col: Math.random() < 0.5 ? '#ff9f43' : '#ff4757', s: 1 });
    if (player.orbT > 0) {
      // 狐火：繞圈、燒傷敵人、擋子彈
      orbPos().forEach(o => {
        enemies.forEach(e => { if (e.spawnT > 0 || e.dead) return; const last = player.orbHit.get(e) || -9;
          if (Math.hypot(e.x - o.x, e.y - 4 - o.y) < e.r + 5 && t - last > 0.45) { player.orbHit.set(e, t); hurt(e, 3, e.x - player.x, e.y - player.y); } });
        bullets.forEach(b => { if (!b.friendly && Math.hypot(b.x - o.x, b.y - o.y) < 6) { b.life = 0; burst(b.x, b.y, '#ffb142', 4); } });
        if (Math.random() < 0.25) parts.push({ x: o.x, y: o.y, vx: 0, vy: -20, life: 0.3, col: Math.random() < 0.5 ? '#ffd32a' : '#ff6b35', s: 1 });
      });
      enemies = enemies.filter(e => !e.dead);
    }
    player.regen -= dt;
    if (player.regen <= 0 && player.shield < player.maxShield) { player.regenTick -= dt; if (player.regenTick <= 0) { player.shield++; player.regenTick = 1; } }
    if (keys.KeyJ || mouse.down || touchBtn.fire || keys.Space) fire();

    // 敵人
    enemies.forEach(e => {
      if (e.dead) return;
      e.flash -= dt;
      if (e.spawnT > 0) { e.spawnT -= dt; return; }
      const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      e.ph += dt;
      if (e.ai === 'chase') moveEnt(e, ux * e.speed * dt, uy * e.speed * dt);
      else if (e.ai === 'zig') { const s = Math.sin(e.ph * 6); moveEnt(e, (ux - uy * s) * e.speed * dt, (uy + ux * s) * e.speed * dt); }
      else if (e.ai === 'ranged' || e.ai === 'ring') {
        let mx = 0, my = 0;
        if (d < 80) { mx = -ux; my = -uy; } else if (d > 150) { mx = ux; my = uy; } else { mx = -uy * Math.sin(e.ph); my = ux * Math.sin(e.ph); }
        moveEnt(e, mx * e.speed * dt, my * e.speed * dt);
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = ENEMY[e.type].cd;
          if (e.ai === 'ranged') shootAt(e, Math.atan2(dy, dx), 110);
          else for (let k = 0; k < 8; k++) shootAt(e, k / 8 * Math.PI * 2 + e.ph, 75);
        }
      } else if (e.ai === 'boss') bossAI(e, dt, ux, uy, d);
      if (d < e.r + player.r + 2) damagePlayer(e.touch);
    });
    enemies = enemies.filter(e => !e.dead);

    // 子彈
    bullets.forEach(b => {
      if (b.homing) {
        const tg2 = aimTarget();
        if (tg2) { const a = Math.atan2(tg2.y - 4 - b.y, tg2.x - b.x), cur = Math.atan2(b.vy, b.vx); let da = Math.atan2(Math.sin(a - cur), Math.cos(a - cur)); const na = cur + Math.max(-4 * dt, Math.min(4 * dt, da)); const s = Math.hypot(b.vx, b.vy); b.vx = Math.cos(na) * s; b.vy = Math.sin(na) * s; }
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.wid === 'fire' && Math.random() < 0.7) parts.push({ x: b.x + (Math.random() - 0.5) * 3, y: b.y + (Math.random() - 0.5) * 3, vx: -b.vx * 0.15, vy: -b.vy * 0.15 - 15, life: 0.25, col: Math.random() < 0.5 ? '#ff9f43' : '#ffd32a', s: 1 });
      if (b.dragon) for (let k = 0; k < 2; k++) parts.push({ x: b.x + (Math.random() - 0.5) * 14, y: b.y + (Math.random() - 0.5) * 14, vx: -b.vx * 0.2, vy: -b.vy * 0.2, life: 0.35, col: Math.random() < 0.5 ? '#ff2d55' : '#7a0f24', s: 2 });
      if (b.wid === 'staff' && Math.random() < 0.35) parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.3, col: '#e0b3ff', s: 1 });
      const tile = tileAt(b.x, b.y);
      if (tile && !b.ghost) {
        if (tile === 2 && b.friendly) {
          const k = Math.floor(b.y / TS) * map.w + Math.floor(b.x / TS);
          map.hp[k] = (map.hp[k] || 1) - 1;
          if (map.hp[k] <= 0) { map.tiles[k] = 0; burst(b.x, b.y, theme().crate, 10); if (Math.random() < 0.5) pickups.push({ kind: 'energy', x: b.x, y: b.y }); }
        }
        if (b.explode) explode(b);
        b.life = 0; burst(b.x, b.y, b.color, 3); return;
      }
      if (b.friendly) {
        for (const e of enemies) {
          if (e.spawnT > 0 || b.hit.has(e)) continue;
          if (Math.hypot(e.x - b.x, e.y - 4 - b.y) < e.r + b.r) {
            b.hit.add(e); hurt(e, b.dmg, b.vx, b.vy);
            if (b.explode) explode(b);
            if (!b.pierce) { b.life = 0; break; }
          }
        }
      } else if (Math.hypot(player.x - b.x, player.y - 7 - b.y) < player.r + b.r + (player.guard > 0 ? 8 : 0)) {
        if (player.guard > 0) {
          // 鐵壁反擊：子彈反彈變成我方子彈
          b.friendly = true; b.vx *= -1.4; b.vy *= -1.4; b.dmg = 3; b.life = 1.2; b.color = '#e8434d'; b.hit = new Set();
          burst(b.x, b.y, '#fff', 4);
        } else { b.life = 0; damagePlayer(1); }
      }
    });
    bullets = bullets.filter(b => b.life > 0);
    enemies = enemies.filter(e => !e.dead);

    // 砲台
    turrets.forEach(tu => {
      tu.life -= dt; tu.cd -= dt;
      if (tu.cd <= 0) {
        let best = null, bd = 200; enemies.forEach(e => { if (e.spawnT > 0) return; const d = dist(e, tu); if (d < bd) { bd = d; best = e; } });
        if (best) { tu.cd = 0.25; const a = Math.atan2(best.y - 4 - tu.y + 6, best.x - tu.x); tu.a = a;
          bullets.push({ x: tu.x, y: tu.y - 6, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, r: 2, dmg: 2, life: 1, friendly: true, color: '#ff9f43', hit: new Set() }); }
      }
    });
    turrets = turrets.filter(tu => tu.life > 0);
    // 流星
    meteors.forEach(m => {
      m.t -= dt;
      if (m.t <= 0 && !m.done) {
        m.done = true; shake = 5; burst(m.x, m.y, '#ffd32a', 18);
        enemies.forEach(e => { if (e.spawnT <= 0 && Math.hypot(e.x - m.x, e.y - m.y) < m.r) hurt(e, m.dmg, 0, 0); });
      }
    });
    meteors = meteors.filter(m => !m.done);
    enemies = enemies.filter(e => !e.dead);

    // 撿東西
    nearItem = null;
    pickups.forEach(p => {
      const d = Math.hypot(p.x - player.x, p.y - player.y);
      if (p.kind === 'weapon') { if (d < 20) nearItem = p; return; }
      if (d < 50) { p.x += (player.x - p.x) * 6 * dt; p.y += (player.y - p.y) * 6 * dt; }
      if (d < 10) {
        p.gone = true;
        if (p.kind === 'energy') player.energy = Math.min(player.maxEnergy, player.energy + 8);
        if (p.kind === 'coin') { coins += p.v; }
        if (p.kind === 'hp') { player.hp = Math.min(player.maxHp, player.hp + 2); addText(player.x, player.y - 24, '+2 ❤', '#ff7675'); }
      }
    });
    pickups = pickups.filter(p => !p.gone);

    // 波次 / 傳送門
    if (!enemies.length && !portal && stage % 5 !== 3) {
      if (waveLeft > 0) nextWave();
      else { portal = { x: map.w * TS / 2, y: 3 * TS }; banner = { text: '房間清空！走進傳送門前往下一關', life: 2 }; }
    }
    if (portal && Math.hypot(portal.x - player.x, portal.y - player.y) < 12 && player.dash <= 0) {
      stage++; coins += 5; enterStage(); return;
    }

    // 特效
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt; });
    parts = parts.filter(p => p.life > 0);
    texts.forEach(x => { x.y -= 20 * dt; x.life -= dt; });
    texts = texts.filter(x => x.life > 0);
    if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
    shake = Math.max(0, shake - dt * 20);
  }

  function shootAt(e, a, sp, col) {
    bullets.push({ x: e.x, y: e.y - 5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3, dmg: 1, life: 4, friendly: false, color: col || '#ff4757', hit: new Set() });
  }

  function bossAI(e, dt, ux, uy, d) {
    e.phaseT -= dt; e.cd -= dt;
    if (e.phaseT <= 0) { e.phase = (e.phase + 1) % 4; e.phaseT = e.phase === 2 ? 1.6 : 3; e.cd = 0.3; e.shots = 0; }
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    if (e.phase === 0) { moveEnt(e, ux * e.speed * dt, uy * e.speed * dt); if (e.cd <= 0) { e.cd = 0.9; for (let k = 0; k < 16; k++) shootAt(e, k / 16 * Math.PI * 2 + e.ph, 80, '#ff6b81'); } }
    else if (e.phase === 1) { if (e.cd <= 0) { e.cd = 0.5; for (let k = -2; k <= 2; k++) shootAt(e, a + k * 0.18, 120, '#ffa502'); } }
    else if (e.phase === 2) {
      if (e.cd <= 0 && !e.charge) { e.charge = 0.8; e.ca = a; }
      if (e.charge > 0) { e.charge -= dt; moveEnt(e, Math.cos(e.ca) * 190 * dt, Math.sin(e.ca) * 190 * dt); if (e.charge <= 0) { e.charge = 0; e.cd = 0.6; } }
    } else if (e.phase === 3) {
      if (e.cd <= 0 && (e.shots || 0) < 1) { e.shots = 1; for (let k = 0; k < 3; k++) { const [x, y] = freeSpot(60); spawn(stage >= 10 ? 'bat' : 'slime', x, y); } }
      moveEnt(e, -uy * e.speed * dt, ux * e.speed * dt);
      if (e.cd <= 0) { e.cd = 0.15; shootAt(e, e.ph * 5, 90, '#a29bfe'); }
    }
  }

  function explode(b) {
    burst(b.x, b.y, '#ff9f43', 10);
    enemies.forEach(e => { if (!e.dead && e.spawnT <= 0 && Math.hypot(e.x - b.x, e.y - b.y) < 22 && !b.hit.has(e)) { b.hit.add(e); hurt(e, 2, 0, 0); } });
  }

  function burst(x, y, col, n) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = 30 + Math.random() * 80; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3 + Math.random() * 0.4, col, s: 2 }); }
  }
  function addText(x, y, text, col) { texts.push({ x, y, text: String(text), col, life: 0.8 }); }

  // ---------- 繪製 ----------
  function drawEnemy(e) {
    const x = Math.round(e.x), y = Math.round(e.y);
    if (e.spawnT > 0) {
      const p = 1 - e.spawnT / 0.7;
      c.strokeStyle = `rgba(255,80,80,${0.5 + 0.5 * Math.sin(t * 20)})`; c.beginPath(); c.ellipse(x, y - 1, e.r + 4 - p * 3, (e.r + 4 - p * 3) / 2, 0, 0, 7); c.stroke();
      R(c, x - 1, y - 4 - p * 6, 2, 2, '#ff8080');
      return;
    }
    const th = Math.floor((stage - 1) / 5) % 3;
    const set = enemyFrames(e.type, th);
    const fi = set.frames.length > 1 ? Math.floor(t * 8 + e.ph) % 2 : 0;
    const img = e.flash > 0 ? set.white[fi] : set.frames[fi];
    let w = img.width / 2, h = img.height / 2;
    shadow(c, x, y, Math.max(5, e.r), e.type === 'boss' ? 4 : 2);
    let sx = 1, sy = 1, lift = 0;
    if (e.type === 'slime') { const q = Math.sin(e.ph * 8) * 0.08; sx = 1 + q; sy = 1 - q; }
    if (e.type === 'boss') { const q = Math.sin(e.ph * 3) * 0.04; sx = 1 + q; sy = 1 - q; if (e.charge > 0) sx *= 1.05; }
    if (e.type === 'bat' || e.type === 'wisp') lift = 6 + Math.sin(e.ph * 4) * 2;
    const flip = player.x < e.x;
    c.save(); c.translate(x, y - lift); if (flip && e.type !== 'boss') c.scale(-1, 1);
    c.drawImage(img, -w * sx / 2, -h * sy + 1, w * sx, h * sy);
    c.restore();
    if (e.type !== 'boss' && e.hp < e.maxHp) { const bw = 14, by = y - lift - h - 3; R(c, x - bw / 2 - 1, by - 1, bw + 2, 4, '#1a1320'); R(c, x - bw / 2, by, bw, 2, '#4a2a2a'); R(c, x - bw / 2, by, Math.max(0, bw * e.hp / e.maxHp), 2, '#ff4757'); }
  }

  // ---------- 技能特效 ----------
  function drawSkillFx() {
    if (player.guard > 0) {
      const a = Math.min(1, player.guard * 2), p = 0.5 + 0.5 * Math.sin(t * 10);
      c.save(); c.globalAlpha = 0.35 * a; c.fillStyle = '#c8d6e5';
      c.beginPath(); c.ellipse(player.x, player.y - 10, 15, 16, 0, 0, 7); c.fill();
      c.globalAlpha = (0.6 + 0.3 * p) * a; c.strokeStyle = '#e8434d'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.arc(player.x, player.y - 10, 13, -2.4, -1.2); c.stroke();
      c.restore();
    }
    if (player.orbT > 0) orbPos().forEach((o, i) => {
      const f = Math.sin(t * 12 + i) > 0;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,120,30,0.35)';
      c.beginPath(); c.arc(o.x, o.y, 6, 0, 7); c.fill(); c.restore();
      R(c, o.x - 2, o.y - 2, 5, 5, '#ff6b35'); R(c, o.x - 1, o.y - (f ? 4 : 3), 3, 3, '#ffb142'); R(c, o.x - 1, o.y - 1, 2, 2, '#fff3b0');
    });
    if (player.rapid > 0) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 16);
      c.fillStyle = '#ff9f43'; c.beginPath(); c.ellipse(player.x, player.y - 1, 11, 4, 0, 0, 7); c.fill(); c.restore();
    }
  }
  function drawDragonBolt(b) {
    const a = Math.atan2(b.vy, b.vx);
    c.save(); c.translate(b.x, b.y); c.rotate(a);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,45,85,0.3)';
    c.beginPath(); c.ellipse(-6, 0, 22, 12, 0, 0, 7); c.fill();
    c.globalCompositeOperation = 'source-over';
    // 身體（波浪）
    for (let i = 6; i >= 1; i--) { const yy = Math.sin(t * 18 - i) * 3; R(c, -i * 5 - 3, yy - 3, 6, 6, i % 2 ? '#a3122e' : '#e0203f'); R(c, -i * 5 - 2, yy - 5, 2, 2, '#ff8fa3'); }
    // 頭
    R(c, -4, -6, 12, 12, '#e0203f'); R(c, 6, -4, 6, 8, '#e0203f'); R(c, 8, 1, 5, 3, '#7a0f24');
    R(c, -2, -9, 3, 4, '#ff8fa3'); R(c, 3, -10, 3, 5, '#ff8fa3');
    R(c, 3, -3, 3, 2, '#fff'); R(c, -4, -6, 12, 1, '#ff5c7a');
    c.restore();
  }
  function handPos() { return { x: player.x + Math.cos(player.aim) * 3, y: player.y - 8 + Math.sin(player.aim) * 2 }; }
  function drawWeapon() {
    const w = weapon(), id = player.weapons[player.cur], h = handPos();
    if (w.melee) {
      const sw = player.swing > 0 ? (player.swing / 0.15 - 0.5) * 2.2 : 0.6;
      if (player.swing > 0) {
        // 劍氣：多層半透明弧線
        const k = player.swing / 0.15, a0 = player.aim - w.arc / 2, a1 = player.aim + w.arc / 2;
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
          c.strokeStyle = `rgba(58,209,255,${(0.5 - i * 0.1) * k})`; c.lineWidth = 3 - i * 0.6;
          c.beginPath(); c.arc(h.x, h.y, w.range - 6 - i * 3, a0, a1); c.stroke();
        }
        c.strokeStyle = `rgba(255,255,255,${0.8 * k})`; c.lineWidth = 1; c.beginPath(); c.arc(h.x, h.y, w.range - 5, a0 + 0.2, a1 - 0.2); c.stroke();
        c.globalCompositeOperation = 'source-over'; c.lineWidth = 1;
      }
      drawWeaponSprite(c, id, h.x, h.y, player.aim + sw * (Math.cos(player.aim) < 0 ? -1 : 1));
      return;
    }
    let pull = 0;
    if (id === 'bow') pull = Math.max(0, Math.min(3, Math.round((1 - player.fireCd / w.rate) * 3)));
    const recoil = player.flash > 0 && id !== 'bow' ? 1.5 : 0;
    const mz = drawWeaponSprite(c, id, h.x, h.y, player.aim, { pull, recoil });
    // 武器本身的光
    if (id === 'staff' || id === 'fire' || id === 'laser') {
      const col = id === 'staff' ? '197,108,240' : id === 'fire' ? '255,140,60' : '72,219,251';
      const g = 0.6 + 0.4 * Math.sin(performance.now() / 150);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${col},${0.3 * g})`;
      c.beginPath(); c.arc(mz.x, mz.y, id === 'staff' ? 4 : 2.5, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
      if (id === 'fire' && Math.random() < 0.5) parts.push({ x: mz.x + (Math.random() - 0.5) * 3, y: mz.y, vx: 0, vy: -20, life: 0.2, col: '#ffb142', s: 1 });
    }
    // 槍口火光
    if (player.flash > 0 && id !== 'bow' && id !== 'staff' && id !== 'fire') {
      const fc = id === 'laser' ? '#c7f4ff' : '#fff3b0', r = id === 'shotgun' ? 4 : 2.6;
      c.save(); c.translate(mz.x, mz.y); c.rotate(player.aim); c.fillStyle = fc;
      c.beginPath(); c.moveTo(0, -r * 0.7); c.lineTo(r * 1.8, 0); c.lineTo(0, r * 0.7); c.lineTo(r * 0.5, 0); c.closePath(); c.fill();
      c.globalAlpha = 0.5; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.restore();
    }
  }

  // ---------- 場景美術 ----------
  const hsh = (x, y, k = 0) => ((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0;
  let darkCv = null;

  function decorate() {
    const th = Math.floor((stage - 1) / 5) % 3, tm = theme();
    const lay = document.createElement('canvas');
    lay.width = map.w * TS; lay.height = map.h * TS;
    const g = lay.getContext('2d');
    map.deco = []; map.torches = []; map.glows = [];
    const at = (x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? 1 : map.tiles[y * map.w + x];
    const cx = map.w / 2, cy = map.h / 2;
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const v = map.tiles[y * map.w + x], px = x * TS, py = y * TS, h = hsh(x, y, stage);
      if (v === 1) {
        const below = at(x, y + 1) !== 1;
        R(g, px, py, TS, TS, tm.wall);
        R(g, px, py, TS, 1, tm.face);
        if (hsh(x, y) % 3 === 0) R(g, px + 3, py + 5, 8, 1, '#00000030');
        if (below) {
          R(g, px, py + 4, TS, 12, tm.face);
          for (let k = 0; k < 3; k++) { R(g, px, py + 4 + k * 4 + 3, TS, 1, '#00000030'); R(g, px + ((k + x) % 2) * 8 + 2, py + 4 + k * 4, 1, 3, '#00000030'); }
          R(g, px, py + 4, TS, 1, '#ffffff30'); R(g, px, py + 14, TS, 2, '#00000050');
          if (x % 5 === 2 && y === 0) map.torches.push({ x: px + 8, y: py + 8 });
        }
        if (at(x - 1, y) !== 1) R(g, px, py, 1, TS, '#ffffff22');
        if (at(x + 1, y) !== 1) R(g, px + 15, py, 1, TS, '#00000040');
        continue;
      }
      if (th === 0) {
        R(g, px, py, TS, TS, [tm.a, tm.b, '#709553'][h % 3]);
        for (let k = 0; k < 4; k++) R(g, px + ((h >>> (k * 3)) % 16), py + ((h >>> (k * 3 + 1)) % 16), 1, 1, k % 2 ? '#5a7a3f' : '#86ab66');
        if (h % 6 === 0) { const tx = px + (h % 11) + 2, ty = py + ((h >>> 4) % 9) + 4; R(g, tx, ty, 1, 3, '#9cc47a'); R(g, tx + 2, ty + 1, 1, 2, '#9cc47a'); }
        if (h % 31 === 0) { R(g, px + 6, py + 6, 2, 2, '#ffe066'); R(g, px + 9, py + 8, 2, 2, '#ffe066'); }
      } else if (th === 1) {
        R(g, px, py, TS, TS, (x + y) % 2 ? tm.a : tm.b);
        R(g, px, py, TS, 1, '#00000030'); R(g, px, py, 1, TS, '#00000030');
        if (h % 5 === 0) { R(g, px + 3, py + 4, 5, 1, '#3d1f1a'); R(g, px + 7, py + 5, 1, 4, '#3d1f1a'); R(g, px + 8, py + 8, 4, 1, '#3d1f1a'); }
        if (h % 13 === 0) { R(g, px + 3, py + 9, 9, 1, '#ff6b35'); R(g, px + 6, py + 7, 1, 3, '#ff9f1a'); map.glows.push({ x: px + 8, y: py + 9, r: 22, col: '255,110,40' }); }
      } else {
        R(g, px, py, TS, TS, (x + y) % 2 ? tm.a : tm.b);
        R(g, px, py, TS, 1, '#ffffff10'); R(g, px, py, 1, TS, '#ffffff10');
        if (h % 4 === 0) R(g, px + (h % 14) + 1, py + ((h >>> 3) % 14) + 1, 1, 1, '#c9c9ff');
        if (h % 17 === 0) { g.strokeStyle = '#8f7dff'; g.strokeRect(px + 4.5, py + 4.5, 7, 7); R(g, px + 7, py + 3, 2, 10, '#8f7dff55'); map.glows.push({ x: px + 8, y: py + 8, r: 18, col: '150,120,255' }); }
      }
      if (at(x, y - 1) === 1) { R(g, px, py, TS, 4, '#00000040'); R(g, px, py + 4, TS, 2, '#00000020'); }
      if (at(x - 1, y) === 1) R(g, px, py, 3, TS, '#00000025');
      if (at(x + 1, y) === 1) R(g, px + 13, py, 3, TS, '#00000020');
      // 不會擋路的裝飾物
      if (v === 0 && h % 19 === 3 && (Math.abs(x - cx) > 3 || Math.abs(y - cy) > 3) && y < map.h - 4) {
        const kind = th === 0 ? ['bamboo', 'mushroom', 'bush'][h % 3] : th === 1 ? ['bones', 'lavaPool', 'skull'][h % 3] : ['crystal', 'orb', 'crystal'][h % 3];
        map.deco.push({ kind, x: px + 8, y: py + 12, s: h % 100 });
        if (kind === 'lavaPool') map.glows.push({ x: px + 8, y: py + 10, r: 30, col: '255,90,30' });
        if (kind === 'crystal' || kind === 'orb') map.glows.push({ x: px + 8, y: py + 6, r: 26, col: kind === 'orb' ? '255,220,120' : '120,200,255' });
      }
    }
    map.layer = lay;
  }

  function drawDeco() {
    map.deco.forEach(d => {
      const x = Math.round(d.x), y = Math.round(d.y);
      if (d.kind === 'bamboo') { const s = Math.round(Math.sin(t * 1.5 + d.s) * 1); for (const bx of [-4, 0, 3]) { R(c, x + bx + s, y - 26, 2, 26, '#5d9c3a'); for (let k = 0; k < 4; k++) R(c, x + bx + s, y - 24 + k * 6, 2, 1, '#2f5f1c'); } R(c, x - 6 + s, y - 22, 5, 2, '#88c057'); R(c, x + 4 + s, y - 15, 5, 2, '#88c057'); }
      else if (d.kind === 'mushroom') { R(c, x - 1, y - 5, 2, 5, '#f5e6c8'); R(c, x - 4, y - 8, 8, 3, '#e74c3c'); R(c, x - 2, y - 8, 1, 1, '#fff'); R(c, x + 2, y - 7, 1, 1, '#fff'); }
      else if (d.kind === 'bush') { R(c, x - 6, y - 7, 12, 7, '#3f7a2c'); R(c, x - 4, y - 9, 8, 3, '#5a9a3f'); R(c, x - 2, y - 5, 2, 2, '#e63946'); }
      else if (d.kind === 'bones') { R(c, x - 5, y - 3, 10, 2, '#e8e2d0'); R(c, x - 6, y - 4, 2, 4, '#e8e2d0'); R(c, x + 4, y - 4, 2, 4, '#e8e2d0'); }
      else if (d.kind === 'skull') { R(c, x - 3, y - 7, 6, 5, '#e8e2d0'); R(c, x - 2, y - 5, 1, 2, '#222'); R(c, x + 1, y - 5, 1, 2, '#222'); R(c, x - 2, y - 2, 4, 1, '#cfc7b0'); }
      else if (d.kind === 'lavaPool') { const g = 0.5 + 0.5 * Math.sin(t * 3 + d.s); c.fillStyle = '#4a1c12'; c.beginPath(); c.ellipse(x, y - 3, 9, 4, 0, 0, 7); c.fill(); c.fillStyle = `rgb(255,${Math.round(100 + g * 80)},30)`; c.beginPath(); c.ellipse(x, y - 3, 7, 3, 0, 0, 7); c.fill(); if (Math.floor(t * 3 + d.s) % 4 === 0) R(c, x - 2, y - 5, 2, 2, '#ffe08a'); }
      else if (d.kind === 'crystal') { const g = 0.6 + 0.4 * Math.sin(t * 2 + d.s); R(c, x - 2, y - 12, 4, 12, `rgba(120,200,255,${g})`); R(c, x - 6, y - 7, 3, 7, `rgba(160,140,255,${g})`); R(c, x + 3, y - 8, 3, 8, `rgba(160,140,255,${g})`); R(c, x - 1, y - 11, 1, 6, '#ffffffcc'); }
      else if (d.kind === 'orb') { const b = Math.sin(t * 2 + d.s) * 2; c.fillStyle = '#ffe08a'; c.beginPath(); c.arc(x, y - 10 + b, 3, 0, 7); c.fill(); R(c, x - 3, y - 1, 6, 1, '#00000040'); }
    });
    map.torches.forEach(tc => {
      const f = Math.sin(t * 12 + tc.x) > 0 ? 1 : 0;
      R(c, tc.x - 1, tc.y, 2, 6, '#5d4037'); R(c, tc.x - 3, tc.y - 5 - f, 6, 5, '#ff9f1a'); R(c, tc.x - 2, tc.y - 4 - f, 4, 3, '#fff200');
    });
  }

  function lightPass() {
    const dk = [0.22, 0.42, 0.5][Math.floor((stage - 1) / 5) % 3];
    if (!darkCv) darkCv = document.createElement('canvas');
    if (darkCv.width !== VW || darkCv.height !== VH) { darkCv.width = VW; darkCv.height = VH; }
    const d = darkCv.getContext('2d');
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, VW, VH);
    d.fillStyle = `rgba(8,6,20,${dk})`; d.fillRect(0, 0, VW, VH);
    d.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a = 1) => {
      const lx = x - camX, ly = y - camY;
      if (lx < -r || ly < -r || lx > VW + r || ly > VH + r) return;
      const gr = d.createRadialGradient(lx, ly, 0, lx, ly, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = gr; d.fillRect(lx - r, ly - r, r * 2, r * 2);
    };
    hole(player.x, player.y - 8, 120);
    map.torches.forEach(tc => hole(tc.x, tc.y, 60 + Math.sin(t * 9 + tc.x) * 4));
    map.glows.forEach(gl => hole(gl.x, gl.y, gl.r, 0.8));
    bullets.forEach(b => hole(b.x, b.y, 14, 0.6));
    if (portal) hole(portal.x, portal.y, 60);
    if (chest) hole(chest.x, chest.y, 36);
    c.drawImage(darkCv, Math.round(camX), Math.round(camY));
    c.save(); c.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, col, a) => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); };
    map.torches.forEach(tc => glow(tc.x, tc.y - 2, 40, '255,150,50', 0.25 + 0.05 * Math.sin(t * 9 + tc.x)));
    map.glows.forEach(gl => glow(gl.x, gl.y, gl.r, gl.col, 0.18 + 0.06 * Math.sin(t * 3 + gl.x)));
    if (portal) glow(portal.x, portal.y, 50, '80,255,180', 0.3);
    c.restore();
  }

  function render() {
    const tm = theme();
    camX = Math.max(0, Math.min(map.w * TS - VW, player.x - VW / 2));
    camY = Math.max(0, Math.min(map.h * TS - VH, player.y - VH / 2));
    if (map.w * TS < VW) camX = (map.w * TS - VW) / 2;
    if (map.h * TS < VH) camY = (map.h * TS - VH) / 2;
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#111'; c.fillRect(0, 0, cv.width, cv.height);
    c.imageSmoothingEnabled = false;
    c.setTransform(scale, 0, 0, scale, offX - Math.round((camX + sx) * scale), offY - Math.round((camY + sy) * scale));
    c.save(); c.beginPath(); c.rect(camX, camY, VW, VH); c.clip();
    // 地圖（地板與牆面已預先畫好）
    c.drawImage(map.layer, 0, 0);
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      if (map.tiles[y * map.w + x] !== 2) continue;
      const px = x * TS, py = y * TS;
      R(c, px + 1, py + 13, 14, 3, '#00000040');
      R(c, px + 1, py, 14, 14, tm.crate); R(c, px + 1, py, 14, 2, '#ffffff40'); R(c, px + 1, py + 12, 14, 2, '#00000040');
      R(c, px + 3, py + 6, 10, 1, '#00000050'); R(c, px + 7, py + 2, 1, 10, '#00000050');
      R(c, px + 2, py + 1, 1, 1, '#ffffff80'); R(c, px + 13, py + 1, 1, 1, '#ffffff80');
    }
    drawDeco();
    // 傳送門
    if (portal) {
      const g = 0.5 + 0.5 * Math.sin(t * 5);
      c.fillStyle = `rgba(80,255,180,${0.3 + 0.3 * g})`; c.beginPath(); c.ellipse(portal.x, portal.y, 12, 6, 0, 0, 7); c.fill();
      c.strokeStyle = '#55efc4'; c.beginPath(); c.ellipse(portal.x, portal.y, 9 + g * 3, 4 + g, 0, 0, 7); c.stroke();
      for (let k = 0; k < 4; k++) { const p = (t + k / 4) % 1; R(c, portal.x - 6 + k * 4, portal.y - p * 18, 2, 2, `rgba(255,255,255,${1 - p})`); }
    }
    // 流星預警
    meteors.forEach(m => {
      c.strokeStyle = `rgba(255,210,40,${0.4 + 0.4 * Math.sin(t * 20)})`; c.beginPath(); c.ellipse(m.x, m.y, m.r, m.r / 2, 0, 0, 7); c.stroke();
      const h = m.t * 160; R(c, m.x - 3 + h * 0.3, m.y - h - 3, 6, 6, '#ffd32a');
    });
    // 物品
    pickups.forEach(p => {
      if (p.kind === 'energy') { c.fillStyle = '#74b9ff'; c.beginPath(); c.arc(p.x, p.y, 2.5, 0, 7); c.fill(); }
      else if (p.kind === 'coin') { R(c, p.x - 2, p.y - 3, 5, 5, '#f9ca24'); R(c, p.x - 1, p.y - 2, 1, 2, '#fff'); }
      else if (p.kind === 'hp') { R(c, p.x - 3, p.y - 6, 6, 7, '#ff4757'); R(c, p.x - 1, p.y - 8, 2, 2, '#dfe6e9'); R(c, p.x - 2, p.y - 4, 1, 2, '#fff'); }
      else if (p.kind === 'weapon') {
        const b = Math.sin(t * 4) * 1.5; shadow(c, p.x, p.y + 2, 8, 2);
        c.globalCompositeOperation = 'lighter'; c.fillStyle = WEAPONS[p.w].color + '40';
        c.beginPath(); c.ellipse(p.x, p.y + 1, 11, 4, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
        drawWeaponIcon(c, p.w, p.x, p.y - 6 + b, 24, 18, p.w === 'bow' ? 0 : -0.3);
        if (Math.random() < 0.05) parts.push({ x: p.x + (Math.random() - 0.5) * 16, y: p.y - 6, vx: 0, vy: -12, life: 0.5, col: '#fff', s: 1 });
      }
    });
    if (chest) {
      const x = chest.x, y = chest.y; shadow(c, x, y + 6, 10, 3);
      R(c, x - 9, y - 6, 18, 12, '#b9770e'); R(c, x - 9, y - 6, 18, 2, '#f39c12'); R(c, x - 2, y - 2, 4, 4, '#f1c40f');
      if (chest.open) R(c, x - 9, y - 12, 18, 6, '#7e5109');
    }
    // 依 y 排序：敵人、玩家、砲台
    const list = enemies.map(e => ({ y: e.y, d: () => drawEnemy(e) }));
    turrets.forEach(tu => list.push({ y: tu.y, d: () => {
      shadow(c, tu.x, tu.y, 6, 2); R(c, tu.x - 5, tu.y - 6, 10, 6, '#4a5263'); R(c, tu.x - 3, tu.y - 11, 6, 5, '#ff8c1a');
      c.save(); c.translate(tu.x, tu.y - 9); c.rotate(tu.a || 0); R(c, 0, -1, 8, 2, '#2d3436'); c.restore();
      R(c, tu.x - 5, tu.y + 2, 10 * tu.life / 8, 1, '#ff8c1a');
    } }));
    list.push({ y: player.y, d: () => {
      if (player.inv > 0 && Math.floor(t * 20) % 2 && player.dash <= 0) return;
      const back = Math.sin(player.aim) < 0;
      if (back) drawWeapon();
      drawChar(c, player.ch, player.x, player.y, player.dir, t, player.moving);
      if (!back) drawWeapon();
      drawSkillFx();
    } });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    // 子彈
    bullets.forEach(b => {
      if (b.dragon) { drawDragonBolt(b); return; }
      if (b.wid) { drawProjectile(c, b, t); return; }
      c.fillStyle = b.color; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
      if (!b.friendly) { c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x, b.y, 1, 0, 7); c.fill(); }
    });
    parts.forEach(p => R(c, p.x, p.y, p.s, p.s, p.col));
    lightPass();
    c.restore();
    hud();
  }

  function hud() {
    c.setTransform(1, 0, 0, 1, 0, 0);
    const font = s => `bold ${s}px "Microsoft JhengHei","PingFang TC",sans-serif`;
    // 飄字
    texts.forEach(x => {
      const sx = offX + (x.x - camX) * scale, sy = offY + (x.y - camY) * scale;
      c.font = font(14); c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(x.text, sx + 1, sy + 1); c.fillStyle = x.col; c.fillText(x.text, sx, sy);
    });
    // 狀態列
    const bx = 12, by = 12, bw = 180;
    c.fillStyle = 'rgba(20,20,30,.75)'; c.fillRect(bx - 6, by - 6, bw + 70, 74);
    const barRow = (i, val, max, col, label) => {
      const y = by + i * 22;
      c.fillStyle = '#2d3436'; c.fillRect(bx + 26, y, bw, 16);
      c.fillStyle = col; c.fillRect(bx + 26, y, bw * Math.max(0, val) / max, 16);
      c.font = font(13); c.textAlign = 'left'; c.fillStyle = '#fff'; c.textBaseline = 'middle';
      c.fillText(label, bx, y + 8); c.textAlign = 'center'; c.fillText(`${Math.floor(val)} / ${max}`, bx + 26 + bw / 2, y + 9);
    };
    barRow(0, player.hp, player.maxHp, '#e74c3c', '❤');
    barRow(1, player.shield, player.maxShield, '#95a5a6', '🛡');
    barRow(2, player.energy, player.maxEnergy, '#3498db', '⚡');
    c.textBaseline = 'alphabetic';
    // 關卡
    c.font = font(16); c.textAlign = 'center'; c.fillStyle = '#fff';
    c.fillText(stageName(), cv.width / 2, 26);
    c.textAlign = 'right'; c.fillText(`💰 ${coins}　💀 ${kills}`, cv.width - 16, 26);
    // 頭目血條
    const boss = enemies.find(e => e.type === 'boss');
    if (boss) {
      const w = Math.min(500, cv.width - 80), x = (cv.width - w) / 2;
      c.fillStyle = '#2d3436'; c.fillRect(x, 40, w, 12); c.fillStyle = '#ff4757'; c.fillRect(x, 40, w * boss.hp / boss.maxHp, 12);
      c.font = font(12); c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(`${theme().name}守護者`, cv.width / 2, 66);
    }
    // 武器與技能
    const wx = cv.width - 230, wy = cv.height - (isTouch ? 230 : 90);
    c.fillStyle = 'rgba(20,20,30,.75)'; c.fillRect(wx, wy, 218, 76);
    player.weapons.forEach((id, i) => {
      const w = WEAPONS[id], on = i === player.cur, iy = wy + 14 + i * 22;
      c.fillStyle = on ? 'rgba(255,211,42,.18)' : 'rgba(255,255,255,.05)'; c.fillRect(wx + 6, iy - 10, 46, 20);
      c.globalAlpha = on ? 1 : 0.55; drawWeaponIcon(c, id, wx + 29, iy, 44, 18, id === 'bow' ? -Math.PI / 4 : 0); c.globalAlpha = 1;
      c.font = font(14); c.textAlign = 'left'; c.fillStyle = on ? '#ffd32a' : '#aaa';
      c.fillText(`${w.name}${w.cost ? `（⚡${w.cost}）` : ''}`, wx + 58, iy + 5);
    });
    const ready = player.skillCd <= 0;
    c.fillStyle = ready ? '#7efff5' : '#888';
    c.fillText(`✦ ${player.ch.skill.name}${ready ? '（K）' : `　${player.skillCd.toFixed(1)}s`}`, wx + 10, wy + 66);
    // 提示
    let tip = null;
    if (nearItem) tip = `按 E 撿起「${WEAPONS[nearItem.w].name}」（換掉目前武器）`;
    else if (chest && !chest.open && Math.hypot(chest.x - player.x, chest.y - player.y) < 26) tip = '按 E 打開寶箱';
    if (tip) {
      c.font = font(15); c.textAlign = 'center';
      const w = c.measureText(tip).width + 24;
      c.fillStyle = 'rgba(255,214,0,.92)'; c.fillRect(cv.width / 2 - w / 2, cv.height - 70, w, 30);
      c.fillStyle = '#222'; c.fillText(tip, cv.width / 2, cv.height - 49);
    }
    if (banner) {
      c.globalAlpha = Math.min(1, banner.life * 2);
      c.font = font(26); c.textAlign = 'center';
      c.fillStyle = '#000'; c.fillText(banner.text, cv.width / 2 + 2, cv.height / 3 + 2);
      c.fillStyle = '#ffd32a'; c.fillText(banner.text, cv.width / 2, cv.height / 3);
      c.globalAlpha = 1;
    }
  }

  function loop(ts) {
    if (!running) return;
    const dt = Math.max(0, Math.min(0.033, (ts - last) / 1000 || 0)); last = ts;
    requestAnimationFrame(loop);   // 先排好下一格：就算這一格出錯，遊戲也不會整個卡住
    try {
      if (!paused && !ended) { t += dt; update(dt); }
      render();
    } catch (err) { console.error('遊戲畫面發生錯誤（已略過這一格）', err); }
  }

  function gameOver(died) {
    if (ended) return;
    ended = true;
    const score = kills * 10 + coins + (stage - 1) * 50;
    const g = Store.state.game;
    const newBest = score > (g.best || 0);
    g.best = Math.max(g.best || 0, score); g.bestStage = Math.max(g.bestStage || 0, stage);
    Store.save();
    const ov = $('#game-overlay');
    ov.innerHTML = `<div class="ov-box"><h2>${died ? '💥 倒下了…' : '🏳 結束出城'}</h2>
      <p>到達：<b>${stageName()}</b>（第 ${stage} 關）</p>
      <p>擊倒 <b>${kills}</b>　金幣 <b>${coins}</b></p>
      <p class="score">分數 ${score} ${newBest ? '🏆 新紀錄！' : ''}</p>
      <p class="hint">最佳：第 ${g.bestStage} 關 / ${g.best} 分</p>
      <button class="btn big" id="g-back">回到城內</button></div>`;
    ov.classList.remove('hidden');
    $('#g-back').onclick = stop;
  }

  function stop() {
    running = false;
    for (const k in keys) keys[k] = false;
    mouse.down = false; touchBtn.fire = false;
    $('#game').classList.add('hidden');
    $('#world-canvas').classList.remove('hidden'); $('#hud').classList.remove('hidden');
    HUD.refresh();
    World.start();
  }

  return { start, bind, isRunning: () => running };
})();

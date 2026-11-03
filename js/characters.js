// ===== 角色：像素點陣圖 + 自動描邊 + 走路動畫 =====
// 每個角色有 down（正面）、up（背面）、side（朝右，朝左時鏡像）三個方向
// 點陣圖中 '.' 代表透明，其他字母對應 pal 調色盤；最後三列是腳，走路時會自動抬腳

const CHARACTERS = [
  {
    id: 'chiling', name: '赤翎', title: '赤翎鐵衛', tag: '武俠 × 騎士',
    desc: '頭盔上插著赤紅羽翎的鐵衛，守護同伴從不退後一步。',
    hp: 7, shield: 5, energy: 160, weapons: ['blade', 'pistol'],
    skill: { name: '鐵壁衝鋒', desc: '舉盾向前衝刺，撞飛路徑上的敵人，衝刺時無敵', cd: 5, type: 'dash' },
    pal: { R: '#e0414a', r: '#9c2228', H: '#8d96aa', h: '#5d6577', L: '#cfd6e2', V: '#23262e', S: '#cf3440', s: '#8e1f2a', B: '#707a8e', b: '#4c5263', G: '#e8bf4f', F: '#3a3f4d', k: '#1d1d24' },
    sprite: {
      down: [
        '.....RRRR.......',
        '...RRRRRRr......',
        '..Rr...HHHRr....',
        '....HHHHHHHH....',
        '...HLLHHHHHHh...',
        '..HLHHHHHHHHHh..',
        '..HLHVVVVVVHHh..',
        '..HHHVhVhVhVHh..',
        '..HHHVVVVVVVHh..',
        '..hHHHHHHHHHhh..',
        '..SShhhhhhhhSS..',
        '.SSSSBBBBBBSSSs.',
        '.sSSBBGBBGBBSs..',
        '..ssBBBBBBBBs...',
        '...bBBBBBBBBb...',
        '...bbbbbbbbbb...',
        '....FFF..FFF....',
        '....FFF..FFF....',
        '....kkk..kkk....',
      ],
      up: [
        '.....RRRR.......',
        '...RRRRRRr......',
        '..Rr..RHHHRr....',
        '....HHHRHHHH....',
        '...HHHHRHHHHh...',
        '..HHHHHHHHHHHh..',
        '..HLHHHHHHHHHh..',
        '..HHHHHHHHHHHh..',
        '..HHHHHHHHHHHh..',
        '..hHHHHHHHHHhh..',
        '..SShhhhhhhhSS..',
        '.SSSSSSSSSSSSSs.',
        '.sSSSSSSSSSSSSs.',
        '..sssSSSSSSsss..',
        '...bsssssssssb..',
        '...bbbbbbbbbb...',
        '....FFF..FFF....',
        '....FFF..FFF....',
        '....kkk..kkk....',
      ],
      side: [
        '...RRRR.........',
        '.RRRRRRr........',
        'Rr...RHHHH......',
        '....HHHHHHHH....',
        '...HHHHHLLHHh...',
        '..HHHHHHHHLHHh..',
        '..HHHHHHVVVVVh..',
        '..HHHHHHVhVhVh..',
        '..HHHHHHVVVVVh..',
        '..hHHHHHHHHHhh..',
        '..sSShhhhhhhh...',
        '.sSSSSBBBBBB....',
        'ssSSSBBBBGBB....',
        '.s.sBBBBBBBB....',
        '....bBBBBBBb....',
        '....bbbbbbbb....',
        '.....FFF.FFF....',
        '.....FFF.FFF....',
        '.....kkk.kkk....',
      ],
    },
  },
  {
    id: 'fengxing', name: '風行', title: '荒野遊俠', tag: '日常 × 冒險',
    desc: '戴著大草帽、嘴裡叼根草的旅人，走到哪學到哪。',
    hp: 6, shield: 4, energy: 170, weapons: ['shotgun', 'pistol'],
    skill: { name: '疾風小憩', desc: '喘口氣回復 2 點生命、護盾全滿，並加速 4 秒', cd: 14, type: 'rest' },
    pal: { T: '#946a3b', t: '#5e3f20', U: '#c0935a', q: '#3b2a1a', D: '#1d1a22', E: '#ffa033', W: '#97d957', C: '#cf3440', c: '#8a1f28', B: '#3d3a4a', F: '#2a2833', k: '#141218' },
    sprite: {
      down: [
        '.....TTTTT......',
        '....TUUUUTT.....',
        '...TUUUTTTTT....',
        '...TTTTTTTTTT...',
        '.TTTTTTTTTTTTTt.',
        'tTqqqqqqqqqqqqTt',
        '.tttttttttttttt.',
        '...DDDDDDDDDD...',
        '...DEEDDDDEEDWW.',
        '...DEEDDDDEEDDWW',
        '..CDDDDDDDDDDC..',
        '.CCCCCCCCCCCCCC.',
        'CCcCCCCCCCCCCcC.',
        'Cc.cBBBBBBBBcCc.',
        'c...BBBBBBBB.cc.',
        '....BBBBBBBB....',
        '....FFF..FFF....',
        '....FFF..FFF....',
        '....kkk..kkk....',
      ],
      up: [
        '.....TTTTT......',
        '....TTTUUTT.....',
        '...TTTTTUUTT....',
        '...TTTTTTTTTT...',
        '.TTTTTTTTTTTTTt.',
        'tTqqqqqqqqqqqqTt',
        '.tttttttttttttt.',
        '...DDDDDDDDDD...',
        '...DDDDDDDDDD...',
        '...DDDDDDDDDD...',
        '..CCCCCCCCCCCC..',
        '.CCCCCCCCCCCCCC.',
        'CCcCCCCCCCCCCcC.',
        'CccCCCCCCCCCCccC',
        'c.ccccCCCCcccc.c',
        '....BBBBBBBB....',
        '....FFF..FFF....',
        '....FFF..FFF....',
        '....kkk..kkk....',
      ],
      side: [
        '.....TTTTT......',
        '....TUUUUTT.....',
        '...TUUTTTTTT....',
        '...TTTTTTTTTT...',
        '.TTTTTTTTTTTTTt.',
        'tTqqqqqqqqqqqqTt',
        '.tttttttttttttt.',
        '....DDDDDDDDD...',
        '....DDDDDDEEDWWW',
        '....DDDDDDEEDD..',
        '..CCDDDDDDDDD...',
        'CCCCCCCCCCCC....',
        'cCCCcCBBBBBB....',
        '.ccc.cBBBBBB....',
        '..c...BBBBBB....',
        '......BBBBBB....',
        '......FFF.FFF...',
        '......FFF.FFF...',
        '......kkk.kkk...',
      ],
    },
  },
  {
    id: 'feihu', name: '緋狐', title: '緋紅狐巫', tag: '魔法',
    desc: '紅髮狐耳的小巫女，尾巴一甩就能點燃狐火。',
    hp: 4, shield: 5, energy: 240, weapons: ['staff', 'pistol'],
    skill: { name: '狐火流星', desc: '召喚狐火流星砸向附近的敵人，範圍傷害', cd: 8, type: 'meteor' },
    pal: { N: '#4a2230', P: '#e2a9ae', A: '#e2404f', a: '#a82838', K: '#fde3d3', k: '#1d1418', Y: '#cf7a1e', M: '#e05a6a', b: '#f4a3a3', W: '#f4efe9', D: '#4d2536', d: '#33171f', O: '#f0b030', X: '#fbf7f0', F: '#f6d5c4' },
    sprite: {
      down: [
        '.NN.......NN....',
        '.NPN.....NPN....',
        '.NPAAAAAAAPN....',
        '.NAAAAAAAAAAN...',
        '.AAAAaAAAaAAAA..',
        '.AAaKKaAaKKaAA..',
        'AAAKkKKKKKkKAAA.',
        'AAAKYKKKKKYKAAA.',
        'AAaKbKKMKKbKaAA.',
        '.Aa.KKKKKKKK.aA.',
        '.A..WWWWWWW..A..',
        '.a.KDDDODDDK.a..',
        '...KDDDDDDDK.XX.',
        '....DDDDDDD.AAXX',
        '....dDDDDDd.AAA.',
        '....ddddddd..a..',
        '.....FF.FF......',
        '.....FF.FF......',
        '.....kk.kk......',
      ],
      up: [
        '.NN.......NN....',
        '.NNN.....NNN....',
        '.NNAAAAAAANN....',
        '.NAAAAAAAAAAN...',
        '.AAAAAAAAAAAAA..',
        '.AAAAAAAAAAAAA..',
        'AAAAAaAAAaAAAAA.',
        'AAAAAAAAAAAAAAA.',
        'AAaAAAAAAAAAaAA.',
        '.AaAAAAAAAAAAaA.',
        '.A.aAAAAAAAAa.A.',
        '.a..aAAAAAAa..a.',
        '...KDDDDDDDDK...',
        '....DDAAAADD....',
        '....dDAAXXDd....',
        '....dddXXXdd....',
        '.....FF.FF......',
        '.....FF.FF......',
        '.....kk.kk......',
      ],
      side: [
        '....NN..........',
        '....NPN.........',
        '...NAAAAAA......',
        '..AAAAAAAAA.....',
        '.AAAAAAAaAAA....',
        '.AAAAAaKKKaA....',
        '.AAAAAKKKkKK....',
        '.AAAAAKKKYKK....',
        '.AAaAAKbKKKM....',
        '.AAaAAKKKKK.....',
        '.AA.aWWWWW......',
        'XAa..DDDOD......',
        'XXAa.DDDDDK.....',
        '.XAAAADDDDK.....',
        '..AAAdDDDDd.....',
        '.....ddddd......',
        '......FF.FF.....',
        '......FF.FF.....',
        '......kk.kk.....',
      ],
    },
  },
  {
    id: 'yeren', name: '夜刃', title: '赤角機鎧', tag: '科幻',
    desc: '白髮赤角、戴著機械面罩的戰士，紅色單眼能掃描所有弱點。',
    hp: 5, shield: 6, energy: 180, weapons: ['smg', 'pistol'],
    skill: { name: '魔眼無人機', desc: '放出一台自動射擊的無人機，持續 8 秒', cd: 12, type: 'turret' },
    pal: { W: '#ece7f2', w: '#b3abc0', R: '#e02a40', r: '#8c1424', V: '#2a2433', E: '#ff3b4e', B: '#3d3548', b: '#26212e', G: '#6a6278', C: '#a8192b', c: '#6a0f1a', F: '#26212e', k: '#141018' },
    sprite: {
      down: [
        'R.....W.W.....R.',
        'RR...WWWWW...RR.',
        '.RR.WWWWWWW.RR..',
        '..RWWWWWWWWWR...',
        '..WWWwWWWwWWW...',
        '.WWWRRRRRRRWWW..',
        '.WwVVVVVVVVVwW..',
        '.WwVVEVVVEVVwW..',
        '.wWVVVVVVVVVWw..',
        '..wGVVVVVVVGw...',
        '.CCbGGGGGGGbCC..',
        'CCRBBBBRBBBBRCC.',
        'CcBBBBRRRBBBBcC.',
        'Cc.BBBBRBBBB.cC.',
        'c..bBBBBBBBb..c.',
        '...bbbbbbbbb....',
        '....FFF.FFF.....',
        '....FFF.FFF.....',
        '....kkk.kkk.....',
      ],
      up: [
        'R.....W.W.....R.',
        'RR...WWWWW...RR.',
        '.RR.WWWWWWW.RR..',
        '..RWWWWWWWWWR...',
        '..WWWWWWWWWWW...',
        '.WWWWWWWWWWWWW..',
        '.WWWWwWWWwWWWW..',
        '.WWwWWWWWWWwWW..',
        '.wWWwWWWWWwWWw..',
        '..wWWwWWWwWWw...',
        '.CCCCCCCCCCCCC..',
        'CCCCCCCCCCCCCCC.',
        'CcCCCCCCCCCCCcC.',
        'Cc.CCCCCCCCCC.cC',
        'c..cccccccccc..c',
        '...bbbbbbbbb....',
        '....FFF.FFF.....',
        '....FFF.FFF.....',
        '....kkk.kkk.....',
      ],
      side: [
        '......W.W...R...',
        '.....WWWWW.RR...',
        '...WWWWWWWRR....',
        '..WWWWWWWWR.....',
        '.WWWWwWWWWW.....',
        '.WWWWWRRRRRW....',
        '.WWwWWVVVVVV....',
        '.WWwWWVVVEVV....',
        '.wWWwWVVVVVV....',
        '..wWWWGVVVVG....',
        '.CCCbGGGGGb.....',
        'CCCCBBBRBBB.....',
        'cCCCBBRRRBB.....',
        '.cCCBBBRBBB.....',
        '..ccbBBBBBb.....',
        '....bbbbbbb.....',
        '.....FFF.FFF....',
        '.....FFF.FFF....',
        '.....kkk.kkk....',
      ],
    },
  },
];
const CHAR = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
// 舊版角色 id 對應到新角色（讓舊存檔可以繼續用）
const CHAR_MIGRATE = { lingxiao: 'chiling', xiaoju: 'fengxing', xingyu: 'feihu', tieyu: 'yeren' };

const SPRITE_OUTLINE = '#1a1320';
const _spriteCache = {};

function _legRuns(row) {
  const runs = []; let s = -1;
  for (let x = 0; x <= row.length; x++) {
    const on = x < row.length && row[x] !== '.';
    if (on && s < 0) s = x;
    if (!on && s >= 0) { runs.push([s, x - 1]); s = -1; }
  }
  return runs;
}

function _renderGrid(g, pal) {
  const h = g.length, w = g[0].length;
  const cv = document.createElement('canvas');
  cv.width = w + 2; cv.height = h + 2;
  const c = cv.getContext('2d');
  const on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && g[y][x] !== '.';
  c.fillStyle = SPRITE_OUTLINE;
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
    if (on(x, y)) continue;
    if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) c.fillRect(x + 1, y + 1, 1, 1);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = g[y][x];
    if (k === '.') continue;
    c.fillStyle = pal[k] || '#ff00ff';
    c.fillRect(x + 1, y + 1, 1, 1);
  }
  return cv;
}

function charFrames(ch, dirKey) {
  const key = ch.id + ':' + dirKey;
  if (_spriteCache[key]) return _spriteCache[key];
  const map = ch.sprite[dirKey];
  const W = Math.max(...map.map(r => r.length)), H = map.length;
  const base = map.map(r => r.padEnd(W, '.').split(''));
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const g = base.map(r => r.slice());
    if (f === 1 || f === 3) {
      for (let y = H - 3; y < H; y++) {
        const run = _legRuns(base[y])[f === 1 ? 0 : 1];
        if (!run) continue;
        for (let x = run[0]; x <= run[1]; x++) { g[y - 1][x] = base[y][x]; if (y === H - 1) g[y][x] = '.'; }
      }
    }
    frames.push(_renderGrid(g, ch.pal));
  }
  return (_spriteCache[key] = frames);
}

// (x, y) 是腳底中心；dir 0下 1上 2左 3右
function drawChar(c, ch, x, y, dir, t, moving) {
  const frames = charFrames(ch, dir === 0 ? 'down' : dir === 1 ? 'up' : 'side');
  t = Math.abs(t);
  const f = moving ? Math.floor(t * 8) % 4 : 0;
  const bob = moving ? (f % 2 ? -1 : 0) : (Math.floor(t * 1.6) % 2 ? -1 : 0);
  const img = frames[f];
  x = Math.round(x); y = Math.round(y);
  shadow(c, x, y, 7, 2.5);
  const top = y - img.height + 2 + bob;
  if (dir === 2) {
    c.save(); c.translate(x, 0); c.scale(-1, 1);
    c.drawImage(img, -Math.floor(img.width / 2), top);
    c.restore();
  } else c.drawImage(img, x - Math.floor(img.width / 2), top);
}

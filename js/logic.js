// ===== 進度計算、房間等級、弱點分析、出城令 =====

function allUnitKeys(sub) {
  const keys = [];
  sub.books.forEach((b, bi) => b.units.forEach((_, ui) => keys.push(`${bi}-${ui}`)));
  return keys;
}

function unitStatus(subId, key) {
  const u = (Store.state.units[subId] || {})[key];
  return u ? u.s : 0;
}

function subjectProgress(sub) {
  const keys = allUnitKeys(sub);
  const done = keys.filter(k => unitStatus(sub.id, k) === 2).length;
  const doing = keys.filter(k => unitStatus(sub.id, k) === 1).length;
  return { total: keys.length, done, doing, pct: keys.length ? done / keys.length : 0 };
}

function roomLevel(sub) {
  const { done } = subjectProgress(sub);
  return Math.min(MAX_LEVEL, 1 + Math.floor(done / unitsPerLevel(sub)));
}

function nextLevelInfo(sub) {
  const lv = roomLevel(sub);
  if (lv >= MAX_LEVEL) return null;
  const need = (lv) * unitsPerLevel(sub) - subjectProgress(sub).done;
  return { next: lv + 1, need };
}

function daysLeft() {
  const d = new Date(Store.state.examDate + 'T08:00:00');
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((d - t0) / 86400000);
}

// 短時間內拿到多張出城令時，合併成一則通知
let _ticketBatch = null;
function giveTicket(n, reason) {
  Store.state.tickets += n;
  Store.save();
  if (typeof HUD !== 'undefined') HUD.refresh();
  if (_ticketBatch) { _ticketBatch.n += n; _ticketBatch.reasons.push(reason); return; }
  _ticketBatch = { n, reasons: [reason] };
  setTimeout(() => {
    const b = _ticketBatch; _ticketBatch = null;
    toast(`🎫 獲得「${TICKET_NAME}」×${b.n}（${b.reasons.length > 1 ? b.reasons[0] + ' 等 ' + b.reasons.length + ' 項' : b.reasons[0]}）`, 'gold');
  }, 150);
}

// 設定單元狀態，處理出城令與升級
function setUnitStatus(sub, key, s) {
  const before = roomLevel(sub);
  Store.unit(sub.id, key).s = s;
  const awardKey = `${sub.id}:${key}`;
  Store.save();
  if (s === 2 && !Store.state.awarded[awardKey]) {
    Store.state.awarded[awardKey] = true;
    Store.save();
    giveTicket(1, `完成 ${sub.name}「${Store.unitName(sub, key)}」`);
  }
  checkLevelUp(sub, before);
}

function checkLevelUp(sub, before) {
  const after = roomLevel(sub);
  if (after > before) {
    toast(`⬆️ ${sub.room} 升級到 Lv.${after}！房間多了新擺設，回地圖看看吧`, 'level');
    if (typeof World !== 'undefined') World.levelUpFx(sub.id);
  }
  Store.state.levels[sub.id] = after;
  Store.save();
}

// ---- 分析 ----
function unitStats(sub) {
  const st = {};
  allUnitKeys(sub).forEach(k => st[k] = { key: k, scores: [], wrong: 0, wrongOpen: 0, heat: (sub.hot || {})[k] || 0 });
  Store.state.records.filter(r => r.subject === sub.id).forEach(r => {
    if (r.total > 0 && r.score != null && r.score !== '') {
      const p = Number(r.score) / Number(r.total);
      (r.units || []).forEach(k => st[k] && st[k].scores.push(p));
    }
  });
  Store.state.wrongs.filter(w => w.subject === sub.id).forEach(w => {
    if (st[w.unit]) {
      st[w.unit].wrong++;
      if (!w.mastered) st[w.unit].wrongOpen++;
    }
  });
  Object.values(st).forEach(u => {
    u.avg = u.scores.length ? u.scores.reduce((a, b) => a + b, 0) / u.scores.length : null;
    u.status = unitStatus(sub.id, u.key);
    // 越需要補強分數越高
    let p = 0;
    if (u.avg != null) p += (1 - u.avg) * 100;
    p += u.wrongOpen * 10;
    if (u.avg != null || u.wrongOpen) p += u.heat * 6;
    u.priority = p;
  });
  return st;
}

function subjectAnalysis(sub) {
  const st = unitStats(sub);
  const list = Object.values(st);
  const recs = Store.state.records.filter(r => r.subject === sub.id && r.total > 0 && r.score !== '' && r.score != null)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const recent = recs.slice(-5);
  const avgRecent = recent.length ? recent.reduce((a, r) => a + r.score / r.total, 0) / recent.length : null;
  const weak = list.filter(u => (u.avg != null && u.avg < 0.75) || u.wrongOpen >= 2)
    .sort((a, b) => b.priority - a.priority);
  const openWrong = Store.state.wrongs.filter(w => w.subject === sub.id && !w.mastered).length;
  // 尚未開始但會考高頻的單元
  const hotTodo = list.filter(u => u.heat >= 3 && u.status === 0);
  let trend = null;
  if (recs.length >= 4) {
    const half = Math.floor(recs.length / 2);
    const a = recs.slice(0, half).reduce((s, r) => s + r.score / r.total, 0) / half;
    const b = recs.slice(half).reduce((s, r) => s + r.score / r.total, 0) / (recs.length - half);
    trend = b - a;
  }
  return { st, list, recs, avgRecent, weak, openWrong, hotTodo, trend, progress: subjectProgress(sub) };
}

function adviceFor(sub, an) {
  const tips = [];
  const name = k => `「${Store.unitName(sub, k)}」`;
  an.weak.slice(0, 3).forEach(u => {
    const parts = [];
    if (u.avg != null) parts.push(`平均答對 ${Math.round(u.avg * 100)}%`);
    if (u.wrongOpen) parts.push(`還有 ${u.wrongOpen} 題錯題沒練熟`);
    if (u.heat >= 2) parts.push('而且是會考常考單元');
    tips.push(`${name(u.key)}：${parts.join('，')} → 建議優先複習${u.wrongOpen ? '，到修練室重做錯題' : ''}。`);
  });
  if (an.hotTodo.length) tips.push(`會考高頻但還沒開始：${an.hotTodo.slice(0, 3).map(u => name(u.key)).join('、')}。`);
  if (an.trend != null) {
    if (an.trend > 0.05) tips.push(`最近成績比之前進步了約 ${Math.round(an.trend * 100)} 分（百分比），保持下去！`);
    else if (an.trend < -0.05) tips.push(`最近成績比之前退步約 ${Math.round(-an.trend * 100)} 分（百分比），回頭看看錯題吧。`);
  }
  if (!an.recs.length) tips.push('還沒有考卷紀錄。到房間的「上傳台」登記考卷分數和錯題，我才能幫你分析。');
  if (!tips.length) tips.push('目前沒有明顯的弱點，繼續保持！');
  return tips;
}

function fmtPct(p) { return p == null ? '—' : Math.round(p * 100) + '%'; }

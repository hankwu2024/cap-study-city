// ===== 各種視窗：科目房間、圓桌、修練室、試題書房、城門、設定、開場 =====
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  const box = $('#toasts');
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), 3600);
  setTimeout(() => el.remove(), 4200);
}

function heatStars(h) { return h ? '<span class="heat" title="會考常考程度（參考）">' + '🔥'.repeat(h) + '</span>' : ''; }
function bar(p, color) { return `<div class="bar"><i style="width:${Math.round((p || 0) * 100)}%;background:${color || '#4caf50'}"></i></div>`; }

const Panels = (() => {
  let open = false;
  const modal = () => $('#modal');

  function show(title, html, color, wide) {
    const m = modal();
    $('.modal-title', m).textContent = title;
    $('.modal-box', m).style.setProperty('--accent', color || '#5b6cff');
    $('.modal-box', m).classList.toggle('wide', !!wide);
    $('.modal-body', m).innerHTML = html;
    m.classList.remove('hidden');
    $('.modal-body', m).scrollTop = 0;
    open = true;
    World.pause(true);
    return $('.modal-body', m);
  }
  function close() {
    modal().classList.add('hidden');
    open = false;
    World.pause(false);
    HUD.refresh();
  }

  // ---------- 圖片 ----------
  async function fillThumbs(root) {
    for (const img of $$('img[data-img]', root)) {
      const src = await ImgDB.get(img.dataset.img);
      if (src) img.src = src; else img.alt = '（照片遺失）';
    }
  }
  function viewImage(src) {
    const lb = $('#lightbox');
    $('img', lb).src = src;
    lb.classList.remove('hidden');
  }
  document.addEventListener('click', e => {
    const img = e.target.closest('img[data-img]');
    if (img && img.src) viewImage(img.src);
  });

  // ================= 科目房間 =================
  function subject(sub, tab = 'progress') {
    const lv = roomLevel(sub);
    const nl = nextLevelInfo(sub);
    const body = show(`${sub.room}（${sub.name}）`, `
      <div class="room-head">
        <div class="lv-badge" style="background:${sub.color}">Lv.${lv}</div>
        <div class="grow">
          ${bar(subjectProgress(sub).pct, sub.color)}
          <small>${nl ? `再完成 ${nl.need} 個單元，房間升級到 Lv.${nl.next}` : '房間已經滿級！🏆'}　·　已完成 ${subjectProgress(sub).done}/${subjectProgress(sub).total} 單元</small>
        </div>
      </div>
      <nav class="tabs">
        <button data-tab="progress">📚 進度</button>
        <button data-tab="upload">⬆ 上傳考卷／作業</button>
        <button data-tab="analysis">📊 分析</button>
        <button data-tab="wrongs">❌ 錯題本</button>
      </nav>
      <div class="tab-body"></div>`, sub.color, true);
    $$('.tabs button', body).forEach(b => b.onclick = () => subjectTab(sub, b.dataset.tab, body));
    subjectTab(sub, tab, body);
  }

  function subjectTab(sub, tab, body) {
    $$('.tabs button', body).forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const el = $('.tab-body', body);
    if (tab === 'progress') progressTab(sub, el, body);
    if (tab === 'upload') uploadTab(sub, el, body);
    if (tab === 'analysis') analysisTab(sub, el, body);
    if (tab === 'wrongs') wrongsTab(sub, el, body);
  }

  const STATUS = [['○', '未開始', 's0'], ['◐', '學習中', 's1'], ['●', '已完成', 's2']];

  function progressTab(sub, el, body) {
    const st = unitStats(sub);
    el.innerHTML = `<p class="hint">點左邊圓圈切換狀態（未開始 → 學習中 → 已完成）。完成一個單元可以拿到 1 張「${TICKET_NAME}」。單元名稱點兩下可以改成你課本上的名稱。🔥 = 會考常考（參考）。</p>` +
      sub.books.map((b, bi) => {
        const keys = b.units.map((_, ui) => `${bi}-${ui}`);
        const done = keys.filter(k => unitStatus(sub.id, k) === 2).length;
        return `<section class="book">
          <h3>${esc(b.name)} <small>${done}/${keys.length}</small>
            <button class="mini" data-bookdone="${bi}">整冊標記完成</button></h3>
          <ul class="units">${keys.map(k => {
            const s = unitStatus(sub.id, k), u = st[k];
            return `<li class="${STATUS[s][2]}">
              <button class="st" data-key="${k}" title="${STATUS[s][1]}">${STATUS[s][0]}</button>
              <span class="uname" data-key="${k}">${esc(Store.unitName(sub, k))}</span>${heatStars(u.heat)}
              <span class="ustat">${u.avg != null ? `答對 ${fmtPct(u.avg)}` : ''}${u.wrongOpen ? ` · 錯題 ${u.wrongOpen}` : ''}</span>
            </li>`;
          }).join('')}</ul></section>`;
      }).join('');
    $$('.st', el).forEach(btn => btn.onclick = () => {
      const k = btn.dataset.key;
      setUnitStatus(sub, k, (unitStatus(sub.id, k) + 1) % 3);
      refreshHead(sub, body); progressTab(sub, el, body);
    });
    $$('.uname', el).forEach(sp => sp.ondblclick = () => {
      const k = sp.dataset.key;
      const n = prompt('把單元名稱改成：', Store.unitName(sub, k));
      if (n && n.trim()) { Store.unit(sub.id, k).n = n.trim(); Store.save(); progressTab(sub, el, body); }
    });
    $$('[data-bookdone]', el).forEach(btn => btn.onclick = () => {
      const bi = +btn.dataset.bookdone;
      if (!confirm(`把「${sub.books[bi].name}」全部標記為已完成？`)) return;
      sub.books[bi].units.forEach((_, ui) => setUnitStatus(sub, `${bi}-${ui}`, 2));
      refreshHead(sub, body); progressTab(sub, el, body);
    });
  }

  function refreshHead(sub, body) {
    const lv = roomLevel(sub), nl = nextLevelInfo(sub), p = subjectProgress(sub);
    $('.lv-badge', body).textContent = 'Lv.' + lv;
    $('.room-head .grow', body).innerHTML = `${bar(p.pct, sub.color)}<small>${nl ? `再完成 ${nl.need} 個單元，房間升級到 Lv.${nl.next}` : '房間已經滿級！🏆'}　·　已完成 ${p.done}/${p.total} 單元</small>`;
  }

  function unitOptions(sub, selected) {
    return sub.books.map((b, bi) => `<optgroup label="${esc(b.name)}">${b.units.map((_, ui) => {
      const k = `${bi}-${ui}`; return `<option value="${k}" ${k === selected ? 'selected' : ''}>${esc(Store.unitName(sub, k))}</option>`;
    }).join('')}</optgroup>`).join('');
  }

  function wrongRow(sub) {
    return `<div class="wrong-row">
      <div class="row2">
        <label>單元 <select class="w-unit">${unitOptions(sub)}</select></label>
        <button type="button" class="mini danger w-del">刪除這題</button>
      </div>
      <label>題目（可以打字，或只放照片）<textarea class="w-q" rows="2" placeholder="例：下列何者是一元二次方程式？"></textarea></label>
      <div class="row2">
        <label>正確答案 <input class="w-a" placeholder="例：(B) 或 x=3"></label>
        <label>我當時的答案 <input class="w-my" placeholder="例：(C)"></label>
      </div>
      <label>題目照片（選填）<input type="file" class="w-img" accept="image/*"></label>
    </div>`;
  }

  function uploadTab(sub, el, body) {
    el.innerHTML = `<form class="upload-form">
      <div class="row3">
        <label>類型 <select name="type"><option>考卷</option><option>作業</option><option>歷屆試題</option></select></label>
        <label>名稱 <input name="rtitle" placeholder="例：第一次段考、講義 P.30" required></label>
        <label>日期 <input type="date" name="date" value="${today()}"></label>
      </div>
      <div class="row3">
        <label>得分 <input type="number" name="score" step="any" min="0" placeholder="例：82"></label>
        <label>滿分 <input type="number" name="total" step="any" min="1" value="100"></label>
        <label class="past-year hidden">哪一年的會考 <select name="year">${PAST_YEARS.map(y => `<option>${y}</option>`).join('')}</select></label>
      </div>
      <fieldset><legend>這次的範圍（勾選單元）</legend>
        ${sub.books.map((b, bi) => `<details ${bi === 0 ? 'open' : ''}><summary>${esc(b.name)}</summary>
          <div class="checks">${b.units.map((_, ui) => { const k = `${bi}-${ui}`; return `<label><input type="checkbox" name="units" value="${k}"> ${esc(Store.unitName(sub, k))}</label>`; }).join('')}</div></details>`).join('')}
        <label class="inline"><input type="checkbox" name="markDone"> 同時把勾選的單元標記為「已完成」</label>
      </fieldset>
      <label>考卷／作業照片（可多張）<input type="file" name="photos" accept="image/*" multiple></label>
      <fieldset><legend>錯題（一題一題登記，之後可以到修練室重做）</legend>
        <div class="wrong-list"></div>
        <button type="button" class="btn ghost add-wrong">＋ 新增一題錯題</button>
      </fieldset>
      <label>備註 <textarea name="note" rows="2" placeholder="例：計算粗心、時間不夠"></textarea></label>
      <p class="hint">登記「考卷」或「歷屆試題」可以拿到 1 張「${TICKET_NAME}」。</p>
      <button class="btn big" type="submit">儲存並分析</button>
    </form>`;
    const f = $('form', el);
    f.type.onchange = () => $('.past-year', f).classList.toggle('hidden', f.type.value !== '歷屆試題');
    $('.add-wrong', f).onclick = () => {
      const wrap = document.createElement('div'); wrap.innerHTML = wrongRow(sub);
      const row = wrap.firstElementChild;
      // 預設選第一個勾選的單元
      const first = $('input[name=units]:checked', f);
      if (first) $('.w-unit', row).value = first.value;
      $('.w-del', row).onclick = () => row.remove();
      $('.wrong-list', f).appendChild(row);
    };
    f.onsubmit = async e => {
      e.preventDefault();
      const btn = $('button[type=submit]', f); btn.disabled = true; btn.textContent = '儲存中…';
      try {
        const units = $$('input[name=units]:checked', f).map(i => i.value);
        const rec = {
          id: Store.uid(), subject: sub.id, type: f.type.value, title: f.rtitle.value.trim(), date: f.date.value,
          score: f.score.value === '' ? null : Number(f.score.value), total: Number(f.total.value) || 100,
          units, note: f.note.value.trim(), images: [], year: f.type.value === '歷屆試題' ? Number(f.year.value) : null,
        };
        for (const file of f.photos.files) { const id = 'img_' + Store.uid(); await ImgDB.put(id, await compressImage(file)); rec.images.push(id); }
        const rows = $$('.wrong-row', f);
        for (const row of rows) {
          const q = $('.w-q', row).value.trim(), file = $('.w-img', row).files[0];
          if (!q && !file) continue;
          const w = { id: Store.uid(), subject: sub.id, unit: $('.w-unit', row).value, recordId: rec.id, question: q,
            answer: $('.w-a', row).value.trim(), myAnswer: $('.w-my', row).value.trim(), image: null,
            created: Date.now(), attempts: 0, streak: 0, mastered: false, lastAt: 0 };
          if (file) { w.image = 'img_' + Store.uid(); await ImgDB.put(w.image, await compressImage(file)); }
          Store.state.wrongs.push(w);
          if (!rec.units.includes(w.unit)) rec.units.push(w.unit);
        }
        Store.state.records.push(rec);
        if (rec.type === '歷屆試題' && rec.score != null) Store.state.past[`${rec.year}-${sub.id}`] = Math.round(rec.score / rec.total * 100);
        Store.save();
        if (f.markDone.checked) units.forEach(k => { if (unitStatus(sub.id, k) !== 2) setUnitStatus(sub, k, 2); });
        else units.forEach(k => { if (unitStatus(sub.id, k) === 0) Store.unit(sub.id, k).s = 1; });
        Store.save();
        if (rec.type !== '作業') giveTicket(1, `登記${rec.type}「${rec.title || '未命名'}」`);
        toast('已儲存！下面是最新的分析結果', 'ok');
        refreshHead(sub, body);
        subjectTab(sub, 'analysis', body);
      } catch (err) {
        console.error(err); alert('儲存失敗：' + err.message);
        btn.disabled = false; btn.textContent = '儲存並分析';
      }
    };
  }

  function trendSvg(recs, color) {
    const list = recs.slice(-12);
    if (!list.length) return '';
    const w = 28, H = 90;
    return `<svg class="trend" viewBox="0 0 ${list.length * w + 10} ${H + 30}" width="100%" height="130" preserveAspectRatio="xMinYMid meet">
      <line x1="0" x2="${list.length * w + 10}" y1="${H - H * 0.75 + 10}" y2="${H - H * 0.75 + 10}" stroke="#e57373" stroke-dasharray="4 3"/>
      ${list.map((r, i) => { const p = r.score / r.total; const h = Math.max(2, p * H);
        return `<rect x="${i * w + 8}" y="${H - h + 10}" width="18" height="${h}" rx="3" fill="${p < 0.6 ? '#e57373' : color}"><title>${esc(r.date)} ${esc(r.title)}：${Math.round(p * 100)}%</title></rect>
        <text x="${i * w + 17}" y="${H - h + 6}" font-size="10" text-anchor="middle" fill="#555">${Math.round(p * 100)}</text>
        <text x="${i * w + 17}" y="${H + 24}" font-size="9" text-anchor="middle" fill="#888">${esc((r.date || '').slice(5))}</text>`; }).join('')}
    </svg>`;
  }

  function analysisTab(sub, el) {
    const an = subjectAnalysis(sub);
    const tips = adviceFor(sub, an);
    const withData = an.list.filter(u => u.avg != null || u.wrong).sort((a, b) => b.priority - a.priority);
    const recs = Store.state.records.filter(r => r.subject === sub.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    el.innerHTML = `
      <div class="cards">
        <div class="card"><b>${Math.round(an.progress.pct * 100)}%</b><span>單元完成度</span></div>
        <div class="card"><b>${fmtPct(an.avgRecent)}</b><span>最近 5 次平均</span></div>
        <div class="card ${an.openWrong ? 'warn' : ''}"><b>${an.openWrong}</b><span>還沒練熟的錯題</span></div>
        <div class="card"><b>${an.trend == null ? '—' : (an.trend >= 0 ? '↗ +' : '↘ ') + Math.round(an.trend * 100)}</b><span>成績趨勢</span></div>
      </div>
      <h3>🧭 分析建議</h3>
      <ul class="tips">${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      ${an.recs.length ? `<h3>📈 成績走勢（紅線 = 75%）</h3>${trendSvg(an.recs, sub.color)}` : ''}
      ${withData.length ? `<h3>🔍 各單元熟練度（越上面越需要補強）</h3>
      <table class="utable"><tr><th>單元</th><th>答對率</th><th>錯題（未熟／全部）</th><th>常考</th></tr>
      ${withData.map(u => `<tr class="${(u.avg != null && u.avg < 0.6) || u.wrongOpen >= 3 ? 'bad' : (u.avg != null && u.avg < 0.75) || u.wrongOpen ? 'mid' : ''}">
        <td>${esc(Store.unitName(sub, u.key))}</td>
        <td>${u.avg != null ? bar(u.avg, u.avg < 0.6 ? '#e57373' : u.avg < 0.75 ? '#ffb74d' : '#66bb6a') + fmtPct(u.avg) : '—'}</td>
        <td>${u.wrongOpen} / ${u.wrong}</td><td>${heatStars(u.heat) || '—'}</td></tr>`).join('')}
      </table>` : ''}
      <h3>🗂️ 紀錄列表</h3>
      ${recs.length ? `<div class="records">${recs.map(r => `<div class="record">
        <div><b>${esc(r.title || '未命名')}</b> <span class="tag">${esc(r.type)}${r.year ? ' ' + r.year : ''}</span> <small>${esc(r.date)}</small></div>
        <div>${r.score != null ? `<b>${r.score}</b> / ${r.total}（${fmtPct(r.score / r.total)}）` : '未填分數'}　範圍：${(r.units || []).map(k => esc(Store.unitName(sub, k))).join('、') || '—'}</div>
        ${r.note ? `<div class="note">📝 ${esc(r.note)}</div>` : ''}
        ${r.images && r.images.length ? `<div class="thumbs">${r.images.map(id => `<img data-img="${id}" alt="照片">`).join('')}</div>` : ''}
        <button class="mini danger" data-delrec="${r.id}">刪除</button>
      </div>`).join('')}</div>` : '<p class="hint">還沒有紀錄，先到「上傳考卷／作業」登記吧！</p>'}`;
    fillThumbs(el);
    $$('[data-delrec]', el).forEach(b => b.onclick = () => {
      if (!confirm('確定刪除這筆紀錄？（裡面登記的錯題也會一起刪掉）')) return;
      const id = b.dataset.delrec;
      const rec = Store.state.records.find(r => r.id === id);
      (rec.images || []).forEach(i => ImgDB.del(i));
      Store.state.wrongs.filter(w => w.recordId === id && w.image).forEach(w => ImgDB.del(w.image));
      Store.state.wrongs = Store.state.wrongs.filter(w => w.recordId !== id);
      Store.state.records = Store.state.records.filter(r => r.id !== id);
      Store.save(); analysisTab(sub, el);
    });
  }

  function wrongsTab(sub, el) {
    const list = Store.state.wrongs.filter(w => w.subject === sub.id).sort((a, b) => a.mastered - b.mastered || b.created - a.created);
    el.innerHTML = `
      <details class="add-box"><summary class="btn ghost">＋ 直接新增錯題（不屬於任何考卷）</summary>
        <form class="solo">${wrongRow(sub)}<button class="btn" type="submit">加入錯題本</button></form></details>
      <p class="hint">共 ${list.length} 題，未練熟 ${list.filter(w => !w.mastered).length} 題。在修練室連續答對 2 次就會變成「已熟練」。</p>
      <div class="wrongs">${list.map(w => `<div class="wcard ${w.mastered ? 'mastered' : ''}">
        <div class="wmeta"><span class="tag">${esc(Store.unitName(sub, w.unit))}</span>
          ${w.mastered ? '<span class="tag ok">✔ 已熟練</span>' : `<span class="tag">練習 ${w.attempts} 次</span>`}
          <button class="mini danger" data-delw="${w.id}">刪除</button></div>
        ${w.question ? `<div class="q">${esc(w.question)}</div>` : ''}
        ${w.image ? `<div class="thumbs"><img data-img="${w.image}" alt="題目照片"></div>` : ''}
        <div class="ans">正解：<b>${esc(w.answer || '（未填）')}</b>${w.myAnswer ? `　我的答案：<s>${esc(w.myAnswer)}</s>` : ''}</div>
      </div>`).join('') || '<p class="hint">目前沒有錯題 🎉</p>'}</div>`;
    fillThumbs(el);
    const f = $('form.solo', el);
    $('.w-del', f).remove();
    f.onsubmit = async e => {
      e.preventDefault();
      const q = $('.w-q', f).value.trim(), file = $('.w-img', f).files[0];
      if (!q && !file) { alert('請輸入題目或放一張照片'); return; }
      const w = { id: Store.uid(), subject: sub.id, unit: $('.w-unit', f).value, recordId: null, question: q,
        answer: $('.w-a', f).value.trim(), myAnswer: $('.w-my', f).value.trim(), image: null,
        created: Date.now(), attempts: 0, streak: 0, mastered: false, lastAt: 0 };
      if (file) { w.image = 'img_' + Store.uid(); await ImgDB.put(w.image, await compressImage(file)); }
      Store.state.wrongs.push(w); Store.save(); toast('已加入錯題本', 'ok'); wrongsTab(sub, el);
    };
    $$('[data-delw]', el).forEach(b => b.onclick = () => {
      if (!confirm('刪除這題錯題？')) return;
      const w = Store.state.wrongs.find(x => x.id === b.dataset.delw);
      if (w.image) ImgDB.del(w.image);
      Store.state.wrongs = Store.state.wrongs.filter(x => x !== w); Store.save(); wrongsTab(sub, el);
    });
  }

  // ================= 圓桌 =================
  function roundtable() {
    const days = daysLeft();
    const rows = SUBJECTS.map(s => ({ s, an: subjectAnalysis(s), lv: roomLevel(s) }));
    const totalUnits = rows.reduce((a, r) => a + r.an.progress.total, 0);
    const doneUnits = rows.reduce((a, r) => a + r.an.progress.done, 0);
    // 最需要補強的科目：完成度低、分數低、錯題多
    const need = rows.map(r => ({ ...r, score: (1 - r.an.progress.pct) * 40 + (r.an.avgRecent == null ? 15 : (1 - r.an.avgRecent) * 60) + r.an.openWrong * 3 }))
      .sort((a, b) => b.score - a.score).slice(0, 3);
    const body = show('🪑 圓桌會議：各科進度總覽', `
      <div class="countdown-big ${days <= 30 ? 'urgent' : ''}">會考倒數 <b>${days >= 0 ? days : 0}</b> 天 <small>（${esc(Store.state.examDate)}）</small></div>
      <div class="cards">
        <div class="card"><b>${Math.round(doneUnits / totalUnits * 100)}%</b><span>全部單元完成度（${doneUnits}/${totalUnits}）</span></div>
        <div class="card"><b>${Store.state.records.length}</b><span>已登記考卷／作業</span></div>
        <div class="card warn"><b>${Store.state.wrongs.filter(w => !w.mastered).length}</b><span>待練錯題</span></div>
        <div class="card gold"><b>${Store.state.tickets}</b><span>${TICKET_NAME}</span></div>
      </div>
      <h3>⚠️ 最需要補強的科目</h3>
      <ul class="tips">${need.map(r => {
        const w = r.an.weak.slice(0, 2).map(u => `「${Store.unitName(r.s, u.key)}」`).join('、');
        const hot = !w && r.an.hotTodo.length ? `常考單元「${Store.unitName(r.s, r.an.hotTodo[0].key)}」還沒開始` : '';
        return `<li><b style="color:${r.s.color}">${r.s.name}</b>：完成 ${Math.round(r.an.progress.pct * 100)}%，最近平均 ${fmtPct(r.an.avgRecent)}${r.an.openWrong ? `，錯題 ${r.an.openWrong} 題` : ''}${w ? `；弱點 ${w}` : ''}${hot ? `；${hot}` : ''}</li>`;
      }).join('')}</ul>
      <div class="subj-grid">${rows.map(({ s, an, lv }) => `
        <button class="subj-card" data-sub="${s.id}" style="--c:${s.color}">
          <div class="sc-top"><b>${s.name}</b><span>Lv.${lv}</span></div>
          ${bar(an.progress.pct, s.color)}
          <div class="sc-line">完成 ${an.progress.done}/${an.progress.total}　平均 ${fmtPct(an.avgRecent)}</div>
          <div class="sc-line ${an.openWrong ? 'red' : ''}">錯題 ${an.openWrong}</div>
          <div class="sc-weak">${an.weak.length ? '補強：' + an.weak.slice(0, 2).map(u => esc(Store.unitName(s, u.key))).join('、') : (an.recs.length ? '✔ 目前穩定' : '尚無考卷紀錄')}</div>
        </button>`).join('')}</div>
      <p class="hint">點任一科可以看詳細分析。</p>`, '#c9a227', true);
    $$('[data-sub]', body).forEach(b => b.onclick = () => subject(SUBJ[b.dataset.sub], 'analysis'));
  }

  // ================= 修練室 =================
  function training() {
    const counts = SUBJECTS.map(s => ({ s, n: Store.state.wrongs.filter(w => w.subject === s.id && !w.mastered).length }));
    const total = counts.reduce((a, c) => a + c.n, 0);
    const body = show('⚔️ 修練室：錯題重練', `
      <p>選一個科目，系統會挑出最多 <b>10 題</b>還沒練熟的錯題，一題做完再換下一題。連續答對 2 次的題目會變成「已熟練」。</p>
      <div class="pick-grid">
        <button class="pick" data-sub="all" ${total ? '' : 'disabled'}><b>全部科目</b><span>${total} 題</span></button>
        ${counts.map(({ s, n }) => `<button class="pick" data-sub="${s.id}" style="--c:${s.color}" ${n ? '' : 'disabled'}><b>${s.name}</b><span>${n} 題</span></button>`).join('')}
      </div>
      ${total ? '' : '<p class="hint">目前沒有待練的錯題。到各科房間的上傳台登記錯題後再來修練吧！</p>'}`, '#7d6aa8');
    $$('.pick', body).forEach(b => b.onclick = () => startTraining(b.dataset.sub));
  }

  function startTraining(subId) {
    let pool = Store.state.wrongs.filter(w => !w.mastered && (subId === 'all' || w.subject === subId));
    pool.sort((a, b) => (a.lastAt - b.lastAt) || (b.attempts - a.attempts));
    pool = pool.slice(0, 10).sort(() => Math.random() - 0.5);
    const results = [];
    let i = 0;
    const norm = s => String(s || '').toLowerCase().replace(/[\s（）()。．.，,]/g, '').replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

    function render() {
      const w = pool[i], sub = SUBJ[w.subject];
      const body = show(`⚔️ 修練中（${i + 1} / ${pool.length}）`, `
        <div class="train-progress">${pool.map((_, k) => `<i class="${k < i ? (results[k] ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
        <div class="qcard">
          <div class="wmeta"><span class="tag" style="background:${sub.color};color:#fff">${sub.name}</span><span class="tag">${esc(Store.unitName(sub, w.unit))}</span></div>
          ${w.question ? `<div class="q big">${esc(w.question)}</div>` : ''}
          ${w.image ? `<div class="thumbs big"><img data-img="${w.image}" alt="題目照片"></div>` : ''}
          <form class="answer-form"><label>你的答案 <input name="a" autocomplete="off" placeholder="寫下答案後按「對答案」"></label>
          <button class="btn" type="submit">對答案</button></form>
          <div class="result"></div>
        </div>`, sub.color);
      fillThumbs(body);
      const f = $('.answer-form', body); f.a.focus();
      f.onsubmit = e => {
        e.preventDefault();
        f.querySelector('button').disabled = true; f.a.disabled = true;
        const res = $('.result', body);
        const auto = w.answer && norm(f.a.value) && norm(f.a.value) === norm(w.answer);
        if (auto) { res.innerHTML = `<div class="ok-box">✔ 答對了！正解：<b>${esc(w.answer)}</b></div>`; finish(true, res); }
        else {
          res.innerHTML = `<div class="ans-box">正解：<b>${esc(w.answer || '（沒有登記答案，請自己對照）')}</b></div>
            <p>你覺得自己這次答對了嗎？</p>
            <div class="row2"><button class="btn ok" data-r="1">✔ 我答對了</button><button class="btn danger" data-r="0">✘ 還是錯了</button></div>`;
          $$('[data-r]', res).forEach(b => b.onclick = () => finish(b.dataset.r === '1', res));
        }
      };
    }

    function finish(ok, res) {
      const w = pool[i];
      w.attempts++; w.lastAt = Date.now();
      w.streak = ok ? (w.streak || 0) + 1 : 0;
      let msg = '';
      if (w.streak >= 2) { w.mastered = true; msg = '<p class="ok-box">🎉 連續答對 2 次，這題已熟練！</p>'; }
      Store.save();
      results[i] = ok;
      res.insertAdjacentHTML('beforeend', `${msg}<button class="btn big next">${i + 1 < pool.length ? '下一題 →' : '看結果'}</button>`);
      $$('[data-r]', res).forEach(b => b.disabled = true);
      $('.next', res).onclick = () => { i++; if (i < pool.length) render(); else summary(); };
      $('.next', res).focus();
    }

    function summary() {
      const ok = results.filter(Boolean).length;
      const body = show('⚔️ 修練結果', `
        <div class="countdown-big">${ok} / ${pool.length} 題答對</div>
        <ul class="tips">${pool.map((w, k) => `<li>${results[k] ? '✔' : '✘'} ${esc(SUBJ[w.subject].name)}・${esc(Store.unitName(SUBJ[w.subject], w.unit))}${w.question ? '：' + esc(w.question.slice(0, 30)) : ''}${w.mastered ? ' <span class="tag ok">已熟練</span>' : ''}</li>`).join('')}</ul>
        <div class="row2"><button class="btn again">再修練一輪</button><button class="btn ghost back">離開</button></div>`, '#7d6aa8');
      $('.again', body).onclick = training;
      $('.back', body).onclick = close;
    }

    if (!pool.length) { toast('這個科目沒有待練錯題'); return; }
    render();
  }

  // ================= 試題書房 =================
  function exams(selected) {
    const sid = selected || 'math';
    const s = SUBJ[sid];
    // 你自己的歷屆錯題統計
    const pastRecIds = new Set(Store.state.records.filter(r => r.type === '歷屆試題' && r.subject === sid).map(r => r.id));
    const myCount = {};
    Store.state.wrongs.filter(w => w.subject === sid && pastRecIds.has(w.recordId)).forEach(w => myCount[w.unit] = (myCount[w.unit] || 0) + 1);
    const myList = Object.entries(myCount).sort((a, b) => b[1] - a[1]);
    const myMax = myList.length ? myList[0][1] : 1;
    let hotHtml;
    if (s.hotTypes) {
      hotHtml = `<table class="utable"><tr><th>題型</th><th>常考程度</th></tr>${s.hotTypes.slice().sort((a, b) => b[1] - a[1]).map(([n, h]) => `<tr><td>${esc(n)}</td><td>${heatStars(h)}</td></tr>`).join('')}</table>`;
    } else {
      const list = Object.entries(s.hot || {}).sort((a, b) => b[1] - a[1]);
      hotHtml = `<table class="utable"><tr><th>單元</th><th>常考程度</th><th>你的進度</th></tr>${list.map(([k, h]) => {
        const st = unitStatus(sid, k);
        return `<tr class="${h >= 3 && st < 2 ? 'mid' : ''}"><td>${esc(Store.unitName(s, k))}</td><td>${heatStars(h)}</td><td>${STATUS[st][0]} ${STATUS[st][1]}</td></tr>`;
      }).join('')}</table>`;
    }
    const body = show('📜 會考試題書房', `
      <div class="exam-top">
        <a class="btn big" href="${EXAM_URL}" target="_blank" rel="noopener">🔗 開啟官方歷屆試題（心測中心）</a>
        <p class="hint">歷屆試題、答案和非選擇題評分規準都在官方網站下載。做完一份後，到該科房間的上傳台選「歷屆試題」登記分數和錯題，這裡就會統計你自己的錯題分布。</p>
      </div>
      <nav class="tabs">${SUBJECTS.map(x => `<button data-ex="${x.id}" class="${x.id === sid ? 'on' : ''}">${x.name}</button>`).join('')}</nav>
      <div class="two-col">
        <section>
          <h3>🔥 ${s.name} 常考${s.hotTypes ? '題型' : '單元'}</h3>
          <p class="hint">依近年會考題目整理的參考排序，不是官方統計數字。🔥🔥🔥 = 幾乎每年都考。</p>
          ${hotHtml}
        </section>
        <section>
          <h3>🎯 你在歷屆試題的錯題分布</h3>
          ${myList.length ? myList.map(([k, n]) => `<div class="hbar"><span>${esc(Store.unitName(s, k))}</span>${bar(n / myMax, '#e57373')}<b>${n}</b></div>`).join('') : '<p class="hint">還沒有登記這科的歷屆試題錯題。</p>'}
          <h3>🗓️ 歷屆練習紀錄</h3>
          <div class="past-grid">${PAST_YEARS.map(y => { const v = Store.state.past[`${y}-${sid}`];
            return `<button class="past ${v != null ? 'done' : ''}" data-year="${y}">${y} 年<br><b>${v != null ? v + '%' : '未做'}</b></button>`; }).join('')}</div>
          <p class="hint">點年份可以直接填答對率（%）。</p>
        </section>
      </div>`, '#3d8bfd', true);
    $$('[data-ex]', body).forEach(b => b.onclick = () => exams(b.dataset.ex));
    $$('[data-year]', body).forEach(b => b.onclick = () => {
      const key = `${b.dataset.year}-${sid}`;
      const v = prompt(`${b.dataset.year} 年 ${s.name} 的答對率（0–100，留空 = 清除）`, Store.state.past[key] ?? '');
      if (v === null) return;
      if (v.trim() === '') delete Store.state.past[key];
      else if (!isNaN(+v)) Store.state.past[key] = Math.max(0, Math.min(100, Math.round(+v)));
      Store.save(); exams(sid);
    });
  }

  // ================= 城門 =================
  function gate() {
    const g = Store.state.game, n = Store.state.tickets;
    const body = show('🏯 城門', `
      <div class="gate-box">
        <div class="ticket">🎫 ${TICKET_NAME} × <b>${n}</b></div>
        <p>城外是「荒原試煉場」，拿著出城令就能出城冒險：在一間間地城房間裡打倒怪物、撿武器、挑戰頭目。每次出城消耗 1 張出城令。</p>
        <p class="hint">怎麼拿出城令：在房間把一個單元標記為「已完成」（每個單元一次）、或登記一張考卷／歷屆試題。</p>
        <p>最佳紀錄：第 <b>${g.bestStage || 0}</b> 關　最高分 <b>${g.best || 0}</b>　出城 ${g.runs || 0} 次</p>
        <details><summary>操作方式</summary>
          <ul><li>移動：WASD 或方向鍵（手機：左下搖桿）</li><li>攻擊：J 或滑鼠左鍵（會自動瞄準最近的敵人）</li>
          <li>角色技能：K 或滑鼠右鍵</li><li>切換武器：Q　撿武器／開寶箱：E</li><li>暫停：Esc</li></ul></details>
        <button class="btn big go" ${n > 0 ? '' : 'disabled'}>${n > 0 ? '使用 1 張出城令，出發！' : '出城令不夠，先去讀書吧 📖'}</button>
      </div>`, '#2ecc71');
    const go = $('.go', body);
    if (n > 0) go.onclick = () => {
      Store.state.tickets--; Store.state.game.runs = (Store.state.game.runs || 0) + 1; Store.save();
      close(); Game.start();
    };
  }

  // ================= 設定 =================
  function settings() {
    const st = Store.state;
    const body = show('⚙️ 設定', `
      <form class="settings">
        <label>名稱 <input name="pname" value="${esc(st.profile.name)}" maxlength="12"></label>
        <label>會考日期（第一天） <input type="date" name="exam" value="${esc(st.examDate)}"></label>
        <p class="hint">116 年會考日期以心測中心公告為準，公告後記得來這裡修改。</p>
        <h3>角色</h3>
        <div class="char-grid small">${CHARACTERS.map(c => `<label class="char-card ${c.id === st.profile.char ? 'on' : ''}"><input type="radio" name="char" value="${c.id}" ${c.id === st.profile.char ? 'checked' : ''}><canvas width="48" height="56" data-char="${c.id}"></canvas><b>${c.name}</b><small>${c.title}</small></label>`).join('')}</div>
        <button class="btn" type="submit">儲存設定</button>
      </form>
      <h3>💾 資料備份</h3>
      <p class="hint">所有資料都存在這台電腦的瀏覽器裡。換電腦或清除瀏覽器資料前，請先匯出備份。</p>
      <div class="row2"><button class="btn ghost export">匯出備份檔</button><label class="btn ghost">匯入備份檔<input type="file" class="import" accept=".json" hidden></label></div>
      <h3>⚠️ 重設</h3>
      <button class="btn danger reset">清除所有資料，重新開始</button>`, '#607d8b');
    drawCharCanvases(body);
    $$('input[name=char]', body).forEach(r => r.onchange = () => $$('.char-card', body).forEach(c => c.classList.toggle('on', $('input', c).checked)));
    $('form', body).onsubmit = e => {
      e.preventDefault();
      const f = e.target;
      st.profile.name = f.pname.value.trim() || st.profile.name;
      st.examDate = f.exam.value || st.examDate;
      st.profile.char = f.char.value;
      Store.save(); toast('設定已儲存', 'ok'); close();
    };
    $('.export', body).onclick = async () => {
      const data = { state: Store.state, images: await ImgDB.all(), exported: new Date().toISOString() };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
      a.download = `會考學習城備份_${today()}.json`; a.click();
    };
    $('.import', body).onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data.state || !data.state.profile) throw new Error('檔案格式不對');
        if (!confirm('匯入會覆蓋目前所有資料，確定嗎？')) return;
        await ImgDB.clear();
        for (const [k, v] of Object.entries(data.images || {})) await ImgDB.put(k, v);
        Store.state = Object.assign(Store.defaults(), data.state); Store.save();
        location.reload();
      } catch (err) { alert('匯入失敗：' + err.message); }
    };
    $('.reset', body).onclick = async () => {
      if (!confirm('真的要清除所有資料嗎？這個動作無法復原！')) return;
      if (!confirm('再確認一次：所有進度、考卷、錯題都會消失。')) return;
      localStorage.removeItem(STORE_KEY); await ImgDB.clear(); location.reload();
    };
  }

  function drawCharCanvases(root) {
    const cvs = $$('canvas[data-char]', root);
    let t0 = performance.now();
    function frame(ts) {
      if (!cvs[0] || !document.body.contains(cvs[0])) return;
      const t = (ts - t0) / 1000;
      cvs.forEach(cv => {
        const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
        const k = cv.width / 40; c.setTransform(k, 0, 0, k, 0, 0);
        drawChar(c, CHAR[cv.dataset.char], 20, 44, 0, t, true);
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ================= 快速移動 =================
  function travel() {
    const places = [['lobby', '🏛️ 大廳（圓桌）'], ...SUBJECTS.map(s => [s.id, `${s.room}（Lv.${roomLevel(s)}）`]), ['train', '⚔️ 修練室'], ['exam', '📜 會考試題書房'], ['lounge', '☕ 休息室'], ['gate', '🏯 城門（城外）']];
    const body = show('📍 快速前往', `<div class="pick-grid">${places.map(([id, n]) => `<button class="pick" data-go="${id}" style="--c:${SUBJ[id] ? SUBJ[id].color : '#555'}"><b>${n}</b></button>`).join('')}</div>`, '#555');
    $$('[data-go]', body).forEach(b => b.onclick = () => { close(); World.teleport(b.dataset.go); });
  }

  // ================= 開場 =================
  function onboarding(done) {
    const el = $('#onboard');
    el.classList.remove('hidden');
    el.innerHTML = `<div class="ob-box">
      <h1>📚 會考學習城</h1>
      <p>歡迎！這座城裡每一間房間都是一個科目。讀完單元、登記考卷，房間就會升級；累積「${TICKET_NAME}」還能到城外冒險。</p>
      <label class="ob-name">你的名稱 <input id="ob-name" maxlength="12" placeholder="輸入名稱"></label>
      <h2>選擇你的角色</h2>
      <div class="char-grid">${CHARACTERS.map((c, i) => `<label class="char-card ${i === 0 ? 'on' : ''}">
        <input type="radio" name="ob-char" value="${c.id}" ${i === 0 ? 'checked' : ''}>
        <canvas width="96" height="112" data-char="${c.id}"></canvas>
        <b>${c.name}</b><span class="tag">${c.tag}</span><small>${c.title}</small><p>${c.desc}</p>
        <p class="skill">技能「${c.skill.name}」：${c.skill.desc}</p></label>`).join('')}</div>
      <button class="btn big" id="ob-go">進城！</button>
    </div>`;
    drawCharCanvases(el);
    $$('input[name=ob-char]', el).forEach(r => r.onchange = () => $$('.char-card', el).forEach(c => c.classList.toggle('on', $('input', c).checked)));
    $('#ob-go', el).onclick = () => {
      const name = $('#ob-name', el).value.trim();
      if (!name) { $('#ob-name', el).focus(); toast('請先輸入名稱'); return; }
      Store.state.profile = { name, char: $('input[name=ob-char]:checked', el).value };
      Store.save();
      el.classList.add('hidden'); el.innerHTML = '';
      done();
    };
  }

  return { isOpen: () => open, close, subject, roundtable, training, exams, gate, settings, travel, onboarding };
})();

// ===== 上方資訊列 =====
const HUD = {
  refresh() {
    if (!Store.state.profile) return;
    const d = daysLeft();
    $('#hud-name').textContent = `${Store.state.profile.name}・${CHAR[Store.state.profile.char].name}`;
    $('#hud-days').textContent = d >= 0 ? d : 0;
    $('#hud-days').parentElement.classList.toggle('urgent', d <= 30);
    $('#hud-tickets').textContent = Store.state.tickets;
    $('#hud-wrongs').textContent = Store.state.wrongs.filter(w => !w.mastered).length;
  },
};

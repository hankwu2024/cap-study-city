// ===== 啟動 =====
(function main() {
  Store.load();

  // 視窗關閉
  $('.modal-x').onclick = () => Panels.close();
  $('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') Panels.close(); });
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      if (!$('#lightbox').classList.contains('hidden')) $('#lightbox').classList.add('hidden');
      else if (Panels.isOpen()) Panels.close();
    }
  });
  $('#lightbox').onclick = () => $('#lightbox').classList.add('hidden');

  // 上方按鈕
  $('#btn-travel').onclick = () => Panels.travel();
  $('#btn-overview').onclick = () => Panels.roundtable();
  $('#btn-settings').onclick = () => Panels.settings();
  $('#btn-zoom-in').onclick = () => World.zoom(1);
  $('#btn-zoom-out').onclick = () => World.zoom(-1);

  Game.bind();

  function enter() {
    World.init($('#world-canvas'));
    $('#hud').classList.remove('hidden');
    $('#help').classList.remove('hidden');
    setTimeout(() => $('#help').classList.add('fade'), 9000);
    HUD.refresh();
    World.start();
    // 記錄目前等級
    SUBJECTS.forEach(s => { Store.state.levels[s.id] = roomLevel(s); });
    Store.save();
    const d = daysLeft();
    toast(`歡迎回來，${Store.state.profile.name}！會考倒數 ${d >= 0 ? d : 0} 天，加油 💪`);
  }

  if (!Store.state.profile) Panels.onboarding(enter);
  else enter();
})();

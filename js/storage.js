// ===== 資料儲存：一般資料放 localStorage，照片放 IndexedDB =====
const STORE_KEY = 'capQuest.v1';

const Store = {
  state: null,

  defaults() {
    return {
      v: 1,
      profile: null, // {name, char}
      examDate: DEFAULT_EXAM_DATE,
      tickets: 0,
      units: {},        // units[subId][key] = {s:0|1|2, n:'改名'}
      awarded: {},      // 'sub:key' => true 已發過出城令的單元
      records: [],      // 考卷/作業/歷屆紀錄
      wrongs: [],       // 錯題
      past: {},         // past['115-math'] = 分數
      levels: {},       // 上次看到的等級（用來顯示升級提示）
      game: { best: 0, runs: 0, bestStage: 0 },
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      this.state = Object.assign(this.defaults(), raw ? JSON.parse(raw) : {});
    } catch (e) {
      console.error(e);
      this.state = this.defaults();
    }
    return this.state;
  },

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    } catch (e) {
      alert('儲存失敗：瀏覽器空間可能已滿。建議到「設定」匯出備份。');
    }
  },

  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  unit(subId, key) {
    const s = this.state.units[subId] || (this.state.units[subId] = {});
    return s[key] || (s[key] = { s: 0 });
  },

  unitName(sub, key) {
    const u = (this.state.units[sub.id] || {})[key];
    if (u && u.n) return u.n;
    const [b, i] = key.split('-').map(Number);
    return sub.books[b].units[i];
  },
};

// ---- IndexedDB 存照片 ----
const ImgDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('capQuestImages', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async put(id, dataUrl) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('img', 'readwrite');
      tx.objectStore('img').put(dataUrl, id);
      tx.oncomplete = () => res(id);
      tx.onerror = () => rej(tx.error);
    });
  },
  async get(id) {
    const db = await this.open();
    return new Promise((res) => {
      const r = db.transaction('img').objectStore('img').get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
  },
  async del(id) {
    const db = await this.open();
    db.transaction('img', 'readwrite').objectStore('img').delete(id);
  },
  async all() {
    const db = await this.open();
    return new Promise((res) => {
      const out = {};
      const r = db.transaction('img').objectStore('img').openCursor();
      r.onsuccess = () => {
        const c = r.result;
        if (c) { out[c.key] = c.value; c.continue(); } else res(out);
      };
    });
  },
  async clear() {
    const db = await this.open();
    db.transaction('img', 'readwrite').objectStore('img').clear();
  },
};

// 把照片縮小壓縮後再存，避免佔太多空間
function compressImage(file, maxSide = 1400) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

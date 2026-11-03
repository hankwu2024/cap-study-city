// ===== 科目、單元、高頻考點、角色資料 =====
// 單元名稱可在各科房間的「進度」分頁點兩下改成你課本的名稱

const BOOK_NAMES = ['第一冊（七上）', '第二冊（七下）', '第三冊（八上）', '第四冊（八下）', '第五冊（九上）', '第六冊（九下）'];

function lessons(prefix, counts) {
  return counts.map(n => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}${prefix === 'Unit ' ? '' : '課'}`));
}

const SUBJECTS = [
  {
    id: 'chinese', name: '國文', room: '國文書齋', color: '#c0392b', floorA: '#d9b98c', floorB: '#cfa978',
    books: BOOK_NAMES.map((b, i) => ({ name: b, units: lessons('第', [12, 12, 12, 12, 11, 6])[i] })),
    hotTypes: [['長文／圖表閱讀理解', 3], ['文言文閱讀', 3], ['文意判讀與推論', 3], ['成語與詞語運用', 2], ['修辭與句型', 2], ['字音字形', 1], ['寫作測驗（另考）', 3]],
  },
  {
    id: 'english', name: '英文', room: '英文交誼廳', color: '#2e86de', floorA: '#c9d6e3', floorB: '#b7c7d8',
    books: BOOK_NAMES.map((b, i) => ({ name: b, units: lessons('Unit ', [6, 6, 6, 6, 6, 4])[i] })),
    hotTypes: [['閱讀題組（文章／圖表）', 3], ['文意字彙', 3], ['時態與被動語態', 2], ['關係子句與連接詞', 2], ['比較級與最高級', 2], ['不定詞與動名詞', 2], ['聽力（另考）', 3]],
  },
  {
    id: 'math', name: '數學', room: '數學工作室', color: '#16a085', floorA: '#d6e4dc', floorB: '#c4d8cc',
    books: [
      { name: BOOK_NAMES[0], units: ['整數的運算', '分數的運算', '一元一次方程式'] },
      { name: BOOK_NAMES[1], units: ['二元一次聯立方程式', '直角坐標與二元一次方程式的圖形', '比與比例', '一元一次不等式', '統計圖表與資料分析'] },
      { name: BOOK_NAMES[2], units: ['乘法公式與多項式', '平方根與畢氏定理', '因式分解', '一元二次方程式'] },
      { name: BOOK_NAMES[3], units: ['數列與級數', '線型函數及其圖形', '三角形的基本性質', '平行與四邊形'] },
      { name: BOOK_NAMES[4], units: ['相似形', '圓形', '幾何與證明（外心、內心、重心）'] },
      { name: BOOK_NAMES[5], units: ['二次函數', '統計與機率', '立體圖形'] },
    ],
    hot: { '5-0': 3, '4-0': 3, '4-1': 3, '5-1': 3, '2-3': 2, '2-1': 2, '3-2': 2, '3-3': 2, '3-0': 2, '4-2': 2, '3-1': 2, '1-0': 1, '1-2': 1 },
  },
  {
    id: 'civics', name: '公民', room: '公民議事廳', color: '#8e44ad', floorA: '#ddd0e4', floorB: '#cfbfd9',
    books: [
      { name: BOOK_NAMES[0], units: ['自我成長與人性尊嚴', '性別平等', '家庭生活', '學校與社區'] },
      { name: BOOK_NAMES[1], units: ['社會規範', '社會團體與公民參與', '公共利益', '多元文化'] },
      { name: BOOK_NAMES[2], units: ['民主與政治', '中央與地方政府', '選舉與政治參與'] },
      { name: BOOK_NAMES[3], units: ['法律的基本原則', '憲法與人權保障', '民法與生活', '刑法與行政法'] },
      { name: BOOK_NAMES[4], units: ['生產與消費', '市場與價格', '貨幣與金融'] },
      { name: BOOK_NAMES[5], units: ['全球化', '國際貿易', '永續發展'] },
    ],
    hot: { '4-1': 3, '3-1': 3, '3-2': 3, '3-3': 2, '2-1': 2, '2-2': 2, '4-0': 2, '4-2': 2, '5-1': 2, '1-0': 1 },
  },
  {
    id: 'geography', name: '地理', room: '地理探險室', color: '#27ae60', floorA: '#d4e2c4', floorB: '#c2d6ae',
    books: [
      { name: BOOK_NAMES[0], units: ['位置與地圖', '地形', '海岸與島嶼', '天氣與氣候', '水文'] },
      { name: BOOK_NAMES[1], units: ['人口', '產業活動', '交通與區域', '臺灣的區域發展'] },
      { name: BOOK_NAMES[2], units: ['中國的自然環境', '中國的人口與產業', '中國的區域特色'] },
      { name: BOOK_NAMES[3], units: ['東北亞與東南亞', '南亞與西亞', '非洲'] },
      { name: BOOK_NAMES[4], units: ['歐洲', '俄羅斯', '北美洲', '中南美洲'] },
      { name: BOOK_NAMES[5], units: ['大洋洲與兩極', '全球化與永續發展'] },
    ],
    hot: { '0-0': 3, '0-3': 3, '0-1': 2, '1-0': 2, '1-1': 2, '0-4': 2, '3-0': 2, '3-1': 2, '4-0': 1, '5-1': 2 },
  },
  {
    id: 'history', name: '歷史', room: '歷史博物館', color: '#a0522d', floorA: '#d8c3a5', floorB: '#c8ae8a',
    books: [
      { name: BOOK_NAMES[0], units: ['史前臺灣與原住民族', '大航海時代的臺灣', '清帝國時期的臺灣'] },
      { name: BOOK_NAMES[1], units: ['日本統治時期的臺灣', '戰後臺灣的政治', '戰後臺灣的經濟與社會'] },
      { name: BOOK_NAMES[2], units: ['古代中國的國家與社會', '宋元明清的國家與社會', '東亞的交流'] },
      { name: BOOK_NAMES[3], units: ['從傳統到現代的東亞', '現代國家的追求', '當代東亞'] },
      { name: BOOK_NAMES[4], units: ['古代文明', '歐洲的中古時期', '近代歐洲的興起'] },
      { name: BOOK_NAMES[5], units: ['現代世界的發展', '兩次世界大戰', '冷戰與當代世界'] },
    ],
    hot: { '1-0': 3, '0-2': 3, '1-1': 2, '1-2': 2, '0-1': 2, '3-0': 2, '4-2': 2, '5-1': 2, '2-2': 1, '5-2': 1 },
  },
  {
    id: 'physics', name: '理化', room: '理化實驗室', color: '#e67e22', floorA: '#e6dccd', floorB: '#d9ccb6',
    books: [
      { name: '第三冊（八上）', units: ['基本測量', '物質的世界', '波動與聲音', '光', '溫度與熱', '物質的基本結構'] },
      { name: '第四冊（八下）', units: ['化學反應', '氧化與還原', '電解質與酸鹼鹽', '反應速率與平衡', '有機化合物', '力與壓力'] },
      { name: '第五冊（九上）', units: ['直線運動', '力與運動', '功與能', '電路與電流'] },
      { name: '第六冊（九下）', units: ['電流的效應', '電與磁'] },
    ],
    hot: { '2-1': 3, '2-3': 3, '1-0': 3, '1-2': 3, '2-2': 2, '0-2': 2, '0-3': 2, '0-4': 2, '1-3': 2, '1-1': 2, '2-0': 2, '3-1': 2, '1-5': 2 },
  },
  {
    id: 'earth', name: '地科', room: '地科天文台', color: '#34495e', floorA: '#c8ced8', floorB: '#b5bdca',
    books: [
      { name: '第五冊（九上）', units: ['岩石與礦物', '地表的變動', '板塊構造運動'] },
      { name: '第六冊（九下）', units: ['大氣與天氣', '天氣與氣候變遷', '地球與宇宙', '晝夜、季節、月相與潮汐'] },
    ],
    hot: { '1-1': 3, '1-3': 3, '1-0': 2, '0-2': 2, '1-2': 2, '0-1': 1 },
  },
  {
    id: 'biology', name: '生物', room: '生物溫室', color: '#2ecc71', floorA: '#cfe6c9', floorB: '#bcdab4',
    books: [
      { name: BOOK_NAMES[0], units: ['生命世界與科學方法', '細胞', '養分', '運輸', '協調', '恆定'] },
      { name: BOOK_NAMES[1], units: ['生殖', '遺傳', '演化', '生物的分類', '生態系', '人類與環境'] },
    ],
    hot: { '1-1': 3, '1-4': 3, '0-4': 2, '0-5': 2, '0-2': 2, '0-3': 2, '1-0': 2, '1-2': 2, '0-1': 2, '1-5': 1 },
  },
];

const SUBJ = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));


const TICKET_NAME = '出城令';
const EXAM_URL = 'https://cap.rcpet.edu.tw/examination.html';
const DEFAULT_EXAM_DATE = '2027-05-15'; // 116 年會考尚未公告，先預設 5/15，可在設定中修改
const PAST_YEARS = [115, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104];
const MAX_LEVEL = 7;

// 各科房間等級：單元總數分成 6 段，每完成一段升 1 級（約等於一冊）
function unitsPerLevel(sub) {
  const total = sub.books.reduce((a, b) => a + b.units.length, 0);
  return Math.max(1, Math.ceil(total / (MAX_LEVEL - 1)));
}

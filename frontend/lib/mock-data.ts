// ─── 搜尋結果頁 Mock Data（三層）────────────────────

/** Layer 1: 共現詞列表 */
export const LAYER1_DATA = [
  { word: '美食', count: 1520 },
  { word: '文化', count: 1380 },
  { word: '歌謠', count: 1120 },
  { word: '族群', count: 980 },
  { word: '傳統', count: 870 },
  { word: '語言', count: 750 },
  { word: '聚落', count: 620 },
  { word: '義民', count: 580 },
  { word: '山歌', count: 510 },
  { word: '擂茶', count: 430 },
  { word: '粄條', count: 390 },
  { word: '伯公', count: 340 },
  { word: '北埔', count: 280 },
  { word: '美濃', count: 260 },
  { word: '油桐花', count: 220 },
]

/** Layer 2: 共現詞語境 */
export const LAYER2_DATA = [
  { word1: '美食', keyword: '客家', word2: '文化', span: 3, miScore: 8.234 },
  { word1: '傳統', keyword: '客家', word2: '美食', span: 2, miScore: 7.891 },
  { word1: '道地', keyword: '客家', word2: '美食', span: 1, miScore: 7.654 },
  { word1: '品嚐', keyword: '客家', word2: '美食', span: 4, miScore: 7.321 },
  { word1: '推廣', keyword: '客家', word2: '美食', span: 5, miScore: 6.987 },
  { word1: '經典', keyword: '客家', word2: '美食', span: 2, miScore: 6.543 },
  { word1: '在地', keyword: '客家', word2: '美食', span: 3, miScore: 6.210 },
  { word1: '特色', keyword: '客家', word2: '美食', span: 1, miScore: 5.876 },
]

/** Layer 3: KWIC 語料上下文 */
export const LAYER3_DATA = [
  { dialect: '四', left: '來到美濃，一定要品嚐道地的', keyword: '客家', right: '美食 ，像是粄條、豬腳和客家小炒。' },
  { dialect: '四', left: '這間餐廳專門經營傳統', keyword: '客家', right: '美食 ，吸引了許多觀光客前來。' },
  { dialect: '海', left: '過年過節，家家戶戶都會準備豐盛的', keyword: '客家', right: '美食 來招待親友。' },
  { dialect: '四', left: '政府近年積極推廣', keyword: '客家', right: '美食 文化，舉辦了多場美食節活動。' },
  { dialect: '大', left: '阿婆教我做正宗的', keyword: '客家', right: '美食 ——鹹菜豬肚湯，味道十分鮮美。' },
  { dialect: '四', left: '在客家庄，', keyword: '客家', right: '美食 不僅是味覺的享受，更是文化的傳承。' },
  { dialect: '饒', left: '這本書介紹了各地不同風味的', keyword: '客家', right: '美食 ，從北到南都有特色料理。' },
  { dialect: '四', left: '客家電視台製作了一系列探訪', keyword: '客家', right: '美食 的節目，深受觀眾喜愛。' },
]

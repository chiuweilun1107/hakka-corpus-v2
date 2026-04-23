/**
 * 客家歲時節慶靜態資料
 * 本次只做首頁入口卡片，專題頁（/festivals/[slug]）為 placeholder
 */

export interface Festival {
  slug: string
  name: string
  date: string          // 農曆或陽曆描述
  tagline: string       // 簡短副標
  summary: string       // 2-3 句簡介
  color: string         // Tailwind bg class（保留，其他地方可能用）
  iconLabel: string     // 無障礙 alt text
  image: string         // 節慶意象圖路徑（public/festivals/<slug>.png）
}

export const FESTIVALS: Festival[] = [
  {
    slug: 'tian-chuan',
    name: '天穿日',
    date: '農曆正月二十',
    tagline: '客家特有節日',
    summary: '女媧補天傳說衍生的客家獨有節日，家家休耕、休農，以艾粄敬天，象徵天地安康。',
    color: 'bg-rose-50',
    iconLabel: '補天傳說',
    image: '/festivals/tian-chuan.png',
  },
  {
    slug: 'spring-festival',
    name: '客家新年',
    date: '農曆正月初一',
    tagline: '炮竹獅陣迎新春',
    summary: '客家新春習俗以「粄」為核心，包含發粄、甜粄、菜包粄，家族團聚行「拜福神」。',
    color: 'bg-red-50',
    iconLabel: '春節慶典',
    image: '/festivals/spring-festival.png',
  },
  {
    slug: 'qingming',
    name: '清明掃墓',
    date: '國曆 4 月 4-6 日',
    tagline: '客家掛紙文化',
    summary: '客家特有「掛紙」（貼墓紙）習俗，展現慎終追遠的族群情感，常伴隨族群大型「公嘗」祭祖活動。',
    color: 'bg-green-50',
    iconLabel: '祭祖掛紙',
    image: '/festivals/qingming.png',
  },
  {
    slug: 'duanwu',
    name: '端午粽子節',
    date: '農曆五月初五',
    tagline: '北部粽客家特色',
    summary: '客家粽子特色：以鹼粽、粿粽、鹹粽三種著稱，尤其鹼粽（粄粽）是客家文化代表食物之一。',
    color: 'bg-yellow-50',
    iconLabel: '端午粽子',
    image: '/festivals/duanwu.png',
  },
  {
    slug: 'yimin-festival',
    name: '義民祭',
    date: '農曆七月中旬',
    tagline: '客家最重要祭典',
    summary: '義民廟（新埔）主祭，紀念清代保鄉護土犧牲的義民英靈，是臺灣客家族群認同的核心象徵，每年輪值舉辦聯庄賽神豬活動。',
    color: 'bg-amber-50',
    iconLabel: '義民祭典',
    image: '/festivals/yimin-festival.png',
  },
  {
    slug: 'mid-autumn',
    name: '中秋夜話',
    date: '農曆八月十五',
    tagline: '月下賞桂聽山歌',
    summary: '客家中秋以月餅、柚子為主，民間有「月下唱山歌」傳統，男女以歌詞互答，傳遞情感。',
    color: 'bg-orange-50',
    iconLabel: '中秋月夜',
    image: '/festivals/mid-autumn.png',
  },
  {
    slug: 'chongyang',
    name: '重陽敬老',
    date: '農曆九月初九',
    tagline: '客家孝道文化',
    summary: '重陽節是客家敬老文化的重要節日，子孫製作九層粄（重陽糕）供奉長輩，表達孝道傳承。',
    color: 'bg-purple-50',
    iconLabel: '重陽登高',
    image: '/festivals/chongyang.png',
  },
  {
    slug: 'dongzhi',
    name: '冬至湯圓',
    date: '國曆 12 月 22 日前後',
    tagline: '搓湯圓話團圓',
    summary: '客家冬至有「冬大過年」說法，全家搓湯圓（擂圓），同時以紅湯圓黏於門框、農具、果樹，象徵豐收與感恩。',
    color: 'bg-blue-50',
    iconLabel: '冬至湯圓',
    image: '/festivals/dongzhi.png',
  },
]

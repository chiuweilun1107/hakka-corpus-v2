/** 時間區間 */
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

/** 客語腔調 */
export type Dialect = 'sixian' | 'hailu' | 'dapu' | 'raoping' | 'zhaoan' | 'sihai'

/** 腔調清單 */
export const DIALECTS: { id: Dialect; name: string; nameEn: string }[] = [
  { id: 'sixian', name: '四縣腔', nameEn: 'Sixian' },
  { id: 'hailu', name: '海陸腔', nameEn: 'Hailu' },
  { id: 'dapu', name: '大埔腔', nameEn: 'Dapu' },
  { id: 'raoping', name: '饒平腔', nameEn: 'Raoping' },
  { id: 'zhaoan', name: '詔安腔', nameEn: 'Zhaoan' },
  { id: 'sihai', name: '四海腔', nameEn: 'Sihai' },
]

/** 熱門查詢詞 */
export interface TrendingWord {
  rank: number
  word: string
  pronunciation: string
  meaning: string
  trend: 'up' | 'down' | 'new' | 'stable'
  trendChange: number
  searchCount: number
}

/** 每日一句 */
export interface DailyQuote {
  text: string
  pronunciation: string
  translation: string
  dialect: Dialect
}

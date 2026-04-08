const API_BASE = '/api/v1'

// ===== Types matching actual API responses =====

export interface CoocItem {
  partner: string
  co_count: number
  logdice: number
  mi_score: number
  word_freq: number
}

export interface CoocResponse {
  word: string
  total: number
  sort_by: string
  results: CoocItem[]
}

export interface DictEntry {
  id: number
  title: string
  heteronyms: Array<{
    pinyin?: string
    definitions: Array<{
      def: string
      type?: string
      example?: string[]
    }>
  }>
}

export interface DictResponse {
  entry: DictEntry | null
  related: Array<{ title: string; pinyin_preview?: string; definition_preview?: string }>
}

export interface PinyinDialect {
  dialect: string
  pinyin_full: string
  pinyin_base: string
}

export interface PinyinRecommendItem {
  word: string
  dialects: PinyinDialect[]
}

export interface PinyinRecommendResponse {
  query: string
  items: PinyinRecommendItem[]
}

export interface PinyinSearchItem {
  word: string
  pinyin_full: string
  pinyin_base: string
  dialect: string
  definition: string | null
}

export interface PinyinSearchResponse {
  query: string
  results: PinyinSearchItem[]
}

export interface DialectResult {
  dialect: string
  text: string
  pinyin: string
}

export interface TranslateResponse {
  original: string
  dialects: DialectResult[]
  source: string
}

export interface ChatResponse {
  reply: string
  source?: string
  items?: Array<{ item: string; dialects: DialectResult[] }>
  ocr_text?: string
  annotations?: Array<{ word: string; pinyin: string }>
  corpus_results?: Array<{ keyword: string; cooccurrences: Array<{ word: string; logdice: number }> }>
  recommendations?: string[]
  asr_url?: string
}

export interface YoutubeVideo {
  id: string
  title: string
  thumbnail: string
  channel: string
  views?: string
  duration?: string
}

export interface ImageResult {
  thumb: string
  full: string
  title?: string
}

export interface StatsOverview {
  dict_count: number
  cooc_count: number
  pinyin_count: number
  total_queries_today: number
}

// ===== API functions =====

export async function fetchDict(q: string): Promise<DictResponse> {
  const res = await fetch(`${API_BASE}/dict?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('NOT_FOUND')
  return res.json()
}

export async function fetchCooc(q: string, sort = 'logdice', limit = 50): Promise<CoocResponse> {
  const res = await fetch(`${API_BASE}/cooc?q=${encodeURIComponent(q)}&sort=${sort}&limit=${limit}`)
  if (!res.ok) throw new Error('API error: ' + res.status)
  return res.json()
}

export async function fetchPinyinRecommend(q: string): Promise<PinyinRecommendResponse> {
  const res = await fetch(`${API_BASE}/pinyin/recommend?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchPinyinSearch(q: string, limit = 15): Promise<PinyinSearchResponse> {
  const res = await fetch(`${API_BASE}/pinyin?q=${encodeURIComponent(q)}&limit=${limit}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchTranslate(text: string): Promise<TranslateResponse> {
  const res = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchChat(
  message: string,
  mode = 'chat',
  sessionId = '',
  image?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode, session_id: sessionId, image }),
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchOcr(image: string, message = ''): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, message }),
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchImageRecognize(image: string, message = ''): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/image-recognize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, message }),
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchAsrTicket(): Promise<{ wss_url: string }> {
  const res = await fetch(`${API_BASE}/asr/ticket`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchYoutube(q: string, n = 6): Promise<YoutubeVideo[]> {
  const res = await fetch(`${API_BASE}/media/youtube?q=${encodeURIComponent(q)}&n=${n}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchImages(q: string, n = 6): Promise<ImageResult[]> {
  const res = await fetch(`${API_BASE}/media/images?q=${encodeURIComponent(q)}&n=${n}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchStatsOverview(): Promise<StatsOverview> {
  const res = await fetch(`${API_BASE}/stats/overview`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Daily Quote =====

export interface DailyQuoteData {
  title: string
  pinyin: string
  dialect: string
  definition: string
  example: string
}

export async function fetchDailyQuote(): Promise<DailyQuoteData> {
  const res = await fetch(`${API_BASE}/stats/daily-quote`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Trending =====

export interface TrendingItem {
  word: string
  count: number
}

export interface TrendingData {
  period: string
  items: TrendingItem[]
}

export async function fetchTrending(period = 'monthly', limit = 10): Promise<TrendingData> {
  const res = await fetch(`${API_BASE}/stats/trending?period=${period}&limit=${limit}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

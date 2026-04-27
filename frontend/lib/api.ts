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

export async function fetchCooc(
  q: string,
  sort = 'logdice',
  limit = 20,
  offset = 0,
  dialects?: string[]
): Promise<CoocResponse> {
  let url = `${API_BASE}/cooc?q=${encodeURIComponent(q)}&sort=${sort}&limit=${limit}&offset=${offset}`
  if (dialects && dialects.length > 0) {
    url += `&dialects=${dialects.join(',')}`
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error('API error: ' + res.status)
  return res.json()
}

export async function fetchCoocPositional(
  q: string,
  cats: string[],
  limit = 20,
  offset = 0
): Promise<CoocResponse> {
  const catsParam = cats.join(',')
  const res = await fetch(
    `${API_BASE}/cooc/positional?q=${encodeURIComponent(q)}&cats=${encodeURIComponent(catsParam)}&limit=${limit}&offset=${offset}`
  )
  if (!res.ok) throw new Error('API error: ' + res.status)
  return res.json()
}

export interface DialectCountItem {
  dialect: string
  count: number
}

export interface DialectCountsResponse {
  word: string
  counts: DialectCountItem[]
}

export async function fetchCoocDialectCounts(q: string): Promise<DialectCountsResponse> {
  const res = await fetch(`${API_BASE}/cooc/dialect-counts?q=${encodeURIComponent(q)}`)
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

// ===== Dialects =====

export interface DialectMeta {
  code: string
  name_zh: string
  db_labels: string[]
  total_words: number
}

export interface DialectWord {
  word: string
  pinyin_full: string
  definition: string | null
  word_freq: number
}

export interface DialectWordsResponse {
  dialect_code: string
  dialect_name: string
  items: DialectWord[]
}

export async function fetchDialects(): Promise<DialectMeta[]> {
  const res = await fetch(`${API_BASE}/dialects`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchDialectWords(code: string, limit = 10): Promise<DialectWordsResponse> {
  const res = await fetch(`${API_BASE}/dialects/${code}/words?limit=${limit}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Word of Day =====

export interface PinyinByDialect {
  dialect: string
  pinyin_full: string
}

export interface CoocWord {
  partner: string
  logdice: number
}

export interface ProverbPreview {
  title: string
  pinyin: string | null
  definition: string | null
  example: string | null
}

export interface WordOfDayData {
  entry: DictEntry
  pinyin_by_dialect: PinyinByDialect[]
  cooc_words: CoocWord[]
  related_proverbs: ProverbPreview[]
}

export async function fetchWordOfDay(opts?: {
  keyword?: string
  random?: boolean
}): Promise<WordOfDayData> {
  const params = new URLSearchParams()
  if (opts?.keyword) params.set('q', opts.keyword)
  if (opts?.random) params.set('random', 'true')
  const qs = params.toString()
  const url = qs ? `${API_BASE}/dict/word-of-day?${qs}` : `${API_BASE}/dict/word-of-day`
  const res = await fetch(url)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchRandomDict(dialect?: string): Promise<DictEntry> {
  const url = dialect
    ? `${API_BASE}/dict/random?dialect=${encodeURIComponent(dialect)}`
    : `${API_BASE}/dict/random`
  const res = await fetch(url)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Proverbs =====

export interface ProverbTopicItem {
  name: string
  percentage: number
}

export interface ProverbItem {
  id: number
  title: string
  pinyin: string | null
  dialect: string | null
  definition: string | null
  example: string | null
  category: string | null
  topics?: ProverbTopicItem[] | null
}

export interface ProverbListResponse {
  total: number
  items: ProverbItem[]
}

export async function fetchRandomProverb(): Promise<ProverbItem> {
  const res = await fetch(`${API_BASE}/proverbs/random`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchProverbPinyinByDialect(id: number): Promise<PinyinByDialect[]> {
  const res = await fetch(`${API_BASE}/proverbs/${id}/pinyin-by-dialect`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchProverbList(params?: {
  limit?: number
  offset?: number
  category?: string
  dialect?: string
  topic?: string
}): Promise<ProverbListResponse> {
  const p = new URLSearchParams()
  if (params?.limit) p.set('limit', String(params.limit))
  if (params?.offset) p.set('offset', String(params.offset))
  if (params?.category) p.set('category', params.category)
  if (params?.dialect) p.set('dialect', params.dialect)
  if (params?.topic) p.set('topic', params.topic)
  const res = await fetch(`${API_BASE}/proverbs?${p.toString()}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Proverb by ID =====
export async function fetchProverbById(id: number): Promise<ProverbItem> {
  const res = await fetch(`${API_BASE}/proverbs/${id}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Certified Vocab =====
export interface CertifiedVocabItem {
  word: string
  pinyin: string | null
  dialect: string | null
  grade: string
  category: string | null
  mandarin: string | null
}

export interface CertifiedVocabBatchItem {
  word: string
  grade: string | null
  mandarin: string | null
}

export async function fetchCertifiedVocabBatch(
  words: string[],
  dialect?: string
): Promise<CertifiedVocabBatchItem[]> {
  if (words.length === 0) return []
  const params = new URLSearchParams()
  params.set('words', words.join(','))
  if (dialect) params.set('dialect', dialect)
  const res = await fetch(`${API_BASE}/certified-vocab/batch?${params.toString()}`)
  if (!res.ok) return words.map(w => ({ word: w, grade: null, mandarin: null }))
  return res.json()
}

// ===== Cooc Top / Random Pair =====

export interface CoocPairItem {
  word: string
  partner: string
  co_count: number
  logdice: number
  mi_score: number
  word_freq: number
}

export async function fetchCoocTop(limit = 30, sort = 'logdice'): Promise<CoocPairItem[]> {
  const res = await fetch(`${API_BASE}/cooc/top?limit=${limit}&sort=${sort}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchRandomCoocPair(): Promise<CoocPairItem> {
  const res = await fetch(`${API_BASE}/cooc/random-pair`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Corpus Texts (文章級客語語料 + AI 分析) =====

export interface CorpusTopicItem {
  name: string
  percentage: number
  keywords: string[]
}

export interface CorpusNerEntities {
  persons?: string[]
  places?: string[]
  organizations?: string[]
}

export interface CorpusEmotionSentence {
  text: string
  keywords: string[]
  emotion: string
  confidence: number
}

export interface CorpusSentiment {
  /** 情緒擷取（新）— 主要情緒 */
  primary?: string
  /** 七大情緒分布：喜悅/驚訝/生氣/厭惡/害怕/哀傷/中性 */
  distribution?: Record<string, number>
  /** 逐句情緒樣本 */
  sentences?: CorpusEmotionSentence[]

  /** 情感極性（舊）— 向後相容 */
  positive?: number
  negative?: number
  neutral?: number
}

export interface CorpusTextSummary {
  id: string
  title: string
  dialect?: string | null
  genre?: string | null
  source?: string | null
  word_count?: number | null
  summary?: string | null
  topics?: CorpusTopicItem[] | null
  categories?: string[] | null
  sentiment?: CorpusSentiment | null
}

export interface CorpusTextDetail extends CorpusTextSummary {
  content: string
  content_pinyin?: string | null
  author?: string | null
  source_url?: string | null
  license?: string | null
  year?: number | null
  summary_pinyin?: string | null
  summary_zh?: string | null
  ner_entities?: CorpusNerEntities | null
  sentiment?: CorpusSentiment | null
}

export interface CorpusTextListResponse {
  total: number
  items: CorpusTextSummary[]
  offset: number
  limit: number
}

export interface CorpusTextStats {
  total: number
  analyzed: number
  by_genre: { genre: string; count: number }[]
  by_dialect: { dialect: string; count: number }[]
}

export async function fetchCorpusTexts(params: {
  limit?: number
  offset?: number
  dialect?: string
  genre?: string
  topic?: string
  q?: string
} = {}): Promise<CorpusTextListResponse> {
  const sp = new URLSearchParams()
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.offset) sp.set('offset', String(params.offset))
  if (params.dialect) sp.set('dialect', params.dialect)
  if (params.genre) sp.set('genre', params.genre)
  if (params.topic) sp.set('topic', params.topic)
  if (params.q) sp.set('q', params.q)
  const res = await fetch(`${API_BASE}/corpus/texts?${sp.toString()}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchCorpusTextDetail(id: string): Promise<CorpusTextDetail> {
  const res = await fetch(`${API_BASE}/corpus/texts/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function fetchCorpusStats(): Promise<CorpusTextStats> {
  const res = await fetch(`${API_BASE}/corpus/stats`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// ===== Word Sketch =====

export interface SketchCategoryItem {
  partner: string
  count: number
}

export interface SketchCategories {
  N_Modifier: SketchCategoryItem[]
  Modifies: SketchCategoryItem[]
  Object_of: SketchCategoryItem[]
  Subject_of: SketchCategoryItem[]
  Possession: SketchCategoryItem[]
}

export interface SketchResponse {
  word: string
  categories: SketchCategories
}

export async function fetchSketch(q: string, limitPerCat = 10): Promise<SketchResponse> {
  const res = await fetch(`${API_BASE}/cooc/sketch?q=${encodeURIComponent(q)}&limit_per_cat=${limitPerCat}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

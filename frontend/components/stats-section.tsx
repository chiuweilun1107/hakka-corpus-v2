'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
// Card imports removed — using plain divs for lighter design
import { Button } from '@/components/ui/button'
import { fetchStatsOverview } from '@/lib/api'
import type { StatsOverview } from '@/lib/api'
import { DIALECT_CHART_COLORS, GENRE_COLORS as GENRE_COLORS_LIB } from '@/lib/colors'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { useTranslations, useLocale } from 'next-intl'
import { HakkaLabel } from '@/components/ui/hakka-label'
import { SectionHeader } from '@/components/ui/section-header'

// 中文 → 英文 label 對照表（僅 en locale 使用；其他 locale 維持中文）
const CHART_LABEL_EN: Record<string, string> = {
  '四縣': 'Sixian',
  '海陸': 'Hailu',
  '大埔': 'Dapu',
  '饒平': 'Raoping',
  '詔安': 'Zhaoan',
  '南四縣': 'Sihai',
  '散文': 'Prose',
  '口語': 'Speech',
  '歌謠': 'Folk Song',
  '戲劇': 'Drama',
  '報導': 'News',
  '飲食': 'Food',
  '文化': 'Culture',
  '教育': 'Education',
  '觀光': 'Tourism',
  '民俗': 'Folklore',
}

function useChartFmt() {
  const locale = useLocale()
  return (v: string | number | undefined | null): string => {
    const s = String(v ?? '')
    if (locale !== 'en') return s
    return CHART_LABEL_EN[s] ?? s
  }
}

// ============================================================
// 【型別定義】兩軸選擇器：showWhat × dimension
// ============================================================

/** 「呈現什麼」— 第一排按鈕 */
type ShowWhat = 'dialect' | 'genre' | 'topic'

/** 「依什麼維度」— 第二排按鈕 */
type Dimension = 'overall' | 'by-genre' | 'by-topic' | 'by-time'

// ============================================================
// 【顏色定義】腔調 / 文體 / 主題
// ============================================================

const DIALECT_COLORS = DIALECT_CHART_COLORS
const GENRE_COLORS = GENRE_COLORS_LIB

/** 五大主題顏色 */
const TOPIC_COLORS: Record<string, string> = {
  飲食: '#009688',
  文化: '#6366f1',
  教育: '#f59e0b',
  觀光: '#8b5cf6',
  民俗: '#ef4444',
}

const DIALECT_KEYS = ['四縣', '海陸', '大埔', '饒平', '詔安', '南四縣'] as const
const GENRE_KEYS = ['散文', '口語', '歌謠', '戲劇', '報導'] as const
const TOPIC_KEYS = ['飲食', '文化', '教育', '觀光', '民俗'] as const

// ============================================================
// 【模擬資料】語料庫尚無文體/主題/時間 metadata
// 以下為模擬值，展示多維度交叉分析的預期效果
// 實際上線後應從語料庫標注中統計
// ============================================================

// --- 腔調 × 按文體 ---
const MOCK_DIALECT_BY_GENRE = [
  { genre: '散文', 四縣: 1800, 海陸: 1500, 大埔: 800, 饒平: 650, 詔安: 320, 南四縣: 450 },
  { genre: '口語', 四縣: 1200, 海陸: 1100, 大埔: 600, 饒平: 500, 詔安: 280, 南四縣: 500 },
  { genre: '歌謠', 四縣: 600, 海陸: 450, 大埔: 350, 饒平: 200, 詔安: 80, 南四縣: 580 },
  { genre: '報導', 四縣: 900, 海陸: 750, 大埔: 400, 饒平: 350, 詔安: 150, 南四縣: 650 },
  { genre: '戲劇', 四縣: 400, 海陸: 350, 大埔: 200, 饒平: 180, 詔安: 120, 南四縣: 590 },
]

// --- 腔調 × 按主題 ---
const MOCK_DIALECT_BY_TOPIC = [
  { topic: '飲食', 四縣: 950, 海陸: 780, 大埔: 420, 饒平: 380, 詔安: 180, 南四縣: 420 },
  { topic: '文化', 四縣: 1100, 海陸: 920, 大埔: 550, 饒平: 480, 詔安: 250, 南四縣: 570 },
  { topic: '教育', 四縣: 800, 海陸: 650, 大埔: 380, 饒平: 320, 詔安: 160, 南四縣: 230 },
  { topic: '民俗', 四縣: 720, 海陸: 600, 大埔: 350, 饒平: 300, 詔安: 200, 南四縣: 510 },
  { topic: '觀光', 四縣: 650, 海陸: 520, 大埔: 280, 饒平: 250, 詔安: 120, 南四縣: 180 },
]

// --- 腔調 × 按時間（堆疊面積圖：語料累積成長） ---
const MOCK_DIALECT_BY_TIME = [
  { year: '2008', 四縣: 2200, 海陸: 1800, 大埔: 1000, 饒平: 900, 詔安: 500, 南四縣: 600 },
  { year: '2012', 四縣: 3100, 海陸: 2600, 大埔: 1500, 饒平: 1300, 詔安: 700, 南四縣: 1200 },
  { year: '2016', 四縣: 4500, 海陸: 3800, 大埔: 2200, 饒平: 1900, 詔安: 1000, 南四縣: 2100 },
  { year: '2020', 四縣: 6200, 海陸: 5400, 大埔: 3100, 饒平: 2700, 詔安: 1500, 南四縣: 3200 },
  { year: '2024', 四縣: 8500, 海陸: 7200, 大埔: 4200, 饒平: 3600, 詔安: 2100, 南四縣: 4500 },
]

// --- 文體 × 整體（橫條圖） ---
const MOCK_GENRE_OVERALL = [
  { name: '散文', count: 4520 },
  { name: '口語', count: 3180 },
  { name: '歌謠', count: 1260 },
  { name: '戲劇', count: 840 },
  { name: '報導', count: 2200 },
]

// --- 文體 × 按主題 ---
const MOCK_GENRE_BY_TOPIC = [
  { topic: '飲食', 散文: 900, 口語: 650, 歌謠: 80, 戲劇: 120, 報導: 380 },
  { topic: '文化', 散文: 1200, 口語: 800, 歌謠: 450, 戲劇: 280, 報導: 590 },
  { topic: '教育', 散文: 850, 口語: 520, 歌謠: 60, 戲劇: 90, 報導: 420 },
  { topic: '民俗', 散文: 780, 口語: 680, 歌謠: 520, 戲劇: 250, 報導: 350 },
  { topic: '觀光', 散文: 790, 口語: 530, 歌謠: 150, 戲劇: 100, 報導: 460 },
]

// --- 文體 × 按時間（面積圖） ---
const MOCK_GENRE_BY_TIME = [
  { year: '2008', 散文: 800, 口語: 400, 歌謠: 200, 戲劇: 100, 報導: 300 },
  { year: '2012', 散文: 1200, 口語: 700, 歌謠: 350, 戲劇: 200, 報導: 550 },
  { year: '2016', 散文: 1800, 口語: 1100, 歌謠: 500, 戲劇: 350, 報導: 900 },
  { year: '2020', 散文: 2500, 口語: 1800, 歌謠: 700, 戲劇: 500, 報導: 1300 },
  { year: '2024', 散文: 3200, 口語: 2500, 歌謠: 900, 戲劇: 650, 報導: 1800 },
]

// --- 主題 × 整體（直條圖） ---
const MOCK_TOPIC_OVERALL = [
  { name: '飲食', count: 2130 },
  { name: '文化', count: 1870 },
  { name: '教育', count: 1540 },
  { name: '觀光', count: 1320 },
  { name: '民俗', count: 1180 },
]

// --- 主題 × 按文體（分組柱狀圖） ---
const MOCK_TOPIC_BY_GENRE = [
  { genre: '散文', 飲食: 900, 文化: 1200, 教育: 850, 觀光: 790, 民俗: 780 },
  { genre: '口語', 飲食: 650, 文化: 800, 教育: 520, 觀光: 530, 民俗: 680 },
  { genre: '歌謠', 飲食: 80, 文化: 450, 教育: 60, 觀光: 150, 民俗: 520 },
  { genre: '戲劇', 飲食: 120, 文化: 280, 教育: 90, 觀光: 100, 民俗: 250 },
  { genre: '報導', 飲食: 380, 文化: 590, 教育: 420, 觀光: 460, 民俗: 350 },
]

// --- 主題 × 按時間（折線圖） ---
const MOCK_TOPIC_BY_TIME = [
  { year: '2008', 飲食: 300, 文化: 400, 教育: 200, 觀光: 150, 民俗: 350 },
  { year: '2012', 飲食: 500, 文化: 600, 教育: 350, 觀光: 280, 民俗: 320 },
  { year: '2016', 飲食: 800, 文化: 850, 教育: 550, 觀光: 480, 民俗: 300 },
  { year: '2020', 飲食: 1200, 文化: 1100, 教育: 800, 觀光: 750, 民俗: 280 },
  { year: '2024', 飲食: 1600, 文化: 1500, 教育: 1100, 觀光: 1000, 民俗: 260 },
]

// ============================================================
// 【共用 Recharts 樣式】Tooltip / CartesianGrid / Axis
// ============================================================

const TOOLTIP_STYLE = {
  borderRadius: '0.75rem',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
}

const GRID_PROPS = {
  strokeDasharray: '3 3' as const,
  vertical: false,
  stroke: '#f1f5f9',
}

const X_AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 12, fill: '#64748b' },
}

const Y_AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 11, fill: '#64748b' },
}

// ============================================================
// 【禁用規則】某些 showWhat × dimension 組合無意義
// ============================================================

/** 檢查某個 dimension 在目前的 showWhat 下是否禁用 */
function isDimensionDisabled(showWhat: ShowWhat, dim: Dimension): boolean {
  // 文體 × 按文體 無意義
  if (showWhat === 'genre' && dim === 'by-genre') return true
  // 主題 × 按主題 無意義
  if (showWhat === 'topic' && dim === 'by-topic') return true
  return false
}

/** 判斷該組合是否使用 mock 資料（只有 dialect + overall 用真實 API） */
function isMockData(showWhat: ShowWhat, dimension: Dimension): boolean {
  return !(showWhat === 'dialect' && dimension === 'overall')
}

// ============================================================
// 【子組件】MockBadge — 模擬資料標示
// ============================================================

function MockBadge() {
  const t = useTranslations('stats')
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold">
      <AlertCircle className="h-3 w-3" />
      {t('mockBadge')}
    </span>
  )
}

// ============================================================
// 【子組件】StatCard — 統計概覽卡片
// ============================================================

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="text-center py-4">
      {loading ? (
        <Loader2 className="h-5 w-5 text-slate-300 animate-spin mx-auto mb-1" />
      ) : (
        <p className="text-2xl sm:text-3xl font-bold text-primary">{value.toLocaleString()}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  )
}

// ============================================================
// 【圖表組件】各種 showWhat × dimension 組合
// ============================================================

/** dialect + overall: 圓餅圖（真實 DB） */
function DialectOverallChart({ data }: { data: Array<{ name: string; count: number }> }) {
  const fmt = useChartFmt()
  const PIE_COLORS_LIST = Object.values(DIALECT_COLORS)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={({ name, count }: { name: string; count: number }) => `${fmt(name)} ${count.toLocaleString()}`}
          labelLine={{ stroke: '#ccc', strokeWidth: 1 }}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={PIE_COLORS_LIST[index % PIE_COLORS_LIST.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [v, fmt(n)]} />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** dialect + by-genre: 分組柱狀圖（X=文體） */
function DialectByGenreChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={MOCK_DIALECT_BY_GENRE} margin={{ left: 10, bottom: 10 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="genre" tickFormatter={fmt} {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} formatter={(v: number, n: string) => [v, fmt(n)]} />
        <Legend formatter={fmt} />
        {DIALECT_KEYS.map((key) => (
          <Bar key={key} dataKey={key} fill={DIALECT_COLORS[key]} radius={[4, 4, 0, 0]} barSize={16} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** dialect + by-topic: 分組柱狀圖（X=主題） */
function DialectByTopicChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={MOCK_DIALECT_BY_TOPIC} margin={{ left: 10, bottom: 10 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="topic" tickFormatter={fmt} {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} formatter={(v: number, n: string) => [v, fmt(n)]} />
        <Legend formatter={fmt} />
        {DIALECT_KEYS.map((key) => (
          <Bar key={key} dataKey={key} fill={DIALECT_COLORS[key]} radius={[4, 4, 0, 0]} barSize={16} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** dialect + by-time: 堆疊面積圖（X=年份） */
function DialectByTimeChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={MOCK_DIALECT_BY_TIME}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="year" {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [v, fmt(n)]} />
        <Legend formatter={fmt} />
        {DIALECT_KEYS.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="dialect"
            stroke={DIALECT_COLORS[key]}
            fill={DIALECT_COLORS[key]}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** genre + overall: 橫條圖 */
function GenreOverallChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={MOCK_GENRE_OVERALL} layout="vertical" margin={{ left: 40, right: 20 }}>
        <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
        <XAxis type="number" {...X_AXIS_PROPS} />
        <YAxis type="category" dataKey="name" tickFormatter={fmt} {...Y_AXIS_PROPS} width={70} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
          {MOCK_GENRE_OVERALL.map((entry) => (
            <Cell key={entry.name} fill={GENRE_COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** genre + by-topic: 分組柱狀圖（X=主題） */
function GenreByTopicChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={MOCK_GENRE_BY_TOPIC} margin={{ left: 10, bottom: 10 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="topic" tickFormatter={fmt} {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} formatter={(v: number, n: string) => [v, fmt(n)]} />
        <Legend formatter={fmt} />
        {GENRE_KEYS.map((key) => (
          <Bar key={key} dataKey={key} fill={GENRE_COLORS[key]} radius={[4, 4, 0, 0]} barSize={20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** genre + by-time: 面積圖（X=年份） */
function GenreByTimeChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={MOCK_GENRE_BY_TIME}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="year" {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [v, fmt(n)]} />
        <Legend formatter={fmt} />
        {GENRE_KEYS.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={GENRE_COLORS[key]}
            fill={GENRE_COLORS[key]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** topic + overall: 直條圖 */
function TopicOverallChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={MOCK_TOPIC_OVERALL} margin={{ left: 10, bottom: 10 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="name" tickFormatter={fmt} {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
          {MOCK_TOPIC_OVERALL.map((entry) => (
            <Cell key={entry.name} fill={TOPIC_COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** topic + by-genre: 分組柱狀圖（X=文體） */
function TopicByGenreChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={MOCK_TOPIC_BY_GENRE} margin={{ left: 10, bottom: 10 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="genre" tickFormatter={fmt} {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} formatter={(v: number, n: string) => [v, fmt(n)]} />
        <Legend formatter={fmt} />
        {TOPIC_KEYS.map((key) => (
          <Bar key={key} dataKey={key} fill={TOPIC_COLORS[key]} radius={[4, 4, 0, 0]} barSize={20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** topic + by-time: 折線圖（X=年份） */
function TopicByTimeChart() {
  const fmt = useChartFmt()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={MOCK_TOPIC_BY_TIME}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="year" {...X_AXIS_PROPS} />
        <YAxis {...Y_AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [v, fmt(n)]} />
        <Legend formatter={fmt} />
        {TOPIC_KEYS.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={TOPIC_COLORS[key]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: TOPIC_COLORS[key] }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// 【主組件】StatsSection
// ============================================================

export function StatsSection() {
  const t = useTranslations('stats')

  // --- 真實 API 資料 ---
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [dialectData, setDialectData] = useState<Array<{ name: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

  // --- 兩軸選擇器狀態 ---
  const [showWhat, setShowWhat] = useState<ShowWhat>('dialect')
  const [dimension, setDimension] = useState<Dimension>('overall')

  const showWhatOptions: Array<{ key: ShowWhat; label: string }> = [
    { key: 'dialect', label: t('showWhat.dialect') },
    { key: 'genre', label: t('showWhat.genre') },
    { key: 'topic', label: t('showWhat.topic') },
  ]

  const dimensionOptions: Array<{ key: Dimension; label: string }> = [
    { key: 'overall', label: t('dimension.overall') },
    { key: 'by-genre', label: t('dimension.byGenre') },
    { key: 'by-topic', label: t('dimension.byTopic') },
    { key: 'by-time', label: t('dimension.byTime') },
  ]

  // 載入真實 API 資料（統計概覽 + 腔調分布）
  useEffect(() => {
    Promise.all([
      fetchStatsOverview().catch(() => null),
      fetch('/api/v1/stats/dialect-distribution').then(r => r.json()).catch(() => []),
    ]).then(([statsData, dialectRows]) => {
      if (statsData) setStats(statsData)
      if (Array.isArray(dialectRows)) setDialectData(dialectRows)
    }).finally(() => setLoading(false))
  }, [])

  // 切換 showWhat 時，若當前 dimension 變成禁用，自動退回 overall
  useEffect(() => {
    if (isDimensionDisabled(showWhat, dimension)) {
      setDimension('overall')
    }
  }, [showWhat, dimension])

  // 根據 showWhat × dimension 渲染對應圖表
  const chartElement = useMemo(() => {
    if (showWhat === 'dialect') {
      switch (dimension) {
        case 'overall': return <DialectOverallChart data={dialectData} />
        case 'by-genre': return <DialectByGenreChart />
        case 'by-topic': return <DialectByTopicChart />
        case 'by-time': return <DialectByTimeChart />
      }
    }
    if (showWhat === 'genre') {
      switch (dimension) {
        case 'overall': return <GenreOverallChart />
        case 'by-topic': return <GenreByTopicChart />
        case 'by-time': return <GenreByTimeChart />
        default: return null // by-genre 已禁用
      }
    }
    if (showWhat === 'topic') {
      switch (dimension) {
        case 'overall': return <TopicOverallChart />
        case 'by-genre': return <TopicByGenreChart />
        case 'by-time': return <TopicByTimeChart />
        default: return null // by-topic 已禁用
      }
    }
    return null
  }, [showWhat, dimension, dialectData])

  const showMockBadge = isMockData(showWhat, dimension)

  // 圖表標題描述（分離 showWhat label 供 HakkaLabel 處理）
  const chartTitleLabel = useMemo<string>(() => {
    const labels: Record<ShowWhat, string> = {
      dialect: t('chartTitle.dialect'),
      genre: t('chartTitle.genre'),
      topic: t('chartTitle.topic'),
    }
    return labels[showWhat]
  }, [showWhat, t])

  const chartDimLabel = useMemo<string>(() => {
    const dimLabels: Record<Dimension, string> = {
      overall: t('dimension.overall'),
      'by-genre': t('dimension.byGenre'),
      'by-topic': t('dimension.byTopic'),
      'by-time': t('dimension.byTime'),
    }
    return dimLabels[dimension]
  }, [dimension, t])

  return (
    <section className="py-20 bg-background border-t border-border/20 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        {/* Stats Overview Cards — 真實 API 資料 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label={t('statCards.dictCount')} value={stats?.dict_count ?? 0} loading={loading} />
          <StatCard label={t('statCards.coocCount')} value={stats?.cooc_count ?? 0} loading={loading} />
          <StatCard label={t('statCards.pinyinCount')} value={stats?.pinyin_count ?? 0} loading={loading} />
          <StatCard label={t('statCards.todayQueries')} value={stats?.total_queries_today ?? 0} loading={loading} />
        </div>

        {/* Chart area */}
        <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="pb-0 pt-5 px-6">
            {/* 圖表標題 */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground">
                <HakkaLabel text={chartTitleLabel} /> – {chartDimLabel}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {showWhat === 'dialect' && dimension === 'overall'
                  ? t('realData')
                  : t('mockHint')
                }
              </p>
            </div>

            {/* 第一排：呈現什麼 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 shrink-0">{t('showWhat.label')}</span>
                <div className="flex gap-1 flex-wrap">
                  {showWhatOptions.map((opt) => (
                    <Button
                      key={opt.key}
                      variant={showWhat === opt.key ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-lg text-xs h-8"
                      onClick={() => setShowWhat(opt.key)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 第二排：按什麼維度 + MockBadge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 shrink-0">{t('dimension.label')}</span>
                <div className="flex gap-1 flex-wrap">
                  {dimensionOptions.map((opt) => {
                    const disabled = isDimensionDisabled(showWhat, opt.key)
                    return (
                      <Button
                        key={opt.key}
                        variant={dimension === opt.key ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-lg text-xs h-8"
                        disabled={disabled}
                        onClick={() => setDimension(opt.key)}
                      >
                        {opt.label}
                      </Button>
                    )
                  })}
                </div>
                {showMockBadge && <MockBadge />}
              </div>
            </div>
          </div>

          <div className="p-6 h-[420px]">
            {chartElement}
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingState } from '@/components/loading-state'
import { EmptyState } from '@/components/empty-state'
import { DataSources } from '@/components/data-sources'
import { PageHeader } from '@/components/page-header'
import { ContentCard } from '@/components/ui/content-card'
import {
  fetchCooc,
  fetchCoocPositional,
  fetchCoocDialectCounts,
  type CoocItem,
  type CoocResponse,
  type DialectCountItem,
} from '@/lib/api'

// ===== Types =====

type SortKey = 'logdice' | 'mi' | 'count' | 'freq'

const SORT_LABELS: Record<SortKey, string> = {
  logdice: 'LogDice',
  mi: 'MI-score',
  count: '共現次數',
  freq: '詞頻',
}

const SORT_API_KEY: Record<SortKey, string> = {
  logdice: 'logdice',
  mi: 'mi',
  count: 'freq',
  freq: 'word_freq',
}

// ===== Filter constants =====

const CAT_DISPLAY: Record<string, { label: string; hint: string }> = {
  Modifies:   { label: '右1 (+1)',     hint: '關鍵詞後方第1個詞' },
  N_Modifier: { label: '左1 (-1)',     hint: '關鍵詞前方第1個詞' },
  Subject_of: { label: '右2-3 (+2,+3)', hint: '關鍵詞右方2-3個詞' },
  Object_of:  { label: '左2-3 (-2,-3)', hint: '關鍵詞左方2-3個詞' },
  Possession: { label: '領屬',          hint: '含 的/介/个 的領屬關係' },
}

const DIALECT_DISPLAY = [
  { code: 'sixian',  label: '四縣腔',  dbLabel: '四縣',  color: '#009688' },
  { code: 'hailu',   label: '海陸腔',  dbLabel: '海陸',  color: '#4CAF50' },
  { code: 'sihai',   label: '南四縣腔', dbLabel: '南四縣', color: '#03A9F4' },
  { code: 'dapu',    label: '大埔腔',  dbLabel: '大埔',  color: '#E91E63' },
  { code: 'raoping', label: '饒平腔',  dbLabel: '饒平',  color: '#FF9800' },
  { code: 'zhaoan',  label: '詔安腔',  dbLabel: '詔安',  color: '#3F51B5' },
]

// ===== FilterPanel =====

interface FilterPanelProps {
  q: string
  windowMode: boolean
  selectedCats: string[]
  onCatToggle: (cat: string) => void
  onWindowModeChange: (v: boolean) => void
  dialectMode: boolean
  selectedDialects: string[]
  onDialectToggle: (d: string) => void
  onDialectModeChange: (v: boolean) => void
  dialectCounts: DialectCountItem[]
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function FilterPanel({
  windowMode,
  selectedCats,
  onCatToggle,
  onWindowModeChange,
  dialectMode,
  selectedDialects,
  onDialectToggle,
  onDialectModeChange,
  dialectCounts,
}: FilterPanelProps) {
  const getDialectCount = (dbLabel: string) => {
    const item = dialectCounts.find(c => c.dialect === dbLabel)
    return item ? item.count : null
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 詞距篩選 section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 border-b border-border">
          <span className="text-xs font-semibold text-foreground tracking-wide">詞距篩選</span>
          <ToggleSwitch
            checked={windowMode}
            onChange={(v) => {
              onWindowModeChange(v)
            }}
            label="啟用詞距篩選"
          />
        </div>
        <div className={`px-3 py-2 flex flex-col gap-1 transition-opacity duration-200 ${windowMode ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {Object.entries(CAT_DISPLAY).map(([cat, { label, hint }]) => {
            const checked = selectedCats.includes(cat)
            return (
              <label
                key={cat}
                className="flex items-start gap-2 cursor-pointer group py-1"
                title={hint}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onCatToggle(cat)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
                />
                <span className="text-xs leading-tight text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* 方言群 section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 border-b border-border">
          <span className="text-xs font-semibold text-foreground tracking-wide">方言群</span>
          <ToggleSwitch
            checked={dialectMode}
            onChange={(v) => {
              onDialectModeChange(v)
            }}
            label="啟用方言群篩選"
          />
        </div>
        <div className={`px-3 py-2 flex flex-col gap-1 transition-opacity duration-200 ${dialectMode ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {DIALECT_DISPLAY.map(({ code, label, dbLabel, color }) => {
            const checked = selectedDialects.includes(code)
            const count = getDialectCount(dbLabel)
            return (
              <label
                key={code}
                className="flex items-center gap-2 cursor-pointer group py-1"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onDialectToggle(code)}
                  className="sr-only"
                />
                {/* colored dot indicator */}
                <span
                  className={`h-3 w-3 rounded-full shrink-0 border-2 transition-all ${
                    checked ? 'border-transparent' : 'border-current opacity-40'
                  }`}
                  style={{ backgroundColor: checked ? color : 'transparent', borderColor: checked ? color : color }}
                  aria-hidden="true"
                />
                <span className="text-xs flex-1 leading-tight text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
                {count !== null && (
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground bg-muted/50 rounded px-1">
                    {count.toLocaleString()}
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ===== Mobile filter accordion =====

function MobileFilterAccordion(props: FilterPanelProps) {
  const [open, setOpen] = useState(false)
  const activeCount = (props.windowMode ? props.selectedCats.length : 0) +
    (props.dialectMode ? props.selectedDialects.length : 0)

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="lg:hidden mb-3 rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none bg-muted/30 select-none">
        <span className="text-sm font-semibold text-foreground">篩選條件</span>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </summary>
      <div className="px-4 py-3">
        <FilterPanel {...props} />
      </div>
    </details>
  )
}

// ===== Main content =====

function CooccurrenceContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [coocData, setCoocData] = useState<CoocItem[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('logdice')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 詞距篩選 state
  const [windowMode, setWindowMode] = useState(false)
  const [selectedCats, setSelectedCats] = useState<string[]>([
    'Modifies', 'N_Modifier', 'Object_of', 'Subject_of', 'Possession',
  ])

  // 方言群篩選 state
  const [dialectMode, setDialectMode] = useState(false)
  const [selectedDialects, setSelectedDialects] = useState<string[]>([])
  const [dialectCounts, setDialectCounts] = useState<DialectCountItem[]>([])

  const handleCatToggle = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
    setPage(1)
  }

  const handleDialectToggle = (d: string) => {
    setSelectedDialects(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
    setPage(1)
  }

  const handleWindowModeChange = (v: boolean) => {
    setWindowMode(v)
    if (v) {
      // 詞距與方言互斥
      setDialectMode(false)
      setSelectedDialects([])
    }
    setPage(1)
  }

  const handleDialectModeChange = (v: boolean) => {
    setDialectMode(v)
    if (v) {
      // 詞距與方言互斥
      setWindowMode(false)
    }
    setPage(1)
  }

  // 載入方言計數
  useEffect(() => {
    if (!q) return
    fetchCoocDialectCounts(q)
      .then(r => setDialectCounts(r.counts))
      .catch(() => {})
  }, [q])

  const loadData = useCallback(async () => {
    if (!q) return
    setLoading(true)
    setError('')
    try {
      let data: CoocResponse
      if (windowMode && selectedCats.length > 0) {
        data = await fetchCoocPositional(q, selectedCats, pageSize, (page - 1) * pageSize)
      } else {
        const dialects =
          dialectMode && selectedDialects.length > 0 ? selectedDialects : undefined
        data = await fetchCooc(q, SORT_API_KEY[sortKey], pageSize, (page - 1) * pageSize, dialects)
      }
      setCoocData(Array.isArray(data) ? data : (data?.results ?? []))
      setTotal(data?.total ?? 0)
    } catch {
      setError('無法載入共現詞資料，請確認伺服器已啟動。')
    } finally {
      setLoading(false)
    }
  }, [q, sortKey, page, pageSize, windowMode, selectedCats, dialectMode, selectedDialects])

  useEffect(() => { loadData() }, [loadData])

  const handleSortChange = (k: SortKey) => { setSortKey(k); setPage(1) }
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1) }

  const maxLogDice = Math.max(...coocData.map(d => d.logdice), 1)
  const maxMIScore = Math.max(...coocData.map(d => d.mi_score), 1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const skeletonCount = Math.min(pageSize, 10)

  const filterPanelProps: FilterPanelProps = {
    q,
    windowMode,
    selectedCats,
    onCatToggle: handleCatToggle,
    onWindowModeChange: handleWindowModeChange,
    dialectMode,
    selectedDialects,
    onDialectToggle: handleDialectToggle,
    onDialectModeChange: handleDialectModeChange,
    dialectCounts,
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="共現詞列表"
          subtitle={q ? (
            <>「<span className="font-semibold text-primary">{q}</span>」{!loading && ` -- 共 ${total} 筆結果`}</>
          ) : '輸入關鍵詞後顯示共現詞分析結果'}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">排序：</span>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <Button
                  key={key}
                  variant={sortKey === key ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg text-xs h-8"
                  onClick={() => handleSortChange(key)}
                  disabled={windowMode}
                >
                  {SORT_LABELS[key]}
                </Button>
              ))}
            </div>
          }
        />

        {q && loading && <LoadingState />}
        {q && error && <EmptyState title={error} />}

        {/* 手機版折疊篩選 */}
        <MobileFilterAccordion {...filterPanelProps} />

        {/* 主佈局：左側篩選 + 右側表格 */}
        <div className="flex gap-4 items-start">
          {/* 左側篩選面板（桌面） */}
          <aside className="hidden lg:block w-52 shrink-0" aria-label="篩選面板">
            <FilterPanel {...filterPanelProps} />
          </aside>

          {/* 右側主體 */}
          <div className="flex-1 min-w-0">
            <ContentCard variant="default" padding="sm" className="overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-12 text-center text-xs font-semibold">#</TableHead>
                      <TableHead className="text-center text-xs font-semibold">共現詞</TableHead>
                      <TableHead className="text-center text-xs font-semibold">詞頻</TableHead>
                      <TableHead className="text-center text-xs font-semibold">共現次數</TableHead>
                      <TableHead className="text-center text-xs font-semibold">LogDice</TableHead>
                      <TableHead className="text-center text-xs font-semibold">MI-score</TableHead>
                      <TableHead className="text-center text-xs font-semibold">外部連結</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!q ? (
                      Array.from({ length: skeletonCount }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-center text-xs text-muted-foreground/30">{i + 1}</TableCell>
                          <TableCell><div className="h-4 bg-muted/20 rounded w-20" /></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted/20 rounded w-10 mx-auto" /></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted/20 rounded w-10 mx-auto" /></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted/20 rounded w-24 mx-auto" /></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted/20 rounded w-24 mx-auto" /></TableCell>
                          <TableCell><div className="h-4 bg-muted/20 rounded w-24 mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : coocData.length > 0 ? (
                      coocData.map((d, i) => (
                        <TableRow key={d.partner} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="text-center text-xs text-muted-foreground font-mono tabular-nums">
                            {(page - 1) * pageSize + i + 1}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                              {d.partner}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-sm font-mono tabular-nums text-foreground">
                            {d.word_freq || '-'}
                          </TableCell>
                          <TableCell className="text-center text-sm font-mono tabular-nums text-foreground">
                            {d.co_count}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${(Math.max(0, d.logdice) / maxLogDice * 100).toFixed(0)}%` }}
                                />
                              </div>
                              <span className="text-sm font-mono font-bold text-primary tabular-nums min-w-[50px] text-right">
                                {d.logdice.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${(Math.max(0, d.mi_score) / maxMIScore * 100).toFixed(0)}%` }}
                                />
                              </div>
                              <span className="text-sm font-mono font-bold text-emerald-600 tabular-nums min-w-[50px] text-right">
                                {d.mi_score.toFixed(3)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1.5">
                              <Button size="sm" asChild className="px-2 py-1 h-auto text-[10px] font-bold bg-blue-500 hover:bg-blue-600 text-white">
                                <a href={`https://www.google.com/search?q=${encodeURIComponent(q + ' ' + d.partner)}`} target="_blank" rel="noopener noreferrer">
                                  Google
                                </a>
                              </Button>
                              <Button size="sm" asChild className="px-2 py-1 h-auto text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white">
                                <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q + ' ' + d.partner)}`} target="_blank" rel="noopener noreferrer">
                                  圖片
                                </a>
                              </Button>
                              <Button size="sm" asChild className="px-2 py-1 h-auto text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white">
                                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' ' + d.partner)}`} target="_blank" rel="noopener noreferrer">
                                  YT
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          {error || `關鍵詞「${q}」查無共現詞資料`}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination footer */}
              <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {q && total > 0
                    ? `顯示 ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} 筆，共 ${total} 筆`
                    : '尚無資料'}
                </span>
                {q && total > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">每頁</span>
                    {[20, 50, 100].map((s) => (
                      <Button
                        key={s}
                        variant={pageSize === s ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handlePageSizeChange(s)}
                      >
                        {s}
                      </Button>
                    ))}
                    <span className="mx-1 w-px h-4 bg-border" />
                    <Button
                      variant="outline" size="sm" className="h-7 px-2 text-xs"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      上一頁
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline" size="sm" className="h-7 px-2 text-xs"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      下一頁
                    </Button>
                  </div>
                )}
              </div>
            </ContentCard>
          </div>
        </div>

        <DataSources />
      </div>
    </>
  )
}

export default function CooccurrencePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CooccurrenceContent />
    </Suspense>
  )
}

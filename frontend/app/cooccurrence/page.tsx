'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, ArrowUpDown, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLayout } from '@/components/page-layout'
import { PageSearchBar } from '@/components/page-search-bar'
import { fetchCooc, type CoocItem } from '@/lib/api'

type SortKey = 'logdice' | 'mi' | 'freq' | 'count'

function CooccurrenceContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [coocData, setCoocData] = useState<CoocItem[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('logdice')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!q) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchCooc(q, sortKey, 50)
      setCoocData(Array.isArray(data) ? data : (data?.results ?? []))
    } catch {
      setError('無法載入共現詞資料，請確認伺服器已啟動。')
    } finally {
      setLoading(false)
    }
  }, [q, sortKey])

  useEffect(() => { loadData() }, [loadData])

  const sortedData = [...coocData].sort((a, b) => {
    if (sortKey === 'logdice') return b.logdice - a.logdice
    if (sortKey === 'mi') return b.mi_score - a.mi_score
    if (sortKey === 'count') return b.co_count - a.co_count
    if (sortKey === 'freq') return (b.word_freq || 0) - (a.word_freq || 0)
    return 0
  })

  const maxLogDice = Math.max(...sortedData.map(d => d.logdice), 1)

  if (!q) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        請在上方搜尋欄輸入關鍵詞
      </div>
    )
  }

  return (
    <>
      <PageSearchBar defaultQuery={q} targetPath="/cooccurrence" />

      <div className="container mx-auto px-4 py-6">
        {/* Title + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              共現詞列表
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              「<span className="font-semibold text-primary">{q}</span>」
              {!loading && ` -- 共 ${sortedData.length} 筆結果`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">排序：</span>
            {(['logdice', 'mi', 'freq', 'count'] as SortKey[]).map((key) => {
              const labels: Record<SortKey, string> = {
                logdice: 'LogDice',
                mi: 'MI-score',
                freq: '詞頻',
                count: '共現次數',
              }
              return (
                <Button
                  key={key}
                  variant={sortKey === key ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg text-xs h-8"
                  onClick={() => setSortKey(key)}
                >
                  {labels[key]}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">載入中...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20 text-muted-foreground">{error}</div>
        )}

        {/* Table */}
        {!loading && !error && sortedData.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 w-12">#</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">共現詞</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">詞頻</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">共現次數</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">LogDice</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">MI-score</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">外部連結</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sortedData.map((d, i) => (
                    <tr key={d.partner} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                          {d.partner}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {d.word_freq || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        {d.co_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${(d.logdice / maxLogDice * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-primary font-mono min-w-[50px] text-right">
                            {d.logdice.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground font-mono">
                        {d.mi_score.toFixed(3)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(q + ' ' + d.partner)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          >
                            Google
                          </a>
                          <a
                            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q + ' ' + d.partner)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                          >
                            圖片
                          </a>
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' ' + d.partner)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            YT
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination info */}
            <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                顯示 1-{sortedData.length} 筆，共 {sortedData.length} 筆
              </span>
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && !error && sortedData.length === 0 && (
          <div className="text-center py-20">
            <div className="text-lg font-semibold text-foreground mb-2">查無共現詞資料</div>
            <div className="text-sm text-muted-foreground">
              關鍵詞「{q}」在資料庫中沒有共現詞。
            </div>
          </div>
        )}

        {/* Data sources */}
        <div className="mt-8 py-4 border-t border-border flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">資料來源：</span>
          <a href="https://www.moedict.tw/" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
            萌典 Moedict 客語辭典 API <ExternalLink className="h-3 w-3" />
          </a>
          <span>|</span>
          <a href="https://corpus.hakka.gov.tw/" target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
            臺灣客語語料庫 <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </>
  )
}

export default function CooccurrencePage() {
  return (
    <PageLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <CooccurrenceContent />
      </Suspense>
    </PageLayout>
  )
}

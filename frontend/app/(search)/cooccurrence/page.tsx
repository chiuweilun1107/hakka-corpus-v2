'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingState } from '@/components/loading-state'
import { EmptyState } from '@/components/empty-state'
import { DataSources } from '@/components/data-sources'
import { PageHeader } from '@/components/page-header'
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
      const data = await fetchCooc(q, 'logdice', 50)
      setCoocData(Array.isArray(data) ? data : (data?.results ?? []))
    } catch {
      setError('無法載入共現詞資料，請確認伺服器已啟動。')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => { loadData() }, [loadData])

  const sortedData = [...coocData].sort((a, b) => {
    if (sortKey === 'logdice') return b.logdice - a.logdice
    if (sortKey === 'mi') return b.mi_score - a.mi_score
    if (sortKey === 'count') return b.co_count - a.co_count
    if (sortKey === 'freq') return (b.word_freq || 0) - (a.word_freq || 0)
    return 0
  })

  const maxLogDice = Math.max(...sortedData.map(d => d.logdice), 1)

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Title + Sort */}
        <PageHeader
          title="共現詞列表"
          subtitle={q ? (
            <>「<span className="font-semibold text-primary">{q}</span>」{!loading && ` -- 共 ${sortedData.length} 筆結果`}</>
          ) : '輸入關鍵詞後顯示共現詞分析結果'}
          action={
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
          }
        />

        {/* Loading */}
        {q && loading && <LoadingState />}

        {/* Error */}
        {q && error && <EmptyState title={error} />}

        {/* Table — always show skeleton */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12 text-xs font-semibold">#</TableHead>
                  <TableHead className="text-xs font-semibold">共現詞</TableHead>
                  <TableHead className="text-right text-xs font-semibold">詞頻</TableHead>
                  <TableHead className="text-right text-xs font-semibold">共現次數</TableHead>
                  <TableHead className="text-right text-xs font-semibold">LogDice</TableHead>
                  <TableHead className="text-right text-xs font-semibold">MI-score</TableHead>
                  <TableHead className="text-center text-xs font-semibold">外部連結</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!q ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground/30">{i + 1}</TableCell>
                      <TableCell><div className="h-4 bg-muted/20 rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-muted/20 rounded w-10 ml-auto" /></TableCell>
                      <TableCell><div className="h-4 bg-muted/20 rounded w-10 ml-auto" /></TableCell>
                      <TableCell><div className="h-4 bg-muted/20 rounded w-16 ml-auto" /></TableCell>
                      <TableCell><div className="h-4 bg-muted/20 rounded w-12 ml-auto" /></TableCell>
                      <TableCell><div className="h-4 bg-muted/20 rounded w-24 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedData.length > 0 ? (
                  sortedData.map((d, i) => (
                    <TableRow key={d.partner} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                          {d.partner}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {d.word_freq || '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">
                        {d.co_count}
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {d.mi_score.toFixed(3)}
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

          {/* Pagination info */}
          <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {q && sortedData.length > 0 ? `顯示 1-${sortedData.length} 筆，共 ${sortedData.length} 筆` : '尚無資料'}
            </span>
          </div>
        </div>

        {/* Data sources */}
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

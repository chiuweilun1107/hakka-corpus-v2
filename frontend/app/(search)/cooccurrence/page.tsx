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
import { fetchCooc, type CoocItem } from '@/lib/api'

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

  const loadData = useCallback(async () => {
    if (!q) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchCooc(q, SORT_API_KEY[sortKey], pageSize, (page - 1) * pageSize)
      setCoocData(Array.isArray(data) ? data : (data?.results ?? []))
      setTotal(data?.total ?? 0)
    } catch {
      setError('無法載入共現詞資料，請確認伺服器已啟動。')
    } finally {
      setLoading(false)
    }
  }, [q, sortKey, page, pageSize])

  useEffect(() => { loadData() }, [loadData])

  const handleSortChange = (k: SortKey) => { setSortKey(k); setPage(1) }
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1) }

  const maxLogDice = Math.max(...coocData.map(d => d.logdice), 1)
  const maxMIScore = Math.max(...coocData.map(d => d.mi_score), 1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const skeletonCount = Math.min(pageSize, 10)

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
                >
                  {SORT_LABELS[key]}
                </Button>
              ))}
            </div>
          }
        />

        {q && loading && <LoadingState />}
        {q && error && <EmptyState title={error} />}

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

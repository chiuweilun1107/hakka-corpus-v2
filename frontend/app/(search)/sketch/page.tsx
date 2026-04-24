'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, BarChart3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/loading-state'
import { EmptyState } from '@/components/empty-state'
import { DataSources } from '@/components/data-sources'
import { fetchCooc, fetchDict, type CoocItem, type DictEntry } from '@/lib/api'

const SKETCH_DATA_CACHE: Record<string, Record<string, string[]>> = {
  '客家': {
    'Modifies': ['文化節','族群','鄉親','山歌','文物館','歌謠','美食','民謠','本色'],
    'N_Modifier': ['榮興','美濃','寶島','永定','全美','中原','東勢','新竹縣','鄭榮興'],
    'Subject_of': ['採茶','小炒','醃漬','講古','現身','說唱','開館','料理','口述','炒','掛牌'],
    'Object_of': ['品嚐','發揚','演唱','保存','認識','變成','展現','非','演出','接見','成立','推出'],
    'Possession': ['夜'],
  },
}

const CAT_META: Record<string, { label: string; desc: string; color: string }> = {
  Modifies: { label: 'Modifies', desc: '修飾', color: '#60a5fa' },
  N_Modifier: { label: 'N_Modifier', desc: '名詞修飾', color: '#fb923c' },
  Subject_of: { label: 'Subject_of', desc: '主語', color: '#f472b6' },
  Object_of: { label: 'Object_of', desc: '賓語', color: '#34d399' },
  Possession: { label: 'Possession', desc: '領屬', color: '#a78bfa' },
}

function SketchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const [coocData, setCoocData] = useState<CoocItem[]>([])
  const [dictData, setDictData] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!q) return
    setLoading(true)
    setError('')
    try {
      const [coocResult, dictResult] = await Promise.allSettled([
        fetchCooc(q),
        fetchDict(q),
      ])
      if (coocResult.status === 'fulfilled') {
        const v = coocResult.value
        setCoocData(Array.isArray(v) ? v : (v?.results ?? []))
      }
      if (dictResult.status === 'fulfilled') {
        const v = dictResult.value
        setDictData('entry' in v ? v.entry : v ?? null)
      }
    } catch {
      setError('無法載入資料，請確認伺服器已啟動。')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => { loadData() }, [loadData])

  const countMap = new Map(coocData.map(c => [c.partner, c.co_count]))
  const sketchData = SKETCH_DATA_CACHE[q]

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Word Sketch
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {q ? (
                <>「<span className="font-semibold text-primary">{q}</span>」{sketchData ? '語法分類' : '共現詞列表'}</>
              ) : '輸入關鍵詞後顯示語法分類結果'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>Based on Sketch Engine methodology</span>
            <Button
              variant="default"
              size="sm"
              className="rounded-lg shadow-md"
              disabled={!q}
              asChild={!!q}
            >
              {q ? (
                <Link href={`/viz?q=${encodeURIComponent(q)}`}>
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  視覺化呈現
                </Link>
              ) : (
                <span>
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  視覺化呈現
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Dict info card */}
        {q && dictData && (
          <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-lg font-bold text-foreground">{dictData.title}</div>
                {dictData.heteronyms?.map((h, i) => (
                  <div key={i} className="mt-2">
                    {h.pinyin && (
                      <span className="text-sm text-primary font-medium mr-3">{h.pinyin}</span>
                    )}
                    {h.definitions?.slice(0, 2).map((d, j) => (
                      <span key={j} className="text-sm text-muted-foreground">
                        {j > 0 && ' | '}{d.def}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                萌典 Moedict
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {q && loading && <LoadingState />}

        {/* Error */}
        {q && error && <EmptyState title={error} />}

        {/* Skeleton grid when no keyword */}
        {!q && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Object.entries(CAT_META).map(([cat, meta]) => (
              <div key={cat} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b-2" style={{ borderBottomColor: meta.color }}>
                  <div className="font-bold text-sm" style={{ color: meta.color }}>{meta.label}</div>
                  <div className="text-xs text-muted-foreground">{meta.desc}</div>
                </div>
                <div className="space-y-1 p-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="h-4 bg-muted/20 rounded w-16" />
                      <div className="h-3 bg-muted/15 rounded w-8" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sketch Grid */}
        {q && !loading && !error && sketchData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Object.entries(sketchData).map(([cat, words]) => {
              const meta = CAT_META[cat]
              return (
                <div key={cat} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div
                    className="px-4 py-3 border-b-2"
                    style={{ borderBottomColor: meta.color }}
                  >
                    <div className="font-bold text-sm" style={{ color: meta.color }}>{meta.label}</div>
                    <div className="text-xs text-muted-foreground">{meta.desc}</div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {words.map((w, i) => (
                      <Button
                        key={w}
                        variant="ghost"
                        className="w-full flex items-center justify-between px-4 py-2.5 h-auto hover:bg-muted/50 rounded-none text-left"
                        style={{ opacity: Math.max(0.4, 1 - i * 0.07) }}
                        onClick={() => router.push(`/cooccurrence?q=${encodeURIComponent(w)}`)}
                      >
                        <span className="text-sm text-foreground font-medium">{w}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {countMap.get(w) || '-'}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Fallback: flat cooc list when no sketch data */}
        {q && !loading && !error && !sketchData && coocData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((col) => {
              const chunkSize = Math.ceil(coocData.length / 3)
              const chunk = coocData.slice(col * chunkSize, (col + 1) * chunkSize)
              return (
                <div key={col} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b-2 border-primary">
                    <div className="font-bold text-sm text-primary">共現詞 ({col + 1})</div>
                    <div className="text-xs text-muted-foreground">LogDice 排序</div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {chunk.map((w, i) => (
                      <Button
                        key={w.partner}
                        variant="ghost"
                        className="w-full flex items-center justify-between px-4 py-2.5 h-auto hover:bg-muted/50 rounded-none text-left"
                        style={{ opacity: Math.max(0.4, 1 - i * 0.04) }}
                        onClick={() => router.push(`/cooccurrence?q=${encodeURIComponent(w.partner)}`)}
                      >
                        <span className="text-sm text-foreground font-medium">{w.partner}</span>
                        <span className="text-xs text-muted-foreground font-mono">{w.co_count}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No results */}
        {q && !loading && !error && !sketchData && coocData.length === 0 && (
          <EmptyState
            title="查無共現詞資料"
            description={`關鍵詞「${q}」在資料庫中沒有共現詞。`}
          />
        )}

        {/* Data sources */}
        <DataSources />
      </div>
    </>
  )
}

export default function SketchPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SketchContent />
    </Suspense>
  )
}

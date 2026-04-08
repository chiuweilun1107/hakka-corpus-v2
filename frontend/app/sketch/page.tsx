'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ExternalLink, BarChart3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/page-layout'
import { PageSearchBar } from '@/components/page-search-bar'
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

  if (!q) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        請在上方搜尋欄輸入關鍵詞
      </div>
    )
  }

  return (
    <>
      <PageSearchBar defaultQuery={q} targetPath="/sketch" />

      <div className="container mx-auto px-4 py-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Word Sketch
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              「<span className="font-semibold text-primary">{q}</span>」
              {sketchData ? '語法分類' : '共現詞列表'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Based on Sketch Engine methodology</span>
            <Button
              variant="default"
              size="sm"
              className="rounded-lg shadow-md"
              asChild
            >
              <Link href={`/viz?q=${encodeURIComponent(q)}`}>
                <BarChart3 className="h-4 w-4 mr-1.5" />
                視覺化呈現
              </Link>
            </Button>
          </div>
        </div>

        {/* Dict info card */}
        {dictData && (
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

        {/* Sketch Grid */}
        {!loading && !error && sketchData && (
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
                      <button
                        key={w}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                        style={{ opacity: Math.max(0.4, 1 - i * 0.07) }}
                        onClick={() => router.push(`/cooccurrence?q=${encodeURIComponent(w)}`)}
                      >
                        <span className="text-sm text-foreground font-medium">{w}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {countMap.get(w) || '-'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Fallback: flat cooc list when no sketch data */}
        {!loading && !error && !sketchData && coocData.length > 0 && (
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
                      <button
                        key={w.partner}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                        style={{ opacity: Math.max(0.4, 1 - i * 0.04) }}
                        onClick={() => router.push(`/cooccurrence?q=${encodeURIComponent(w.partner)}`)}
                      >
                        <span className="text-sm text-foreground font-medium">{w.partner}</span>
                        <span className="text-xs text-muted-foreground font-mono">{w.co_count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No results */}
        {!loading && !error && !sketchData && coocData.length === 0 && (
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

export default function SketchPage() {
  return (
    <PageLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SketchContent />
      </Suspense>
    </PageLayout>
  )
}

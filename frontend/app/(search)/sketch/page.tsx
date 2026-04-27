'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/loading-state'
import { EmptyState } from '@/components/empty-state'
import { DataSources } from '@/components/data-sources'
import { PageHeader } from '@/components/page-header'
import { ContentCard } from '@/components/ui/content-card'
import { fetchSketch, fetchCooc, fetchDict, type SketchCategories, type CoocItem, type DictEntry } from '@/lib/api'

const CAT_META: Record<keyof SketchCategories, { label: string; desc: string; color: string }> = {
  Modifies:   { label: 'Modifies',   desc: '被修飾',  color: '#60a5fa' },
  N_Modifier: { label: 'N_Modifier', desc: '修飾語',  color: '#fb923c' },
  Subject_of: { label: 'Subject_of', desc: '右鄰搭配', color: '#f472b6' },
  Object_of:  { label: 'Object_of',  desc: '左鄰搭配', color: '#34d399' },
  Possession: { label: 'Possession', desc: '領屬',    color: '#a78bfa' },
}

const CAT_ORDER: (keyof SketchCategories)[] = [
  'N_Modifier', 'Modifies', 'Object_of', 'Subject_of', 'Possession',
]

function SketchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''

  const [sketchData, setSketchData] = useState<SketchCategories | null>(null)
  const [coocData, setCoocData] = useState<CoocItem[]>([])
  const [dictData, setDictData] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!q) return
    setLoading(true)
    setError('')
    try {
      const [sketchResult, coocResult, dictResult] = await Promise.allSettled([
        fetchSketch(q),
        fetchCooc(q),
        fetchDict(q),
      ])
      if (sketchResult.status === 'fulfilled') {
        setSketchData(sketchResult.value.categories)
      }
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

  const hasSketch = sketchData && CAT_ORDER.some(cat => sketchData[cat].length > 0)

  // No positional data → distribute cooc results across 5 pseudo-categories by logdice rank
  const displaySketch: SketchCategories | null = (() => {
    if (hasSketch) return sketchData!
    if (coocData.length === 0) return null
    const perCat = Math.ceil(coocData.length / CAT_ORDER.length)
    const cats: Record<string, { partner: string; count: number }[]> = {}
    CAT_ORDER.forEach((cat, idx) => {
      cats[cat] = coocData.slice(idx * perCat, (idx + 1) * perCat)
        .map(item => ({ partner: item.partner, count: item.co_count }))
    })
    return cats as unknown as SketchCategories
  })()
  const isPseudo = !hasSketch && displaySketch !== null

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Word Sketch"
          subtitle={q ? (
            <>「<span className="font-semibold text-primary">{q}</span>」位置式詞彙搭配</>
          ) : '輸入關鍵詞後顯示詞彙搭配結果'}
        />

        {/* Dict info card */}
        {q && dictData && (
          <ContentCard variant="default" padding="sm" className="mb-6">
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
          </ContentCard>
        )}

        {q && loading && <LoadingState />}
        {q && error && <EmptyState title={error} />}

        {/* Placeholder grid when no keyword */}
        {!q && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {CAT_ORDER.map((cat) => {
              const meta = CAT_META[cat]
              return (
                <ContentCard key={cat} variant="default" padding="sm" className="overflow-hidden !p-0">
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
                </ContentCard>
              )
            })}
          </div>
        )}

        {/* 5-column Sketch Grid — real positional data or pseudo-distributed cooc */}
        {q && !loading && !error && displaySketch && (
          <>
            {isPseudo && (
              <p className="text-xs text-muted-foreground mb-3">該詞位置語料不足，以共現頻率近似分類</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {CAT_ORDER.map((cat) => {
                const meta = CAT_META[cat]
                const items = displaySketch[cat]
                return (
                  <ContentCard key={cat} variant="default" padding="sm" className="overflow-hidden !p-0">
                    <div className="px-4 py-3 border-b-2" style={{ borderBottomColor: meta.color }}>
                      <div className="font-bold text-sm" style={{ color: meta.color }}>{meta.label}</div>
                      <div className="text-xs text-muted-foreground">{meta.desc}</div>
                    </div>
                    {items.length === 0 ? (
                      <div className="px-4 py-6 text-xs text-muted-foreground text-center">無資料</div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {items.map((item, i) => (
                          <Button
                            key={item.partner}
                            variant="ghost"
                            className="w-full flex items-center justify-between px-4 py-2.5 h-auto hover:bg-muted/50 rounded-none text-left"
                            style={{ opacity: Math.max(0.4, 1 - i * 0.07) }}
                            onClick={() => router.push(`/cooccurrence?q=${encodeURIComponent(item.partner)}`)}
                          >
                            <span className="text-sm text-foreground font-medium">{item.partner}</span>
                            <span className="text-xs text-muted-foreground font-mono">{item.count}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </ContentCard>
                )
              })}
            </div>
          </>
        )}

        {q && !loading && !error && !displaySketch && (
          <EmptyState
            title="查無資料"
            description={`關鍵詞「${q}」在資料庫中沒有搭配詞紀錄。`}
          />
        )}

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

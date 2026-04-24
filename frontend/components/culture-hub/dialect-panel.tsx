'use client'

import { useState, useEffect } from 'react'
import { Volume2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useExploreStore } from '@/lib/stores/explore-store'
import { DIALECTS, type Dialect } from '@/lib/types'
import { DIALECT_INFO } from '@/lib/data/dialects'
import { DIALECT_BG } from '@/lib/colors'
import { fetchDialectWords } from '@/lib/api'
import type { DialectWord } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function DialectPanel() {
  const t = useTranslations('dialectPanel')
  const { activeDialect, setActiveDialect } = useExploreStore()
  const [words, setWords] = useState<DialectWord[]>([])
  const [loading, setLoading] = useState(false)
  const [isWordsOpen, setIsWordsOpen] = useState(false)

  const currentIndex = DIALECTS.findIndex(d => d.id === activeDialect)
  const goPrev = () => {
    const idx = (currentIndex - 1 + DIALECTS.length) % DIALECTS.length
    setActiveDialect(DIALECTS[idx].id as Dialect)
  }
  const goNext = () => {
    const idx = (currentIndex + 1) % DIALECTS.length
    setActiveDialect(DIALECTS[idx].id as Dialect)
  }

  useEffect(() => {
    setIsWordsOpen(false)
    let cancelled = false
    setLoading(true)
    fetchDialectWords(activeDialect, 12)
      .then((res) => { if (!cancelled) setWords(res.items) })
      .catch(() => { if (!cancelled) setWords([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeDialect])

  return (
    <div className="pt-2">
      <Tabs value={activeDialect} onValueChange={(v) => setActiveDialect(v as Dialect)}>
        <div className="flex items-center gap-1 border-b border-border/30 mb-5">
          <button
            onClick={goPrev}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Previous dialect"
          >
            <ChevronLeft size={15} />
          </button>
          <TabsList className="flex-1 flex h-auto bg-transparent p-0 gap-3 rounded-none justify-center overflow-hidden">
            {DIALECTS.map((d) => (
              <TabsTrigger
                key={d.id}
                value={d.id}
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-1 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground transition-colors"
              >
                {d.name.replace('腔', '')}
              </TabsTrigger>
            ))}
          </TabsList>
          <button
            onClick={goNext}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Next dialect"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {DIALECTS.map((d) => {
          const info = DIALECT_INFO[d.id]
          return (
            <TabsContent key={d.id} value={d.id}>
              <div className="grid grid-cols-1 gap-4">
                {/* 腔調簡介（扁平化，無邊框） */}
                <div className="rounded-2xl bg-muted/30 p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${DIALECT_BG[d.id]}`} />
                    <h3 className="font-bold text-base">{d.name}</h3>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">{info.intro}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.mainRegions.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[11px] font-normal">{r}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">{info.historyNote}</p>
                  <div className="flex items-baseline gap-1.5 pt-2 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground/60 tracking-widest uppercase">{t('population')}</span>
                    <span className="text-sm font-semibold text-foreground">{info.populationEst.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground/60">{t('populationUnit')}</span>
                  </div>
                </div>

                {/* 代表詞彙 */}
                <div>
                  {/* Mobile: accordion toggle */}
                  <button
                    type="button"
                    onClick={() => setIsWordsOpen(v => !v)}
                    className="md:hidden w-full flex items-center justify-between mb-3 py-1"
                  >
                    <p className="text-[11px] font-medium text-muted-foreground/50 tracking-widest uppercase">
                      {t('representativeWords')}
                    </p>
                    <ChevronDown
                      size={14}
                      className={cn('text-muted-foreground/40 transition-transform duration-200', isWordsOpen && 'rotate-180')}
                    />
                  </button>
                  {/* Desktop: always visible label */}
                  <p className="hidden md:block text-[11px] font-medium text-muted-foreground/50 tracking-widest uppercase mb-3">
                    {t('representativeWords')}
                  </p>
                  <div className={cn('md:block', isWordsOpen ? 'block' : 'hidden')}>
                  {loading ? (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : words.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('noData')}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {words.map((w) => (
                        <div
                          key={w.word}
                          className="group rounded-xl bg-muted/20 hover:bg-muted/50 transition-colors p-3 flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold truncate">{w.word}</div>
                            <div className="text-xs text-primary/80 font-mono truncate">{w.pinyin_full}</div>
                            {w.definition && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-snug">{w.definition}</div>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="shrink-0 h-7 w-7 text-muted-foreground/40 hover:text-primary"
                            title={t('readAloud', { word: w.word })}
                            onClick={() => {
                              const audio = new Audio(`/api/v1/tts?text=${encodeURIComponent(w.word)}`)
                              audio.play().catch(() => {})
                            }}
                          >
                            <Volume2 size={13} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

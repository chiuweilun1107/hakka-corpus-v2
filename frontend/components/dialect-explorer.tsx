'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TtsButton } from '@/components/ui/tts-button'
import { useExploreStore } from '@/lib/stores/explore-store'
import { DIALECTS, type Dialect } from '@/lib/types'
import { DIALECT_INFO } from '@/lib/data/dialects'
import { DIALECT_BG } from '@/lib/colors'
import { fetchDialectWords } from '@/lib/api'
import type { DialectWord } from '@/lib/api'

export function DialectExplorer() {
  const t = useTranslations('dialectExplorer')
  const tWord = useTranslations('wordOfDay')
  const locale = useLocale()
  const { activeDialect, setActiveDialect } = useExploreStore()
  const [words, setWords] = useState<DialectWord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchDialectWords(activeDialect, 12)
      .then((res) => { if (!cancelled) setWords(res.items) })
      .catch(() => { if (!cancelled) setWords([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeDialect])

  return (
    <section id="dialect-explorer" className="py-12 bg-muted/20 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        <Tabs value={activeDialect} onValueChange={(v) => setActiveDialect(v as Dialect)}>
          <TabsList className="grid grid-cols-6 w-full max-w-2xl mx-auto mb-8">
            {DIALECTS.map((d) => (
              <TabsTrigger key={d.id} value={d.id} className="text-xs md:text-sm">
                {locale === 'en' ? d.nameEn : d.name.replace('腔', '')}
              </TabsTrigger>
            ))}
          </TabsList>

          {DIALECTS.map((d) => {
            const info = DIALECT_INFO[d.id]
            return (
              <TabsContent key={d.id} value={d.id}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 腔調簡介 */}
                  <Card className="lg:col-span-1">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${DIALECT_BG[d.id]}`} />
                        <h3 className="font-bold text-lg">{locale === 'en' ? d.nameEn : d.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{info.intro}</p>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {info.mainRegions.map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground/70 leading-relaxed">{info.historyNote}</p>
                      </div>
                      <div className="text-xs text-muted-foreground border-t pt-3">
                        {t('populationEst', { n: info.populationEst.toLocaleString() })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 代表詞網格 */}
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground">{t('representativeWords')}</h4>
                    {loading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : words.length === 0 ? (
                      <p className="text-muted-foreground text-sm">{t('noData')}</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {words.map((w) => (
                          <Card key={w.word} className="group cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-bold truncate">{w.word}</div>
                                <div className="text-xs text-primary/80 font-mono truncate">{w.pinyin_full}</div>
                                {w.definition && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{w.definition}</div>
                                )}
                              </div>
                              <TtsButton
                                text={w.word}
                                size="sm"
                                variant="ghost"
                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                                title={tWord('readAloud', { word: w.word })}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </section>
  )
}

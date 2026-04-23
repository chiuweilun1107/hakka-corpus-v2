'use client'

import { useState, useEffect } from 'react'
import { Volume2, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchWordOfDay, fetchRandomDict } from '@/lib/api'
import type { WordOfDayData } from '@/lib/api'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import { useTranslations } from 'next-intl'
import { HakkaLabel } from '@/components/ui/hakka-label'

// 腔調 DB label → 顯示名稱對照
const DIALECT_LABEL_MAP: Record<string, string> = {
  四縣: '四縣',
  南四縣: '四海',
  海陸: '海陸',
  大埔: '大埔',
  饒平: '饒平',
  詔安: '詔安',
}

export function WordOfDay() {
  const t = useTranslations('wordOfDay')
  const [data, setData] = useState<WordOfDayData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRandom, setIsRandom] = useState(false)

  const loadToday = async () => {
    setLoading(true)
    try {
      const d = await fetchWordOfDay()
      setData(d)
      setIsRandom(false)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const loadRandom = async () => {
    setLoading(true)
    try {
      const entry = await fetchRandomDict()
      // random endpoint 只回傳 DictEntry，構造 WordOfDayData 結構
      setData({ entry, pinyin_by_dialect: [], cooc_words: [], related_proverbs: [] })
      setIsRandom(true)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadToday()
  }, [])

  if (!data && !loading) return null

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold"><HakkaLabel text={t('title')} /></h2>
          <p className="text-muted-foreground mt-2">
            {isRandom ? t('subtitleRandom') : t('subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 主題詞 + 操作 */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <h3 className="text-5xl md:text-7xl font-bold text-primary">{data.entry.title}</h3>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full h-12 w-12"
                  title={t('readAloud', { word: data.entry.title })}
                  onClick={() => {
                    const audio = new Audio(
                      `/api/v1/tts?text=${encodeURIComponent(data.entry.title)}`
                    )
                    audio.play().catch(() => {})
                  }}
                >
                  <Volume2 size={20} />
                </Button>
              </div>

              {/* 六腔拼音對照 */}
              {data.pinyin_by_dialect.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {data.pinyin_by_dialect.map((p) => (
                    <div
                      key={p.dialect}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: DIALECT_CHART_COLORS[p.dialect] ?? '#999' }}
                      />
                      <span className="text-xs text-muted-foreground">{DIALECT_LABEL_MAP[p.dialect] ?? p.dialect}</span>
                      <span className="text-sm font-mono text-primary">{p.pinyin_full}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 共現詞標籤雲 */}
              {data.cooc_words.length > 0 && (
                <Card>
                  <CardContent className="pt-5">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">{t('coocWords')}</h4>
                    <div className="flex flex-wrap gap-2 items-baseline">
                      {data.cooc_words.map((c) => {
                        // logdice 越高字越大：最大 1.2rem，最小 0.7rem
                        const maxLogdice = data.cooc_words[0]?.logdice ?? 1
                        const ratio = maxLogdice > 0 ? c.logdice / maxLogdice : 0.5
                        const fontSize = 0.7 + ratio * 0.5
                        return (
                          <a
                            key={c.partner}
                            href={`/sketch?q=${encodeURIComponent(c.partner)}`}
                            className="text-foreground/80 hover:text-primary transition-colors"
                            style={{ fontSize: `${fontSize}rem` }}
                          >
                            {c.partner}
                          </a>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 相關諺語 */}
              {data.related_proverbs.length > 0 && (
                <Card>
                  <CardContent className="pt-5 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">{t('relatedProverbs')}</h4>
                    {data.related_proverbs.map((p, i) => (
                      <div key={i} className="space-y-1">
                        <div className="font-medium">{p.title}</div>
                        {p.definition && (
                          <div className="text-sm text-muted-foreground">{p.definition}</div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 操作列 */}
            <div className="flex flex-wrap justify-center gap-3">
              {!isRandom && (
                <Button variant="outline" onClick={loadRandom} className="rounded-full gap-2">
                  <RefreshCw size={15} /> <HakkaLabel text={t('randomBtn')} />
                </Button>
              )}
              {isRandom && (
                <Button variant="outline" onClick={loadToday} className="rounded-full gap-2">
                  <HakkaLabel text={t('todayBtn')} />
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-full gap-2"
                onClick={() => {
                  window.location.href = `/sketch?q=${encodeURIComponent(data.entry.title)}`
                }}
              >
                <ExternalLink size={15} /> {t('deepSearch')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

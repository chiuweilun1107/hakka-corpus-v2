'use client'

import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchRandomDict, fetchRandomProverb, fetchRandomCoocPair } from '@/lib/api'
import type { DictEntry, ProverbItem, CoocPairItem } from '@/lib/api'

type ResultMode = 'word' | 'proverb' | 'cooc'
type ResultData = DictEntry | ProverbItem | CoocPairItem

export function RandomExplore() {
  const t = useTranslations('randomExplore')
  const [mode, setMode] = useState<ResultMode | null>(null)
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchResult = async (m: ResultMode) => {
    setLoading(true)
    setMode(m)
    setResult(null)
    try {
      if (m === 'word') setResult(await fetchRandomDict())
      else if (m === 'proverb') setResult(await fetchRandomProverb())
      else setResult(await fetchRandomCoocPair())
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-10 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center justify-center gap-2">
            <Shuffle size={20} className="text-primary" />
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Button
            variant={mode === 'word' ? 'default' : 'outline'}
            onClick={() => fetchResult('word')}
            disabled={loading}
            className="rounded-full gap-2"
          >
            {t('randomWord')}
          </Button>
          <Button
            variant={mode === 'proverb' ? 'default' : 'outline'}
            onClick={() => fetchResult('proverb')}
            disabled={loading}
            className="rounded-full gap-2"
          >
            {t('randomProverb')}
          </Button>
          <Button
            variant={mode === 'cooc' ? 'default' : 'outline'}
            onClick={() => fetchResult('cooc')}
            disabled={loading}
            className="rounded-full gap-2"
          >
            {t('randomCooc')}
          </Button>
        </div>

        {loading && (
          <div className="max-w-md mx-auto h-24 rounded-xl bg-muted animate-pulse" />
        )}

        {!loading && result && mode === 'word' && (
          <ResultCard>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold">{(result as DictEntry).title}</span>
              <Badge variant="secondary">{t('dictEntry')}</Badge>
            </div>
            <Button
              size="sm"
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => { window.location.href = `/cooccurrence?q=${encodeURIComponent((result as DictEntry).title)}` }}
            >
              {t('viewFull')}
            </Button>
          </ResultCard>
        )}

        {!loading && result && mode === 'proverb' && (
          <ResultCard>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-lg font-bold">{(result as ProverbItem).title}</span>
                {(result as ProverbItem).dialect && (
                  <Badge variant="outline" className="text-xs">{(result as ProverbItem).dialect}</Badge>
                )}
                {(result as ProverbItem).category && (
                  <Badge variant="secondary" className="text-xs">{(result as ProverbItem).category}</Badge>
                )}
              </div>
              {(result as ProverbItem).pinyin && (
                <p className="text-sm text-primary font-mono">{(result as ProverbItem).pinyin}</p>
              )}
              {(result as ProverbItem).definition && (
                <p className="text-sm text-muted-foreground">{(result as ProverbItem).definition}</p>
              )}
            </div>
          </ResultCard>
        )}

        {!loading && result && mode === 'cooc' && (
          <ResultCard>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <div className="text-2xl font-bold">{(result as CoocPairItem).word}</div>
                <div className="text-xs text-muted-foreground">{t('word')}</div>
              </div>
              <div className="text-muted-foreground text-2xl">↔</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{(result as CoocPairItem).partner}</div>
                <div className="text-xs text-muted-foreground">{t('coword')}</div>
              </div>
              <div className="ml-auto space-y-1 text-right text-xs text-muted-foreground">
                <div>LogDice: <span className="font-mono">{(result as CoocPairItem).logdice.toFixed(2)}</span></div>
                <div>{t('coocCount')}: <span className="font-mono">{(result as CoocPairItem).co_count}</span></div>
              </div>
            </div>
          </ResultCard>
        )}
      </div>
    </section>
  )
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-primary/20">
        <CardContent className="pt-5">{children}</CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { fetchDailyQuote } from '@/lib/api'
import type { WordOfDayData, DailyQuoteData } from '@/lib/api'

interface Props {
  data: WordOfDayData | null
  fallbackQuote: DailyQuoteData | null
  onLoadFallback: () => void
}

export function ContextPanel({ data, fallbackQuote, onLoadFallback }: Props) {
  const tWord = useTranslations('wordOfDay')
  const tQuote = useTranslations('dailyQuote')
  const coocWords = data?.cooc_words ?? []
  const proverbs = data?.related_proverbs ?? []
  const hasProverbs = proverbs.length > 0
  const hasCooc = coocWords.length > 0

  if (!hasCooc && !hasProverbs && !fallbackQuote) return null

  const maxLogdice = coocWords[0]?.logdice ?? 1

  return (
    <div className="border-t border-dashed border-border/50 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 共現詞 tag cloud */}
        {hasCooc && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3">
              {tWord('coocWordsOf', { word: data!.entry.title })}
            </h4>
            <div className="flex flex-wrap gap-2 items-baseline min-h-[4rem]">
              {coocWords.map((c) => {
                const ratio = maxLogdice > 0 ? c.logdice / maxLogdice : 0.5
                const fontSize = 0.7 + ratio * 0.5
                return (
                  <a
                    key={c.partner}
                    href={`/cooccurrence?q=${encodeURIComponent(c.partner)}`}
                    className="text-foreground/80 hover:text-primary transition-colors"
                    style={{ fontSize: `${fontSize}rem` }}
                  >
                    {c.partner}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* 諺語 / fallback 每日一句 */}
        <div>
          {hasProverbs ? (
            <>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">{tWord('relatedProverbs')}</h4>
              <div className="space-y-3">
                {proverbs.map((p, i) => (
                  <div key={i} className="space-y-1 border-l-2 border-primary/20 pl-3">
                    <div className="font-medium text-sm">{p.title}</div>
                    {p.definition && (
                      <div className="text-xs text-muted-foreground">{p.definition}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : fallbackQuote ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-muted-foreground">{tQuote('dailyQuoteTitle')}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1 text-muted-foreground"
                  onClick={onLoadFallback}
                >
                  <RefreshCw size={11} /> {tQuote('refreshQuote')}
                </Button>
              </div>
              <div className="space-y-2 border-l-2 border-primary/20 pl-3">
                <div className="font-medium">{fallbackQuote.title}</div>
                {fallbackQuote.pinyin && (
                  <div className="text-sm font-mono text-primary">{fallbackQuote.pinyin}</div>
                )}
                <div className="text-sm text-muted-foreground">{fallbackQuote.definition}</div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

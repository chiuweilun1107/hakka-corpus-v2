'use client'

import { useTranslations } from 'next-intl'
import { RefreshButton } from '@/components/ui/refresh-button'
import { CoocWordCloud } from '@/components/ui/cooc-word-cloud'
import { PinyinText } from '@/components/ui/pinyin-text'
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

  return (
    <div className="border-t border-dashed border-border/50 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 共現詞 tag cloud */}
        {hasCooc && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3">
              {tWord('coocWordsOf', { word: data!.entry.title })}
            </h4>
            <CoocWordCloud items={coocWords} className="min-h-[4rem] justify-start" />
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
                <RefreshButton
                  onClick={onLoadFallback}
                  size="sm"
                  title={tQuote('refreshQuote')}
                />
              </div>
              <div className="space-y-2 border-l-2 border-primary/20 pl-3">
                <div className="font-medium">{fallbackQuote.title}</div>
                {fallbackQuote.pinyin && (
                  <PinyinText value={fallbackQuote.pinyin} size="sm" />
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

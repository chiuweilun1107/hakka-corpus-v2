'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { RefreshButton } from '@/components/ui/refresh-button'
import { TtsButton } from '@/components/ui/tts-button'
import { fetchDailyQuote } from '@/lib/api'
import type { DailyQuoteData } from '@/lib/api'

export function DailyQuote() {
  const t = useTranslations('dailyQuote')
  const [quote, setQuote] = useState<DailyQuoteData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const loadQuote = useCallback(async () => {
    setIsRefreshing(true)
    setError(false)
    try {
      const data = await fetchDailyQuote()
      setQuote(data)
    } catch {
      setError(true)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadQuote()
  }, [loadQuote])

  if (error && !quote) {
    return (
      <section className="py-14 bg-muted/30 border-y border-border relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <p className="text-muted-foreground">{t('errorLoad')}</p>
            <RefreshButton
              onClick={loadQuote}
              loading={isRefreshing}
              size="md"
              title={t('reload')}
            />
          </div>
        </div>
      </section>
    )
  }

  if (!quote) return null

  return (
    <section className="py-14 bg-muted/30 border-y border-border relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[180px] font-serif font-black text-primary/5 leading-none select-none">"</div>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto relative text-center">

          <div className="space-y-5">
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary px-4 py-1">
              {quote.dialect}
            </Badge>

            <h2 className="text-2xl md:text-4xl font-serif font-bold text-foreground leading-tight px-4">
              {quote.title}
            </h2>

            <div className="space-y-2">
              {quote.pinyin && (
                <p className="text-xl text-primary font-medium font-mono">{quote.pinyin}</p>
              )}
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{quote.definition}</p>
              {quote.example && (
                <p className="text-muted-foreground/70 text-base max-w-2xl mx-auto italic">
                  {quote.example}
                </p>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <RefreshButton
                onClick={loadQuote}
                loading={isRefreshing}
                size="md"
                title={t('refreshQuote')}
              />
              <TtsButton
                text={quote.title}
                size="md"
                variant="ghost"
                title={t('listen')}
                className="rounded-full px-6 shadow-lg shadow-primary/20"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

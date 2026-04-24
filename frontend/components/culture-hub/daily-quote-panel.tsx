'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshButton } from '@/components/ui/refresh-button'
import { TtsButton } from '@/components/ui/tts-button'
import { DialectPinyinSwitcher } from '@/components/ui/dialect-pinyin-switcher'
import { fetchRandomProverb, fetchProverbPinyinByDialect, fetchCertifiedVocabBatch } from '@/lib/api'
import type { ProverbItem, PinyinByDialect } from '@/lib/api'
import { useExploreStore } from '@/lib/stores/explore-store'
import { DB_LABEL_TO_DIALECT } from '@/lib/dialect'
import { useTranslations } from 'next-intl'
import { CertifiedBadge, GradeBadge } from '@/components/ui/grade-badge'
import { GRADE_ORDER, CJK_REGEX } from '@/lib/text'

export function DailyQuotePanel() {
  const t = useTranslations('dailyQuote')
  const { activeDialect, setActiveDialect } = useExploreStore()
  const [quote, setQuote] = useState<ProverbItem | null>(null)
  const [pinyinByDialect, setPinyinByDialect] = useState<PinyinByDialect[]>([])
  const [loading, setLoading] = useState(false)
  const [gradeMap, setGradeMap] = useState<Record<string, string | null>>({})
  const [highestGrade, setHighestGrade] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = await fetchRandomProverb()
      setQuote(q)
      setPinyinByDialect([])
      try {
        const multi = await fetchProverbPinyinByDialect(q.id)
        setPinyinByDialect(multi)
      } catch {
        setPinyinByDialect([])
      }
    } catch {
      setQuote(null)
      setPinyinByDialect([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!quote) return
    const chars = [...quote.title].filter(c => CJK_REGEX.test(c))
    if (chars.length === 0) return
    const dialectLabel = Object.keys(DB_LABEL_TO_DIALECT).find(k => DB_LABEL_TO_DIALECT[k] === activeDialect)
    fetchCertifiedVocabBatch(chars, dialectLabel)
      .then(results => {
        const map: Record<string, string | null> = {}
        let top: string | null = null
        results.forEach(r => {
          map[r.word] = r.grade
          if (r.grade) {
            const idx = GRADE_ORDER.indexOf(r.grade as typeof GRADE_ORDER[number])
            const topIdx = top ? GRADE_ORDER.indexOf(top as typeof GRADE_ORDER[number]) : 999
            if (idx !== -1 && idx < topIdx) top = r.grade
          }
        })
        setGradeMap(map)
        setHighestGrade(top)
      })
      .catch(() => {})
  }, [quote, activeDialect])

  if (loading && !quote) {
    return (
      <div className="py-8 space-y-3 max-w-xl mx-auto">
        <div className="h-10 w-3/4 mx-auto rounded bg-muted animate-pulse" />
        <div className="h-5 w-1/2 mx-auto rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {t('loadFailed')}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden py-2 space-y-4">
      {/* 引號水印 */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 text-[160px] font-serif font-black text-primary/5 leading-none select-none"
      >
        &quot;
      </div>

      {/* 認證分級 badges */}
      {Object.keys(gradeMap).length > 0 && (
        <div className="flex justify-center gap-1.5 flex-wrap">
          <CertifiedBadge />
          {highestGrade && <GradeBadge grade={highestGrade} />}
        </div>
      )}

      {/* 主諺語 + 右側垂直 icon buttons */}
      <div className="relative flex justify-center">
        <div className="relative px-14">
          <Link
            href={`/examples/${quote.id}`}
            className="block text-2xl md:text-4xl font-serif font-bold text-foreground leading-tight text-center hover:text-primary transition-colors hover:underline decoration-primary/40 underline-offset-4"
          >
            {quote.title}
          </Link>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            <TtsButton
              text={quote.title}
              size="sm"
              variant="ghost"
              title={t('readAloud', { text: quote.title })}
            />
            <RefreshButton
              onClick={load}
              loading={loading}
              title={t('refreshQuote')}
            />
          </div>
        </div>
      </div>

      {/* 腔調 pills + 拼音（對齊 ThemeWordHero） */}
      <DialectPinyinSwitcher
        pinyinByDialect={pinyinByDialect}
        activeDialect={activeDialect}
        onSelect={setActiveDialect}
        size="md"
        emptyHint={t('selectDialect')}
      />

      {/* Fallback：若多腔合成失敗，回退至單腔 pinyin */}
      {pinyinByDialect.length === 0 && quote.pinyin && (
        <p className="relative text-center text-base text-primary/80 font-mono tracking-widest">
          {quote.pinyin}
        </p>
      )}

      {/* 定義 / 例句 */}
      <div className="relative text-center space-y-1.5 max-w-xl mx-auto px-6">
        {quote.definition && (
          <p className="text-sm text-muted-foreground leading-relaxed">{quote.definition}</p>
        )}
        {quote.example && (
          <p className="text-xs text-muted-foreground/60 italic leading-relaxed">{quote.example}</p>
        )}
      </div>
    </div>
  )
}

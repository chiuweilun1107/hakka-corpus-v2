'use client'

import { useCallback, useEffect, useState } from 'react'
import { Volume2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DialectPillGroup } from '@/components/ui/dialect-pill'
import { fetchRandomProverb, fetchProverbPinyinByDialect, fetchCertifiedVocabBatch } from '@/lib/api'
import type { ProverbItem, PinyinByDialect } from '@/lib/api'
import { useExploreStore } from '@/lib/stores/explore-store'
import { cn } from '@/lib/utils'
import type { Dialect } from '@/lib/types'
import { useTranslations } from 'next-intl'
import { CertifiedBadge, GradeBadge } from '@/components/ui/grade-badge'

const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian',
  '南四縣': 'sihai',
  '海陸': 'hailu',
  '大埔': 'dapu',
  '饒平': 'raoping',
  '詔安': 'zhaoan',
}

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
    const chars = [...quote.title].filter(c => /[一-鿿]/.test(c))
    if (chars.length === 0) return
    const dialectLabel = Object.keys(DB_LABEL_TO_DIALECT).find(k => DB_LABEL_TO_DIALECT[k] === activeDialect)
    fetchCertifiedVocabBatch(chars, dialectLabel)
      .then(results => {
        const map: Record<string, string | null> = {}
        const GRADE_ORDER = ['高級', '中高級', '中級', '初級', '基礎級']
        let top: string | null = null
        results.forEach(r => {
          map[r.word] = r.grade
          if (r.grade) {
            const idx = GRADE_ORDER.indexOf(r.grade)
            const topIdx = top ? GRADE_ORDER.indexOf(top) : 999
            if (idx < topIdx) top = r.grade
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

  // 去重：同一腔調只取第一筆
  const uniqueDialects = Array.from(
    new Map(pinyinByDialect.map((p) => [p.dialect, p])).values()
  )

  const activePinyin = uniqueDialects.find(
    (p) => DB_LABEL_TO_DIALECT[p.dialect] === activeDialect
  )

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
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t('readAloud', { text: quote.title })}
              onClick={() => {
                new Audio(`/api/v1/tts?text=${encodeURIComponent(quote.title)}`).play().catch(() => {})
              }}
            >
              <Volume2 size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
              title={t('refreshQuote')}
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </div>

      {/* 腔調 pills + 拼音（對齊 ThemeWordHero） */}
      {uniqueDialects.length > 0 && (
        <div className="relative space-y-2">
          <DialectPillGroup
            dialects={uniqueDialects.map(p => p.dialect)}
            activeDialect={activeDialect}
            onSelect={setActiveDialect}
          />
          <div className="flex items-baseline justify-center gap-3">
            {activePinyin ? (
              <span className="text-sm md:text-base font-mono text-primary/80 tracking-wider break-all max-w-3xl">
                {activePinyin.pinyin_full}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">{t('selectDialect')}</span>
            )}
          </div>
        </div>
      )}

      {/* Fallback：若多腔合成失敗，回退至單腔 pinyin */}
      {uniqueDialects.length === 0 && quote.pinyin && (
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

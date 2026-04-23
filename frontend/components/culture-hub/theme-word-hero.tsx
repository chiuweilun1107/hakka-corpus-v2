'use client'

import { Volume2, RefreshCw, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useExploreStore } from '@/lib/stores/explore-store'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import type { WordOfDayData } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Dialect } from '@/lib/types'

const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian',
  '南四縣': 'sihai',
  '海陸': 'hailu',
  '大埔': 'dapu',
  '饒平': 'raoping',
  '詔安': 'zhaoan',
}

const DB_LABEL_DISPLAY: Record<string, string> = {
  '四縣': '四縣',
  '南四縣': '四海',
  '海陸': '海陸',
  '大埔': '大埔',
  '饒平': '饒平',
  '詔安': '詔安',
}

interface Props {
  data: WordOfDayData | null
  loading: boolean
  onRefresh: () => void
}

export function ThemeWordHero({ data, loading, onRefresh }: Props) {
  const t = useTranslations('wordOfDay')
  const tQuote = useTranslations('dailyQuote')
  const { activeDialect, setActiveDialect } = useExploreStore()

  // 去重：同一腔調可能有多筆拼音紀錄（例：「墊」有 17 筆），僅取第一筆作為 pill 代表
  const uniqueDialects = data
    ? Array.from(
        new Map(data.pinyin_by_dialect.map(p => [p.dialect, p])).values()
      )
    : []

  const activePinyin = uniqueDialects.find(
    p => DB_LABEL_TO_DIALECT[p.dialect] === activeDialect
  )

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-20 w-40 mx-auto rounded-xl bg-muted animate-pulse" />
        <div className="h-6 w-64 mx-auto rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const coocWords = data.cooc_words
  const proverbs = data.related_proverbs
  const maxLogdice = coocWords[0]?.logdice ?? 1

  // 詞的第一條定義（供「今日選詞」標示詞義）
  const primaryDef = data.entry.heteronyms?.[0]?.definitions?.[0]

  return (
    <div className="py-2 space-y-4">
      {/* 主題詞（真正置中，按鈕絕對定位不影響對齊） */}
      <div className="flex justify-center">
        <div className="relative px-14">
          <h3 className="text-6xl md:text-8xl font-bold text-primary tracking-tight leading-none">
            {data.entry.title}
          </h3>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            <Button
              size="icon" variant="ghost"
              className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t('readAloud', { word: data.entry.title })}
              onClick={() => {
                new Audio(`/api/v1/tts?text=${encodeURIComponent(data.entry.title)}`).play().catch(() => {})
              }}
            >
              <Volume2 size={14} />
            </Button>
            <Button
              size="icon" variant="ghost"
              className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t('randomBtn')} onClick={onRefresh}
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* 腔調選擇列 + 拼音 + 查詢連結（同一視覺群組） */}
      <div className="space-y-2">
        {uniqueDialects.length > 0 && (
          <div className="flex justify-center gap-1.5 flex-wrap">
            {uniqueDialects.map((p) => {
              const dialectCode = DB_LABEL_TO_DIALECT[p.dialect]
              const isActive = dialectCode === activeDialect
              return (
                <button
                  key={p.dialect}
                  onClick={() => dialectCode && setActiveDialect(dialectCode)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  style={isActive ? { backgroundColor: DIALECT_CHART_COLORS[p.dialect] ?? '#666' } : undefined}
                >
                  <span
                    className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isActive ? 'bg-white/70' : '')}
                    style={!isActive ? { backgroundColor: DIALECT_CHART_COLORS[p.dialect] ?? '#999' } : undefined}
                  />
                  {DB_LABEL_DISPLAY[p.dialect] ?? p.dialect}
                </button>
              )
            })}
          </div>
        )}

        {/* 拼音 + 深入查詢（同行，查詢為次要輔助連結） */}
        <div className="flex items-baseline justify-center gap-3">
          {uniqueDialects.length > 0 ? (
            activePinyin ? (
              <span className="text-xl font-mono text-primary/80 tracking-widest">
                {activePinyin.pinyin_full}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">{tQuote('selectDialect')}</span>
            )
          ) : null}
          <a
            href={`/sketch?q=${encodeURIComponent(data.entry.title)}`}
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-primary transition-colors"
          >
            <ExternalLink size={10} />
            {t('deepSearch')}
          </a>
        </div>
      </div>

      {/* 詞義（詞性 + 釋義，一行精簡） */}
      {primaryDef && (
        <div className="flex items-start justify-center gap-2 max-w-xl mx-auto text-center">
          {primaryDef.type && (
            <span className="shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
              {primaryDef.type}
            </span>
          )}
          <p className="text-sm text-foreground/70 leading-relaxed text-left">
            {primaryDef.def}
          </p>
        </div>
      )}

      {/* 共現詞 */}
      {coocWords.length > 0 && (
        <div className="pt-1">
          <p className="text-center text-[11px] font-medium text-muted-foreground/50 tracking-widest uppercase mb-2">
            {t('coocWords')}
          </p>
          <div className="flex flex-wrap gap-2 items-baseline justify-center">
            {coocWords.map((c) => {
              const ratio = maxLogdice > 0 ? c.logdice / maxLogdice : 0.5
              const fontSize = 0.7 + ratio * 0.5
              return (
                <a
                  key={c.partner}
                  href={`/sketch?q=${encodeURIComponent(c.partner)}`}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  style={{ fontSize: `${fontSize}rem` }}
                >
                  {c.partner}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* 諺語區：相關諺語優先（標題明示關聯），無則顯示每日諺語（標題明示獨立） */}
      {proverbs.length > 0 ? (
        <div className="relative overflow-hidden pt-2 pb-4">
          <div aria-hidden className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[120px] font-serif font-black text-primary/5 leading-none select-none">"</div>
          <p className="relative text-center text-[11px] font-medium text-muted-foreground/50 tracking-widest uppercase mb-3">
            {t('relatedProverbsOf', { word: data.entry.title })}
          </p>
          <div className="relative space-y-4 text-center max-w-xl mx-auto">
            {proverbs.map((p, i) => (
              <div key={i} className={cn('space-y-1.5', i > 0 && 'pt-4 border-t border-border/30')}>
                <p className="text-xl md:text-2xl font-serif font-bold text-foreground leading-snug">{p.title}</p>
                {p.pinyin && (
                  <p className="text-sm text-primary/80 font-mono">{p.pinyin}</p>
                )}
                {p.definition && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.definition}</p>
                )}
                {p.example && (
                  <p className="text-xs text-muted-foreground/60 italic leading-relaxed">{p.example}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

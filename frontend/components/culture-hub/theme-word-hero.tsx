'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { TtsButton } from '@/components/ui/tts-button'
import { RefreshButton } from '@/components/ui/refresh-button'
import { DialectPinyinSwitcher } from '@/components/ui/dialect-pinyin-switcher'
import { CoocWordCloud } from '@/components/ui/cooc-word-cloud'
import { useExploreStore } from '@/lib/stores/explore-store'
import type { WordOfDayData } from '@/lib/api'
import { cn } from '@/lib/utils'

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

  // 詞的第一條定義（供「今日選詞」標示詞義）
  const primaryDef = data.entry.heteronyms?.[0]?.definitions?.[0]

  return (
    <div className="py-2 space-y-4">
      {/* 主題詞（真正置中，按鈕絕對定位不影響對齊） */}
      <div className="flex justify-center">
        <div className="relative px-14">
          <Link
            href={`/cooccurrence?q=${encodeURIComponent(data.entry.title)}`}
            className="block text-6xl md:text-8xl font-bold text-primary tracking-tight leading-none hover:underline decoration-primary/40 underline-offset-8 transition-colors"
          >
            {data.entry.title}
          </Link>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            <TtsButton
              text={data.entry.title}
              size="sm"
              variant="ghost"
              title={t('readAloud', { word: data.entry.title })}
            />
            <RefreshButton
              onClick={onRefresh}
              title={t('randomBtn')}
            />
          </div>
        </div>
      </div>

      {/* 腔調選擇列 + 拼音 + 查詢連結（同一視覺群組） */}
      <DialectPinyinSwitcher
        pinyinByDialect={uniqueDialects}
        activeDialect={activeDialect}
        onSelect={setActiveDialect}
        size="md"
        emptyHint={tQuote('selectDialect')}
      />

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
          <CoocWordCloud items={coocWords} />
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

'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, Volume2 } from 'lucide-react'
import { fetchWordOfDay } from '@/lib/api'
import type { WordOfDayData } from '@/lib/api'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import { useExploreStore } from '@/lib/stores/explore-store'
import { cn } from '@/lib/utils'
import type { Dialect } from '@/lib/types'
import { useTranslations } from 'next-intl'

const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian', '南四縣': 'sihai', '海陸': 'hailu',
  '大埔': 'dapu', '饒平': 'raoping', '詔安': 'zhaoan',
}
const DB_LABEL_DISPLAY: Record<string, string> = {
  '四縣': '四縣', '南四縣': '四海', '海陸': '海陸',
  '大埔': '大埔', '饒平': '饒平', '詔安': '詔安',
}

export function HeroWordCard() {
  const t = useTranslations('wordOfDay')
  const { activeDialect, setActiveDialect } = useExploreStore()
  const [data, setData] = useState<WordOfDayData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = (random = false) => {
    setLoading(true)
    fetchWordOfDay(random ? { random: true } : undefined)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const uniqueDialects = data
    ? Array.from(new Map(data.pinyin_by_dialect.map(p => [p.dialect, p])).values())
    : []

  const activePinyin = uniqueDialects.find(
    p => DB_LABEL_TO_DIALECT[p.dialect] === activeDialect
  )

  const primaryDef = data?.entry.heteronyms?.[0]?.definitions?.[0]

  return (
    <div className="relative rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[11px] font-semibold text-white/50 tracking-widest uppercase">
          {t('title')}
        </span>
        <div className="flex gap-1">
          {data && (
            <button
              onClick={() => {
                new Audio(`/api/v1/tts?text=${encodeURIComponent(data.entry.title)}`).play().catch(() => {})
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title={t('readAloud', { word: data?.entry.title ?? '' })}
            >
              <Volume2 size={13} />
            </button>
          )}
          <button
            onClick={() => load(true)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title={t('randomBtn')}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-32 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-4 w-48 rounded bg-white/10 animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 w-10 rounded-full bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      ) : !data ? null : (
        <div className="flex-1 flex flex-col gap-4">
          {/* Big word */}
          <div className="text-center">
            <h2 className="text-6xl xl:text-7xl font-bold text-white tracking-tight leading-none">
              {data.entry.title}
            </h2>
          </div>

          {/* Dialect pills */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {uniqueDialects.map((p) => {
              const code = DB_LABEL_TO_DIALECT[p.dialect]
              const isActive = code === activeDialect
              return (
                <button
                  key={p.dialect}
                  onClick={() => code && setActiveDialect(code)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
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

          {/* Pinyin */}
          <div className="text-center min-h-[1.75rem]">
            {activePinyin ? (
              <span className="text-xl font-mono text-white/80 tracking-widest">
                {activePinyin.pinyin_full}
              </span>
            ) : (
              <span className="text-sm text-white/30">點選腔調查看拼音</span>
            )}
          </div>

          {/* Definition */}
          {primaryDef && (
            <div className="flex items-start gap-2 bg-white/8 rounded-xl px-4 py-3">
              {primaryDef.type && (
                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-md bg-white/15 text-white/70 text-[11px] font-medium">
                  {primaryDef.type}
                </span>
              )}
              <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                {primaryDef.def}
              </p>
            </div>
          )}

          {/* Co-occurring words */}
          {data.cooc_words.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/30 tracking-widest uppercase mb-2 text-center">
                {t('coocWords')}
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {data.cooc_words.slice(0, 8).map((c) => (
                  <a
                    key={c.partner}
                    href={`/sketch?q=${encodeURIComponent(c.partner)}`}
                    className="text-xs text-white/50 hover:text-white transition-colors bg-white/8 hover:bg-white/15 px-2 py-0.5 rounded-md"
                  >
                    {c.partner}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Deep search link */}
          <div className="mt-auto pt-2 flex justify-center">
            <a
              href={`/sketch?q=${encodeURIComponent(data.entry.title)}`}
              className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/70 transition-colors"
            >
              <ExternalLink size={10} />
              {t('deepSearch')}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

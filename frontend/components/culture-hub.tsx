'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useExploreStore } from '@/lib/stores/explore-store'
import { fetchWordOfDay } from '@/lib/api'
import type { WordOfDayData } from '@/lib/api'
import type { Dialect } from '@/lib/types'
import { ThemeWordHero } from '@/components/culture-hub/theme-word-hero'
import { DailyQuotePanel } from '@/components/culture-hub/daily-quote-panel'
import { TrendingPanel } from '@/components/culture-hub/trending-panel'
import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/ui/section-header'
import type { HubTab } from '@/lib/stores/explore-store'

const TAB_ORDER: HubTab[] = ['today', 'quote', 'trending']

const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian',
  '南四縣': 'sihai',
  '海陸': 'hailu',
  '大埔': 'dapu',
  '饒平': 'raoping',
  '詔安': 'zhaoan',
}

export function CultureHub({ inline = false }: { inline?: boolean }) {
  const t = useTranslations('cultureHub')
  const { setActiveDialect, setActiveWord, activeHubTab, setActiveHubTab } = useExploreStore()
  const [localTab, setLocalTab] = useState<HubTab>('today')
  const hubTab = activeHubTab ?? localTab

  const paused = useRef(false)

  const setHubTab = (v: HubTab) => {
    setLocalTab(v)
    setActiveHubTab(v)
  }

  // Autoplay: advance tab every 7s, pause on hover / page hidden
  useEffect(() => {
    const tick = () => {
      if (paused.current || document.hidden) return
      setLocalTab(prev => {
        const next = TAB_ORDER[(TAB_ORDER.indexOf(prev) + 1) % TAB_ORDER.length]
        setActiveHubTab(next)
        return next
      })
    }
    const id = setInterval(tick, 7000)
    const onVisibility = () => { if (!document.hidden) {} } // keeps interval alive, tick checks hidden
    document.addEventListener('visibilitychange', onVisibility)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisibility) }
  }, [setActiveHubTab])

  const [data, setData] = useState<WordOfDayData | null>(null)
  const [loading, setLoading] = useState(false)

  const loadWordOfDay = useCallback(async (opts?: { keyword?: string; random?: boolean }) => {
    setLoading(true)
    try {
      const d = await fetchWordOfDay(opts)
      setData(d)
      setActiveWord(d.entry.title)
      if (d.pinyin_by_dialect.length > 0) {
        const firstDialect = DB_LABEL_TO_DIALECT[d.pinyin_by_dialect[0].dialect]
        if (firstDialect) setActiveDialect(firstDialect)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [setActiveDialect, setActiveWord])

  useEffect(() => { loadWordOfDay() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const tabItemClass = 'pb-3 px-5 rounded-none border-b-2 -mb-px bg-transparent shadow-none font-medium text-sm data-[state=on]:border-primary data-[state=on]:text-foreground data-[state=on]:bg-transparent data-[state=on]:shadow-none text-muted-foreground hover:text-foreground transition-colors'

  const inner = (
    <div onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      {!inline && <SectionHeader title={t('title')} subtitle={t('subtitle')} />}
      <div className="flex justify-center border-b border-border/20 mb-8">
        <ToggleGroup
          type="single"
          value={hubTab}
          onValueChange={(v) => { if (v) setHubTab(v as HubTab) }}
          className="gap-0"
        >
          <ToggleGroupItem value="today" className={tabItemClass}>{t('tabs.today')}</ToggleGroupItem>
          <ToggleGroupItem value="quote" className={tabItemClass}>{t('tabs.quote')}</ToggleGroupItem>
          <ToggleGroupItem value="trending" className={tabItemClass}>{t('tabs.trending')}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div>
        {hubTab === 'today' && (
          <ThemeWordHero
            data={data}
            loading={loading}
            onRefresh={() => loadWordOfDay({ random: true })}
          />
        )}
        {hubTab === 'quote' && <DailyQuotePanel />}
        {hubTab === 'trending' && <TrendingPanel />}
      </div>
    </div>
  )

  if (inline) return inner

  return (
    <section id="culture-hub" className="py-20 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {inner}
      </div>
    </section>
  )

}

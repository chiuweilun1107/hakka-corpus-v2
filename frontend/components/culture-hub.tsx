'use client'

import { useState, useEffect, useCallback } from 'react'
import { useExploreStore } from '@/lib/stores/explore-store'
import { fetchWordOfDay } from '@/lib/api'
import type { WordOfDayData } from '@/lib/api'
import { DB_LABEL_TO_DIALECT } from '@/lib/dialect'
import { ThemeWordHero } from '@/components/culture-hub/theme-word-hero'
import { DailyQuotePanel } from '@/components/culture-hub/daily-quote-panel'
import { TrendingPanel } from '@/components/culture-hub/trending-panel'
import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/ui/section-header'
import { UnderlineTabs } from '@/components/ui/underline-tabs'
import type { HubTab } from '@/lib/stores/explore-store'

export function CultureHub({ inline = false }: { inline?: boolean }) {
  const t = useTranslations('cultureHub')
  const { setActiveDialect, setActiveWord, activeHubTab, setActiveHubTab } = useExploreStore()
  const [localTab, setLocalTab] = useState<HubTab>('today')
  const hubTab = activeHubTab ?? localTab

  const setHubTab = (v: HubTab) => {
    setLocalTab(v)
    setActiveHubTab(v)
  }

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

  useEffect(() => { loadWordOfDay() }, [loadWordOfDay])

  const handleRefresh = useCallback(() => loadWordOfDay({ random: true }), [loadWordOfDay])

  const inner = (
    <div>
      {!inline && <SectionHeader title={t('title')} subtitle={t('subtitle')} />}
      <UnderlineTabs
        items={[
          { value: 'today', label: t('tabs.today') },
          { value: 'quote', label: t('tabs.quote') },
          { value: 'trending', label: t('tabs.trending') },
        ]}
        value={hubTab}
        onValueChange={(v) => setHubTab(v as HubTab)}
        onActiveChange={(v) => setHubTab(v as HubTab)}
        autoplay
        autoplayInterval={7000}
        pauseOnHover
        align="center"
        className="mb-8"
      />

      <div>
        {hubTab === 'today' && (
          <ThemeWordHero
            data={data}
            loading={loading}
            onRefresh={handleRefresh}
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

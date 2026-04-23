'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useExploreStore } from '@/lib/stores/explore-store'
import { fetchWordOfDay } from '@/lib/api'
import type { WordOfDayData } from '@/lib/api'
import { getCurrentFestival, type FestivalStatus } from '@/lib/utils/current-festival'
import type { Dialect } from '@/lib/types'
import { ThemeWordHero } from '@/components/culture-hub/theme-word-hero'
import { FestivalCarousel } from '@/components/culture-hub/festival-carousel'
import { DailyQuotePanel } from '@/components/culture-hub/daily-quote-panel'
import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/ui/section-header'

const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian',
  '南四縣': 'sihai',
  '海陸': 'hailu',
  '大埔': 'dapu',
  '饒平': 'raoping',
  '詔安': 'zhaoan',
}

import type { HubTab } from '@/lib/stores/explore-store'

export function CultureHub() {
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
  const [festivalStatus, setFestivalStatus] = useState<FestivalStatus>({
    today: null, upcoming: null, daysUntilUpcoming: 0,
  })

  useEffect(() => { setFestivalStatus(getCurrentFestival()) }, [])

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

  return (
    <section id="culture-hub" className="py-20 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        <Tabs value={hubTab} onValueChange={(v) => setHubTab(v as HubTab)}>
          {/* Pill-style tab（與 Trending/News 一致） */}
          <div className="flex justify-center mb-8">
            <ToggleGroup
              type="single"
              value={hubTab}
              onValueChange={(v) => { if (v) setHubTab(v as HubTab) }}
              className="gap-1"
            >
              <ToggleGroupItem value="today" className="text-xs h-8 px-4 rounded-md font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground hover:text-foreground hover:bg-muted">{t('tabs.today')}</ToggleGroupItem>
              <ToggleGroupItem value="quote" className="text-xs h-8 px-4 rounded-md font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground hover:text-foreground hover:bg-muted">{t('tabs.quote')}</ToggleGroupItem>
              <ToggleGroupItem value="festival" className="text-xs h-8 px-4 rounded-md font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground hover:text-foreground hover:bg-muted">{t('tabs.festival')}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <TabsContent value="today" className="mt-0">
            <ThemeWordHero
              data={data}
              loading={loading}
              onRefresh={() => loadWordOfDay({ random: true })}
            />
          </TabsContent>

          <TabsContent value="quote" className="mt-0">
            <DailyQuotePanel />
          </TabsContent>

          <TabsContent value="festival" className="mt-0">
            <FestivalCarousel status={festivalStatus} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

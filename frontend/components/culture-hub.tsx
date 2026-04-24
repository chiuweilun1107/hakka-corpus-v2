'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
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
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: 'start', watchDrag: true, loop: true },
    [Autoplay({ delay: 7000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )

  const setHubTab = (v: HubTab) => {
    setLocalTab(v)
    setActiveHubTab(v)
    emblaApi?.scrollTo(TAB_ORDER.indexOf(v))
  }

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap()
      const tab = TAB_ORDER[idx]
      setLocalTab(tab)
      setActiveHubTab(tab)
    }
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, setActiveHubTab])

  // 分頁切到背景時暫停，切回來恢復
  useEffect(() => {
    if (!emblaApi) return
    const autoplay = emblaApi.plugins().autoplay
    if (!autoplay) return
    const onVisibility = () => {
      document.hidden ? autoplay.stop() : autoplay.play()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [emblaApi])
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

  const inner = (
    <>
      {!inline && <SectionHeader title={t('title')} subtitle={t('subtitle')} />}
      <div className="flex justify-center border-b border-border/20 mb-8">
        <ToggleGroup
          type="single"
          value={hubTab}
          onValueChange={(v) => { if (v) setHubTab(v as HubTab) }}
          className="gap-0"
        >
          <ToggleGroupItem value="today" className="pb-3 px-5 rounded-none border-b-2 -mb-px bg-transparent shadow-none font-medium text-sm data-[state=on]:border-primary data-[state=on]:text-foreground data-[state=on]:bg-transparent data-[state=on]:shadow-none text-muted-foreground hover:text-foreground transition-colors">{t('tabs.today')}</ToggleGroupItem>
          <ToggleGroupItem value="quote" className="pb-3 px-5 rounded-none border-b-2 -mb-px bg-transparent shadow-none font-medium text-sm data-[state=on]:border-primary data-[state=on]:text-foreground data-[state=on]:bg-transparent data-[state=on]:shadow-none text-muted-foreground hover:text-foreground transition-colors">{t('tabs.quote')}</ToggleGroupItem>
          <ToggleGroupItem value="trending" className="pb-3 px-5 rounded-none border-b-2 -mb-px bg-transparent shadow-none font-medium text-sm data-[state=on]:border-primary data-[state=on]:text-foreground data-[state=on]:bg-transparent data-[state=on]:shadow-none text-muted-foreground hover:text-foreground transition-colors">{t('tabs.trending')}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          <div className="flex-[0_0_100%] min-w-0">
            <ThemeWordHero
              data={data}
              loading={loading}
              onRefresh={() => loadWordOfDay({ random: true })}
            />
          </div>
          <div className="flex-[0_0_100%] min-w-0">
            <DailyQuotePanel />
          </div>
          <div className="flex-[0_0_100%] min-w-0">
            <TrendingPanel />
          </div>
        </div>
      </div>
    </>
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

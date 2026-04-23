'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { DIALECTS, type Dialect } from '@/lib/types'
import { DialectPanel } from '@/components/culture-hub/dialect-panel'
import { useExploreStore } from '@/lib/stores/explore-store'
import { SectionHeader } from '@/components/ui/section-header'
import { useTranslations } from 'next-intl'

const InteractiveMap = dynamic(() => import('./interactive-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#fdfaf5] animate-pulse rounded-xl" />,
})

const ALL_DIALECTS = new Set(DIALECTS.map(d => d.id))

export function DialectMapSection() {
  const t = useTranslations('dialectMap')
  const { activeDialect, setActiveDialect } = useExploreStore()
  const [showAllOnMap, setShowAllOnMap] = useState(true)
  const isInitialMount = useRef(true)

  // Whenever activeDialect changes (from panel tabs, arrows, or marker/legend clicks),
  // auto-focus the map to that dialect — skip on first mount to preserve "show all" default
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    setShowAllOnMap(false)
  }, [activeDialect])

  const selectedDialects = showAllOnMap ? ALL_DIALECTS : new Set([activeDialect])

  const handleMarkerClick = (dialectId: string, _label: string) => {
    setActiveDialect(dialectId as Dialect)
  }

  const handleShowAll = () => setShowAllOnMap(true)

  return (
    <section id="dialect-map" className="py-20 bg-background border-t border-border/20 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        {/* Mobile (<768px): stacked */}
        <div className="md:hidden mt-8 space-y-5">
          <div className="relative h-[260px] rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm">
            <InteractiveMap
              selectedDialects={selectedDialects}
              onMarkerClick={handleMarkerClick}
              onShowAll={handleShowAll}
              showLegend={false}
            />
          </div>
          <DialectPanel />
        </div>

        {/* Tablet (768–1023px): side-by-side, compact */}
        <div className="hidden md:flex lg:hidden gap-4 mt-8 h-[560px]">
          <div className="flex-[3] relative rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm">
            <InteractiveMap
              selectedDialects={selectedDialects}
              onMarkerClick={handleMarkerClick}
              onShowAll={handleShowAll}
            />
          </div>
          <div className="flex-[2] overflow-y-auto no-scrollbar">
            <DialectPanel />
          </div>
        </div>

        {/* Desktop (1024px+): side-by-side, full */}
        <div className="hidden lg:flex gap-6 mt-8 h-[780px] xl:h-[820px]">
          <div className="flex-1 relative rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm">
            <InteractiveMap
              selectedDialects={selectedDialects}
              onMarkerClick={handleMarkerClick}
              onShowAll={handleShowAll}
            />
          </div>
          <div className="w-[360px] xl:w-[420px] flex-shrink-0 overflow-y-auto no-scrollbar">
            <DialectPanel />
          </div>
        </div>
      </div>
    </section>
  )
}

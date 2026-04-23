'use client'

import { useState, useEffect } from 'react'
import { getCurrentFestival } from '@/lib/utils/current-festival'
import type { FestivalStatus } from '@/lib/utils/current-festival'
import { FestivalCarousel } from '@/components/culture-hub/festival-carousel'
import { SectionHeader } from '@/components/ui/section-header'
import { useTranslations } from 'next-intl'

export function FestivalSection() {
  const t = useTranslations('festivalCards')
  const [festivalStatus, setFestivalStatus] = useState<FestivalStatus>({
    today: null, upcoming: null, daysUntilUpcoming: 0,
  })

  useEffect(() => { setFestivalStatus(getCurrentFestival()) }, [])

  return (
    <section id="festival" className="bg-muted/20 scroll-mt-0">
      <div className="h-16 lg:hidden" />
      <div className="container mx-auto px-4 max-w-6xl py-12">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />
        <FestivalCarousel status={festivalStatus} />
      </div>
    </section>
  )
}

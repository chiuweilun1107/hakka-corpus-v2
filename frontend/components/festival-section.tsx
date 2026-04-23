'use client'

import { useState, useEffect } from 'react'
import { getCurrentFestival } from '@/lib/utils/current-festival'
import type { FestivalStatus } from '@/lib/utils/current-festival'
import { FestivalCarousel } from '@/components/culture-hub/festival-carousel'

export function FestivalSection() {
  const [festivalStatus, setFestivalStatus] = useState<FestivalStatus>({
    today: null, upcoming: null, daysUntilUpcoming: 0,
  })

  useEffect(() => { setFestivalStatus(getCurrentFestival()) }, [])

  return (
    <section id="festival" className="bg-background scroll-mt-0">
      <div className="h-16" />
      <div className="container mx-auto px-4 max-w-6xl pt-6 pb-14">
        <FestivalCarousel status={festivalStatus} />
      </div>
    </section>
  )
}

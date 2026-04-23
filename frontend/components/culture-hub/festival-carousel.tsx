'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  getFestivalSortedByDate,
  getFestivalSolarDate,
  type FestivalStatus,
} from '@/lib/utils/current-festival'

interface Props {
  status: FestivalStatus
}

export function FestivalCarousel({ status }: Props) {
  const t = useTranslations('a11y')
  const sorted = getFestivalSortedByDate()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const initialTarget = status.today?.slug ?? status.upcoming?.slug
  const initialIdx = initialTarget
    ? Math.max(0, sorted.findIndex((f) => f.slug === initialTarget))
    : 0

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.scrollTo(initialIdx, true)
    setSelectedIndex(initialIdx)
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, initialIdx])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className="pt-2 space-y-4">
      {/* 今日／下一個節慶提示 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar size={14} className="text-muted-foreground/60" />
        {status.today ? (
          <span>
            今日節慶：<span className="font-semibold text-primary">{status.today.name}</span>
          </span>
        ) : status.upcoming ? (
          <span>
            下一個節慶：
            <span className="font-semibold text-foreground">{status.upcoming.name}</span>
            <span className="ml-1 text-xs text-muted-foreground/60">
              （還有 {status.daysUntilUpcoming} 天）
            </span>
          </span>
        ) : null}
      </div>

      {/* 輪播主體 */}
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden rounded-2xl">
          <div className="flex">
            {sorted.map((f, i) => {
              const dateStr = getFestivalSolarDate(f.slug)
              const monthDay = dateStr
                ? `${parseInt(dateStr.split('-')[1])} / ${parseInt(dateStr.split('-')[2])}`
                : f.date
              const isToday = status.today?.slug === f.slug
              return (
                <div key={f.slug} className="flex-[0_0_100%] min-w-0 px-1">
                  <article className="rounded-2xl overflow-hidden bg-muted/20">
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <Image
                        src={f.image}
                        alt={f.iconLabel}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 800px"
                        priority={i === initialIdx}
                      />
                      {isToday && (
                        <span className="absolute top-3 right-3 text-[11px] font-bold text-white bg-primary px-2 py-0.5 rounded-full shadow-md">
                          今日節慶
                        </span>
                      )}
                    </div>
                    <div className="p-5 md:p-6 space-y-2">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h3 className="text-xl md:text-2xl font-bold">{f.name}</h3>
                        <span className="text-sm font-mono text-muted-foreground">
                          {monthDay}
                        </span>
                        <span className="text-xs text-muted-foreground/60">{f.date}</span>
                      </div>
                      <p className="text-sm text-primary/80 font-medium">{f.tagline}</p>
                      <p className="text-sm text-foreground/70 leading-relaxed">{f.summary}</p>
                    </div>
                  </article>
                </div>
              )
            })}
          </div>
        </div>

        {/* 左右箭頭 */}
        <button
          type="button"
          onClick={scrollPrev}
          aria-label={t('prevFestival')}
          className="absolute left-2 top-[35%] -translate-y-1/2 w-9 h-9 rounded-full bg-background/85 backdrop-blur shadow-md flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label={t('nextFestival')}
          className="absolute right-2 top-[35%] -translate-y-1/2 w-9 h-9 rounded-full bg-background/85 backdrop-blur shadow-md flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots */}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', containScroll: false },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )
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
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, initialIdx])

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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {sorted.map((f, i) => {
            const dateStr = getFestivalSolarDate(f.slug)
            const monthDay = dateStr
              ? `${parseInt(dateStr.split('-')[1])} / ${parseInt(dateStr.split('-')[2])}`
              : f.date
            const isToday = status.today?.slug === f.slug
            const isUpcoming = !isToday && status.upcoming?.slug === f.slug

            return (
              <div
                key={f.slug}
                className={cn(
                  'flex-[0_0_92%] mx-3 transition-opacity duration-500',
                  i !== selectedIndex && 'opacity-40'
                )}
              >
                <article className="relative overflow-hidden bg-muted rounded-2xl shadow-lg">
                  {/* Hero image */}
                  <div className="relative aspect-[16/7] md:aspect-[21/9] w-full">
                    <Image
                      src={f.image}
                      alt={f.iconLabel}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority={i === initialIdx}
                    />
                    {/* Gradient overlay for text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    {/* Status badge */}
                    {(isToday || isUpcoming) && (
                      <span className={cn(
                        'absolute top-4 right-4 text-[11px] font-bold text-white px-2.5 py-1 rounded-full shadow-md',
                        isToday ? 'bg-primary' : 'bg-black/50 backdrop-blur-sm'
                      )}>
                        {isToday ? '今日節慶' : `還有 ${status.daysUntilUpcoming} 天`}
                      </span>
                    )}

                    {/* Text overlay on image */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-6 md:pb-8 [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
                      <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
                        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                          {f.name}
                        </h2>
                        <span className="text-sm font-mono text-white/80">{monthDay}</span>
                        <span className="text-xs text-white/60">{f.date}</span>
                      </div>
                      <p className="text-sm md:text-base text-white/85 font-medium leading-snug">
                        {f.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Summary text below image */}
                  <div className="px-6 md:px-10 py-4 md:py-5 bg-card">
                    <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
                      {f.summary}
                    </p>
                  </div>
                </article>
              </div>
            )
          })}
        </div>
      </div>

      {/* Nav arrows */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label={t('prevFestival')}
        className="absolute left-3 top-[35%] -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label={t('nextFestival')}
        className="absolute right-3 top-[35%] -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {sorted.map((f, i) => (
          <button
            key={f.slug}
            type="button"
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === selectedIndex
                ? 'w-6 bg-primary'
                : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>
    </div>
  )
}

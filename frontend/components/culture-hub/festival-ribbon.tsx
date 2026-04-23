'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { FESTIVALS } from '@/lib/data/festivals'
import { useExploreStore } from '@/lib/stores/explore-store'
import { getFestivalSortedByDate, getFestivalSolarDate, type FestivalStatus } from '@/lib/utils/current-festival'

interface Props {
  status: FestivalStatus
}

export function FestivalRibbon({ status }: Props) {
  const t = useTranslations('festivalCards')
  const { activeFestival, setActiveFestival } = useExploreStore()
  const sorted = getFestivalSortedByDate()

  return (
    <div className="border-b border-dashed border-border/50 pb-4">
      {/* 今日/下個節慶提示 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          {status.today ? (
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('todayFestival')}{status.today.name}
            </span>
          ) : status.upcoming ? (
            <span className="text-muted-foreground">
              {t('nextFestival')}<span className="font-medium text-foreground">{status.upcoming.name}</span>
              <span className="ml-1 text-xs">{t('daysUntil', { n: status.daysUntilUpcoming })}</span>
            </span>
          ) : null}
        </div>
        {activeFestival && (
          <button
            onClick={() => setActiveFestival(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {t('clearFilter')}
          </button>
        )}
      </div>

      {/* 節慶時間軸 chip row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {sorted.map((f) => {
          const isActive = activeFestival === f.slug
          const isToday = status.today?.slug === f.slug
          const dateStr = getFestivalSolarDate(f.slug)
          const month = dateStr ? t('monthSuffix', { n: parseInt(dateStr.split('-')[1]) }) : ''

          return (
            <div key={f.slug} className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setActiveFestival(isActive ? null : f.slug)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isToday
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  f.color.replace('bg-', 'bg-').replace('-50', '-400')
                )} />
                {f.name}
                {month && <span className="opacity-60">{month}</span>}
                {isToday && <span className="text-[10px] font-bold">{t('today')}</span>}
              </button>
              <Link
                href={`/festivals/${f.slug}`}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-0.5"
                title={t('goToFestival', { name: f.name })}
              >
                <ExternalLink size={10} />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

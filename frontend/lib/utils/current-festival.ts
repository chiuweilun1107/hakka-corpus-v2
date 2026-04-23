// 每年一月更新 FESTIVAL_SOLAR_DATES 為當年農曆對應陽曆日期
import { FESTIVALS, type Festival } from '@/lib/data/festivals'

const FESTIVAL_SOLAR_DATES: Record<string, string> = {
  'spring-festival': '2026-02-17', // 農曆正月初一
  'tian-chuan':      '2026-03-08', // 農曆正月二十
  'qingming':        '2026-04-05', // 陽曆清明
  'duanwu':          '2026-06-19', // 農曆五月初五
  'yimin-festival':  '2026-08-27', // 農曆七月中旬
  'mid-autumn':      '2026-09-25', // 農曆八月十五
  'chongyang':       '2026-10-19', // 農曆九月初九
  'dongzhi':         '2026-12-22', // 陽曆冬至
}

const TOLERANCE_MS = 2 * 24 * 60 * 60 * 1000

export interface FestivalStatus {
  today: Festival | null
  upcoming: Festival | null
  daysUntilUpcoming: number
}

export function getCurrentFestival(now = new Date()): FestivalStatus {
  const sorted = FESTIVALS.slice().sort((a, b) => {
    const da = FESTIVAL_SOLAR_DATES[a.slug] ?? ''
    const db = FESTIVAL_SOLAR_DATES[b.slug] ?? ''
    return da.localeCompare(db)
  })

  let todayFestival: Festival | null = null
  let upcoming: Festival | null = null
  let daysUntilUpcoming = 0

  const nowMs = now.getTime()

  for (const f of sorted) {
    const dateStr = FESTIVAL_SOLAR_DATES[f.slug]
    if (!dateStr) continue
    const festMs = new Date(dateStr).getTime()
    if (Math.abs(festMs - nowMs) <= TOLERANCE_MS) {
      todayFestival = f
    } else if (festMs > nowMs && !upcoming) {
      upcoming = f
      daysUntilUpcoming = Math.ceil((festMs - nowMs) / (24 * 60 * 60 * 1000))
    }
  }

  // if no upcoming in remaining year, wrap around to first festival
  if (!upcoming && sorted.length > 0) {
    upcoming = sorted[0]
    const festMs = new Date(FESTIVAL_SOLAR_DATES[sorted[0].slug] ?? '').getTime()
    daysUntilUpcoming = Math.ceil((festMs + 365 * 24 * 60 * 60 * 1000 - nowMs) / (24 * 60 * 60 * 1000))
  }

  return { today: todayFestival, upcoming, daysUntilUpcoming }
}

export function getFestivalSortedByDate(): Festival[] {
  return FESTIVALS.slice().sort((a, b) => {
    const da = FESTIVAL_SOLAR_DATES[a.slug] ?? ''
    const db = FESTIVAL_SOLAR_DATES[b.slug] ?? ''
    return da.localeCompare(db)
  })
}

export function getFestivalSolarDate(slug: string): string | null {
  return FESTIVAL_SOLAR_DATES[slug] ?? null
}

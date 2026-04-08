'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { fetchTrending } from '@/lib/api'
import type { TrendingItem } from '@/lib/api'

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

const TIME_PERIODS: { id: TimePeriod; label: string }[] = [
  { id: 'daily', label: '每日' },
  { id: 'weekly', label: '每週' },
  { id: 'monthly', label: '每月' },
  { id: 'quarterly', label: '每季' },
  { id: 'yearly', label: '每年' },
]

function TrendingRow({ item, rank }: { item: TrendingItem; rank: number }) {
  const isTop3 = rank <= 3

  return (
    <Link
      href={`/sketch?q=${encodeURIComponent(item.word)}`}
      className="flex items-center gap-3 py-2.5 group"
    >
      <span
        className={`w-5 text-right text-sm font-semibold tabular-nums ${
          isTop3 ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {rank}
      </span>
      <span className="flex-1 min-w-0 text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
        {item.word}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
        {item.count.toLocaleString()} 次
      </span>
    </Link>
  )
}

export function TrendingSection() {
  const [period, setPeriod] = useState<TimePeriod>('monthly')
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async (p: TimePeriod) => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchTrending(p, 10)
      setItems(data.items)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(period)
  }, [period, load])

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header: title + period tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              熱門查詢 <span className="text-primary">Top 10</span>
            </h2>

            <div className="flex gap-1">
              {TIME_PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`text-xs h-7 px-3 rounded-md font-medium transition-colors ${
                    period === p.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              暫時無法載入熱門查詢，請稍後再試。
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              目前尚無查詢資料。
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
              <div className="divide-y divide-border">
                {items.slice(0, 5).map((item, i) => (
                  <TrendingRow key={item.word} item={item} rank={i + 1} />
                ))}
              </div>
              <div className="divide-y divide-border">
                {items.slice(5, 10).map((item, i) => (
                  <TrendingRow key={item.word} item={item} rank={i + 6} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

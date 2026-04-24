'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { fetchTrending } from '@/lib/api'
import type { TrendingItem } from '@/lib/api'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTranslations } from 'next-intl'

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

const RANK_COLOR: Record<number, { text: string; bar: string }> = {
  1: { text: 'text-amber-600', bar: 'bg-amber-100' },
  2: { text: 'text-slate-500', bar: 'bg-slate-100' },
  3: { text: 'text-orange-500', bar: 'bg-orange-100' },
}

function TrendingRow({ item, rank, maxCount }: { item: TrendingItem; rank: number; maxCount: number }) {
  const t = useTranslations('trending')
  const color = RANK_COLOR[rank]
  const pct = maxCount > 0 ? Math.max(8, (item.count / maxCount) * 100) : 0

  return (
    <Link
      href={`/cooccurrence?q=${encodeURIComponent(item.word)}`}
      className="relative flex items-center gap-3 py-3 px-2 border-b border-border group hover:bg-muted/40 transition-colors"
    >
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-500 ${color?.bar || 'bg-primary/8'}`}
        style={{ width: `${pct}%` }}
      />
      <div className="relative flex items-center gap-3 w-full">
        <span className={`w-6 text-right text-sm font-extrabold tabular-nums shrink-0 ${color?.text || 'text-muted-foreground'}`}>
          {rank}
        </span>
        <span className="flex-1 min-w-0 text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
          {item.word}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {t('count', { n: item.count.toLocaleString() })}
        </span>
      </div>
    </Link>
  )
}

export function TrendingPanel() {
  const t = useTranslations('trending')
  const [period, setPeriod] = useState<TimePeriod>('monthly')
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const timePeriods: { id: TimePeriod; label: string }[] = [
    { id: 'daily', label: t('periods.day') },
    { id: 'weekly', label: t('periods.week') },
    { id: 'monthly', label: t('periods.month') },
    { id: 'quarterly', label: t('periods.quarter') },
    { id: 'yearly', label: t('periods.year') },
  ]

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

  useEffect(() => { load(period) }, [period, load])

  return (
    <div>
      <div className="flex justify-center mb-6">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => { if (v) setPeriod(v as TimePeriod) }}
          className="gap-1 flex-wrap"
        >
          {timePeriods.map((p) => (
            <ToggleGroupItem
              key={p.id}
              value={p.id}
              className="text-xs h-7 px-3 rounded-md font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-sm text-muted-foreground">{t('error.fetch')}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">{t('empty')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div>
            {items.slice(0, 5).map((item, i) => (
              <TrendingRow key={item.word} item={item} rank={i + 1} maxCount={items[0]?.count || 1} />
            ))}
          </div>
          <div>
            {items.slice(5, 10).map((item, i) => (
              <TrendingRow key={item.word} item={item} rank={i + 6} maxCount={items[0]?.count || 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

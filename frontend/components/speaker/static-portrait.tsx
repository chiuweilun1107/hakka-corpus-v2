'use client'

import { Mic } from 'lucide-react'
import { DIALECT_CHART_COLORS } from '@/lib/colors'

interface StaticPortraitProps {
  dialect: string
  name:    string
  size?:   number
}

const DIALECT_PATTERN: Record<string, string> = {
  '四縣': '⬟',
  '海陸': '◈',
  '大埔': '⬡',
  '饒平': '◇',
  '詔安': '⬢',
  '南四縣': '⬟',
}

export function StaticPortrait({ dialect, name, size = 96 }: StaticPortraitProps) {
  const color = DIALECT_CHART_COLORS[dialect] ?? '#009688'
  const symbol = DIALECT_PATTERN[dialect] ?? '◎'
  const initials = name.slice(0, 1)

  return (
    <div
      className="flex items-center justify-center rounded-full relative overflow-hidden select-none flex-shrink-0"
      style={{ width: size, height: size, background: `${color}22`, border: `3px solid ${color}66` }}
    >
      {/* 背景紋樣 */}
      <span
        className="absolute text-5xl opacity-10 pointer-events-none"
        style={{ color }}
        aria-hidden
      >
        {symbol}
      </span>

      {/* 中心麥克風 + 姓 */}
      <div className="relative flex flex-col items-center gap-0.5">
        <Mic size={size * 0.28} style={{ color }} strokeWidth={1.5} />
        <span className="text-xs font-bold" style={{ color, fontSize: size * 0.16 }}>
          {initials}
        </span>
      </div>
    </div>
  )
}

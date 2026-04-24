'use client'

import { Mic } from 'lucide-react'
import { DIALECT_CHART_COLORS } from '@/lib/colors'

interface StaticPortraitProps {
  dialect: string
  name:    string
  size?:   number
  variant?: 'circle' | 'panel'
}

const DIALECT_PATTERN: Record<string, string> = {
  '四縣': '⬟',
  '海陸': '◈',
  '大埔': '⬡',
  '饒平': '◇',
  '詔安': '⬢',
  '南四縣': '⬟',
}

export function StaticPortrait({ dialect, name, size = 96, variant = 'circle' }: StaticPortraitProps) {
  const color = DIALECT_CHART_COLORS[dialect] ?? '#009688'
  const symbol = DIALECT_PATTERN[dialect] ?? '◎'
  const initials = name.slice(0, 1)

  if (variant === 'panel') {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden select-none"
        style={{ background: `${color}18` }}
      >
        {/* 背景紋樣 */}
        <span
          className="absolute text-[200px] opacity-[0.06] pointer-events-none"
          style={{ color }}
          aria-hidden
        >
          {symbol}
        </span>

        {/* 中心麥克風 + 姓 */}
        <div className="relative flex flex-col items-center gap-3">
          <Mic size={64} style={{ color }} strokeWidth={1} />
          <span className="text-4xl font-bold" style={{ color }}>
            {initials}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-full relative overflow-hidden select-none flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `${color}18`,
        boxShadow: `0 0 0 4px ${color}20, 0 0 0 7px ${color}10, 0 8px 24px rgba(0,0,0,0.08)`,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ border: `2.5px solid ${color}55` }}
        aria-hidden
      />
      <span
        className="absolute opacity-[0.08] pointer-events-none"
        style={{ color, fontSize: size * 0.55 }}
        aria-hidden
      >
        {symbol}
      </span>
      <div className="relative flex flex-col items-center gap-0.5">
        <Mic size={size * 0.27} style={{ color }} strokeWidth={1.5} />
        <span className="font-bold" style={{ color, fontSize: size * 0.15 }}>
          {initials}
        </span>
      </div>
    </div>
  )
}

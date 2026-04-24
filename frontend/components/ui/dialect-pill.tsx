'use client'

import { cn } from '@/lib/utils'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import type { Dialect } from '@/lib/types'

const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian',
  '南四縣': 'sihai',
  '海陸': 'hailu',
  '大埔': 'dapu',
  '饒平': 'raoping',
  '詔安': 'zhaoan',
}

const DB_LABEL_DISPLAY: Record<string, string> = {
  '四縣': '四縣',
  '南四縣': '四海',
  '海陸': '海陸',
  '大埔': '大埔',
  '饒平': '饒平',
  '詔安': '詔安',
}

interface DialectPillProps {
  dialect: string        // DB label e.g. '四縣'
  isActive: boolean
  onClick?: () => void
}

export function DialectPill({ dialect, isActive, onClick }: DialectPillProps) {
  const color = DIALECT_CHART_COLORS[dialect] ?? '#999'
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
        isActive
          ? 'text-white shadow-sm'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      style={isActive ? { backgroundColor: color } : undefined}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isActive ? 'bg-white/70' : '')}
        style={!isActive ? { backgroundColor: color } : undefined}
      />
      {DB_LABEL_DISPLAY[dialect] ?? dialect}
    </button>
  )
}

interface DialectPillGroupProps {
  dialects: string[]           // DB label list, already deduped
  activeDialect: Dialect | null
  onSelect: (dialect: Dialect) => void
  className?: string
}

export function DialectPillGroup({ dialects, activeDialect, onSelect, className }: DialectPillGroupProps) {
  if (dialects.length === 0) return null
  return (
    <div className={cn('flex justify-center gap-1.5 flex-wrap', className)}>
      {dialects.map(dialect => {
        const code = DB_LABEL_TO_DIALECT[dialect]
        return (
          <DialectPill
            key={dialect}
            dialect={dialect}
            isActive={code === activeDialect}
            onClick={() => code && onSelect(code)}
          />
        )
      })}
    </div>
  )
}

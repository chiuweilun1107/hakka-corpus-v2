'use client'

import { cn } from '@/lib/utils'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import type { Dialect } from '@/lib/types'
import { DB_LABEL_TO_DIALECT, DIALECT_DISPLAY_LABEL } from '@/lib/dialect'

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
      {DIALECT_DISPLAY_LABEL[dialect] ?? dialect}
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

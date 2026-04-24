import Link from 'next/link'
import { cn } from '@/lib/utils'

// Solid colors matching dialect pill "active" visual language
const GRADE_COLORS: Record<string, string> = {
  '基礎級': '#94a3b8',  // slate
  '初級':   '#34d399',  // emerald
  '中級':   '#60a5fa',  // blue
  '中高級': '#fbbf24',  // amber
  '高級':   '#f87171',  // rose
}

const PILL_BASE = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white'

export function CertifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn(PILL_BASE, className)} style={{ backgroundColor: '#34d399' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
      客委會認證
    </span>
  )
}

export function GradeBadge({ grade, className }: { grade: string; className?: string }) {
  const color = GRADE_COLORS[grade] ?? '#94a3b8'
  return (
    <span className={cn(PILL_BASE, className)} style={{ backgroundColor: color }}>
      {grade}
    </span>
  )
}

export function InlineWordGrade({ word, grade }: { word: string; grade: string | null }) {
  const href = `/cooccurrence?q=${encodeURIComponent(word)}`
  const color = grade ? (GRADE_COLORS[grade] ?? '#94a3b8') : undefined
  return (
    <Link href={href} className="inline-flex items-baseline gap-0.5 hover:opacity-75 transition-opacity">
      <span className="text-foreground font-medium">{word}</span>
      {grade && (
        <span
          className="text-[9px] px-1.5 py-px rounded-full text-white leading-none"
          style={{ backgroundColor: color }}
        >
          {grade}
        </span>
      )}
    </Link>
  )
}

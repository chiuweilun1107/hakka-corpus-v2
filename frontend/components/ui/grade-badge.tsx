import Link from 'next/link'
import { cn } from '@/lib/utils'

const GRADE_STYLES: Record<string, string> = {
  '基礎級': 'bg-slate-50 text-slate-600 border-slate-200',
  '初級':   'bg-emerald-50 text-emerald-700 border-emerald-200',
  '中級':   'bg-blue-50 text-blue-700 border-blue-200',
  '中高級': 'bg-amber-50 text-amber-700 border-amber-200',
  '高級':   'bg-rose-50 text-rose-700 border-rose-200',
}

export function CertifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200', className)}>
      ✓ 客委會認證
    </span>
  )
}

export function GradeBadge({ grade, className }: { grade: string; className?: string }) {
  const style = GRADE_STYLES[grade] ?? 'bg-muted/50 text-muted-foreground border-border/40'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', style, className)}>
      {grade}
    </span>
  )
}

export function InlineWordGrade({ word, grade }: { word: string; grade: string | null }) {
  const href = `/cooccurrence?q=${encodeURIComponent(word)}`
  if (!grade) {
    return (
      <Link href={href} className="text-foreground hover:text-primary transition-colors">
        {word}
      </Link>
    )
  }
  const style = GRADE_STYLES[grade] ?? 'bg-muted/50 text-muted-foreground border-border/40'
  return (
    <Link href={href} className="inline-flex items-baseline gap-0.5 hover:opacity-80 transition-opacity">
      <span className="text-foreground">{word}</span>
      <span className={cn('text-[9px] px-1 py-px rounded border leading-none', style)}>
        {grade}
      </span>
    </Link>
  )
}

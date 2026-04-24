import { cn } from '@/lib/utils'

interface LabeledDividerProps {
  label: string
  size?: 'xs' | 'sm'
  className?: string
}

export function LabeledDivider({ label, size = 'xs', className }: LabeledDividerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-px bg-border/60" />
      <span className={cn(
        'text-muted-foreground/70 font-medium px-1',
        size === 'xs' ? 'text-[11px]' : 'text-xs'
      )}>
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  )
}

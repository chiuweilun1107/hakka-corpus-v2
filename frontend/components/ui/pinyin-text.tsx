import { cn } from '@/lib/utils'

interface PinyinTextProps {
  value: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'muted'
  tracking?: 'wider' | 'widest'
  breakAll?: boolean
  className?: string
}

const SIZE_CLASS = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

export function PinyinText({ value, size = 'md', color = 'primary', tracking = 'wider', breakAll = false, className }: PinyinTextProps) {
  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        SIZE_CLASS[size],
        color === 'primary' ? 'text-primary/80' : 'text-muted-foreground',
        tracking === 'wider' ? 'tracking-wider' : 'tracking-widest',
        breakAll && 'break-all',
        className
      )}
    >
      {value}
    </span>
  )
}

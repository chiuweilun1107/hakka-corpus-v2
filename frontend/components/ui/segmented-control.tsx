'use client'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface SegmentItem {
  value: string
  label: string
  icon?: LucideIcon
}

export interface SegmentedControlProps {
  items: SegmentItem[]
  value: string
  onValueChange: (v: string) => void
  variant?: 'primary' | 'muted'
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl({
  items,
  value,
  onValueChange,
  variant = 'muted',
  size = 'sm',
  className,
}: SegmentedControlProps) {
  const containerClass = cn(
    'inline-flex rounded-lg p-1 gap-0.5',
    'bg-muted/60',
    className
  )

  const itemClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-1 rounded-md font-medium transition-all',
      size === 'sm' ? 'px-3 py-1 text-xs h-7' : 'px-4 py-1.5 text-sm h-8',
      isActive
        ? variant === 'primary'
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    )

  return (
    <div className={containerClass} role="group">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.value}
            type="button"
            className={itemClass(item.value === value)}
            onClick={() => onValueChange(item.value)}
          >
            {Icon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

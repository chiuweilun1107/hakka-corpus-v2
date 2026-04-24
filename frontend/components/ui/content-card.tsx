import React from 'react'
import { cn } from '@/lib/utils'

type HtmlTag = 'div' | 'section' | 'article' | 'aside' | 'main' | 'header' | 'footer' | 'nav' | 'span' | 'li'

interface ContentCardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  variant?: 'default' | 'hero' | 'compact'
  hoverable?: boolean
  padding?: 'sm' | 'md' | 'lg'
  as?: HtmlTag
}

const PADDING = {
  sm: 'px-4 py-3',
  md: 'px-5 py-3.5',
  lg: 'px-8 py-7',
}

const VARIANT_BASE = {
  default: 'bg-card rounded-xl border border-border/50 shadow-sm',
  hero: 'bg-card rounded-2xl border border-border/50 shadow-sm',
  compact: 'bg-card rounded-xl border border-border/50',
}

export function ContentCard({
  children,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  className,
  as: Tag = 'div',
  ...rest
}: ContentCardProps) {
  return (
    <Tag
      className={cn(
        VARIANT_BASE[variant],
        PADDING[padding],
        hoverable && 'hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

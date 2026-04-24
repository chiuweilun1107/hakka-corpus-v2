'use client'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RefreshButtonProps {
  onClick: () => void
  loading?: boolean
  size?: 'sm' | 'md'
  className?: string
  title?: string
}

export function RefreshButton({ onClick, loading = false, size = 'sm', className, title }: RefreshButtonProps) {
  const dim = size === 'md' ? 'h-9 w-9' : 'h-8 w-8'
  return (
    <Button
      size="icon" variant="ghost"
      className={cn('rounded-full text-muted-foreground hover:text-foreground disabled:opacity-50', dim, className)}
      title={title}
      onClick={onClick}
      disabled={loading}
    >
      <RefreshCw size={size === 'md' ? 16 : 14} className={cn(loading && 'animate-spin')} />
    </Button>
  )
}

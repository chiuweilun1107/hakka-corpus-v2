import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = '載入中...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center py-20', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-3 text-muted-foreground">{message}</span>
    </div>
  )
}
